// Project Pages lives at /draft-duck/. Vite wants a trailing slash. The router does not.
// A missing leading slash would become a relative Vite base and break asset URLs.

function normalizeBase(raw: string | undefined): string {
    const trimmed = raw?.trim() || '/';
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export function viteBase(raw: string | undefined): string {
    const value = normalizeBase(raw);
    return value.endsWith('/') ? value : `${value}/`;
}

export function routerBasepath(raw: string | undefined): string | undefined {
    const value = normalizeBase(raw).replace(/\/+$/, '') || '/';
    return value === '/' ? undefined : value;
}
