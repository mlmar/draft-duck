import type { LeagueComparison } from '@draft-duck/core';

const API_URL = import.meta.env.PUBLIC_API_URL ?? 'https://localhost:3300';

export type YahooStatus = { enabled: boolean };
export type YahooAttempt = { attemptId: string; claimSecret: string; authorizationUrl: string; expiresAt: string };
export type YahooClaim = { status: 'pending' } | { status: 'complete'; token: string; expiresAt: string };
export type YahooLeague = {
    leagueKey: string;
    name: string;
    season: number;
    teamCount: number;
    currentWeek: number;
    weeks: number[];
    supported: boolean;
    unsupportedReason?: string;
    isFinished: boolean;
};

export class YahooApiError extends Error {
    constructor(
        message: string,
        public readonly status: number
    ) {
        super(message);
    }
}

export async function getYahooStatus(signal?: AbortSignal): Promise<YahooStatus> {
    return request('/yahoo/status', { signal });
}
export async function createYahooAttempt(signal?: AbortSignal): Promise<YahooAttempt> {
    return request('/yahoo/connections', { method: 'POST', headers: jsonHeaders, body: '{}', signal });
}
export async function claimYahooAttempt(
    attemptId: string,
    claimSecret: string,
    signal?: AbortSignal
): Promise<YahooClaim> {
    return request(`/yahoo/connections/${encodeURIComponent(attemptId)}/claim`, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({ claimSecret }),
        signal
    });
}
export async function getYahooLeagues(token: string, signal?: AbortSignal): Promise<YahooLeague[]> {
    const result = await request<{ leagues: YahooLeague[] }>('/yahoo/leagues', {
        headers: bearerHeaders(token),
        signal
    });
    return result.leagues;
}
export async function getYahooComparison(
    token: string,
    leagueKey: string,
    week: number,
    signal?: AbortSignal
): Promise<LeagueComparison> {
    return request(`/yahoo/leagues/${encodeURIComponent(leagueKey)}/comparison?week=${week}`, {
        headers: bearerHeaders(token),
        signal,
        cache: 'no-store'
    });
}
export async function disconnectYahoo(token: string, signal?: AbortSignal): Promise<void> {
    const response = await fetch(`${API_URL}/yahoo/session`, {
        method: 'DELETE',
        headers: bearerHeaders(token),
        signal,
        cache: 'no-store'
    });
    if (!response.ok) throw new YahooApiError('The Yahoo session could not be revoked.', response.status);
}

const jsonHeaders = { 'Content-Type': 'application/json' };
function bearerHeaders(token: string): HeadersInit {
    return { Authorization: `Bearer ${token}` };
}
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, { ...init, credentials: 'omit', cache: 'no-store' });
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: unknown } | null;
        const message = typeof body?.error === 'string' ? body.error : 'Yahoo request failed. Try again.';
        throw new YahooApiError(message, response.status);
    }
    return response.json() as Promise<T>;
}
