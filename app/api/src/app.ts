import cors from '@fastify/cors';
import formbody from '@fastify/formbody';
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import {
    CsvProvider,
    rankRequestSchema,
    rankWithDataModeSignals,
    type DataMode,
    type PlayerSeason,
    type PlayerStatsProvider
} from '@draft-duck/core';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { YahooClient, YahooError, type YahooLeague } from './yahoo.ts';
import { randomSecret, sha256, TokenCipher } from './security.ts';
import { SupabaseYahooStore, type YahooStore } from './store.ts';
import type { LocalHttpsOptions } from './local-https.ts';

export type ApiEnv = Record<string, string | undefined>;
export type AppOptions = {
    env?: ApiEnv;
    store?: YahooStore;
    fetcher?: typeof fetch;
    now?: () => Date;
    playerUniverses?: Record<DataMode, PlayerSeason[]>;
    rateLimit?: { max: number; windowMs: number };
    https?: LocalHttpsOptions;
};

const dataPaths = {
    perGame: process.env.CSV_PATH ?? fileURLToPath(new URL('../../data/25_26_per_game.csv', import.meta.url)),
    per36: fileURLToPath(new URL('../../data/25_26_per_36.csv', import.meta.url)),
    totals: fileURLToPath(new URL('../../data/25_26_totals.csv', import.meta.url))
};
const OAUTH_BASE = 'https://api.login.yahoo.com/oauth2';
const OAUTH_AUTH = `${OAUTH_BASE}/request_auth`;
const OAUTH_TOKEN = `${OAUTH_BASE}/get_token`;

