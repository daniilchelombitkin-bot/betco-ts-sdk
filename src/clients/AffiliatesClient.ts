import axios from 'axios';
import { BetsConstructAuthException } from '../exceptions/BetsConstructAuthException';
import { parseSetCookies, buildCookieHeader } from '../utils';
import { BACKOFFICE_API_BASE_URL } from '../actions/BaseAction';
import type { IBetsConstructClient } from './IBetsConstructClient';
import type { IAffiliatesClient } from './IAffiliatesClient';
import { Players } from '../affiliatesActions/Players';

export class AffiliatesClient implements IAffiliatesClient {
    private authCookies: Record<string, string> = {};
    private authExpiresAt: number | null = null;

    public reauthenticateAutomatically: boolean;

    constructor(
        private readonly betsConstructClient: IBetsConstructClient,
        private readonly affiliateBaseURL: string,
        reauthenticateAutomatically = true,
    ) {
        this.reauthenticateAutomatically = reauthenticateAutomatically;
    }

    // ─── Action Factories ────────────────────────────────────────────────────

    players(): Players { return new Players(this); }

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
        return this.affiliateBaseURL;
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
     * 3. POST /global/api/core/signInFromBetconstruct with that token → get session cookies
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

        // Step 2: sign in to Affiliates using the token
        const signInResponse = await axios.post(
            `${this.affiliateBaseURL}/global/api/core/signInFromBetconstruct`,
            { authToken: token },
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
                },
                validateStatus: () => true,
            },
        );

        if (signInResponse.status >= 400) {
            throw new BetsConstructAuthException(
                `Affiliates sign-in failed: ${JSON.stringify(signInResponse.data)}`,
                signInResponse.status,
            );
        }

        this.authCookies = parseSetCookies(signInResponse.headers as Record<string, unknown>);
        this.authExpiresAt = Math.floor(Date.now() / 1000) + 3600;
    }
}
