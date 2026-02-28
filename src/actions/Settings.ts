import { BaseAction } from './BaseAction';

export interface SaveSettingParams {
    Language?: string;
    TimeZone?: number;
    OddsType?: string | null;
    ReportCurrency?: string;
    ReportPartner?: number;
    HubNotificationSettings?: unknown[];
    IsAppliedPartnerDefaults?: boolean | null;
    ReportsColumns?: unknown[] | null;
    ViewMode?: number;
    DecimalPrecision?: number | null;
    IsSaveFilters?: boolean;
    ViewStyle?: string | null;
    DateFormat?: string | null;
    [key: string]: unknown;
}

export class Settings extends BaseAction {
    /**
     * Get current account settings.
     */
    async getSettings(): Promise<Record<string, unknown>> {
        await this.ensureAuthenticated();
        return this.sendRequest('/api/en/setting/GetSetting', {}, 'GET');
    }

    /**
     * Save account settings.
     * Most commonly used to switch active partner: saveSetting({ ReportPartner: id })
     */
    async saveSetting(params: SaveSettingParams): Promise<Record<string, unknown>> {
        await this.ensureAuthenticated();
        return this.sendRequest('/api/en/setting/saveSetting', params as Record<string, unknown>);
    }
}
