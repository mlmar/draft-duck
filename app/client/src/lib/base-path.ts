// Project Pages lives at /draft-duck/. Vite wants a trailing slash. The router does not.

export function viteBase(raw: string | undefined): string {
    const value = raw?.trim() || '/';
    return value.endsWith('/') ? value : `${value}/`;
}

export function routerBasepath(raw: string | undefined): string | undefined {
    const trimmed = raw?.trim() || '/';
    const value = trimmed.replace(/\/+$/, '') || '/';
    return value === '/' ? undefined : value;
}