export async function buildApp(options: AppOptions = {}): Promise<FastifyInstance> {
    const env = options.env ?? process.env;
    const clientOrigin = env.CLIENT_ORIGIN ?? 'http://localhost:3000';
    const enabled = env.YAHOO_ENABLED === 'true';
    const now = options.now ?? (() => new Date());
    const universes = options.playerUniverses ?? (await loadPlayers(env));
    let store = options.store;
    let cipher: TokenCipher | undefined;
    if (enabled) {
        requireValues(env, [
            'SUPABASE_URL',
            'SUPABASE_SECRET_KEY',
            'YAHOO_CLIENT_ID',
            'YAHOO_CLIENT_SECRET',
            'YAHOO_REDIRECT_URI',
            'YAHOO_TOKEN_ENCRYPTION_KEY'
        ]);
        validateRedirectUri(env.YAHOO_REDIRECT_URI!);
        cipher = new TokenCipher(env.YAHOO_TOKEN_ENCRYPTION_KEY!);
        store ??= new SupabaseYahooStore(env.SUPABASE_URL!, env.SUPABASE_SECRET_KEY!);
    }

    // Fastify's request serializer includes req.url, which contains Yahoo's callback code and state.
    // Disable Fastify request logs entirely because callback URLs contain OAuth code and state.
    const app: FastifyInstance = Fastify({
        logger: false,
        bodyLimit: 16 * 1024,
        ...(options.https ? { https: options.https } : {})
    });
    await app.register(cors, {
        origin: clientOrigin,
        credentials: false,
        methods: ['GET', 'POST', 'DELETE', 'OPTIONS']
    });
    await app.register(formbody, { bodyLimit: 4096 });
    const windows = new Map<string, { count: number; until: number }>();
    const limit = options.rateLimit ?? { max: 30, windowMs: 60_000 };
    app.addHook('preHandler', async (request, reply) => {
        if (!request.url.startsWith('/yahoo/')) return;
        const route = request.routeOptions.url ?? request.url.split('?')[0];
        const nowMs = now().getTime();
        if (windows.size > 10_000) {
            for (const [key, value] of windows) if (value.until <= nowMs) windows.delete(key);
            if (windows.size > 10_000) windows.clear();
        }
        const routeKey = route === '/yahoo/connections/:attemptId/claim' ? request.url.split('?')[0] : route;
        const key = `${request.ip}:${routeKey}`;
        const max = route === '/yahoo/connections/:attemptId/claim' ? Math.max(limit.max, 120) : limit.max;
        const current = windows.get(key);
        if (!current || current.until <= nowMs) windows.set(key, { count: 1, until: nowMs + limit.windowMs });
        else if (++current.count > max) return reply.code(429).send({ error: 'Too many requests. Try again shortly.' });
    });
    app.addHook('onSend', async (request, reply, payload) => {
        if (request.url.startsWith('/yahoo/')) {
            reply.header('Cache-Control', 'no-store, max-age=0');
            reply.header('Pragma', 'no-cache');
        }
        return payload;
    });
    app.setErrorHandler((error, request, reply) => {
        request.log.error({ err: { name: error instanceof Error ? error.name : 'Error' } }, 'API request failed');
        const statusCode = isRecord(error) && typeof error.statusCode === 'number' ? error.statusCode : 500;
        const status = statusCode >= 400 && statusCode <= 599 ? statusCode : 500;
        return reply.code(status).send({ error: status < 500 ? 'Invalid request.' : 'Request failed.' });
    });

    app.get('/health', async () => ({ ok: true as const }));
    app.get('/players', async () => ({ players: universes.perGame }));
    app.post('/rank', async (request, reply) => {
        const parsed = rankRequestSchema.safeParse(request.body);
        if (!parsed.success)
            return reply.code(400).send({ error: 'Invalid rank request', issues: parsed.error.issues });
        return { players: rankWithDataModeSignals(universes, parsed.data.profile) };
    });

    app.get('/yahoo/status', async () => ({ enabled }));
    // The OAuth attempt is intentionally short-lived; its claim proof is returned once to the browser.
    app.post('/yahoo/connections', async (request, reply) => {
        if (!enabled || !store) return reply.code(404).send({ error: 'Yahoo connections are unavailable.' });
        if (!hasOrigin(request, clientOrigin) || !isJson(request))
            return reply.code(403).send({ error: 'Request origin is not allowed.' });
        const id = randomUUID(),
            claimSecret = randomSecret(),
            expiresAt = new Date(now().getTime() + 10 * 60_000).toISOString();
        await store.createAttempt(id, sha256(claimSecret), expiresAt);
        const origin = apiOrigin(env, request);
        return reply
            .code(201)
            .send({ attemptId: id, claimSecret, authorizationUrl: `${origin}/yahoo/oauth/start/${id}`, expiresAt });
    });
    // A same-origin POST proof binds one first-party cookie to this attempt before Yahoo sees OAuth state.
    app.post<{ Params: { attemptId: string }; Body: { claimSecret?: string } }>(
        '/yahoo/oauth/start/:attemptId',
        async (request, reply) => {
            const id = request.params.attemptId;
            if (!enabled || !store || !isUuid(id))
                return reply.code(404).send({ error: 'OAuth attempt is unavailable.' });
            if (
                !hasOrigin(request, clientOrigin) ||
                request.headers['content-type']?.split(';')[0] !== 'application/x-www-form-urlencoded'
            )
                return reply.code(403).send({ error: 'Request origin is not allowed.' });
            const body = request.body;
            const claimSecret = isRecord(body) && typeof body.claimSecret === 'string' ? body.claimSecret : '';
            if (!claimSecret || claimSecret.length > 256)
                return reply.code(403).send({ error: 'OAuth attempt is unavailable.' });
            const state = `${id}.${randomSecret()}`;
            const cookie = randomSecret();
            if (!(await store.bindAttempt(id, sha256(claimSecret), sha256(state), sha256(cookie))))
                return reply.code(410).send({ error: 'OAuth attempt is expired, already started, or unavailable.' });
            reply.header(
                'Set-Cookie',
                `__Host-ddy-${id}=${cookie}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=600`
            );
            reply.header('Cache-Control', 'no-store');
            const target = new URL(OAUTH_AUTH);
            target.searchParams.set('client_id', env.YAHOO_CLIENT_ID!);
            target.searchParams.set('redirect_uri', env.YAHOO_REDIRECT_URI!);
            target.searchParams.set('response_type', 'code');
            target.searchParams.set('state', state);
            return reply.redirect(target.toString(), 303);
        }
    );
    // Consume state and verify the browser cookie before exchanging the one-use authorization code.
    app.get<{ Querystring: { code?: string; state?: string; error?: string } }>(
        '/yahoo/oauth/callback',
        async (request, reply) => {
            safeCallbackHeaders(reply);
            const state = scalarQuery(request.query.state);
            const match = /^([0-9a-f-]{36})\.([A-Za-z0-9_-]{32,})$/.exec(state);
            if (!match || !isUuid(match[1]!)) return oauthPage(reply, 'Yahoo connection could not be completed.');
            const id = match[1]!,
                cookie = request.headers.cookie
                    ?.split(';')
                    .map((x) => x.trim())
                    .find((x) => x.startsWith(`__Host-ddy-${id}=`))
                    ?.split('=')
                    .slice(1)
                    .join('=');
            const consumed = await store?.consumeCallback(id, sha256(state), cookie ? sha256(cookie) : '');
            if (!consumed) return oauthPage(reply, 'Yahoo connection could not be completed.');
            const code = scalarQuery(request.query.code);
            if (request.query.error !== undefined || !code || code.length > 2048) {
                await store!.completeCallback(id, '', null, true);
                return oauthPage(reply, 'Yahoo authorization was not completed. You may close this tab.');
            }
            try {
                const result = await exchangeCode(env, code, options.fetcher ?? fetch);
                const expiresAt = new Date(
                    Math.min(now().getTime() + 60 * 60_000, now().getTime() + result.expiresIn * 1000)
                ).toISOString();
                const ok = await store!.completeCallback(id, cipher!.encrypt(result.accessToken), expiresAt);
                if (!ok) return oauthPage(reply, 'Yahoo connection expired. Please start again.');
                return oauthPage(reply, 'Yahoo connected. You may close this tab.');
            } catch {
                await store!.completeCallback(id, '', null, true).catch(() => false);
                return oauthPage(reply, 'Yahoo connection could not be completed. Please start again.');
            }
        }
    );
    // Atomic claim creates an app bearer only after authorization completed and before its attempt expiry.
    app.post<{ Params: { attemptId: string }; Body: { claimSecret?: string } }>(
        '/yahoo/connections/:attemptId/claim',
        async (request, reply) => {
            if (!enabled || !store || !isUuid(request.params.attemptId))
                return reply.code(404).send({ error: 'OAuth attempt is unavailable.' });
            if (!hasOrigin(request, clientOrigin) || !isJson(request))
                return reply.code(403).send({ error: 'Request origin is not allowed.' });
            const body = request.body;
            const secret = isRecord(body) && typeof body.claimSecret === 'string' ? body.claimSecret : '';
            if (!secret || secret.length > 256) return reply.code(400).send({ error: 'Invalid claim request.' });
            const token = randomSecret(32),
                expiresAt = new Date(now().getTime() + 60 * 60_000).toISOString();
            const status = await store.claim(
                request.params.attemptId,
                sha256(secret),
                sha256(token),
                now().toISOString()
            );
            if (status === 'pending') return { status: 'pending' as const };
            if (status !== 'complete')
                return reply.code(410).send({
                    status: 'expired' as const,
                    error: 'This Yahoo sign-in attempt expired or was not approved. Start again to connect.'
                });
            const session = await store.session(sha256(token), now().toISOString());
            if (!session) return reply.code(410).send({ status: 'expired' as const });
            return { status: 'complete' as const, token, expiresAt: session.expiresAt ?? expiresAt };
        }
    );
    app.delete('/yahoo/session', async (request, reply) => {
        if (!enabled || !store) return reply.code(404).send({ error: 'Yahoo connections are unavailable.' });
        const bearer = getBearer(request.headers.authorization);
        if (!bearer) return reply.code(401).send({ error: 'A valid session is required.' });
        await store.disconnect(sha256(bearer));
        return reply.code(204).send();
    });
    app.get('/yahoo/leagues', async (request, reply) => {
        const session = await yahooSession(request, reply, store, cipher, enabled, now);
        if (!session) return;
        try {
            return { leagues: await new YahooClient(session.accessToken, options.fetcher).listLeagues() };
        } catch (error) {
            return yahooError(reply, error);
        }
    });
    app.get<{ Params: { leagueKey: string }; Querystring: { week?: string } }>(
        '/yahoo/leagues/:leagueKey/comparison',
        async (request, reply) => {
            const session = await yahooSession(request, reply, store, cipher, enabled, now);
            if (!session) return;
            try {
                const client = new YahooClient(session.accessToken, options.fetcher);
                const leagues = await client.listLeagues();
                const league = leagues.find((entry) => entry.leagueKey === request.params.leagueKey);
                if (!league) return reply.code(404).send({ error: 'League not found.' });
                if (!league.supported)
                    return reply.code(422).send({ error: league.unsupportedReason ?? 'This league is not supported.' });
                const week = request.query.week === undefined ? league.currentWeek : Number(request.query.week);
                if (!Number.isInteger(week) || !league.weeks.includes(week))
                    return reply.code(400).send({ error: 'Week is outside this league season.' });
                return await client.comparison(league, week);
            } catch (error) {
                return yahooError(reply, error);
            }
        }
    );
    return app;
}

