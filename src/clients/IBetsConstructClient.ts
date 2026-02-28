/**
 * Interface for BetsConstructClient.
 * Used by BaseAction to avoid circular imports.
 */
export interface IBetsConstructClient {
    reauthenticateAutomatically: boolean;
    getAuthCookies(): Record<string, string>;
    ensureAuthenticated(): Promise<void>;
    authenticate(): Promise<void>;
    getPartnerId(): number | null;
    isPreSelectedPartnerIdUsed(): boolean;
}
