/**
 * Parse Set-Cookie headers from axios response into a key-value map.
 * Only takes the name=value part, ignores Path/Expires/etc.
 */
export function parseSetCookies(headers: Record<string, unknown>): Record<string, string> {
    const cookies: Record<string, string> = {};
    const raw = headers['set-cookie'];
    if (!raw) return cookies;

    const cookieArray: string[] = Array.isArray(raw) ? raw : [String(raw)];

    for (const cookie of cookieArray) {
        const [nameValue] = cookie.split(';');
        const eqIdx = nameValue.indexOf('=');
        if (eqIdx === -1) continue;
        const name = nameValue.slice(0, eqIdx).trim();
        const value = nameValue.slice(eqIdx + 1).trim();
        cookies[name] = value;
    }

    return cookies;
}

/**
 * Build a Cookie header string from a key-value map.
 * Example: { a: '1', b: '2' } → 'a=1; b=2'
 */
export function buildCookieHeader(cookies: Record<string, string>): string {
    return Object.entries(cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');
}
