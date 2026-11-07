import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from './app.ts';
import { parseCategories, parseTeams, YahooClient, type YahooLeague } from './yahoo.ts';
import type { ComparisonCategory } from '@draft-duck/core';
import { sha256, TokenCipher } from './security.ts';
import { SupabaseYahooStore, type YahooStore } from './store.ts';

const origin = 'https://client.example';
const encryptionKey = Buffer.alloc(32, 7).toString('base64');
const env = {
    CLIENT_ORIGIN: origin,
    YAHOO_ENABLED: 'true',
    SUPABASE_URL: 'https://db.example',
    SUPABASE_SECRET_KEY: 'server-secret',
    YAHOO_CLIENT_ID: 'client-id',
    YAHOO_CLIENT_SECRET: 'client-secret',
    YAHOO_REDIRECT_URI: 'https://api.example/yahoo/oauth/callback',
    YAHOO_TOKEN_ENCRYPTION_KEY: encryptionKey
};
const apps: Array<{ close(): Promise<void> }> = [];
afterEach(async () => {
    for (const app of apps.splice(0)) await app.close();
});

type AttemptStatus = 'pending' | 'consuming' | 'complete' | 'failed' | 'claimed' | 'expired';
type AttemptRow = {
    id: string;
    claimHash: string;
    expiresAt: string;
    status: AttemptStatus;
    stateHash?: string;
    cookieHash?: string;
};
type SessionRow = { id: string; tokenCiphertext: string; expiresAt: string; bearerHash: string | null };

class MemoryStore implements YahooStore {
    readonly attempts = new Map<string, AttemptRow>();
    readonly sessions = new Map<string, SessionRow>();

    async createAttempt(id: string, claimHash: string, expiresAt: string): Promise<void> {
        this.attempts.set(id, { id, claimHash, expiresAt, status: 'pending' });
    }

    async bindAttempt(id: string, claimHash: string, stateHash: string, cookieHash: string): Promise<boolean> {
        const attempt = this.attempts.get(id);
        if (!attempt || attempt.status !== 'pending' || attempt.stateHash || attempt.claimHash !== claimHash)
            return false;
        if (Date.parse(attempt.expiresAt) <= Date.now()) {
            attempt.status = 'expired';
            return false;
        }
        attempt.stateHash = stateHash;
        attempt.cookieHash = cookieHash;
        return true;
    }

    async consumeCallback(id: string, stateHash: string, cookieHash: string) {
        const attempt = this.attempts.get(id);
        if (!attempt || attempt.status !== 'pending' || attempt.stateHash !== stateHash) return null;
        if (Date.parse(attempt.expiresAt) <= Date.now()) {
            attempt.status = 'expired';
            return null;
        }
        if (attempt.cookieHash !== cookieHash) {
            attempt.status = 'failed';
            return null;
        }
        attempt.status = 'consuming';
        return { id, claimHash: attempt.claimHash, expiresAt: attempt.expiresAt };
    }

    async completeCallback(
        id: string,
        tokenCiphertext: string,
        expiresAt: string | null,
        failure = false
    ): Promise<boolean> {
        const attempt = this.attempts.get(id);
        if (!attempt || attempt.status !== 'consuming') return false;
        attempt.status = failure ? 'failed' : 'complete';
        if (!failure && expiresAt) this.sessions.set(id, { id, tokenCiphertext, expiresAt, bearerHash: null });
        return true;
    }

    async claim(id: string, claimHash: string, bearerHash: string, now: string) {
        const attempt = this.attempts.get(id);
        if (!attempt || attempt.claimHash !== claimHash) return 'invalid' as const;
        if (attempt.status !== 'claimed' && Date.parse(attempt.expiresAt) <= Date.parse(now)) {
            if (!['failed', 'expired'].includes(attempt.status)) attempt.status = 'expired';
            return 'invalid' as const;
        }
        if (attempt.status === 'pending' || attempt.status === 'consuming') return 'pending' as const;
        const session = this.sessions.get(id);
        if (
            attempt.status !== 'complete' ||
            !session ||
            session.bearerHash ||
            Date.parse(session.expiresAt) <= Date.parse(now)
        )
            return 'invalid' as const;
        session.bearerHash = bearerHash;
        attempt.status = 'claimed';
        return 'complete' as const;
    }

    async session(bearerHash: string, now: string) {
        return (
            [...this.sessions.values()].find(
                (session) => session.bearerHash === bearerHash && Date.parse(session.expiresAt) > Date.parse(now)
            ) ?? null
        );
    }

    async disconnect(bearerHash: string): Promise<void> {
        for (const [id, session] of this.sessions) if (session.bearerHash === bearerHash) this.sessions.delete(id);
    }

    async cleanup(now: string): Promise<void> {
        for (const [id, session] of this.sessions)
            if (Date.parse(session.expiresAt) <= Date.parse(now)) this.sessions.delete(id);
        for (const [id, attempt] of this.attempts) {
            if (
                Date.parse(attempt.expiresAt) <= Date.parse(now) &&
                ['pending', 'consuming', 'failed', 'expired'].includes(attempt.status)
            )
                this.attempts.delete(id);
            if (['complete', 'claimed'].includes(attempt.status) && !this.sessions.has(id)) this.attempts.delete(id);
        }
    }
}

