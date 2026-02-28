import { BaseAction } from './BaseAction';
import { BonusType } from '../enums/BonusType';
import { PaymentDocumentType } from '../enums/PaymentDocumentType';

export interface GetBonusesParams {
    BonusType?: string | null;
    EndDateLocal?: string | null;
    StartDateLocal?: string | null;
    AcceptanceType?: string | null;
    PartnerBonusName?: string | null;
    ClientBonusId?: string | null;
    PartnerBonusId?: string | null;
    PartnerExternalBonusId?: string | null;
}

export interface CreatePaymentDocumentParams {
    Info?: string;
    PaymentSystemId?: number;
    [key: string]: unknown;
}

export interface AttachBonusParams {
    Note?: string;
    MessageChannel?: string | null;
    MessageSubject?: string | null;
    MessageContent?: string | null;
    Count?: number | null;
    PartnerBonusName?: string;
    [key: string]: unknown;
}

export interface SearchClientsParams {
    Id?: string | null;
    Email?: string;
    FirstName?: string;
    LastName?: string;
    Login?: string;
    MobilePhone?: string;
    Phone?: string;
    PersonalId?: string;
    DocumentNumber?: string;
    ExternalId?: string;
    BTag?: string | null;
    PromoCode?: string | null;
    CurrencyId?: string | number | null;
    Gender?: string | null;
    Status?: string | null;
    IsTest?: string | null;
    IsLocked?: boolean | null;
    IsVerified?: boolean | null;
    IsEmailSubscribed?: boolean | null;
    IsSMSSubscribed?: boolean | null;
    IsSelfExcluded?: boolean | null;
    MinBalance?: number | null;
    MaxBalance?: number | null;
    BirthDate?: string | null;
    MinCreatedLocal?: string | null;
    MaxCreatedLocal?: string | null;
    MaxRows?: number;
    SkeepRows?: number;
    IsOrderedDesc?: boolean;
    OrderedItem?: number;
    [key: string]: unknown;
}

export interface UpdateClientDetailsParams {
    Id: number;
    Gender?: number;
    RegionId?: string;
    Login?: string;
    Password?: string;
    Email?: string;
    IsResident?: boolean;
    IsTest?: boolean;
    IsSubscribeToEmail?: boolean;
    IsSubscribeToSMS?: boolean;
    CurrencyId?: string;
    [key: string]: unknown;
}

export class Users extends BaseAction {
    /**
     * Get user details by ID.
     */
    async get(userId: string | number): Promise<Record<string, unknown>> {
        await this.ensureAuthenticated();
        return this.sendRequest('/api/en/Client/GetClientById', { id: userId }, 'GET');
    }

    /**
     * Get user KPI details.
     */
    async getKPI(userId: string | number): Promise<Record<string, unknown>> {
        await this.ensureAuthenticated();
        return this.sendRequest('/api/en/Client/GetClientKpi', { id: userId }, 'GET');
    }

    /**
     * Update user info (SaveClientInfo).
     */
    async update(userId: string | number, data: Record<string, unknown>): Promise<Record<string, unknown>> {
        await this.ensureAuthenticated();
        return this.sendRequest('/api/en/Client/SaveClientInfo', { ...data, ClientId: userId });
    }

    /**
     * Reset user password.
     */
    async updatePassword(userId: string | number, newPassword: string): Promise<Record<string, unknown>> {
        await this.ensureAuthenticated();
        return this.sendRequest('/api/en/Client/ResetPassword', { ClientId: userId, Password: newPassword });
    }

    /**
     * Get user accounts (balances).
     */
    async getAccounts(userId: string | number): Promise<Record<string, unknown>> {
        await this.ensureAuthenticated();
        return this.sendRequest('/api/en/Client/GetClientAccounts', { Id: userId });
    }

    /**
     * Get bonuses assigned to a user.
     */
    async getBonuses(clientId: string | number, params: GetBonusesParams = {}): Promise<Record<string, unknown>> {
        await this.ensureAuthenticated();
        return this.sendRequest('/api/en/Client/GetClientBonuses', { ClientId: clientId, ...params });
    }

    /**
     * Create a payment document (deposit, withdrawal, correction, etc.)
     */
    async createPaymentDocument(
        clientId: string | number,
        currency: string,
        amount: string | number,
        type: PaymentDocumentType,
        params: CreatePaymentDocumentParams = {},
    ): Promise<Record<string, unknown>> {
        await this.ensureAuthenticated();
        return this.sendRequest('/api/en/Client/CreateClientPaymentDocument', {
            ClientId: clientId,
            CurrencyId: currency,
            Amount: amount,
            DocTypeInt: type,
            ...params,
        });
    }

    /**
     * Attach (give) a bonus to a user.
     */
    async attachBonus(
        clientId: string | number,
        bonusId: string | number,
        amount: number,
        type: BonusType,
        additionalParams: AttachBonusParams = {},
    ): Promise<Record<string, unknown>> {
        await this.ensureAuthenticated();
        return this.sendRequest('/api/en/Client/AddClientToBonus', {
            ClientId: clientId,
            Amount: amount,
            PartnerBonusId: bonusId,
            Type: type,
            ...additionalParams,
        });
    }

    /**
     * Search for clients using filters.
     */
    async search(params: SearchClientsParams = {}): Promise<Record<string, unknown>> {
        await this.ensureAuthenticated();
        return this.sendRequest('/api/en/Client/GetClients', params as Record<string, unknown>);
    }

    /**
     * Update or create client details (UpdateClientDetails).
     */
    async updateClientDetails(params: UpdateClientDetailsParams): Promise<Record<string, unknown>> {
        await this.ensureAuthenticated();
        return this.sendRequest('/api/en/Client/UpdateClientDetails', params as Record<string, unknown>);
    }
}
