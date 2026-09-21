import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
const srcDir = fileURLToPath(new URL('./src', import.meta.url));

// Marketing and onboarding HTML is prerendered. /draft stays a client-only SPA route.
const prerenderPages = [{ path: '/' }, { path: '/about' }, { path: '/how-it-works' }, { path: '/onboard' }];

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, repoRoot, '');
    const clientPort = Number(env.CLIENT_PORT) || 3000;

    return {
        envDir: repoRoot,
        envPrefix: ['VITE_', 'PUBLIC_'],
        server: {
            port: clientPort,
            host: true
        },
        preview: {
            port: clientPort,
            host: true
        },
        resolve: {
            alias: {
                '@': srcDir
            }
        },
        plugins: [
            tanstackStart({
                spa: {
                    enabled: true,
                    // `/` is already a full prerender. Query keeps the shell as a second page.
                    maskPath: '/?spa-shell=1'
                },
                prerender: {
                    enabled: true,
                    // Home links to /draft. Do not follow those into static HTML.
                    crawlLinks: false,
                    autoStaticPathsDiscovery: false,
                    failOnError: true
                },
                pages: prerenderPages
            }),
            viteReact(),
            tailwindcss()
        ]
    };
});
