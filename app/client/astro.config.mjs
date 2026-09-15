import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
const env = loadEnv(process.env.NODE_ENV ?? 'development', repoRoot, '');
const clientPort = Number(env.CLIENT_PORT) || 3000;

// `@` points at src so pages can import layouts without long relative paths.
export default defineConfig({
    output: 'static',
    envDir: repoRoot,
    integrations: [react()],
    server: {
        port: clientPort,
        host: true
    },
    preview: {
        port: clientPort
    },
    devToolbar: {
        enabled: false
    },
    vite: {
        plugins: [tailwindcss()],
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url))
            }
        }
    }
});