export async function loadPlayers(env: ApiEnv = process.env): Promise<Record<DataMode, PlayerSeason[]>> {
    const paths = { ...dataPaths, perGame: env.CSV_PATH ?? dataPaths.perGame };
    const providers: Record<keyof typeof paths, PlayerStatsProvider> = {
        perGame: new CsvProvider(paths.perGame),
        per36: new CsvProvider(paths.per36),
        totals: new CsvProvider(paths.totals)
    };
    return Object.fromEntries(
        await Promise.all(Object.entries(providers).map(async ([mode, provider]) => [mode, await provider.load()]))
    ) as Record<DataMode, PlayerSeason[]>;
}

async function yahooSession(
    request: FastifyRequest,
    reply: FastifyReply,
    store: YahooStore | undefined,
    cipher: TokenCipher | undefined,
    enabled: boolean,
    now: () => Date
) {
    if (!enabled || !store || !cipher) {
        reply.code(404).send({ error: 'Yahoo connections are unavailable.' });
        return null;
    }
    const bearer = getBearer(request.headers.authorization);
    if (!bearer) {
        reply.code(401).send({ error: 'A valid session is required.' });
        return null;
    }
    const record = await store.session(sha256(bearer), now().toISOString());
    if (!record || Date.parse(record.expiresAt) <= now().getTime()) {
        reply.code(401).send({ error: 'Yahoo session expired.' });
        return null;
    }
    try {
        return { ...record, accessToken: cipher.decrypt(record.tokenCiphertext) };
    } catch {
        reply.code(401).send({ error: 'Yahoo session is unavailable.' });
        return null;
    }
}

