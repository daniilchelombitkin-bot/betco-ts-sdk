import { createHmac } from 'crypto';

/**
 * Decode a base32-encoded string to a Buffer.
 * Supports standard RFC 4648 base32 alphabet (A-Z, 2-7).
 */
function base32Decode(secret: string): Buffer {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const lookup: Record<string, number> = {};
    for (let i = 0; i < alphabet.length; i++) {
        lookup[alphabet[i]] = i;
    }

    const cleaned = secret.toUpperCase().replace(/=+$/, '');

    let bits = '';
    for (const char of cleaned) {
        const val = lookup[char];
        if (val === undefined) continue;
        bits += val.toString(2).padStart(5, '0');
    }

    const bytes: number[] = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
        bytes.push(parseInt(bits.slice(i, i + 8), 2));
    }

    return Buffer.from(bytes);
}

/**
 * TOTP (Time-based One-Time Password) implementation.
 * Compatible with Google Authenticator.
 * Direct port of the PHP GoogleAuth class.
 */
export class GoogleAuth {
    private readonly codeLength = 6;

    /**
     * Generate a TOTP code for the given base32-encoded secret.
     *
     * @param secret - base32-encoded TOTP secret
     * @param timeSlice - optional unix time / 30 (defaults to current time)
     */
    getCode(secret: string, timeSlice?: number): string {
        if (timeSlice === undefined) {
            timeSlice = Math.floor(Date.now() / 1000 / 30);
        }

        const secretKey = base32Decode(secret);

        // 8-byte big-endian time buffer (first 4 bytes = 0 for timestamps < 2^32 * 30 seconds)
        const time = Buffer.alloc(8, 0);
        time.writeUInt32BE(timeSlice >>> 0, 4);

        // HMAC-SHA1
        const hm = createHmac('sha1', secretKey).update(time).digest();

        // Dynamic truncation
        const offset = hm[hm.length - 1] & 0x0f;
        let value = hm.readUInt32BE(offset);
        value = value & 0x7fffffff;

        const code = value % Math.pow(10, this.codeLength);
        return code.toString().padStart(this.codeLength, '0');
    }
}
