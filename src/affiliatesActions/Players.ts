import { BaseAffiliatesAction } from './BaseAffiliatesAction';
import { HttpMethod } from '../constants/HttpMethod';

export interface GetPlayersParams {
    start?: number;
    limit?: number;
    filter?: Record<string, unknown>;
    [key: string]: unknown;
}

export interface AttachPlayerParams {
    brandId: number;
    newPlayerId: number;
    affiliateId: number;
}

export class Players extends BaseAffiliatesAction {
    /**
     * Get players statistics (pro version with filtering and pagination).
     */
    async get(params: GetPlayersParams = {}): Promise<Record<string, unknown>> {
        await this.ensureAuthenticated();
        return this.sendRequest('/global/api/Statistics/getPlayersStatisticsPro', params, HttpMethod.POST);
    }

    /**
     * Attach a player to an affiliate ref ID.
     */
    async attachPlayerToRefId(params: AttachPlayerParams): Promise<Record<string, unknown>> {
        await this.ensureAuthenticated();
        return this.sendRequest('/global/api/Player/addPlayerFromSpring', params, HttpMethod.POST);
    }
}