function buildTestApp<T extends YahooStore = MemoryStore>(
    store: T = new MemoryStore() as unknown as T,
    fetcher: typeof fetch = async () => new Response('{}')
) {
    return buildApp({ env, store, fetcher, playerUniverses: { perGame: [], per36: [], totals: [] } }).then((app) => {
        apps.push(app);
        return { app, store };
    });
}

function tuple(resource: Record<string, unknown>): Record<string, unknown>[] {
    return Object.entries(resource).map(([key, value]) => ({ [key]: value }));
}

function currentGameResponse() {
    return {
        fantasy_content: {
            game: [
                tuple({ game_key: '390', code: 'nba', season: '2024', is_current: '0' }),
                tuple({ game_key: '461', code: 'nba', season: '2025', is_current: '1' })
            ]
        }
    };
}

type FixtureLeague = { key: string; season: number; name: string; scoring?: string; isFinished?: boolean };
function leagueResponse(leagues: FixtureLeague[]) {
    const leagueResources = leagues.map((league) =>
        tuple({
            league_key: league.key,
            name: league.name,
            season: String(league.season),
            num_teams: '2',
            start_week: '1',
            end_week: '22',
            current_week: '5',
            scoring_type: league.scoring ?? 'head',
            is_finished: league.isFinished ? '1' : '0'
        })
    );
    const leagueCollection = {
        ...Object.fromEntries(leagueResources.map((resource, index) => [String(index), { league: resource }])),
        count: leagueResources.length
    };
    const game = [[{ game_key: '461' }, { code: 'nba' }, { season: '2025' }], { leagues: leagueCollection }];
    return {
        fantasy_content: {
            users: {
                count: 1,
                0: {
                    user: [{ guid: 'fixture-user' }, { games: { count: 1, 0: { game } } }]
                }
            }
        }
    };
}

function canonicalLeagueMembership(gameKey: string, leagues: Record<string, unknown>) {
    const game = [[{ game_key: gameKey }, { code: 'nba' }, { season: '2026' }], { leagues }];
    return {
        fantasy_content: {
            users: {
                count: 1,
                0: { user: [{ guid: 'fixture-user' }, { games: { count: 1, 0: { game } } }] }
            }
        }
    };
}

const currentAndHistoric = [
    { key: '390.l.9', season: 2024, name: 'Old season' },
    { key: '461.l.1', season: 2025, name: 'Current league' },
    { key: '461.l.2', season: 2025, name: 'Finished league', isFinished: true }
];

function nestedLeagueSettings(leagueKey: string, categories: Record<string, unknown>[], scoring = 'head') {
    return {
        fantasy_content: {
            league: [
                tuple({
                    league_key: leagueKey,
                    scoring_type: scoring,
                    stat_categories: { stats: { stat: categories.map((stat) => ({ stat })) } }
                })
            ]
        }
    };
}

function nestedTeams(
    leagueKey: string,
    teams: Array<{ id: number; name: string; owned: number; stats: Array<{ id: string; value: unknown }> }>,
    coverage?: { type: string; week: number }
) {
    return {
        fantasy_content: {
            league: [
                tuple({
                    league_key: leagueKey,
                    teams: {
                        ...Object.fromEntries(
                            teams.map((team, index) => [
                                String(index),
                                {
                                    team: [
                                        tuple({
                                            team_key: `${leagueKey}.t.${team.id}`,
                                            name: team.name,
                                            is_owned_by_current_login: team.owned
                                        }),
                                        {
                                            team_stats: {
                                                ...(coverage
                                                    ? { coverage_type: coverage.type, week: coverage.week }
                                                    : {}),
                                                stats: team.stats.map((stat) => ({
                                                    stat: { stat_id: stat.id, value: stat.value }
                                                }))
                                            }
                                        }
                                    ]
                                }
                            ])
                        ),
                        count: teams.length
                    }
                })
            ]
        }
    };
}

const allCategoryMetadata = [
    { stat_id: '12', name: 'PTS', display_name: 'PTS', stat_type: 'integer' },
    { stat_id: '15', name: 'REB', display_name: 'REB', stat_type: 'integer' },
    { stat_id: '16', name: 'AST', display_name: 'AST', stat_type: 'integer' },
    { stat_id: '17', name: 'STL', display_name: 'STL', stat_type: 'integer' },
    { stat_id: '18', name: 'BLK', display_name: 'BLK', stat_type: 'integer' },
    { stat_id: '10', name: '3PTM', display_name: '3-point Shots Made', stat_type: 'integer' },
    { stat_id: '5', name: 'FG%', display_name: 'FG%', stat_type: 'percentage' },
    { stat_id: '8', name: 'FT%', display_name: 'FT%', stat_type: 'percentage' },
    { stat_id: '19', name: 'TO', display_name: 'TO', stat_type: 'integer' },
    { stat_id: '3', name: 'FGM', display_name: 'Field Goals Made', is_only_display_stat: '1' },
    { stat_id: '99', name: 'PF', display_name: 'Fouls', enabled: '0' }
];

