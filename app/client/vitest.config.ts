import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    test: {
        environment: 'node',
        // Tests default to Node; mounted workspace tests opt into jsdom per file.
        include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts']
    }
});
