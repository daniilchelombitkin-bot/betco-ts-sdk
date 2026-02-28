import { BaseAction } from './BaseAction';
import { BetsConstructLogicException } from '../exceptions/BetsConstructLogicException';

export interface GetBonusListParams {
    IsBonusDetailsIncluded?: boolean;
    IsDeleted?: boolean;
    IsDisabled?: boolean;
    [key: string]: unknown;
}

export class Bonuses extends BaseAction {
    /**
     * Get partner bonuses list.
     *
     * @param partnerId - if null, uses the pre-selected partner ID from withPreSelectedPartnerId()
     * @param additionalParams - optional extra filters
     */
    async getList(partnerId: string | number | null = null, additionalParams: GetBonusListParams = {}): Promise<Record<string, unknown>> {
        await this.ensureAuthenticated();

        if (partnerId === null) {
            if (!this.client.isPreSelectedPartnerIdUsed()) {
                throw new BetsConstructLogicException('Partner ID is required for Bonuses.getList(). Either pass it explicitly or call withPreSelectedPartnerId() on the client.');
            }
            partnerId = this.client.getPartnerId();
        }

        return this.sendRequest('/api/en/Client/GetPartnerBonuses', {
            PartnerId: partnerId,
            ...additionalParams,
        });
    }
}
