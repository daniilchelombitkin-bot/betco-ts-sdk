/**
 * Interface for CRMClient.
 * Used by BaseCRMAction to avoid circular imports.
 */
export interface ICRMClient {
    reauthenticateAutomatically: boolean;
    getAuthCookies(): Record<string, string>;
    ensureAuthenticated(): Promise<void>;
    authenticate(): Promise<void>;
    getBaseUrl(): string;
}
