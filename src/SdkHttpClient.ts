import axios from 'axios';
import type { GetTurnoverReportParams, GetBetsParams, GetBonusReportParams, GetRegistrationStatisticsDetailsParams } from './actions/Reports';
import type { GetBonusesParams, CreatePaymentDocumentParams, AttachBonusParams, SearchClientsParams, UpdateClientDetailsParams } from './actions/Users';
import type { GetBonusListParams } from './actions/Bonuses';
import type { GetTransactionsParams } from './actions/Financials';
import type { SaveSettingParams } from './actions/Settings';
import type { GetClientPromoCodesParams, CreatePromoCodeParams } from './actions/PromoCodes';
import type { GetPlayersParams, AttachPlayerParams } from './affiliatesActions/Players';

/**
 * Typed HTTP client for bots. Connects to the running SDK server (server.ts).
 * No BetConstruct credentials needed — auth is centralized on the server.
 *
 * Setup in your bot:
 *   npm install git+https://TOKEN@github.com/daniilchelombitkin-bot/betco-ts-sdk.git
 *
 * Usage:
 *   import { SdkHttpClient } from 'betco-ts-sdk';
 *   const sdk = new SdkHttpClient(process.env.SDK_URL!, process.env.SDK_SECRET);
 *   const user = await sdk.users.get(12345);
 */
export class SdkHttpClient {
    public readonly users: UsersApi;
    public readonly reports: ReportsApi;
    public readonly bonuses: BonusesApi;
    public readonly financials: FinancialsApi;
    public readonly settings: SettingsApi;
    public readonly promoCodes: PromoCodesApi;
    public readonly affiliates: AffiliatesApi;
    public readonly crm: CrmApi;
    public readonly client: ClientApi;

    constructor(
        private readonly url: string,
        private readonly secret?: string,
    ) {
        const rpc = this._rpc.bind(this);
        this.users = new UsersApi(rpc);
        this.reports = new ReportsApi(rpc);
        this.bonuses = new BonusesApi(rpc);
        this.financials = new FinancialsApi(rpc);
        this.settings = new SettingsApi(rpc);
        this.promoCodes = new PromoCodesApi(rpc);
        this.affiliates = new AffiliatesApi(rpc);
        this.crm = new CrmApi(rpc);
        this.client = new ClientApi(rpc);
    }

    async health(): Promise<boolean> {
        const res = await axios.get(`${this.url}/health`);
        return res.data?.ok === true;
    }

    private async _rpc(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (this.secret) headers['Authorization'] = `Bearer ${this.secret}`;

        const res = await axios.post(`${this.url}/rpc`, { method, params }, { headers, validateStatus: () => true });

        const data = res.data as { ok: boolean; result?: unknown; error?: string; code?: number | null };
        if (!data.ok) {
            const err = new Error(data.error ?? 'SDK error') as Error & { code?: number | null };
            err.code = data.code;
            throw err;
        }
        return data.result;
    }
}

type Rpc = (method: string, params?: Record<string, unknown>) => Promise<unknown>;

class UsersApi {
    constructor(private rpc: Rpc) {}
    get(userId: number | string)                                                                           { return this.rpc('users.get', { userId }); }
    getKPI(userId: number | string)                                                                        { return this.rpc('users.getKPI', { userId }); }
    update(userId: number | string, data: Record<string, unknown>)                                         { return this.rpc('users.update', { userId, data }); }
    updatePassword(userId: number | string, password: string)                                              { return this.rpc('users.updatePassword', { userId, password }); }
    getAccounts(userId: number | string)                                                                   { return this.rpc('users.getAccounts', { userId }); }
    getBonuses(clientId: number | string, params?: GetBonusesParams)                                       { return this.rpc('users.getBonuses', { clientId, params }); }
    createPaymentDocument(clientId: number | string, currency: string, amount: number, type: number, params?: CreatePaymentDocumentParams) { return this.rpc('users.createPaymentDocument', { clientId, currency, amount, type, params }); }
    attachBonus(clientId: number | string, bonusId: number, amount: number, type: number, params?: AttachBonusParams) { return this.rpc('users.attachBonus', { clientId, bonusId, amount, type, params }); }
    search(params?: SearchClientsParams)                                                                    { return this.rpc('users.search', params as Record<string, unknown>); }
    updateClientDetails(params: UpdateClientDetailsParams)                                                 { return this.rpc('users.updateClientDetails', params as Record<string, unknown>); }
}

class ReportsApi {
    constructor(private rpc: Rpc) {}
    getBets(params: GetBetsParams)                                             { return this.rpc('reports.getBets', params as unknown as Record<string, unknown>); }
    getTurnOverReport(params: GetTurnoverReportParams)                         { return this.rpc('reports.getTurnOverReport', params as unknown as Record<string, unknown>); }
    getBonusReport(params: GetBonusReportParams)                               { return this.rpc('reports.getBonusReport', params as unknown as Record<string, unknown>); }
    getRegistrationStatisticsDetails(params: GetRegistrationStatisticsDetailsParams) { return this.rpc('reports.getRegistrationStatisticsDetails', params as unknown as Record<string, unknown>); }
}

class BonusesApi {
    constructor(private rpc: Rpc) {}
    getList(partnerId?: number, params?: GetBonusListParams) { return this.rpc('bonuses.getList', { partnerId, params }); }
}

class FinancialsApi {
    constructor(private rpc: Rpc) {}
    getTransactions(params?: GetTransactionsParams) { return this.rpc('financials.getTransactions', params as Record<string, unknown>); }
}

class SettingsApi {
    constructor(private rpc: Rpc) {}
    getSettings()                      { return this.rpc('settings.getSettings'); }
    saveSetting(params: SaveSettingParams) { return this.rpc('settings.saveSetting', params as unknown as Record<string, unknown>); }
}

class PromoCodesApi {
    constructor(private rpc: Rpc) {}
    getClientPromoCodes(params?: GetClientPromoCodesParams) { return this.rpc('promoCodes.getClientPromoCodes', params as Record<string, unknown>); }
    create(params: CreatePromoCodeParams)                   { return this.rpc('promoCodes.create', params as unknown as Record<string, unknown>); }
}

class AffiliatesApi {
    constructor(private rpc: Rpc) {}
    readonly players = {
        get:                 (params?: GetPlayersParams)   => this.rpc('affiliates.players.get', params as Record<string, unknown>),
        attachPlayerToRefId: (params: AttachPlayerParams)  => this.rpc('affiliates.players.attachPlayerToRefId', params as unknown as Record<string, unknown>),
    };
}

class CrmApi {
    constructor(private rpc: Rpc) {}
    readonly segments = {
        update: (segmentId: number, params?: Record<string, unknown>) => this.rpc('crm.segments.update', { segmentId, params }),
    };
}

class ClientApi {
    constructor(private rpc: Rpc) {}
    changeActiveProject(projectId: number)  { return this.rpc('client.changeActiveProject', { projectId }); }
    withPreSelectedPartnerId()              { return this.rpc('client.withPreSelectedPartnerId'); }
}
