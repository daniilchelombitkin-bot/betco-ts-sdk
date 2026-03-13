import axios from 'axios';
import type { IBetsConstructClient } from '../clients/IBetsConstructClient';
import { BetsConstructRequestException } from '../exceptions/BetsConstructRequestException';
import { BetsConstructLogicException } from '../exceptions/BetsConstructLogicException';
import { buildCookieHeader } from '../utils';

export const BACKOFFICE_API_BASE_URL = 'https://backofficewebadmin.betconstruct.com';

export abstract class BaseAction {
    constructor(protected readonly client: IBetsConstructClient) {}

    protected async ensureAuthenticated(): Promise<void> {
        await this.client.ensureAuthenticated();
    }

    /**
     * Send a request to the BackOffice API.
     *
     * @param url - relative URL, e.g. '/api/en/Client/GetClientById'
     * @param params - query params (GET) or JSON body (POST/PUT/etc.)
     * @param httpMethod - HTTP method, defaults to 'POST'
     */
    protected async sendRequest(
        url: string,
        params: object = {},
        httpMethod = 'POST',
        retry = true,
    ): Promise<Record<string, unknown>> {
        const method = httpMethod.toUpperCase();
        const cookies = this.client.getAuthCookies();

        const makeRequest = () => axios.request({
            method,
            url: `${BACKOFFICE_API_BASE_URL}${url}`,
            headers: {
                'Authentication': cookies['bo_sso_token'] ?? '',
                'Cookie': buildCookieHeader(cookies),
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
            },
            ...((['GET', 'OPTIONS', 'HEAD'].includes(method)) ? { params } : { data: params }),
            validateStatus: () => true,
        });

        const maxAttempts = retry ? 3 : 1;
        let lastError: unknown;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                const response = await makeRequest();

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

                const data = response.data as Record<string, unknown>;
                if (data['HasError'] === true) {
                    throw new BetsConstructLogicException(
                        (data['AlertMessage'] as string) ?? 'Unknown API error',
                    );
                }
                return data;
            } catch (e) {
                if (e instanceof BetsConstructRequestException) throw e;
                if (e instanceof BetsConstructLogicException) throw e;
                lastError = e;
                if (attempt < 2) {
                    await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
                }
            }
        }

        throw lastError;
    }
}
