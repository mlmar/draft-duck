// Bake-time check for PUBLIC_API_URL. The client concatenates `${API_URL}/rank`.
// A trailing slash, http://, or localhost ships a dead production board.

import { pathToFileURL } from 'node:url';

export function assertPublicApiUrl(raw) {
    const value = typeof raw === 'string' ? raw.trim() : '';
    if (!value) {
        throw new Error('Set repository variable PUBLIC_API_URL to the Cloud Run origin (https, no trailing slash).');
    }

    let url;
    try {
        url = new URL(value);
    } catch {
        throw new Error(`PUBLIC_API_URL must be an absolute URL, got ${JSON.stringify(raw)}.`);
    }

    if (url.protocol !== 'https:') {
        throw new Error(`PUBLIC_API_URL must be https://, got ${JSON.stringify(value)}.`);
    }
    if (value.endsWith('/')) {
        throw new Error(
            `PUBLIC_API_URL must not end with a slash (client appends /rank), got ${JSON.stringify(value)}.`
        );
    }
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        throw new Error(`PUBLIC_API_URL must be the Cloud Run origin, not loopback, got ${JSON.stringify(value)}.`);
    }
    if (url.pathname !== '/' || url.search || url.hash) {
        throw new Error(`PUBLIC_API_URL must be origin only (no path or query), got ${JSON.stringify(value)}.`);
    }

    return value;
}

// Vitest imports this file. Only check env when the workflow runs the script.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    assertPublicApiUrl(process.env.PUBLIC_API_URL);
}
