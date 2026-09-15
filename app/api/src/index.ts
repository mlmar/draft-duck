// Local API for the client. Serves the loaded season board and a health check.
import cors from '@fastify/cors';
import Fastify from 'fastify';
import { CsvProvider, type PlayerStatsProvider } from '@waiver-warrior/core';
import { fileURLToPath } from 'node:url';

const PORT = readPort('API_PORT', 3300);
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

await app.listen({ port: PORT, host: '127.0.0.1' });

function readPort(name: string, fallback: number): number {
    const raw = process.env[name];
    if (raw === undefined || raw.trim() === '') return fallback;
    const port = Number(raw);
    if (!Number.isInteger(port) || port <= 0) {
        throw new Error(`${name} must be a positive integer, got ${JSON.stringify(raw)}`);
    }
    return port;
}