describe('Yahoo OAuth routes', () => {
    // This documents current shared-proxy behavior; X-Forwarded-For is intentionally not trusted here.
    it('shares Yahoo status rate limits across forwarded IP headers for one proxy address', async () => {
        const app = await buildApp({
            env: { CLIENT_ORIGIN: origin, YAHOO_ENABLED: 'false' },
            playerUniverses: { perGame: [], per36: [], totals: [] },
            rateLimit: { max: 1, windowMs: 60_000 }
        });
        apps.push(app);
        const first = await app.inject({
            url: '/yahoo/status',
            remoteAddress: '192.0.2.10',
            headers: { 'x-forwarded-for': '198.51.100.1' }
        });
        const sameProxy = await app.inject({
            url: '/yahoo/status',
            remoteAddress: '192.0.2.10',
            headers: { 'x-forwarded-for': '203.0.113.7' }
        });
        expect(first.statusCode).toBe(200);
        expect(sameProxy.statusCode).toBe(429);
    });

    it('keeps Yahoo status rate limits independent for distinct proxy addresses', async () => {
        const app = await buildApp({
            env: { CLIENT_ORIGIN: origin, YAHOO_ENABLED: 'false' },
            playerUniverses: { perGame: [], per36: [], totals: [] },
            rateLimit: { max: 1, windowMs: 60_000 }
        });
        apps.push(app);
        const first = await app.inject({ url: '/yahoo/status', remoteAddress: '192.0.2.20' });
        const second = await app.inject({ url: '/yahoo/status', remoteAddress: '192.0.2.21' });
        expect(first.statusCode).toBe(200);
        expect(second.statusCode).toBe(200);
    });

    it('requires exact Origin and JSON for attempt creation, then binds a first-party cookie with a POST proof', async () => {
        const { app } = await buildTestApp();
        const denied = await app.inject({
            method: 'POST',
            url: '/yahoo/connections',
            headers: { origin: 'https://attacker.example', 'content-type': 'application/json' },
            payload: {}
        });
        expect(denied.statusCode).toBe(403);
        const made = await app.inject({
            method: 'POST',
            url: '/yahoo/connections',
            headers: { origin, 'content-type': 'application/json' },
            payload: {}
        });
        const { attemptId, claimSecret, authorizationUrl } = made.json();
        expect(authorizationUrl).toBe(`https://api.example/yahoo/oauth/start/${attemptId}`);
        expect((await app.inject({ url: `/yahoo/oauth/start/${attemptId}` })).statusCode).toBe(404);
        const malformedProof = await app.inject({
            method: 'POST',
            url: `/yahoo/connections/${attemptId}/claim`,
            headers: { origin, 'content-type': 'application/json' },
            payload: { claimSecret: { bad: true } }
        });
        expect(malformedProof.statusCode).toBe(400);
        expect(malformedProof.headers['cache-control']).toContain('no-store');
        const badProof = await app.inject({
            method: 'POST',
            url: `/yahoo/oauth/start/${attemptId}`,
            headers: { origin, 'content-type': 'application/x-www-form-urlencoded' },
            payload: 'claimSecret=wrong'
        });
        expect(badProof.statusCode).toBe(410);
        const started = await app.inject({
            method: 'POST',
            url: `/yahoo/oauth/start/${attemptId}`,
            headers: { origin, 'content-type': 'application/x-www-form-urlencoded' },
            payload: `claimSecret=${encodeURIComponent(claimSecret)}`
        });
        expect(started.statusCode).toBe(303);
        expect(started.headers['set-cookie']).toContain('HttpOnly; SameSite=Lax');
        expect(started.headers['set-cookie']).toContain('Secure');
        expect(started.headers['cache-control']).toContain('no-store');
    });

    it('consumes state once and returns the app bearer only through a one-time claim', async () => {
        const store = new MemoryStore();
        const fetcher: typeof fetch = async () =>
            new Response(
                JSON.stringify({
                    access_token: 'yahoo-private-access',
                    refresh_token: 'do-not-retain',
                    expires_in: 7200
                })
            );
        const { app } = await buildTestApp(store, fetcher);
        const made = await app.inject({
            method: 'POST',
            url: '/yahoo/connections',
            headers: { origin, 'content-type': 'application/json' },
            payload: {}
        });
        const data = made.json();
        const started = await app.inject({
            method: 'POST',
            url: `/yahoo/oauth/start/${data.attemptId}`,
            headers: { origin, 'content-type': 'application/x-www-form-urlencoded' },
            payload: `claimSecret=${encodeURIComponent(data.claimSecret)}`
        });
        const state = new URL(started.headers.location!).searchParams.get('state')!;
        const cookieHeader = started.headers['set-cookie'];
        const cookie = (Array.isArray(cookieHeader) ? cookieHeader[0] : cookieHeader)!.split(';')[0];
        const done = await app.inject({
            url: `/yahoo/oauth/callback?state=${state}&code=auth-code`,
            headers: { cookie }
        });
        expect(done.statusCode).toBe(200);
        expect(done.body).not.toContain('yahoo-private-access');
        expect(done.headers['cache-control']).toContain('no-store');
        expect(done.headers['content-security-policy']).toContain("default-src 'none'");
        expect([...store.sessions.values()][0]!.tokenCiphertext).not.toContain('yahoo-private-access');
        const [first, second] = await Promise.all([
            app.inject({
                method: 'POST',
                url: `/yahoo/connections/${data.attemptId}/claim`,
                headers: { origin, 'content-type': 'application/json' },
                payload: { claimSecret: data.claimSecret }
            }),
            app.inject({
                method: 'POST',
                url: `/yahoo/connections/${data.attemptId}/claim`,
                headers: { origin, 'content-type': 'application/json' },
                payload: { claimSecret: data.claimSecret }
            })
        ]);
        expect([first.statusCode, second.statusCode].sort()).toEqual([200, 410]);
        const issued = first.statusCode === 200 ? first.json().token : second.json().token;
        const replay = await app.inject({
            method: 'POST',
            url: `/yahoo/connections/${data.attemptId}/claim`,
            headers: { origin, 'content-type': 'application/json' },
            payload: { claimSecret: data.claimSecret }
        });
        expect(replay.statusCode).toBe(410);
        expect(replay.body).not.toContain(issued);
        expect(replay.headers['cache-control']).toContain('no-store');
    });

    it('fails a callback when its first-party browser binding does not match', async () => {
        const store = new MemoryStore();
        let exchanges = 0;
        const { app } = await buildTestApp(store, async () => {
            exchanges += 1;
            return new Response(JSON.stringify({ access_token: 'should-not-exchange', expires_in: 3600 }));
        });
        const created = await app.inject({
            method: 'POST',
            url: '/yahoo/connections',
            headers: { origin, 'content-type': 'application/json' },
            payload: {}
        });
        const attempt = created.json();
        const started = await app.inject({
            method: 'POST',
            url: `/yahoo/oauth/start/${attempt.attemptId}`,
            headers: { origin, 'content-type': 'application/x-www-form-urlencoded' },
            payload: `claimSecret=${encodeURIComponent(attempt.claimSecret)}`
        });
        const state = new URL(started.headers.location!).searchParams.get('state')!;
        const callback = await app.inject({
            url: `/yahoo/oauth/callback?state=${state}&code=auth-code`,
            headers: { cookie: `__Host-ddy-${attempt.attemptId}=wrong-browser-binding` }
        });
        expect(callback.headers['cache-control']).toContain('no-store');
        expect(exchanges).toBe(0);
        const claim = await app.inject({
            method: 'POST',
            url: `/yahoo/connections/${attempt.attemptId}/claim`,
            headers: { origin, 'content-type': 'application/json' },
            payload: { claimSecret: attempt.claimSecret }
        });
        expect(claim.statusCode).toBe(410);
    });

    it('marks denied consent and failed exchanges as failed using nullable RPC timestamps', async () => {
        const rpcCalls: Array<{ name: string; args: Record<string, unknown> }> = [];
        const rpc = {
            async rpc(name: string, args: Record<string, unknown>) {
                rpcCalls.push({ name, args });
                if (name === 'yahoo_consume_callback')
                    return {
                        data: {
                            id: args.p_id,
                            claim_hash: 'claim-hash',
                            expires_at: new Date(Date.now() + 60_000).toISOString()
                        },
                        error: null
                    };
                if (name === 'yahoo_complete_callback') return { data: true, error: null };
                if (name === 'yahoo_claim_session') return { data: 'invalid', error: null };
                if (name === 'yahoo_create_attempt') return { data: null, error: null };
                if (name === 'yahoo_bind_attempt') return { data: true, error: null };
                return { data: null, error: null };
            }
        };
        const store = new SupabaseYahooStore(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, rpc);
        const { app } = await buildTestApp(store, async () => new Response('denied', { status: 400 }));
        const rejected: string[] = [];
        for (const query of ['error=access_denied', 'code=invalid-code']) {
            const created = await app.inject({
                method: 'POST',
                url: '/yahoo/connections',
                headers: { origin, 'content-type': 'application/json' },
                payload: {}
            });
            const { attemptId, claimSecret } = created.json();
            const started = await app.inject({
                method: 'POST',
                url: `/yahoo/oauth/start/${attemptId}`,
                headers: { origin, 'content-type': 'application/x-www-form-urlencoded' },
                payload: `claimSecret=${encodeURIComponent(claimSecret)}`
            });
            const state = new URL(started.headers.location!).searchParams.get('state')!;
            const cookieHeader = started.headers['set-cookie'];
            const cookie = (Array.isArray(cookieHeader) ? cookieHeader[0] : cookieHeader)!.split(';')[0];
            const callback = await app.inject({
                url: `/yahoo/oauth/callback?state=${state}&${query}`,
                headers: { cookie }
            });
            expect(callback.headers['cache-control']).toContain('no-store');
            rejected.push(`/yahoo/connections/${attemptId}/claim`);
        }
        const completions = rpcCalls.filter((call) => call.name === 'yahoo_complete_callback');
        expect(completions).toHaveLength(2);
        for (const completion of completions)
            expect(completion.args).toMatchObject({
                p_token_ciphertext: '',
                p_session_expires_at: null,
                p_failure: true
            });
        for (const url of rejected) {
            const claim = await app.inject({
                method: 'POST',
                url,
                headers: { origin, 'content-type': 'application/json' },
                payload: { claimSecret: 'claim-secret-claim-secret' }
            });
            expect(claim.statusCode).toBe(410);
            expect(claim.json().status).toBe('expired');
        }
    });

    it('rejects malformed redirect configuration at startup and disabled status needs no secrets', async () => {
        await expect(
            buildApp({
                env: { ...env, YAHOO_REDIRECT_URI: 'http://outside.example/yahoo/oauth/callback' },
                playerUniverses: { perGame: [], per36: [], totals: [] }
            })
        ).rejects.toThrow(/HTTPS/);
        const app = await buildApp({
            env: { CLIENT_ORIGIN: origin },
            playerUniverses: { perGame: [], per36: [], totals: [] }
        });
        apps.push(app);
        const status = await app.inject('/yahoo/status');
        expect(status.json()).toEqual({ enabled: false });
        expect(status.headers['cache-control']).toContain('no-store');
    });

    it('preserves client errors for malformed requests and body limits', async () => {
        const { app } = await buildTestApp();
        const malformedJson = await app.inject({
            method: 'POST',
            url: '/rank',
            headers: { 'content-type': 'application/json' },
            payload: '{"bad":'
        });
        expect(malformedJson.statusCode).toBe(400);
        const tooLarge = await app.inject({
            method: 'POST',
            url: '/yahoo/connections',
            headers: { origin, 'content-type': 'application/json' },
            payload: { value: 'x'.repeat(20_000) }
        });
        expect(tooLarge.statusCode).toBe(413);
        expect(tooLarge.headers['cache-control']).toContain('no-store');
        const badQuery = await app.inject({ url: '/yahoo/oauth/callback?state=a&state=b&code[]=bad' });
        expect(badQuery.statusCode).toBe(200);
        expect(badQuery.headers['cache-control']).toContain('no-store');
    });

    it.each([401, 403])('preserves Yahoo status %s rather than treating access denial as expiry', async (status) => {
        const store = new MemoryStore();
        const bearer = 'active-session-token-123456789012345678901234';
        store.sessions.set('active', {
            id: 'active',
            tokenCiphertext: new TokenCipher(encryptionKey).encrypt('yahoo-token'),
            expiresAt: new Date(Date.now() + 60_000).toISOString(),
            bearerHash: sha256(bearer)
        });
        const { app } = await buildTestApp(store, async () => new Response('', { status }));
        const response = await app.inject({
            method: 'GET',
            url: '/yahoo/leagues',
            headers: { authorization: `Bearer ${bearer}` }
        });
        expect(response.statusCode).toBe(status);
        expect(response.json().code).toBe(status === 403 ? 'forbidden' : 'unauthorized');
        if (status === 403) {
            expect(response.json().error).toContain('Fantasy Sports Read permission');
            expect(await store.session(sha256(bearer), new Date().toISOString())).not.toBeNull();
        }
    });

    it('rejects expired claims, expires sessions, and immediately invalidates disconnects', async () => {
        const store = new MemoryStore();
        const { app } = await buildTestApp(store);
        const expiredId = 'f4d2b4c6-b3a2-4a56-8d3e-123456789abc';
        await store.createAttempt(expiredId, sha256('claim-hash'), new Date(Date.now() - 1).toISOString());
        store.attempts.get(expiredId)!.status = 'complete';
        store.sessions.set(expiredId, {
            id: expiredId,
            tokenCiphertext: 'sealed',
            expiresAt: new Date(Date.now() + 60_000).toISOString(),
            bearerHash: null
        });
        const expiredClaim = await app.inject({
            method: 'POST',
            url: `/yahoo/connections/${expiredId}/claim`,
            headers: { origin, 'content-type': 'application/json' },
            payload: { claimSecret: 'claim-hash' }
        });
        expect(expiredClaim.statusCode).toBe(410);
        expect(store.attempts.get(expiredId)!.status).toBe('expired');

        const activeId = 'f4d2b4c6-b3a2-4a56-8d3e-123456789abd';
        const activeBearer = 'active-session-token-123456789012345678901234';
        await store.createAttempt(activeId, 'another-claim-hash', new Date(Date.now() - 60_000).toISOString());
        store.attempts.get(activeId)!.status = 'claimed';
        store.sessions.set(activeId, {
            id: activeId,
            tokenCiphertext: 'sealed',
            expiresAt: new Date(Date.now() + 60_000).toISOString(),
            bearerHash: sha256(activeBearer)
        });
        await store.cleanup(new Date().toISOString());
        expect(await store.session(sha256(activeBearer), new Date().toISOString())).not.toBeNull();
        const deleted = await app.inject({
            method: 'DELETE',
            url: '/yahoo/session',
            headers: { authorization: `Bearer ${activeBearer}` }
        });
        expect(deleted.statusCode).toBe(204);
        expect(deleted.headers['cache-control']).toContain('no-store');
        expect(await store.session(sha256(activeBearer), new Date().toISOString())).toBeNull();

        const expiredBearer = 'expired-session-token-12345678901234567890';
        store.sessions.set('expired-session', {
            id: 'expired-session',
            tokenCiphertext: 'sealed',
            expiresAt: new Date(Date.now() - 1).toISOString(),
            bearerHash: sha256(expiredBearer)
        });
        const rejected = await app.inject({
            url: '/yahoo/leagues',
            headers: { authorization: `Bearer ${expiredBearer}` }
        });
        expect(rejected.statusCode).toBe(401);
        expect(rejected.headers['cache-control']).toContain('no-store');
    });
});

