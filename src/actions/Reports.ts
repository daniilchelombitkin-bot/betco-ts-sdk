import { BaseAction } from './BaseAction';

export interface GetTurnoverReportParams {
    StartTimeLocal: string;
    EndTimeLocal: string;
    ClientId?: string | number | null;
    CurrencyId?: string | number | null;
    IsTest?: boolean | null;
}

export interface GetBetsParams {
    filterBet: {
        StartDateLocal: string;
        EndDateLocal: string;
        ClientId?: string | null;
        ClientExternalId?: string | null;
        AmountFrom?: number | null;
        AmountTo?: number | null;
        WinningAmountFrom?: number | null;
        WinningAmountTo?: number | null;
        BetTypes?: unknown[];
        State?: string | null;
        CalcStartDateLocal?: string | null;
        CalcEndDateLocal?: string | null;
        Sources?: unknown[];
        OrderedItem?: number | null;
        IsOrderedDesc?: boolean;
        SportsbookProfileId?: string | null;
        ClientLoginIp?: string | null;
        PriceFrom?: number | null;
        PriceTo?: number | null;
        IsTest?: boolean | null;
        BetId?: string | null;
        BetshopId?: string | null;
        IsClientWithBetShop?: boolean | null;
        CurrencyId?: string | number | null;
        IsBonusBet?: boolean | null;
        IsLive?: boolean | null;
        SkeepRows?: number | null;
        MaxRows?: number | null;
        IsWithSelections?: boolean;
        [key: string]: unknown;
    };
    filterBetSelection?: {
        SportId?: number | null;
        RegionId?: number | null;
        CompetitionId?: number | null;
        MatchId?: number | null;
    };
    matchFilter?: {
        currentSport?: string | null;
        currentRegion?: string | null;
        currentCompetition?: string | null;
        currentMatch?: string | null;
    };
    isCalcTime?: boolean;
    byPassTotals?: boolean;
    ToCurrencyId?: string | null;
}

export interface GetBonusReportParams {
    StartDateLocal?: string | null;
    EndDateLocal?: string | null;
    ClientId?: number | null;
    ClientBonusId?: string;
    PartnerBonusId?: string;
    AcceptanceType?: string | null;
    BonusType?: string | null;
    BonusSource?: string | null;
    ResultType?: string | null;
    ToCurrencyId?: string;
    SkeepRows?: number;
    MaxRows?: number;
    ByPassTotals?: boolean;
    [key: string]: unknown;
}

export class Reports extends BaseAction {
    /**
     * Get client turnover report with active bonuses.
     */
    async getTurnOverReport(params: GetTurnoverReportParams): Promise<Record<string, unknown>> {
        await this.ensureAuthenticated();
        return this.sendRequest('/api/en/Report/GetClientTurnoverReportWithActiveBonus', params);
    }

    /**
     * Get bets report.
     */
    async getBets(params: GetBetsParams): Promise<Record<string, unknown>> {
        await this.ensureAuthenticated();
        return this.sendRequest('/api/en/Report/GetBetReport', params);
    }

    /**
     * Get client bonus report.
     */
    async getBonusReport(params: GetBonusReportParams): Promise<Record<string, unknown>> {
        await this.ensureAuthenticated();
        return this.sendRequest('/api/en/Report/GetClientBonusReport', params);
    }

    /**
     * Get bet report (alias for getBets, same endpoint).
     */
    async getBetReport(params: GetBetsParams): Promise<Record<string, unknown>> {
        await this.ensureAuthenticated();
        return this.sendRequest('/api/en/Report/GetBetReport', params);
    }

}
