import axios from 'axios';
import * as cheerio from 'cheerio';
import { Credentials } from '../Credentials';
import { GoogleAuth } from '../GoogleAuth';
import { BetsConstructAuthException } from '../exceptions/BetsConstructAuthException';
import { parseSetCookies, buildCookieHeader } from '../utils';
import type { IBetsConstructClient } from './IBetsConstructClient';
import { Reports } from '../actions/Reports';
import { Users } from '../actions/Users';
import { Bonuses } from '../actions/Bonuses';
import { Financials } from '../actions/Financials';
import { Settings } from '../actions/Settings';
import { PromoCodes } from '../actions/PromoCodes';

export class BetsConstructClient implements IBetsConstructClient {
    static readonly USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15';

    private static readonly BASE_AUTH_URL = 'https://api.accounts-bc.com';
    private static readonly BASE_AUTH_DOMAIN = 'www.accounts-bc.com';

    private static readonly OAUTH_REQUEST_PARAMS = {
        client_id: 'BackOfficeSSO',
        response_type: 'code token id_token',
        scope: 'openid profile email offline_access introspect.full.access real_ip',
        redirect_uri: 'https://backofficewebadmin.betconstruct.com/api/en/account/ssocallback',
        state: 'https://backoffice.betconstruct.com/',
        nonce: 'https://backofficewebadmin.betconstruct.com',
        response_mode: 'form_post',
    };

    private static readonly TOKEN_EXPIRES_IN = 3600;
    private static readonly TOKEN_LIFETIME_TOLERANCE_SECONDS = 60;

    private authCookies: Record<string, string> = {};
    private authExpiresAt: number | null = null;
    private cachedSettings: Record<string, unknown> = {};
    private partnerId: number | null = null;
    private _withPreSelectedPartnerId = false;

    public reauthenticateAutomatically: boolean;

    constructor(
        private readonly credentials: Credentials,
        reauthenticateAutomatically = true,
    ) {
        this.reauthenticateAutomatically = reauthenticateAutomatically;
    }

    // ─── Action Factories ────────────────────────────────────────────────────

    reports(): Reports { return new Reports(this); }
    users(): Users { return new Users(this); }
    bonuses(): Bonuses { return new Bonuses(this); }
    financials(): Financials { return new Financials(this); }
    settings(): Settings { return new Settings(this); }
    promoCodes(): PromoCodes { return new PromoCodes(this); }

    // ─── Partner / Settings Helpers ──────────────────────────────────────────

    /**
     * Auto-fill partner ID from the currently selected partner in settings.
     * Call once after creating the client if you want methods that require
     * partnerId to work without passing it explicitly.
     */
    async withPreSelectedPartnerId(withPreSelected = true): Promise<this> {
        this._withPreSelectedPartnerId = withPreSelected;

        if (withPreSelected && this.partnerId === null) {
            const settings = await this.getCurrentSettings() as Record<string, unknown>;
            const data = settings['Data'] as Record<string, unknown> | undefined;
            const partners = (data?.['ReportPartners'] ?? []) as Array<Record<string, unknown>>;
            const selected = partners.find(p => p['IsSelected']);
            this.partnerId = selected ? (selected['Id'] as number) : null;
        }

        return this;
    }

    /**
     * Switch the active project (partner) for the current session.
     */
    async changeActiveProject(projectId: number): Promise<boolean> {
        const response = await this.settings().saveSetting({ ReportPartner: projectId });
        this.partnerId = projectId;
        return (response as Record<string, unknown>)['HasError'] === false;
    }

    /**
     * Get settings, using cache if already loaded.
     */
    async getCurrentSettings(): Promise<Record<string, unknown>> {
        if (Object.keys(this.cachedSettings).length === 0) {
            this.cachedSettings = await this.settings().getSettings();
        }
        return this.cachedSettings;
    }

    getPartnerId(): number | null { return this.partnerId; }
    isPreSelectedPartnerIdUsed(): boolean { return this._withPreSelectedPartnerId; }

    // ─── Session Management ──────────────────────────────────────────────────

    /**
     * Export current session for external storage (Redis, file, etc.)
     * Use setSession() to restore it later without re-authenticating.
     */
    getSession(): { cookies: Record<string, string>; expires_at: number | null } {
        return { cookies: this.authCookies, expires_at: this.authExpiresAt };
    }

    /**
     * Restore a previously exported session.
     */
    setSession(cookies: Record<string, string>, expiresAt: number): this {
        this.authCookies = cookies;
        this.authExpiresAt = expiresAt;
        return this;
    }

