import { createClient } from '@supabase/supabase-js';

export type Attempt = { id: string; claimHash: string; expiresAt: string };
export type SessionRecord = { id: string; tokenCiphertext: string; expiresAt: string };
type RpcClient = { rpc(name: string, args: Record<string, unknown>): PromiseLike<{ data: unknown; error: unknown }> };

export interface YahooStore {
    createAttempt(id: string, claimHash: string, expiresAt: string): Promise<void>;
    bindAttempt(id: string, claimHash: string, stateHash: string, cookieHash: string): Promise<boolean>;
    consumeCallback(id: string, stateHash: string, cookieHash: string): Promise<Attempt | null>;
    completeCallback(
        id: string,
        tokenCiphertext: string,
        sessionExpiresAt: string | null,
        failure?: boolean
    ): Promise<boolean>;
    claim(id: string, claimHash: string, bearerHash: string, now: string): Promise<'pending' | 'complete' | 'invalid'>;
    session(bearerHash: string, now: string): Promise<SessionRecord | null>;
    disconnect(bearerHash: string): Promise<void>;
    cleanup(now: string): Promise<void>;
}

/** The server-only Supabase adapter calls only migration-owned atomic RPCs. */
export class SupabaseYahooStore implements YahooStore {
    private readonly db: RpcClient;

    constructor(url: string, secret: string, rpcClient?: RpcClient) {
        const client =
            rpcClient ??
            (createClient(url, secret, {
                db: { schema: 'draft_duck' },
                auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
            }) as unknown as RpcClient);
        this.db = client;
    }

    async createAttempt(id: string, claimHash: string, expiresAt: string): Promise<void> {
        await this.rpc('yahoo_create_attempt', { p_id: id, p_claim_hash: claimHash, p_expires_at: expiresAt });
    }

    async bindAttempt(id: string, claimHash: string, stateHash: string, cookieHash: string): Promise<boolean> {
        return (
            (await this.rpc('yahoo_bind_attempt', {
                p_id: id,
                p_claim_hash: claimHash,
                p_state_hash: stateHash,
                p_cookie_hash: cookieHash
            })) === true
        );
    }

    async consumeCallback(id: string, stateHash: string, cookieHash: string): Promise<Attempt | null> {
        const row = await this.rpc('yahoo_consume_callback', {
            p_id: id,
            p_state_hash: stateHash,
            p_cookie_hash: cookieHash
        });
        if (
            !isRecord(row) ||
            typeof row.id !== 'string' ||
            typeof row.claim_hash !== 'string' ||
            typeof row.expires_at !== 'string'
        )
            return null;
        return { id: row.id, claimHash: row.claim_hash, expiresAt: row.expires_at };
    }

    async completeCallback(
        id: string,
        tokenCiphertext: string,
        sessionExpiresAt: string | null,
        failure = false
    ): Promise<boolean> {
        return (
            (await this.rpc('yahoo_complete_callback', {
                p_id: id,
                p_token_ciphertext: tokenCiphertext,
                p_session_expires_at: sessionExpiresAt,
                p_failure: failure
            })) === true
        );
    }

    async claim(
        id: string,
        claimHash: string,
        bearerHash: string,
        now: string
    ): Promise<'pending' | 'complete' | 'invalid'> {
        const value = await this.rpc('yahoo_claim_session', {
            p_id: id,
            p_claim_hash: claimHash,
            p_bearer_hash: bearerHash,
            p_now: now
        });
        return value === 'complete' || value === 'pending' ? value : 'invalid';
    }

    async session(bearerHash: string, now: string): Promise<SessionRecord | null> {
        const row = await this.rpc('yahoo_get_session', { p_bearer_hash: bearerHash, p_now: now });
        if (
            !isRecord(row) ||
            typeof row.id !== 'string' ||
            typeof row.token_ciphertext !== 'string' ||
            typeof row.expires_at !== 'string'
        )
            return null;
        return { id: row.id, tokenCiphertext: row.token_ciphertext, expiresAt: row.expires_at };
    }

    async disconnect(bearerHash: string): Promise<void> {
        await this.rpc('yahoo_disconnect', { p_bearer_hash: bearerHash });
    }

    async cleanup(now: string): Promise<void> {
        await this.rpc('yahoo_cleanup', { p_now: now });
    }

    private async rpc(name: string, args: Record<string, unknown>): Promise<unknown> {
        const { data, error } = await this.db.rpc(name, args);
        if (error) throw new Error(`Yahoo storage operation failed (${name}).`);
        return data;
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}
