import { BaseAction } from './BaseAction';

export interface GetTransactionsParams {
    FromCreatedDateLocal?: string;
    ToCreatedDateLocal?: string;
    ClientId?: number;
    ExternalId?: number;
    CashDeskId?: number;
    CurrencyId?: number;
    TypeId?: number;
    MaxRows?: number;
    SkeepRows?: number;
    Id?: number;
    PaymentSystemId?: number;
    ClientLogin?: string;
    UserName?: string;
    AmountFrom?: number;
    AmountTo?: number;
    IsTest?: boolean;
    DefaultCurrencyId?: string;
    [key: string]: unknown;
}

export class Financials extends BaseAction {
    /**
     * Get financial transactions with pagination.
     */
    async getTransactions(params: GetTransactionsParams = {}): Promise<Record<string, unknown>> {
        await this.ensureAuthenticated();
        return this.sendRequest('/api/null/Financial/GetDocumentsWithPaging', params as Record<string, unknown>);
    }
}
