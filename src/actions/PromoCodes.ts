import { BaseAction } from './BaseAction';

export interface GetClientPromoCodesParams {
    StartTimeLocal?: string;
    EndTimeLocal?: string;
    CurrencyId?: string | null;
    Code?: string | null;
    ClientId?: string | number | null;
    PromoCodeId?: number | null;
    PromoCodeBonusId?: number | null;
    PromoCodeTypeId?: number | null;
}

export interface PromoCodeItem {
    Id: number;
    ClientId: number;
    PartnerId: number;
    FirstName: string;
    LastName: string;
    Login: string;
    Name: string;
    SportsbookProfileId: number;
    CurrencyId: string;
    PromoCodeId: number;
    Code: string;
    PromoCodeDescription: string | null;
    PromoCodeType: number;
    PromoCodeBonusId: number;
    Amount: number;
    CreatedDateLocal: string;
}

export interface GetClientPromoCodesResponse {
    HasError: boolean;
    AlertType: string;
    AlertMessage: string;
    ModelErrors: unknown[];
    Data: PromoCodeItem[];
}

/** Сумма/количество бонуса по валюте */
export interface PromoCodeAmountItem {
    CurrencyId: string;
    Amount: string;         // для FS — кол-во спинов, для FreeBet — стоимость ставки, для WagerBonus — сумма
    IsDeleted?: boolean;
    generatedId?: string;
    isEditable?: boolean;
}

export interface CreatePromoCodeParams {
    Code: string;
    BonusId: number;
    /**
     * Тип промокода:
     * 1 - Wager Bonus
     * 3 - FreeBet
     * 4 - FreeSpin
     */
    TypeId: 1 | 3 | 4 | number;
    StartDateLocal: string;
    EndDateLocal: string;
    StartDate: string;
    EndDate: string;
    IsActive?: boolean;
    /** true — только для верифицированных игроков */
    IsForVerified?: boolean;
    IsFromOtherPlaces?: boolean;
    IsBalanceValidate?: boolean;
    IsFromRegistration?: boolean;
    /** Максимальное количество активаций */
    MaxCount?: string | null;
    MaxCasinoBetPassDay?: number | null;
    MaxDepositPassDay?: number | null;
    MaxSportBetPassDay?: number | null;
    MinDepositCount?: number | null;
    UsedCount?: string | number;
    Description?: string | null;
    AffilateId?: number | null;
    Prefix?: string | null;
    Count?: number | null;
    CodeLength?: number;
    ClientSportsbookProfiles?: unknown[];
    /**
     * Сумма бонуса по валютам.
     * Должна быть в рамках лимита бонуса, иначе создадутся пустые промокоды.
     */
    PromoItems?: PromoCodeAmountItem[];
    PromoCodeItems?: PromoCodeAmountItem[];
    CustomClientCategories?: (number | null)[];
    Rules?: { DepositRules?: unknown[] };
}

export class PromoCodes extends BaseAction {
    /**
     * Get promo codes used by clients.
     * Defaults to today if dates are not provided.
     * @throws {BetsConstructAuthException} если сессия истекла и реавторизация не удалась
     * @throws {BetsConstructRequestException} если API вернул 4xx/5xx
     */
    async getClientPromoCodes(params: GetClientPromoCodesParams = {}): Promise<GetClientPromoCodesResponse> {
        await this.ensureAuthenticated();

        const now = new Date();
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);

        return this.sendRequest('/api/en/Report/GetClientPromoCodes', {
            StartTimeLocal: start.toISOString(),
            EndTimeLocal: end.toISOString(),
            ...params,
        }) as unknown as Promise<GetClientPromoCodesResponse>;
    }

    /**
     * Create a new promo code.
     * @throws {BetsConstructLogicException} если промокод с таким именем уже существует или параметры невалидны
     * @throws {BetsConstructAuthException} если сессия истекла и реавторизация не удалась
     * @throws {BetsConstructRequestException} если API вернул 4xx/5xx
     */
    async create(params: CreatePromoCodeParams): Promise<Record<string, unknown>> {
        await this.ensureAuthenticated();
        return this.sendRequest('/api/en/Reference/SavePromoCodeWithItemsAsync', params);
    }
}
