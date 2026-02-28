import axios from 'axios';
import type { ICRMClient } from '../clients/ICRMClient';
import { BetsConstructRequestException } from '../exceptions/BetsConstructRequestException';

export abstract class BaseCRMAction {
    constructor(protected readonly client: ICRMClient) {}

    protected async ensureAuthenticated(): Promise<void> {
        await this.client.ensureAuthenticated();
    }

    /**
     * Send a request to the CRM API.
     *
     * @param url - relative URL, e.g. '/api/en/Segment/Update'
     * @param params - query params (GET) or JSON body (POST/PUT/etc.)
     * @param httpMethod - HTTP method, defaults to 'POST'
     */
    protected async sendRequest(
        url: string,
        params: object = {},
        httpMethod = 'POST',
    ): Promise<Record<string, unknown>> {
        const method = httpMethod.toUpperCase();
        const cookies = this.client.getAuthCookies();

        const response = await axios.request({
            method,
            url: `${this.client.getBaseUrl()}${url}`,
            headers: {
                'Authentication': cookies['token'] ?? '',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
            },
            ...((['GET', 'OPTIONS', 'HEAD'].includes(method)) ? { params } : { data: params }),
            validateStatus: () => true,
        });

        if (response.status === 401 && this.client.reauthenticateAutomatically) {
            await this.client.authenticate();
            return this.sendRequest(url, params, httpMethod);
        }

        if (response.status >= 400) {
            throw new BetsConstructRequestException(
                `Request failed with status ${response.status}`,
                response.status,
                response.data,
            );
        }

        return response.data as Record<string, unknown>;
    }
}
