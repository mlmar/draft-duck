// Local API for the client. Serves the loaded season board, health, and ranked boards.
import cors from '@fastify/cors';
import Fastify from 'fastify';
import { CsvProvider, rank, rankRequestSchema, type PlayerStatsProvider } from '@draft-duck/core';
import { fileURLToPath } from 'node:url';

// Cloud Run injects PORT. Local .env keeps API_PORT=3300.
const PORT = readPort('PORT') ?? readPort('API_PORT') ?? 3300;
const HOST = process.env.HOST ?? '0.0.0.0';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:3000';
const csvPath = process.env.CSV_PATH ?? fileURLToPath(new URL('../../data/25_26_per_game.csv', import.meta.url));

// Load once at boot. The CSV is static for now, no need to re-parse per request.
const provider: PlayerStatsProvider = new CsvProvider(csvPath);
const players = await provider.load();

const app = Fastify({ logger: true });

await app.register(cors, {
    origin: CLIENT_ORIGIN
});

app.get('/health', async () => ({ ok: true as const }));

app.get('/players', async () => ({ players }));

app.post('/rank', async (request, reply) => {
    const parsed = rankRequestSchema.safeParse(request.body);
    if (!parsed.success) {
        return reply.code(400).send({ error: 'Invalid rank request', issues: parsed.error.issues });
    }
    return { players: rank(players, parsed.data.profile) };
});

await app.listen({ port: PORT, host: HOST });

function readPort(name: string): number | undefined {
    const raw = process.env[name];
    if (raw === undefined || raw.trim() === '') return undefined;
    const port = Number(raw);
    if (!Number.isInteger(port) || port <= 0) {
        throw new Error(`${name} must be a positive integer, got ${JSON.stringify(raw)}`);
    }
    return port;
}
