import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

export type LocalHttpsOptions = { key: Buffer; cert: Buffer };

/** Load local development certificates only when explicitly enabled; Cloud Run terminates its own TLS. */
export async function loadLocalHttps(env: Record<string, string | undefined>): Promise<LocalHttpsOptions | undefined> {
    if (env.API_HTTPS !== 'true') return undefined;
    if (env.NODE_ENV === 'production') throw new Error('API_HTTPS is for local development only.');

    const certFile = env.API_TLS_CERT_FILE?.trim();
    const keyFile = env.API_TLS_KEY_FILE?.trim();
    if (Boolean(certFile) !== Boolean(keyFile)) {
        throw new Error('Set both API_TLS_CERT_FILE and API_TLS_KEY_FILE, or use the default local certificates.');
    }

    const directory = join(homedir(), '.config', 'draft-duck', 'certs');
    try {
        const [cert, key] = await Promise.all([
            readFile(certFile ? certificatePath(certFile) : join(directory, 'localhost.pem')),
            readFile(keyFile ? certificatePath(keyFile) : join(directory, 'localhost-key.pem'))
        ]);
        return { cert, key };
    } catch {
        throw new Error('Could not read local HTTPS certificates. Check the certificate paths and file permissions.');
    }
}

function certificatePath(value: string): string {
    return value.startsWith('~/') ? join(homedir(), value.slice(2)) : resolve(value);
}
