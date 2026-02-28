/**
 * Interface for AffiliatesClient.
 * Used by BaseAffiliatesAction to avoid circular imports.
 */
export interface IAffiliatesClient {
    reauthenticateAutomatically: boolean;
    getAuthCookies(): Record<string, string>;
    ensureAuthenticated(): Promise<void>;
    authenticate(): Promise<void>;
    getBaseUrl(): string;
}