describe('Yahoo resource normalization', () => {
    const categories = parseCategories(
        { stat_categories: { stats: { stat: allCategoryMetadata.map((stat) => ({ stat })) } } },
        'head'
    );

    it('merges nested Yahoo team metadata and weekly stat siblings for all nine categories', () => {
        const stats = allCategoryMetadata.slice(0, 9).map((stat, index) => ({
            id: String(stat.stat_id),
            value: index === 0 ? '15.25' : index === 6 ? '.45678' : String(index)
        }));
        const response = nestedTeams(
            '461.l.1',
            [
                { id: 1, name: 'Alpha', owned: 1, stats },
                { id: 2, name: 'Beta', owned: 0, stats }
            ],
            { type: 'week', week: 3 }
        );
        const teams = parseTeams(response, categories, 3, '461.l.1', 2);
        expect(teams.map((team) => team.name)).toEqual(['Alpha', 'Beta']);
        expect(teams[0]!.isOwned).toBe(true);
        expect(teams[0]!.values.pts).toBe(15.25);
        expect(teams[0]!.values.fgPct).toBe(0.45678);
        expect(categories.map((category) => category.key)).toEqual([
            'pts',
            'trb',
            'ast',
            'stl',
            'blk',
            'fg3',
            'fgPct',
            'ftPct',
            'tov'
        ]);
        const missingValues = nestedTeams(
            '461.l.1',
            [
                {
                    id: 1,
                    name: 'Alpha',
                    owned: 1,
                    stats: [
                        { id: '12', value: '0' },
                        { id: '15', value: ' — ' }
                    ]
                },
                {
                    id: 2,
                    name: 'Beta',
                    owned: 0,
                    stats: [
                        { id: '12', value: '10' },
                        { id: '15', value: '   ' }
                    ]
                }
            ],
            { type: 'week', week: 3 }
        );
        const nullable = parseTeams(missingValues, categories, 3, '461.l.1', 2);
        expect(nullable[0]!.values.pts).toBe(0);
        expect(nullable[0]!.values.trb).toBeNull();
        expect(nullable[1]!.values.trb).toBeNull();
        expect(() =>
            parseTeams(
                nestedTeams(
                    '461.l.1',
                    [
                        { id: 1, name: 'Alpha', owned: 1, stats: [{ id: '12', value: false }] },
                        { id: 2, name: 'Beta', owned: 0, stats: [{ id: '12', value: '10' }] }
                    ],
                    { type: 'week', week: 3 }
                ),
                categories,
                3,
                '461.l.1',
                2
            )
        ).toThrow(/invalid team statistic/);
        expect(() =>
            parseTeams(
                nestedTeams(
                    '461.l.1',
                    [
                        { id: 1, name: 'Alpha', owned: 1, stats: [{ id: '12', value: { value: 0 } }] },
                        { id: 2, name: 'Beta', owned: 0, stats: [{ id: '12', value: '10' }] }
                    ],
                    { type: 'week', week: 3 }
                ),
                categories,
                3,
                '461.l.1',
                2
            )
        ).toThrow(/invalid team statistic/);
    });

    it('supports eight-category metadata and ignores only explicit display-only or disabled stats', () => {
        const eight = allCategoryMetadata.slice(0, 9).filter((stat) => stat.name !== 'AST');
        const parsed = parseCategories(
            {
                stat_categories: {
                    stats: { stat: [...eight, ...allCategoryMetadata.slice(9)].map((stat) => ({ stat })) }
                }
            },
            'head'
        );
        expect(parsed).toHaveLength(8);
        expect(parsed.some((category) => category.key === 'ast')).toBe(false);
        expect(() =>
            parseCategories(
                { stat_categories: { stats: { stat: [{ stat_id: '50', display_name: 'Fouls' }] } } },
                'head'
            )
        ).toThrow(/Unsupported scored category/);
        expect(() =>
            parseCategories(
                { stat_categories: { stats: { stat: [{ stat_id: '12', display_name: 'PTS' }] } } },
                'headpoint'
            )
        ).toThrow(/Points-scoring/);
        expect(() =>
            parseCategories(
                { stat_categories: { stats: { stat: [{ stat_id: '12', display_name: 'PTS' }] } } },
                'unknown'
            )
        ).toThrow(/unsupported league scoring/);
    });

    it('requires explicit matching weekly coverage and rejects malformed, duplicate, foreign, or incomplete teams', () => {
        const valid = { id: 1, name: 'Alpha', owned: 1, stats: [{ id: '12', value: '10' }] };
        expect(() =>
            parseTeams(nestedTeams('461.l.1', [valid, { ...valid, id: 2 }]), categories, 3, '461.l.1', 2)
        ).toThrow(/weekly credited team results/);
        expect(() =>
            parseTeams(
                nestedTeams('461.l.1', [valid, { ...valid, id: 2 }], { type: 'season', week: 3 }),
                categories,
                3,
                '461.l.1',
                2
            )
        ).toThrow(/weekly credited team results/);
        expect(() =>
            parseTeams(nestedTeams('461.l.1', [valid], { type: 'week', week: 3 }), categories, 3, '461.l.1', 2)
        ).toThrow(/incomplete set/);
        expect(() =>
            parseTeams(
                nestedTeams('461.l.1', [valid, { ...valid, id: 1, name: 'Duplicate' }], { type: 'week', week: 3 }),
                categories,
                3,
                '461.l.1',
                2
            )
        ).toThrow(/duplicate league team/);
        expect(() =>
            parseTeams(
                nestedTeams('461.l.1', [valid, { ...valid, id: 2 }], { type: 'week', week: 2 }),
                categories,
                3,
                '461.l.1',
                2
            )
        ).toThrow(/weekly credited team results/);
        const invalid = nestedTeams('461.l.1', [valid, { ...valid, id: 2 }], { type: 'week', week: 3 });
        const foreign = JSON.parse(JSON.stringify(invalid).replaceAll('461.l.1.t.2', '390.l.9.t.2')) as unknown;
        expect(() => parseTeams(foreign, categories, 3, '461.l.1', 2)).toThrow(/outside this league/);
        const noCategoryIds = [
            { key: 'pts', label: 'PTS', direction: 'higher', format: 'count' }
        ] as unknown as ComparisonCategory[];
        expect(() =>
            parseTeams(
                nestedTeams('461.l.1', [valid, { ...valid, id: 2 }], { type: 'week', week: 3 }),
                noCategoryIds,
                3
            )
        ).toThrow(/category metadata/);
    });

    it('discovers the current NBA game and returns only leagues for its matching game and season', async () => {
        const calls: string[] = [];
        const fetcher: typeof fetch = async (input) => {
            const url = String(input);
            calls.push(url);
            return new Response(
                JSON.stringify(url.includes('/game/nba?') ? currentGameResponse() : leagueResponse(currentAndHistoric))
            );
        };
        const leagues = await new YahooClient('private', fetcher).listLeagues();
        expect(leagues).toHaveLength(2);
        expect(leagues.map((league) => league.leagueKey)).toEqual(['461.l.1', '461.l.2']);
        expect(leagues[0]!.season).toBe(2025);
        expect(leagues[0]!.weeks).toEqual([1, 2, 3, 4, 5]);
        expect(leagues[1]!.isFinished).toBe(true);
        expect(calls.some((url) => url.endsWith('/game/nba?format=json'))).toBe(true);
        expect(calls.some((url) => url.includes('/games;game_keys=461/leagues;'))).toBe(true);
        const throttled = new YahooClient('private', async () => new Response('', { status: 429 }));
        await expect(throttled.listLeagues()).rejects.toMatchObject({ code: 'throttled' });
    });

    it('accepts explicit empty current-season membership and rejects malformed discovery envelopes', async () => {
        const emptyFetcher: typeof fetch = async (input) =>
            new Response(
                JSON.stringify(String(input).includes('/game/nba?') ? currentGameResponse() : leagueResponse([]))
            );
        await expect(new YahooClient('private', emptyFetcher).listLeagues()).resolves.toEqual([]);

        const malformedFetcher: typeof fetch = async (input) =>
            new Response(JSON.stringify(String(input).includes('/game/nba?') ? currentGameResponse() : {}));
        await expect(new YahooClient('private', malformedFetcher).listLeagues()).rejects.toMatchObject({
            code: 'upstream'
        });

        const malformedGameFetcher: typeof fetch = async () => new Response(JSON.stringify({ fantasy_content: {} }));
        await expect(new YahooClient('private', malformedGameFetcher).listLeagues()).rejects.toMatchObject({
            code: 'upstream'
        });
    });

    it('accepts scoped empty users or games and rejects malformed Yahoo collection counts and rows', async () => {
        const withUsers = async (users: unknown) => {
            const fetcher: typeof fetch = async (input) =>
                new Response(
                    JSON.stringify(
                        String(input).includes('/game/nba?') ? currentGameResponse() : { fantasy_content: { users } }
                    )
                );
            return new YahooClient('private', fetcher).listLeagues();
        };
        await expect(withUsers({ count: 0 })).resolves.toEqual([]);
        await expect(
            withUsers({ count: 1, 0: { user: [{ guid: 'fixture-user' }, { games: { count: 0 } }] } })
        ).resolves.toEqual([]);

        const matchingGame = (leagues: Record<string, unknown>) =>
            canonicalLeagueMembership('461', leagues).fantasy_content.users;
        await expect(
            withUsers({ count: 0, 0: { user: [{ guid: 'fixture-user' }, { games: { count: 0 } }] } })
        ).rejects.toMatchObject({
            code: 'upstream'
        });
        await expect(withUsers(matchingGame({ count: null }))).rejects.toMatchObject({ code: 'upstream' });
        await expect(
            withUsers(matchingGame({ count: 0, 0: { league: [tuple({ league_key: '461.l.1' })] } }))
        ).rejects.toMatchObject({ code: 'upstream' });
        await expect(withUsers(matchingGame({ count: 1, 0: { league: [] } }))).rejects.toMatchObject({
            code: 'upstream'
        });
        await expect(
            withUsers(matchingGame({ count: 1, 0: { league: [tuple({ name: 'Missing identity' })] } }))
        ).rejects.toMatchObject({ code: 'upstream' });
        await expect(
            withUsers({ count: 1, 0: { user: [{ games: { count: 0, 0: { game: [] } } }] } })
        ).rejects.toMatchObject({ code: 'upstream' });
    });

    it('merges one user, game, and league tuple without losing nested game metadata or sibling leagues', async () => {
        const gameDoc = {
            fantasy_content: {
                game: [tuple({ game_key: '999', code: 'nba', season: '2026', is_current: '1' })]
            }
        };
        const leagueFields = [
            { league_key: '999.l.1' },
            { name: 'Fixture league' },
            { season: '2026' },
            { num_teams: '2' },
            { start_week: '1' },
            { end_week: '22' },
            { current_week: '3' },
            { scoring_type: 'head' }
        ];
        const membership = canonicalLeagueMembership('999', {
            0: { league: leagueFields },
            count: 1
        });
        const fetchMembership =
            (body: unknown): typeof fetch =>
            async (input) =>
                new Response(JSON.stringify(String(input).includes('/game/nba?') ? gameDoc : body));

        const discovered = await new YahooClient('private', fetchMembership(membership)).listLeagues();
        expect(discovered).toHaveLength(1);
        expect(discovered[0]).toMatchObject({ leagueKey: '999.l.1', name: 'Fixture league', season: 2026 });

        const emptyMembership = canonicalLeagueMembership('999', { count: 0 });
        await expect(new YahooClient('private', fetchMembership(emptyMembership)).listLeagues()).resolves.toEqual([]);
    });

    it('requests official weekly team stats and derives in-progress from league finish metadata', async () => {
        const paths: string[] = [];
        const league: YahooLeague = {
            leagueKey: '461.l.1',
            name: 'League',
            season: 2025,
            teamCount: 2,
            currentWeek: 3,
            startWeek: 1,
            endWeek: 20,
            weeks: [1, 2, 3],
            scoringType: 'head',
            supported: true,
            isFinished: true
        };
        const fetcher: typeof fetch = async (input) => {
            const url = String(input);
            paths.push(url);
            if (url.includes('/settings?'))
                return new Response(JSON.stringify(nestedLeagueSettings('461.l.1', allCategoryMetadata.slice(0, 9))));
            return new Response(
                JSON.stringify(
                    nestedTeams(
                        '461.l.1',
                        [
                            {
                                id: 1,
                                name: 'Alpha',
                                owned: 1,
                                stats: [
                                    { id: '12', value: '15.25' },
                                    { id: '19', value: '2' }
                                ]
                            },
                            {
                                id: 2,
                                name: 'Beta',
                                owned: 0,
                                stats: [
                                    { id: '12', value: '20' },
                                    { id: '19', value: '3' }
                                ]
                            }
                        ],
                        { type: 'week', week: 3 }
                    )
                )
            );
        };
        const result = await new YahooClient('private', fetcher).comparison(league, 3);
        expect(paths.some((url) => url.includes('/teams/stats;type=week;week=3?format=json'))).toBe(true);
        expect(result.teams[0]!.name).toBe('Alpha');
        expect(result.teams[0]!.isOwned).toBe(true);
        expect(result.teams[0]!.values.pts).toBe(15.25);
        expect(result.inProgress).toBe(false);
    });

    it('paginates current-season membership and blocks historical or unowned route keys before league reads', async () => {
        const pageOne = Array.from({ length: 25 }, (_, index) => ({
            key: `461.l.${index}`,
            season: 2025,
            name: `League ${index}`
        }));
        let pageCalls = 0;
        const pagedFetcher: typeof fetch = async (input) => {
            const url = String(input);
            if (url.includes('/game/nba?')) return new Response(JSON.stringify(currentGameResponse()));
            pageCalls += 1;
            const page = pageCalls === 1 ? pageOne : [{ key: '461.l.25', season: 2025, name: 'Last league' }];
            return new Response(JSON.stringify(leagueResponse(page)));
        };
        const all = await new YahooClient('private', pagedFetcher).listLeagues();
        expect(all).toHaveLength(26);
        expect(pageCalls).toBe(2);

        const store = new MemoryStore();
        const bearer = 'private-app-session-token-long-enough-to-pass-validation-123';
        store.sessions.set('active', {
            id: 'active',
            bearerHash: sha256(bearer),
            tokenCiphertext: new TokenCipher(encryptionKey).encrypt('upstream-access'),
            expiresAt: new Date(Date.now() + 60_000).toISOString()
        });
        let leagueSpecificCalls = 0;
        const routeFetcher: typeof fetch = async (input) => {
            const url = String(input);
            if (url.includes('/league/')) leagueSpecificCalls += 1;
            return new Response(
                JSON.stringify(url.includes('/game/nba?') ? currentGameResponse() : leagueResponse(currentAndHistoric))
            );
        };
        const { app } = await buildTestApp(store, routeFetcher);
        const historical = await app.inject({
            url: '/yahoo/leagues/390.l.9/comparison?week=4',
            headers: { authorization: `Bearer ${bearer}` }
        });
        const unowned = await app.inject({
            url: '/yahoo/leagues/461.l.999/comparison?week=4',
            headers: { authorization: `Bearer ${bearer}` }
        });
        expect(historical.statusCode).toBe(404);
        expect(unowned.statusCode).toBe(404);
        expect(leagueSpecificCalls).toBe(0);
    });
});
