import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export function randomSecret(bytes = 32): string {
    return randomBytes(bytes).toString('base64url');
}
export function sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
}
export function equalHex(a: string, b: string): boolean {
    if (!/^[a-f0-9]{64}$/i.test(a) || !/^[a-f0-9]{64}$/i.test(b)) return false;
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}
export class TokenCipher {
    private readonly key: Buffer;
    constructor(base64Key: string) {
        this.key = Buffer.from(base64Key, 'base64');
        if (this.key.length !== 32 || this.key.toString('base64') !== base64Key)
            throw new Error('YAHOO_TOKEN_ENCRYPTION_KEY must be base64 for exactly 32 bytes.');
    }
    encrypt(plain: string): string {
        // A fresh 96-bit nonce and GCM tag protect the Yahoo token before it reaches Supabase.
        const iv = randomBytes(12),
            cipher = createCipheriv('aes-256-gcm', this.key, iv);
        const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
        return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString('base64url')).join('.');
    }
    decrypt(value: string): string {
        const [ivText, tagText, dataText] = value.split('.');
        if (!ivText || !tagText || !dataText) throw new Error('Invalid encrypted token record.');
        const decipher = createDecipheriv('aes-256-gcm', this.key, Buffer.from(ivText, 'base64url'));
        decipher.setAuthTag(Buffer.from(tagText, 'base64url'));
        return Buffer.concat([decipher.update(Buffer.from(dataText, 'base64url')), decipher.final()]).toString('utf8');
    }
}
