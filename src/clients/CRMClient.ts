import axios from 'axios';
import { BetsConstructAuthException } from '../exceptions/BetsConstructAuthException';
import { buildCookieHeader } from '../utils';
import { BACKOFFICE_API_BASE_URL } from '../actions/BaseAction';
import type { IBetsConstructClient } from './IBetsConstructClient';
import type { ICRMClient } from './ICRMClient';
import { Segments } from '../crmActions/Segments';

export class CRMClient implements ICRMClient {
    private authCookies: Record<string, string> = {};
    private authExpiresAt: number | null = null;

    public reauthenticateAutomatically: boolean;

    constructor(
        private readonly betsConstructClient: IBetsConstructClient,
        private readonly crmBaseURL = 'https://crm-t.betconstruct.com',
        reauthenticateAutomatically = true,
    ) {
        this.reauthenticateAutomatically = reauthenticateAutomatically;
    }

    // ─── Action Factories ────────────────────────────────────────────────────

    segments(): Segments { return new Segments(this); }

    // ─── Session Management ──────────────────────────────────────────────────

    getSession(): { cookies: Record<string, string>; expires_at: number | null } {
        return { cookies: this.authCookies, expires_at: this.authExpiresAt };
    }

    setSession(cookies: Record<string, string>, expiresAt: number): this {
        this.authCookies = cookies;
        this.authExpiresAt = expiresAt;
        return this;
    }

    getAuthCookies(): Record<string, string> {
        return this.authCookies;
    }

    getBaseUrl(): string {
        return this.crmBaseURL;
    }

    // ─── Auth ────────────────────────────────────────────────────────────────

    async ensureAuthenticated(): Promise<void> {
        const now = Math.floor(Date.now() / 1000);
        const isExpired = this.authExpiresAt === null || this.authExpiresAt < now;

        if (Object.keys(this.authCookies).length === 0 || isExpired) {
            if (this.reauthenticateAutomatically) {
                await this.authenticate();
                return;
            }
            throw new BetsConstructAuthException('Unauthenticated', 401);
        }
    }

    /**
     * Authenticate using the BetsConstructClient session:
     * 1. Ensure BetsConstructClient is authenticated
     * 2. GET /api/en/Account/CheckAuthentication → get `authentication` header token
     * 3. POST /api/en/User/LoginWithPlatform with that token → get JSON with Data token
     */
    async authenticate(): Promise<void> {
        await this.betsConstructClient.ensureAuthenticated();

        // Step 1: get cross-auth token from BackOffice
        const checkResponse = await axios.get(
            `${BACKOFFICE_API_BASE_URL}/api/en/Account/CheckAuthentication`,
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
                    'Cookie': buildCookieHeader(this.betsConstructClient.getAuthCookies()),
                },
                validateStatus: () => true,
            },
        );

        const token = checkResponse.headers['authentication'] as string;

        if (!token) {
            throw new BetsConstructAuthException('Failed to get authentication token from BackOffice CheckAuthentication endpoint');
        }

        // Step 2: sign in to CRM using the token
        // Note: the token string is sent as the raw JSON body (not wrapped in an object)
        const loginResponse = await axios.post(
            `${this.crmBaseURL}/api/en/User/LoginWithPlatform`,
            token,
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
                    'Content-Type': 'application/json',
                },
                validateStatus: () => true,
            },
        );

        if (loginResponse.status >= 400) {
            throw new BetsConstructAuthException(
                `CRM login failed: ${JSON.stringify(loginResponse.data)}`,
                loginResponse.status,
            );
        }

        const crmToken = (loginResponse.data as Record<string, unknown>)['Data'] as string;

        if (!crmToken) {
            throw new BetsConstructAuthException('CRM login did not return a token in Data field');
        }

        this.authCookies = { token: crmToken };
        this.authExpiresAt = Math.floor(Date.now() / 1000) + 3600;
    }
}
