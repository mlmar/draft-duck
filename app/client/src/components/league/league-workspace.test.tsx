// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { LeagueComparison } from '@draft-duck/core';
import { YahooApiError, type YahooLeague } from '@/lib/yahoo-api';
import { LeagueWorkspace } from './league-workspace.tsx';

const api = vi.hoisted(() => ({
    getYahooStatus: vi.fn(),
    createYahooAttempt: vi.fn(),
    claimYahooAttempt: vi.fn(),
    disconnectYahoo: vi.fn(),
    getYahooLeagues: vi.fn(),
    getYahooComparison: vi.fn()
}));

vi.mock('@/lib/yahoo-api', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/lib/yahoo-api')>()),
    ...api
}));

const baseLeague: YahooLeague = {
    leagueKey: 'nba.2026.l.1',
    name: 'Draft League',
    season: 2026,
    teamCount: 2,
    currentWeek: 2,
    weeks: [1, 2],
    supported: true,
    isFinished: false
};
const baseComparison: LeagueComparison = {
    league: {
        leagueKey: baseLeague.leagueKey,
        name: baseLeague.name,
        season: baseLeague.season,
        teamCount: baseLeague.teamCount,
        currentWeek: baseLeague.currentWeek,
        weeks: baseLeague.weeks,
        isFinished: false
    },
    week: 2,
    inProgress: true,
    fetchedAt: '2026-11-06T12:00:00.000Z',
    categories: [
        { key: 'pts', label: 'PTS', direction: 'higher', format: 'count' },
        { key: 'tov', label: 'TO', direction: 'lower', format: 'count' }
    ],
    teams: [
        { teamKey: `${baseLeague.leagueKey}.t.1`, name: 'Alpha', isOwned: true, values: { pts: 5, tov: 3 } },
        { teamKey: `${baseLeague.leagueKey}.t.2`, name: 'Beta', isOwned: false, values: { pts: 10, tov: 1 } }
    ]
};
let queryClient: QueryClient;

function mountWorkspace() {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    return render(
        <QueryClientProvider client={queryClient}>
            <LeagueWorkspace />
        </QueryClientProvider>
    );
}

async function connectWorkspace() {
    fireEvent.click(await screen.findByRole('button', { name: 'Connect Yahoo' }));
    await screen.findByRole('region', { name: 'Weekly league category results' });
}

function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason: unknown) => void;
    const promise = new Promise<T>((yes, no) => {
        resolve = yes;
        reject = no;
    });
    return { promise, resolve, reject };
}

beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'open').mockReturnValue({ close: vi.fn() } as unknown as Window);
    vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => undefined);
    api.getYahooStatus.mockResolvedValue({ enabled: true });
    api.createYahooAttempt.mockResolvedValue({
        attemptId: 'attempt',
        claimSecret: 'claim-secret',
        authorizationUrl: 'https://yahoo.example/authorize',
        expiresAt: new Date(Date.now() + 60_000).toISOString()
    });
    api.claimYahooAttempt.mockResolvedValue({
        status: 'complete',
        token: 'private-session-token',
        expiresAt: new Date(Date.now() + 60_000).toISOString()
    });
    api.getYahooLeagues.mockResolvedValue([baseLeague]);
    api.getYahooComparison.mockResolvedValue(baseComparison);
    api.disconnectYahoo.mockResolvedValue(undefined);
});

afterEach(() => {
    cleanup();
    queryClient?.clear();
    vi.restoreAllMocks();
});

