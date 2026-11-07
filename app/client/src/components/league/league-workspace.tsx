import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowDownWideNarrow, ArrowUpWideNarrow, ChevronDown, RefreshCw, Unplug } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
    CAT_KEYS,
    rankComparison,
    type ComparisonCategory,
    type ComparisonTeam,
    type LeagueComparison
} from '@draft-duck/core';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    YahooApiError,
    claimYahooAttempt,
    createYahooAttempt,
    disconnectYahoo,
    getYahooComparison,
    getYahooLeagues,
    getYahooStatus,
    type YahooLeague
} from '@/lib/yahoo-api';
import { comparisonHeat, formatLeagueValue, orderLeagueTeams } from '@/lib/league-table';

type Session = { token: string; expiresAt: string; key: string };
type Selection = { key: string; data: LeagueComparison };
type SelectionError = { key: string; message: string; status?: number };
export type SortState = { key: string; bestFirst: boolean } | null;

export function LeagueWorkspace() {
    const queryClient = useQueryClient();
    const [enabled, setEnabled] = useState<boolean | null>(null);
    const [statusRefresh, setStatusRefresh] = useState(0);
    const [statusError, setStatusError] = useState('');
    const [session, setSession] = useState<Session | null>(null);
    const sessionRef = useRef<Session | null>(null);
    const [connectionState, setConnectionState] = useState<'idle' | 'starting' | 'waiting'>('idle');
    const [connectionMessage, setConnectionMessage] = useState('');
    const [connectionError, setConnectionError] = useState('');
    const connectionController = useRef<AbortController | null>(null);
    const connectionSequence = useRef(0);
    const popupRef = useRef<Window | null>(null);
    const [revokeError, setRevokeError] = useState('');
    const revokeTokenRef = useRef<string | null>(null);
    const [leagues, setLeagues] = useState<YahooLeague[] | null>(null);
    const [leagueRefresh, setLeagueRefresh] = useState(0);
    const [leagueError, setLeagueError] = useState('');
    const [selectedLeagueKey, setSelectedLeagueKey] = useState('');
    const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
    const [comparison, setComparison] = useState<Selection | null>(null);
    const [comparisonError, setComparisonError] = useState<SelectionError | null>(null);
    const [comparisonLoading, setComparisonLoading] = useState(false);
    const [refreshCount, setRefreshCount] = useState(0);
    const [sortState, setSortState] = useState<SortState>(null);
    const comparisonController = useRef<AbortController | null>(null);
    const selectedLeague = leagues?.find((league) => league.leagueKey === selectedLeagueKey) ?? null;
    const selectionKey =
        session && selectedLeague && selectedWeek !== null
            ? `${session.key}:${selectedLeague.leagueKey}:${selectedWeek}`
            : '';
    const visibleComparison = comparison?.key === selectionKey ? comparison.data : null;
    const visibleError = comparisonError?.key === selectionKey ? comparisonError : null;

    function replaceSession(next: Session | null) {
        sessionRef.current = next;
        setSession(next);
    }
    function clearPrivateState(message = '') {
        replaceSession(null);
        setLeagues(null);
        setLeagueError('');
        setSelectedLeagueKey('');
        setSelectedWeek(null);
        setComparison(null);
        setComparisonError(null);
        comparisonController.current?.abort();
        setComparisonLoading(false);
        queryClient.removeQueries({ queryKey: ['yahoo'] });
        if (message) setConnectionError(message);
    }

    // Discover whether the feature is available before presenting the connection action.
    useEffect(() => {
        const controller = new AbortController();
        void getYahooStatus(controller.signal)
            .then((result) => setEnabled(result.enabled))
            .catch(() => {
                if (!controller.signal.aborted)
                    setStatusError('Could not check Yahoo connection availability. Try again.');
            });
        return () => controller.abort();
    }, [statusRefresh]);

    // Keep the in-memory bearer bounded even when the user leaves the page idle.
    useEffect(() => {
        const current = session;
        if (!current) return;
        const delay = Date.parse(current.expiresAt) - Date.now();
        const timer = window.setTimeout(
            () => {
                if (sessionRef.current?.token === current.token)
                    clearPrivateState('Your Yahoo session expired. Connect again to continue.');
            },
            Math.max(0, delay)
        );
        return () => window.clearTimeout(timer);
    }, [session]);

    // Membership is private and tied to this session; abort an earlier read if the session changes.
    useEffect(() => {
        const current = session;
        if (!current) return;
        const controller = new AbortController();
        setLeagues(null);
        setLeagueError('');
        setSelectedLeagueKey('');
        setSelectedWeek(null);
        setComparison(null);
        setComparisonError(null);
        void getYahooLeagues(current.token, controller.signal)
            .then((items) => {
                if (controller.signal.aborted || sessionRef.current?.token !== current.token) return;
                setLeagues(items);
                if (items.length === 1) {
                    setSelectedLeagueKey(items[0]!.leagueKey);
                    setSelectedWeek(defaultWeek(items[0]!));
                }
            })
            .catch((error: unknown) => {
                if (controller.signal.aborted) return;
                if (error instanceof YahooApiError && error.status === 401) {
                    clearPrivateState('Your Yahoo session expired. Connect again to continue.');
                    return;
                }
                setLeagueError(
                    error instanceof Error ? error.message : 'Could not load your Yahoo leagues. Try again.'
                );
            });
        return () => controller.abort();
    }, [session?.token, leagueRefresh]);

    // Route exit tears down popup/poll work and removes cached private comparison rows.
    useEffect(
        () => () => {
            connectionSequence.current += 1;
            connectionController.current?.abort();
            comparisonController.current?.abort();
            popupRef.current?.close();
            queryClient.removeQueries({ queryKey: ['yahoo'] });
        },
        [queryClient]
    );

    // A result belongs to one session, league, and week; abort it before loading a new selection.
    useEffect(() => {
        const currentSession = session;
        const currentLeague = selectedLeague;
        const week = selectedWeek;
        comparisonController.current?.abort();
        if (!currentSession || !currentLeague || week === null || !currentLeague.supported) {
            setComparisonLoading(false);
            return;
        }
        const key = `${currentSession.key}:${currentLeague.leagueKey}:${week}`;
        const controller = new AbortController();
        comparisonController.current = controller;
        setComparisonLoading(true);
        setComparisonError(null);
        void getYahooComparison(currentSession.token, currentLeague.leagueKey, week, controller.signal)
            .then((data) => {
                if (controller.signal.aborted || sessionRef.current?.token !== currentSession.token) return;
                setComparison({ key, data });
                // Yahoo's comparison response is the freshest season snapshot; merge it into membership selectors
                // while preserving the user's historical week selection.
                setLeagues(
                    (current) =>
                        current?.map((league) =>
                            league.leagueKey === data.league.leagueKey
                                ? {
                                      ...league,
                                      name: data.league.name,
                                      season: data.league.season,
                                      teamCount: data.league.teamCount,
                                      currentWeek: data.league.currentWeek,
                                      weeks: data.league.weeks,
                                      isFinished: data.league.isFinished ?? false
                                  }
                                : league
                        ) ?? current
                );
                queryClient.setQueryData(
                    ['yahoo', 'comparison', currentSession.key, currentLeague.leagueKey, week],
                    data
                );
            })
            .catch((error: unknown) => {
                if (controller.signal.aborted) return;
                if (error instanceof YahooApiError && error.status === 401) {
                    clearPrivateState('Your Yahoo session expired. Connect again to continue.');
                    return;
                }
                setComparisonError({
                    key,
                    message: error instanceof Error ? error.message : 'Could not refresh this comparison.',
                    status: error instanceof YahooApiError ? error.status : undefined
                });
            })
            .finally(() => {
                if (!controller.signal.aborted) setComparisonLoading(false);
            });
        return () => controller.abort();
    }, [session?.token, session?.expiresAt, selectedLeague?.leagueKey, selectedWeek, refreshCount, queryClient]);

    async function connect() {
        if (connectionController.current) return;
        const targetName = `yahoo-${crypto.randomUUID()}`;
        const popup = window.open('about:blank', targetName, 'popup,width=680,height=760');
        if (!popup) {
            setConnectionError(
                'Your browser blocked the Yahoo sign-in window. Allow pop-ups for this site, then try again.'
            );
            return;
        }
        popupRef.current = popup;
        const controller = new AbortController();
        connectionController.current = controller;
        const sequence = ++connectionSequence.current;
        setConnectionState('starting');
        setConnectionError('');
        setConnectionMessage('Opening Yahoo sign-in…');
        try {
            const attempt = await createYahooAttempt(controller.signal);
            if (controller.signal.aborted || sequence !== connectionSequence.current) return;
            postToYahoo(attempt.authorizationUrl, targetName, attempt.claimSecret);
            setConnectionState('waiting');
            setConnectionMessage('Waiting for Yahoo authorization. Keep this page open.');
            const deadline = Math.min(Date.parse(attempt.expiresAt), Date.now() + 10 * 60_000);
            while (Date.now() < deadline && !controller.signal.aborted) {
                const claim = await claimYahooAttempt(attempt.attemptId, attempt.claimSecret, controller.signal);
                if (controller.signal.aborted || sequence !== connectionSequence.current) {
                    if (claim.status === 'complete') void disconnectYahoo(claim.token).catch(() => undefined);
                    return;
                }
                if (claim.status === 'complete') {
                    replaceSession({ token: claim.token, expiresAt: claim.expiresAt, key: crypto.randomUUID() });
                    setConnectionMessage('Yahoo connected.');
                    return;
                }
                await wait(1200, controller.signal);
            }
            if (!controller.signal.aborted)
                throw new Error('This sign-in attempt expired. Start again to connect Yahoo.');
        } catch (error) {
            if (!controller.signal.aborted && sequence === connectionSequence.current) {
                popupRef.current?.close();
                popupRef.current = null;
                setConnectionError(
                    error instanceof Error ? error.message : 'Yahoo connection could not be completed. Try again.'
                );
                setConnectionMessage('');
            }
        } finally {
            if (sequence === connectionSequence.current) {
                connectionController.current = null;
                setConnectionState('idle');
            }
        }
    }

    function cancelConnection() {
        connectionSequence.current += 1;
        connectionController.current?.abort();
        connectionController.current = null;
        popupRef.current?.close();
        popupRef.current = null;
        setConnectionState('idle');
        setConnectionMessage('Connection cancelled. You can start again whenever you are ready.');
    }

    async function revoke(token: string) {
        try {
            await disconnectYahoo(token);
            revokeTokenRef.current = null;
            setRevokeError('');
        } catch {
            revokeTokenRef.current = token;
            setRevokeError(
                'This page is disconnected, but the server could not end the Yahoo session. Retry disconnect.'
            );
        }
    }
    function disconnect() {
        const token = session?.token;
        if (!token) return;
        clearPrivateState();
        setConnectionError('');
        setRevokeError('');
        setConnectionMessage('Disconnected from Yahoo.');
        void revoke(token);
    }

    function selectLeague(leagueKey: string) {
        const league = leagues?.find((item) => item.leagueKey === leagueKey);
        setSelectedLeagueKey(leagueKey);
        setSelectedWeek(league ? defaultWeek(league) : null);
        setSortState(null);
        setComparisonError(null);
    }
    function selectWeek(value: string) {
        setSelectedWeek(Number(value));
        setSortState(null);
        setComparisonError(null);
    }

    const displayTeams = useMemo(() => {
        if (!visibleComparison) return [];
        const category = sortState
            ? visibleComparison.categories.find((item) => item.key === sortState.key)
            : undefined;
        return orderLeagueTeams(visibleComparison.teams, category, sortState?.bestFirst ?? true);
    }, [visibleComparison, sortState]);
    const ranksByTeam = useMemo(
        () => (visibleComparison ? rankComparison(visibleComparison.teams, visibleComparison.categories) : []),
        [visibleComparison]
    );
    const rankMap = useMemo(() => new Map(ranksByTeam.map((team) => [team.teamKey, team.ranks])), [ranksByTeam]);

    return (
        <section className='mx-auto w-full min-w-0 max-w-[88rem] space-y-6'>
            <div className='max-w-3xl space-y-2'>
                <h1 className='text-3xl leading-tight font-semibold tracking-[-0.025em] md:text-4xl'>
                    League comparison
                </h1>
                <p className='max-w-[70ch] text-base leading-relaxed text-muted-foreground'>
                    Compare your league’s actual weekly category results from Yahoo. Your draft profile and player
                    rankings stay separate.
                </p>
            </div>

            {statusError ? (
                <Message
                    tone='error'
                    text={statusError}
                    action={
                        <Button
                            variant='outline'
                            onClick={() => {
                                setStatusError('');
                                setEnabled(null);
                                setStatusRefresh((count) => count + 1);
                            }}
                        >
                            Retry
                        </Button>
                    }
                />
            ) : null}
            {connectionError ? <Message tone='error' text={connectionError} /> : null}
            {revokeError ? (
                <Message
                    tone='error'
                    text={revokeError}
                    action={
                        <Button
                            variant='outline'
                            onClick={() => revokeTokenRef.current && void revoke(revokeTokenRef.current)}
                        >
                            Retry disconnect
                        </Button>
                    }
                />
            ) : null}

            {enabled === null && !statusError ? (
                <p role='status' className='text-muted-foreground'>
                    Checking Yahoo connection…
                </p>
            ) : null}
            {enabled === false ? <Message text='Yahoo weekly comparisons are not available right now.' /> : null}
            {enabled && !session ? (
                <div className='flex max-w-2xl flex-col items-start gap-3'>
                    <Button onClick={() => void connect()} disabled={connectionState !== 'idle'}>
                        Connect Yahoo
                    </Button>
                    {connectionState !== 'idle' ? (
                        <Button variant='outline' onClick={cancelConnection}>
                            Cancel connection
                        </Button>
                    ) : null}
                    {connectionMessage ? (
                        <p role='status' aria-live='polite' className='text-muted-foreground'>
                            {connectionMessage}
                        </p>
                    ) : null}
                </div>
            ) : null}

            {session ? (
                <div className='space-y-5'>
                    <div className='flex flex-wrap items-end gap-4'>
                        <div className='grid min-w-56 flex-1 gap-2 sm:max-w-md'>
                            <Label htmlFor='league-select'>League</Label>
                            <div className='relative'>
                                <select
                                    id='league-select'
                                    className='h-11 w-full appearance-none rounded-lg border border-input bg-card bg-none pr-10 pl-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50'
                                    value={selectedLeagueKey}
                                    disabled={!leagues?.length}
                                    onChange={(event) => selectLeague(event.target.value)}
                                >
                                    {!leagues?.length ? <option value=''>Choose a league</option> : null}
                                    {leagues?.length && leagues.length > 1 ? (
                                        <option value=''>Choose a league</option>
                                    ) : null}
                                    {leagues?.map((league) => (
                                        <option key={league.leagueKey} value={league.leagueKey}>
                                            {league.name} · {league.season}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown
                                    aria-hidden='true'
                                    className='pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground'
                                />
                            </div>
                        </div>
                        {selectedLeague?.supported && selectedLeague.weeks.length ? (
                            <div className='grid min-w-36 gap-2'>
                                <Label htmlFor='week-select'>Week</Label>
                                <div className='relative'>
                                    <select
                                        id='week-select'
                                        className='h-11 w-full appearance-none rounded-lg border border-input bg-card bg-none pr-10 pl-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'
                                        value={selectedWeek ?? selectedLeague.currentWeek}
                                        onChange={(event) => selectWeek(event.target.value)}
                                    >
                                        {selectedLeague.weeks.map((week) => (
                                            <option key={week} value={week}>
                                                Week {week}
                                                {week === selectedLeague.currentWeek && !selectedLeague.isFinished
                                                    ? ' · Current'
                                                    : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown
                                        aria-hidden='true'
                                        className='pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground'
                                    />
                                </div>
                            </div>
                        ) : null}
                        <div className='flex flex-wrap gap-2'>
                            <Button
                                variant='outline'
                                onClick={() => setRefreshCount((count) => count + 1)}
                                disabled={!selectedLeague?.supported || selectedWeek === null || comparisonLoading}
                            >
                                <RefreshCw aria-hidden='true' /> Refresh
                            </Button>
                            <Button variant='outline' onClick={disconnect}>
                                <Unplug aria-hidden='true' /> Disconnect
                            </Button>
                        </div>
                    </div>

                    {leagues === null && !leagueError ? (
                        <p role='status' className='text-muted-foreground'>
                            Loading your Yahoo leagues…
                        </p>
                    ) : null}
                    {leagueError ? (
                        <Message
                            tone='error'
                            text={leagueError}
                            action={
                                <Button variant='outline' onClick={() => setLeagueRefresh((count) => count + 1)}>
                                    Retry leagues
                                </Button>
                            }
                        />
                    ) : null}
                    {leagues?.length === 0 ? (
                        <Message text='No current-season NBA leagues were found for this Yahoo account.' />
                    ) : null}
                    {leagues && leagues.length > 1 && !selectedLeague ? (
                        <p className='text-muted-foreground'>Choose a league to see its weekly results.</p>
                    ) : null}
                    {selectedLeague && !selectedLeague.supported ? (
                        <Message
                            text={
                                selectedLeague.unsupportedReason ??
                                'This league does not have supported current-season week data.'
                            }
                        />
                    ) : null}
                    {selectedLeague?.supported && selectedWeek !== null ? (
                        <div className='space-y-3'>
                            <div className='flex flex-wrap items-center justify-between gap-2'>
                                <div className='flex flex-wrap items-center gap-2'>
                                    {visibleComparison?.inProgress ? (
                                        <Badge variant='secondary'>In progress</Badge>
                                    ) : null}
                                    {visibleComparison ? (
                                        <span className='text-sm text-muted-foreground'>
                                            Updated {formatFetchedAt(visibleComparison.fetchedAt)}
                                        </span>
                                    ) : null}
                                </div>
                                {comparisonLoading ? (
                                    <p role='status' className='text-sm text-muted-foreground'>
                                        Loading weekly results…
                                    </p>
                                ) : null}
                            </div>
                            {visibleError ? (
                                <Message
                                    tone='error'
                                    text={`${visibleError.status === 422 ? 'This league cannot be compared: ' : ''}${visibleError.message}${visibleComparison ? ' Showing the last successful refresh for this league and week.' : ''}`}
                                />
                            ) : null}
                            {visibleComparison ? (
                                <ComparisonTable
                                    comparison={visibleComparison}
                                    teams={displayTeams}
                                    ranksByTeam={rankMap}
                                    sortState={sortState}
                                    onSort={setSortState}
                                />
                            ) : null}
                            {!visibleComparison && comparisonLoading ? (
                                <div aria-hidden='true' className='h-24 rounded-lg border border-border bg-card' />
                            ) : null}
                            {!visibleComparison && visibleError && visibleError.status !== 422 ? (
                                <Button variant='outline' onClick={() => setRefreshCount((count) => count + 1)}>
                                    Try again
                                </Button>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            ) : null}
        </section>
    );
}

export function ComparisonTable({
    comparison,
    teams,
    ranksByTeam,
    sortState,
    onSort
}: {
    comparison: LeagueComparison;
    teams: ComparisonTeam[];
    ranksByTeam: Map<string, Partial<Record<(typeof CAT_KEYS)[number], number | null>>>;
    sortState: SortState;
    onSort: (next: SortState) => void;
}) {
    const categories = CAT_KEYS.map((key) => comparison.categories.find((category) => category.key === key)).filter(
        (value): value is ComparisonCategory => Boolean(value)
    );
    return (
        <Table
            containerLabel='Weekly league category results'
            containerClassName='max-w-full overscroll-x-contain rounded-lg border border-border bg-card'
            className='min-w-max border-separate border-spacing-0'
        >
            <caption className='sr-only'>
                Weekly Yahoo credited category results and competition ranks for each team
            </caption>
            <TableHeader className='sticky top-0 z-10 bg-card'>
                <TableRow className='bg-card hover:bg-card'>
                    <TableHead className='sticky left-0 z-20 min-w-40 bg-card sm:min-w-56'>Team</TableHead>
                    {categories.map((category) => {
                        const active = sortState?.key === category.key;
                        const bestFirst = active ? sortState.bestFirst : true;
                        const actualAscending = category.direction === 'lower' ? bestFirst : !bestFirst;
                        const nextBestFirst = active ? !sortState.bestFirst : true;
                        const nextAscending = category.direction === 'lower' ? nextBestFirst : !nextBestFirst;
                        const Icon = nextAscending ? ArrowUpWideNarrow : ArrowDownWideNarrow;
                        return (
                            <TableHead
                                key={category.key}
                                aria-sort={active ? (actualAscending ? 'ascending' : 'descending') : 'none'}
                                className='px-2 text-center'
                            >
                                <button
                                    type='button'
                                    className='inline-flex min-h-11 min-w-16 items-center justify-center gap-1 rounded-md px-2 text-base font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50'
                                    aria-label={`Sort by ${category.label}, ${nextBestFirst ? 'best' : 'worst'} first`}
                                    onClick={() =>
                                        onSort(
                                            active
                                                ? { key: category.key, bestFirst: !sortState.bestFirst }
                                                : { key: category.key, bestFirst: true }
                                        )
                                    }
                                >
                                    {category.label}
                                    <Icon aria-hidden='true' className='size-4 text-muted-foreground' />
                                </button>
                            </TableHead>
                        );
                    })}
                </TableRow>
            </TableHeader>
            <TableBody>
                {teams.map((team) => (
                    <TableRow key={team.teamKey}>
                        <TableCell
                            className={`sticky left-0 z-[1] min-w-40 font-medium sm:min-w-56 ${team.isOwned ? 'bg-secondary' : 'bg-card'}`}
                        >
                            <div className='flex min-w-0 flex-col items-start gap-1'>
                                <span className='max-w-40 truncate sm:max-w-52'>{team.name}</span>
                                {team.isOwned ? (
                                    <span className='text-sm font-normal text-muted-foreground'>Your team</span>
                                ) : null}
                            </div>
                        </TableCell>
                        {categories.map((category) => {
                            const value = team.values[category.key];
                            const rank = ranksByTeam.get(team.teamKey)?.[category.key];
                            const heat = comparisonHeat(comparison, team, category);
                            return (
                                <TableCell
                                    key={category.key}
                                    style={heat}
                                    className='min-w-24 px-3 py-2 text-center tabular-nums'
                                    aria-label={`${category.label}: ${formatLeagueValue(value, category.format)}, ${typeof rank === 'number' ? `rank ${rank}` : 'unranked'}`}
                                >
                                    <span className='block font-medium'>
                                        {formatLeagueValue(value, category.format)}
                                    </span>
                                    <span className='block text-sm text-muted-foreground'>
                                        {typeof rank === 'number' ? `#${rank}` : '—'}
                                    </span>
                                </TableCell>
                            );
                        })}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

function Message({ text, tone, action }: { text: string; tone?: 'error'; action?: ReactNode }) {
    return (
        <div
            role={tone === 'error' ? 'alert' : 'status'}
            className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 ${tone === 'error' ? 'border-destructive/30 bg-destructive/5 text-foreground' : 'border-border bg-card text-muted-foreground'}`}
        >
            <p className='mb-0 min-w-0'>{text}</p>
            {action}
        </div>
    );
}

function postToYahoo(action: string, targetName: string, claimSecret: string) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = action;
    form.target = targetName;
    form.enctype = 'application/x-www-form-urlencoded';
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'claimSecret';
    input.value = claimSecret;
    form.append(input);
    document.body.append(form);
    try {
        form.submit();
    } finally {
        form.remove();
        input.value = '';
    }
}
function wait(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
        if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'));
        const timer = window.setTimeout(() => {
            signal.removeEventListener('abort', abort);
            resolve();
        }, ms);
        const abort = () => {
            window.clearTimeout(timer);
            reject(new DOMException('Aborted', 'AbortError'));
        };
        signal.addEventListener('abort', abort, { once: true });
    });
}
function formatFetchedAt(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? 'just now'
        : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}
function defaultWeek(league: YahooLeague): number | null {
    if (league.weeks.includes(league.currentWeek)) return league.currentWeek;
    return league.weeks.at(-1) ?? null;
}
