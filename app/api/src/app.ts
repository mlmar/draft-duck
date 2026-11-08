import cors from '@fastify/cors';
import Fastify from 'fastify';
import {
    CsvProvider,
    rankRequestSchema,
    rankWithDataModeSignals,
    type DataMode,
    type PlayerSeason,
    type PlayerStatsProvider
} from '@draft-duck/core';
import { fileURLToPath } from 'node:url';

/** Build the CSV-backed API without opening a listener. */
export async function buildApp(env: Record<string, string | undefined> = process.env) {
    const dataPaths = {
        perGame: env.CSV_PATH ?? fileURLToPath(new URL('../../data/25_26_per_game.csv', import.meta.url)),
        per36: fileURLToPath(new URL('../../data/25_26_per_36.csv', import.meta.url)),
        totals: fileURLToPath(new URL('../../data/25_26_totals.csv', import.meta.url))
    };

    // Load once at boot. The CSV is static for now, no need to re-parse per request.
    const providers: Record<keyof typeof dataPaths, PlayerStatsProvider> = {
        perGame: new CsvProvider(dataPaths.perGame),
        per36: new CsvProvider(dataPaths.per36),
        totals: new CsvProvider(dataPaths.totals)
    };
    const playerUniverses = Object.fromEntries(
        await Promise.all(Object.entries(providers).map(async ([mode, provider]) => [mode, await provider.load()]))
    ) as Record<DataMode, PlayerSeason[]>;

    const app = Fastify({ logger: false });

    await app.register(cors, {
        origin: env.CLIENT_ORIGIN ?? 'http://localhost:3000'
    });

    app.get('/health', async () => ({ ok: true as const }));

    app.get('/players', async () => ({ players: playerUniverses.perGame }));

    app.post('/rank', async (request, reply) => {
        const parsed = rankRequestSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.code(400).send({ error: 'Invalid rank request', issues: parsed.error.issues });
        }
        return { players: rankWithDataModeSignals(playerUniverses, parsed.data.profile) };
    });

    return app;
}
