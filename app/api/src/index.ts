import { buildApp } from './app.ts';

const port = readPort('PORT') ?? readPort('API_PORT') ?? 3300;
const host = process.env.HOST ?? '127.0.0.1';
const app = await buildApp();
await app.listen({ port, host });

function readPort(name: string): number | undefined {
    const raw = process.env[name];
    if (raw === undefined || raw.trim() === '') return undefined;
    const port = Number(raw);
    if (!Number.isInteger(port) || port <= 0) throw new Error(`${name} must be a positive integer.`);
    return port;
}
