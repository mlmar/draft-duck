import type { SearchParser, SearchSerializer } from '@tanstack/react-router';

// Query values are strings in the app. The default JSON search serializer quotes
// assist=1 as "1", which we do not want in the URL.

export function searchString(value: unknown): string | undefined {
    if (typeof value === 'string') {
        if (value === '') return undefined;
        // Older links JSON-quoted digits. Unwrap so assist="1" still turns the flag on.
        if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
            try {
                const parsed = JSON.parse(value) as unknown;
                if (typeof parsed === 'string') return parsed === '' ? undefined : parsed;
            } catch {
                return value;
            }
        }
        return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return undefined;
}

export const parseSearch: SearchParser = (searchStr) => {
    if (searchStr.startsWith('?')) searchStr = searchStr.slice(1);
    const params = new URLSearchParams(searchStr);
    const search: Record<string, string> = {};
    for (const [key, value] of params) {
        const next = searchString(value);
        if (next !== undefined) search[key] = next;
    }
    return search;
};

export const stringifySearch: SearchSerializer = (search) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(search)) {
        const next = searchString(value);
        if (next === undefined) continue;
        params.set(key, next);
    }
    const query = params.toString();
    return query ? `?${query}` : '';
};
