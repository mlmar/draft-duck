import { buildApp } from './app.ts';
import { loadLocalHttps } from './local-https.ts';

const port = readPort('PORT') ?? readPort('API_PORT') ?? 3300;
const host = process.env.HOST ?? '127.0.0.1';
const https = await loadLocalHttps(process.env);
const app = await buildApp({ https });
const address = await app.listen({ port, host });
console.info(`API listening at ${address}`);

function readPort(name: string): number | undefined {
    const raw = process.env[name];
    if (raw === undefined || raw.trim() === '') return undefined;
    const port = Number(raw);
    if (!Number.isInteger(port) || port <= 0) throw new Error(`${name} must be a positive integer.`);
    return port;
}
