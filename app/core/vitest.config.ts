import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Same `@` alias as the apps, so tests can import like production code.
export default defineConfig({
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    test: {
        environment: 'node'
    }
});