    getAuthCookies(): Record<string, string> {
        return this.authCookies;
    }

    // ─── Auth ────────────────────────────────────────────────────────────────

    async ensureAuthenticated(): Promise<void> {
        const now = Math.floor(Date.now() / 1000);
        const isExpired = this.authExpiresAt === null || this.authExpiresAt < now;
        const hasToken = !!this.authCookies['bo_sso_token'];

        if (!hasToken || isExpired) {
            if (this.reauthenticateAutomatically) {
                await this.authenticate();
                return;
            }
            throw new BetsConstructAuthException('Unauthenticated', 401);
        }
    }

    /**
     * Full 3-step authentication flow:
     * 1. Login with email + password → cookies
     * 2. 2FA verification with TOTP code → new cookies
     * 3. OAuth authorize → HTML → parse access_token
     */
    async authenticate(): Promise<void> {
        // Step 1: Login
        const loginResponse = await axios.post(
            `${BetsConstructClient.BASE_AUTH_URL}/v1/auth/login`,
            {
                email: this.credentials.getUsername(),
                password: this.credentials.getPassword(),
                domain: BetsConstructClient.BASE_AUTH_DOMAIN,
            },
            {
                headers: { 'User-Agent': BetsConstructClient.USER_AGENT },
                validateStatus: () => true,
            },
        );

        if (loginResponse.status >= 400) {
            throw new BetsConstructAuthException(
                `Login failed: ${JSON.stringify(loginResponse.data)}`,
                loginResponse.status,
            );
        }

        // Detect "must change password" flag returned by BetConstruct
        const loginData = loginResponse.data as Record<string, unknown> | null;
        if (loginData && (loginData['PasswordChangeRequired'] || loginData['MustChangePassword'] || loginData['IsPasswordExpired'])) {
            throw new BetsConstructAuthException(
                'BetConstruct requires a password change. Update BC_PASSWORD in .env and restart the container.',
                403,
            );
        }

        let cookies = parseSetCookies(loginResponse.headers as Record<string, unknown>);

        // Step 2: 2FA verification
        const verifyResponse = await axios.post(
            `${BetsConstructClient.BASE_AUTH_URL}/v1/twoFaAuth/verifications/codes`,
            {
                twoFactorCode: new GoogleAuth().getCode(this.credentials.getTwoFaSecret()),
                rememberMachine: false,
            },
            {
                headers: {
                    'User-Agent': BetsConstructClient.USER_AGENT,
                    'Cookie': buildCookieHeader(cookies),
                },
                validateStatus: () => true,
            },
        );

        if (verifyResponse.status >= 400) {
            throw new BetsConstructAuthException(
                `2FA verification failed: ${JSON.stringify(verifyResponse.data)}`,
                verifyResponse.status,
            );
        }

        cookies = parseSetCookies(verifyResponse.headers as Record<string, unknown>);

        // Step 3: OAuth authorize — response is an HTML form containing access_token
        const authorizeResponse = await axios.get(
            `${BetsConstructClient.BASE_AUTH_URL}/connect/authorize`,
            {
                params: BetsConstructClient.OAUTH_REQUEST_PARAMS,
                headers: {
                    'User-Agent': BetsConstructClient.USER_AGENT,
                    'Cookie': buildCookieHeader(cookies),
                },
                maxRedirects: 10,
                validateStatus: () => true,
            },
        );

        const $ = cheerio.load(authorizeResponse.data as string);
        const accessToken = $('input[name="access_token"]').val() as string | undefined;

        if (!accessToken) {
            const html = authorizeResponse.data as string;
            const looksLikePasswordChange = /change.?password|password.?change|ChangePassword|newPassword|new_password/i.test(html);
            if (looksLikePasswordChange) {
                throw new BetsConstructAuthException(
                    'BetConstruct requires a password change. Update BC_PASSWORD in .env and restart the container.',
                    403,
                );
            }
            // Log the HTML for debugging unknown auth failures
            console.error('[BetsConstructClient] Unexpected OAuth HTML:\n', html.slice(0, 2000));
            throw new BetsConstructAuthException(
                'Failed to extract access_token from OAuth response. HTML might have changed or login failed silently.',
            );
        }

        const now = Math.floor(Date.now() / 1000);
        this.authExpiresAt = now + BetsConstructClient.TOKEN_EXPIRES_IN - BetsConstructClient.TOKEN_LIFETIME_TOLERANCE_SECONDS;
        this.authCookies = { bo_sso_token: accessToken };
    }
}