async function exchangeCode(
    env: ApiEnv,
    code: string,
    fetcher: typeof fetch
): Promise<{ accessToken: string; expiresIn: number }> {
    const body = new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: env.YAHOO_REDIRECT_URI! });
    const auth = Buffer.from(`${env.YAHOO_CLIENT_ID!}:${env.YAHOO_CLIENT_SECRET!}`).toString('base64');
    const response = await fetcher(OAUTH_TOKEN, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json'
        },
        body,
        signal: AbortSignal.timeout(12_000)
    });
    if (!response.ok) throw new Error('Yahoo token exchange failed.');
    const data = (await response.json()) as { access_token?: unknown; expires_in?: unknown };
    if (
        typeof data.access_token !== 'string' ||
        typeof data.expires_in !== 'number' ||
        !Number.isFinite(data.expires_in) ||
        data.expires_in <= 0
    )
        throw new Error('Yahoo returned invalid token data.');
    return { accessToken: data.access_token, expiresIn: data.expires_in };
}

function yahooError(reply: FastifyReply, error: unknown) {
    if (error instanceof YahooError) {
        const statusByCode: Record<YahooError['code'], number> = {
            unauthorized: 401,
            forbidden: 403,
            not_found: 404,
            invalid: 400,
            unsupported: 422,
            throttled: 502,
            upstream: 502
        };
        const status = statusByCode[error.code];
        return reply.code(status).send({ error: error.message, code: error.code });
    }
    return reply.code(502).send({ error: 'Yahoo request failed.', code: 'upstream' });
}
function oauthPage(reply: FastifyReply, message: string) {
    reply.type('text/html; charset=utf-8');
    return reply.send(
        `<!doctype html><html lang="en"><meta charset="utf-8"><title>Yahoo connection</title><body><p>${escapeHtml(message)}</p></body></html>`
    );
}
function safeCallbackHeaders(reply: FastifyReply) {
    reply.header('Cache-Control', 'no-store, max-age=0');
    reply.header('Pragma', 'no-cache');
    reply.header('Referrer-Policy', 'no-referrer');
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header(
        'Content-Security-Policy',
        "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; style-src 'none'"
    );
}
function escapeHtml(value: string): string {
    return value.replace(
        /[&<>"']/g,
        (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!
    );
}
function getBearer(value: string | undefined): string | null {
    const match = /^Bearer ([A-Za-z0-9_-]{40,})$/.exec(value ?? '');
    return match?.[1] ?? null;
}
function hasOrigin(request: FastifyRequest, expected: string): boolean {
    return request.headers.origin === expected;
}
function isJson(request: FastifyRequest): boolean {
    return request.headers['content-type']?.split(';')[0] === 'application/json';
}
function isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
function apiOrigin(env: ApiEnv, request: FastifyRequest): string {
    return new URL(env.YAHOO_REDIRECT_URI ?? `${request.protocol}://${request.headers.host}`).origin;
}
function requireValues(env: ApiEnv, keys: string[]) {
    const missing = keys.filter((key) => !env[key]);
    if (missing.length) throw new Error(`Yahoo enabled, missing configuration: ${missing.join(', ')}`);
}
function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function scalarQuery(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

/** Keep callback configuration on the exact OAuth path and protect public environments with HTTPS. */
function validateRedirectUri(value: string): void {
    const uri = new URL(value);
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(uri.hostname);
    if (uri.pathname !== '/yahoo/oauth/callback' || uri.search || uri.hash || uri.username || uri.password) {
        throw new Error('YAHOO_REDIRECT_URI must target /yahoo/oauth/callback without query or fragment.');
    }
    if (uri.protocol !== 'https:' && !(uri.protocol === 'http:' && loopback)) {
        throw new Error('YAHOO_REDIRECT_URI must use HTTPS except for loopback development.');
    }
}
