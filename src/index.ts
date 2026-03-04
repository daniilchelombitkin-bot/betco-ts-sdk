// ─── Clients ──────────────────────────────────────────────────────────────────
export { BetsConstructClient } from './clients/BetsConstructClient';
export { SdkHttpClient } from './SdkHttpClient';
export { AffiliatesClient } from './clients/AffiliatesClient';
export { CRMClient } from './clients/CRMClient';

// ─── Credentials ──────────────────────────────────────────────────────────────
export { Credentials } from './Credentials';

// ─── Enums ────────────────────────────────────────────────────────────────────
export { BonusType } from './enums/BonusType';
export { PaymentDocumentType } from './enums/PaymentDocumentType';

// ─── Constants ────────────────────────────────────────────────────────────────
export { HttpMethod } from './constants/HttpMethod';
export type { HttpMethodType } from './constants/HttpMethod';

// ─── Exceptions ───────────────────────────────────────────────────────────────
export { BetsConstructException } from './exceptions/BetsConstructException';
export { BetsConstructAuthException } from './exceptions/BetsConstructAuthException';
export { BetsConstructRequestException } from './exceptions/BetsConstructRequestException';
export { BetsConstructLogicException } from './exceptions/BetsConstructLogicException';

// ─── Action Types (for type hints in your IDE) ────────────────────────────────
export type { GetTurnoverReportParams, GetBetsParams, GetBonusReportParams } from './actions/Reports';
export type { GetClientPromoCodesParams, PromoCodeItem, GetClientPromoCodesResponse, CreatePromoCodeParams, PromoCodeAmountItem } from './actions/PromoCodes';
export type { GetBonusesParams, CreatePaymentDocumentParams, AttachBonusParams, SearchClientsParams, UpdateClientDetailsParams } from './actions/Users';
export type { GetBonusListParams } from './actions/Bonuses';
export type { GetTransactionsParams } from './actions/Financials';
export type { SaveSettingParams } from './actions/Settings';
export type { GetPlayersParams, AttachPlayerParams } from './affiliatesActions/Players';