describe('mounted Yahoo league workspace', () => {
    it('retries league discovery after a 403 response', async () => {
        api.getYahooLeagues.mockRejectedValueOnce(new YahooApiError('Membership denied.', 403));
        mountWorkspace();
        fireEvent.click(await screen.findByRole('button', { name: 'Connect Yahoo' }));
        expect((await screen.findByRole('alert')).textContent).toContain('Membership denied.');

        fireEvent.click(screen.getByRole('button', { name: 'Retry leagues' }));
        await screen.findByRole('region', { name: 'Weekly league category results' });
        expect(api.getYahooLeagues).toHaveBeenCalledTimes(2);
    });

    it('clears the in-memory session when its expiry timer fires', async () => {
        api.claimYahooAttempt.mockResolvedValueOnce({
            status: 'complete',
            token: 'private-session-token',
            expiresAt: new Date(Date.now() + 800).toISOString()
        });
        mountWorkspace();
        await connectWorkspace();

        await waitFor(() => expect(screen.getByRole('button', { name: 'Connect Yahoo' })).toBeTruthy(), {
            timeout: 3000
        });
        expect(screen.queryByRole('region', { name: 'Weekly league category results' })).toBeNull();
    });

    it('retains the last successful comparison after 403 and allows a successful retry', async () => {
        mountWorkspace();
        await connectWorkspace();

        api.getYahooComparison.mockRejectedValueOnce(new YahooApiError('Yahoo access denied.', 403));
        fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
        expect((await screen.findByRole('alert')).textContent).toContain('Showing the last successful refresh');
        expect(screen.getByRole('region', { name: 'Weekly league category results' })).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
        await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
        expect(screen.getByRole('region', { name: 'Weekly league category results' })).toBeTruthy();
    });

    it('clears a session after 401 and clears private state immediately on disconnect, with revocation retry', async () => {
        mountWorkspace();
        await connectWorkspace();

        api.getYahooComparison.mockRejectedValueOnce(new YahooApiError('Expired.', 401));
        fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
        expect(await screen.findByRole('button', { name: 'Connect Yahoo' })).toBeTruthy();
        expect(screen.queryByRole('region', { name: 'Weekly league category results' })).toBeNull();

        await connectWorkspace();
        api.disconnectYahoo.mockRejectedValueOnce(new Error('revocation unavailable'));
        fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }));
        expect(screen.getByRole('button', { name: 'Connect Yahoo' })).toBeTruthy();
        expect(screen.queryByRole('region', { name: 'Weekly league category results' })).toBeNull();
        fireEvent.click(await screen.findByRole('button', { name: 'Retry disconnect' }));
        await waitFor(() => expect(api.disconnectYahoo).toHaveBeenCalledTimes(2));
        expect(screen.queryByRole('button', { name: 'Retry disconnect' })).toBeNull();
    });

    it('ignores a stale week response and sorts table rows when a category header is activated', async () => {
        const stale = deferred<LeagueComparison>();
        api.getYahooComparison.mockImplementation((_token: string, _key: string, week: number) =>
            week === 1 ? stale.promise : Promise.resolve({ ...baseComparison, week })
        );
        mountWorkspace();
        await connectWorkspace();

        fireEvent.change(screen.getByLabelText('Week'), { target: { value: '1' } });
        await waitFor(() =>
            expect(api.getYahooComparison).toHaveBeenCalledWith(
                'private-session-token',
                baseLeague.leagueKey,
                1,
                expect.any(AbortSignal)
            )
        );
        fireEvent.change(screen.getByLabelText('Week'), { target: { value: '2' } });
        await waitFor(() => expect((screen.getByLabelText('Week') as HTMLSelectElement).value).toBe('2'));
        await act(async () => {
            stale.resolve({ ...baseComparison, week: 1, teams: [{ ...baseComparison.teams[0]!, name: 'Stale Team' }] });
            await stale.promise;
        });
        expect(screen.queryByText('Stale Team')).toBeNull();

        fireEvent.click(screen.getByRole('button', { name: 'Sort by PTS, best first' }));
        const rows = screen
            .getByRole('region', { name: 'Weekly league category results' })
            .querySelectorAll('tbody tr');
        expect(rows[0]?.textContent).toContain('Beta');
        expect(rows[1]?.textContent).toContain('Alpha');
    });

    it('reconciles metadata after refresh, keeps the selected week, and exposes the next week', async () => {
        const rolled: LeagueComparison = {
            ...baseComparison,
            league: { ...baseComparison.league, name: 'Renamed League', currentWeek: 3, weeks: [1, 2, 3] },
            inProgress: false
        };
        api.getYahooComparison.mockResolvedValueOnce(baseComparison).mockResolvedValueOnce(rolled);
        mountWorkspace();
        await connectWorkspace();

        expect((screen.getByLabelText('Week') as HTMLSelectElement).value).toBe('2');
        expect(screen.getByRole('option', { name: 'Week 2 · Current' })).toBeTruthy();
        expect(screen.getByText('In progress')).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));

        await waitFor(() => expect(screen.getByRole('option', { name: 'Week 3 · Current' })).toBeTruthy());
        expect((screen.getByLabelText('Week') as HTMLSelectElement).value).toBe('2');
        expect(screen.queryByRole('option', { name: 'Week 2 · Current' })).toBeNull();
        expect(screen.queryByText('In progress')).toBeNull();
        expect(screen.getByRole('option', { name: 'Week 3 · Current' })).toBeTruthy();
        expect(screen.getByRole('option', { name: 'Renamed League · 2026' })).toBeTruthy();
        await new Promise((resolve) => setTimeout(resolve, 20));
        expect(api.getYahooComparison).toHaveBeenCalledTimes(2);

        fireEvent.change(screen.getByLabelText('Week'), { target: { value: '3' } });
        await waitFor(() => expect(api.getYahooComparison).toHaveBeenCalledTimes(3));
    });
});
