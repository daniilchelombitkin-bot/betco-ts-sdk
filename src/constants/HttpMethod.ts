export const HttpMethod = {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    PATCH: 'PATCH',
    DELETE: 'DELETE',
    HEAD: 'HEAD',
    OPTIONS: 'OPTIONS',
    TRACE: 'TRACE',
} as const;

export type HttpMethodType = typeof HttpMethod[keyof typeof HttpMethod];
