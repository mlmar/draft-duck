import {
    CAT_KEYS,
    CAT_LABELS,
    aggregateTeamStrength,
    appendTeamLabRow,
    applyTeamLabPreview,
    createTeamLabState,
    createTeamRosterRecord,
    displayedTeamLabPlayerIds,
    parseTeamRosterRecord,
    rankTeamLabUniverse,
    resetTeamLabPreview,
    serializeTeamRosterRecord,
    setTeamLabCandidate,
    setTeamLabRosterPlayer,
    swapTeamLabRow,
    TEAM_ROSTER_STORAGE_KEY,
    toggleTeamLabBulkSwap,
    type CatKey,
    type CatStance,
    type PlayerSeason,
    type TeamLabRow,
    type TeamLabState,
    type TeamRawTotals
} from '@draft-duck/core';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { useMediaQuery } from '@/hooks/use-media-query';
import { loadPlayers } from '@/lib/api';
import { formatSignedValue } from '@/lib/player-strength-chart';
import { useDraftProfileStore } from '@/stores/draft-profile';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftRight, Plus, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

type Side = 'team' | 'candidates';
type StorageStatus = 'loading' | 'ready' | 'saved' | 'unavailable';
type SearchTarget = { side: Side; rowId: string } | null;

/** Keep an addable trailing row after any selection consumes the last available slot. */
function ensureTrailingBlankRow(state: TeamLabState): TeamLabState {
    // Existing populated candidate-only or roster-only rows still leave one explicit empty row at the end.
    const last = state.rows.at(-1);
    if (!last || (last.rosterPlayerId === null && last.candidatePlayerId === null)) return state;
    let suffix = state.rows.length + 1;
    while (state.rows.some((row) => row.rowId === `row-${suffix}`)) suffix += 1;
    return appendTeamLabRow(state, `row-${suffix}`);
}

/** Supply neutral values only when one side of a valid comparison contains no players. */
function zeroStrength(): Record<CatKey, number> {
    // An empty side is plotted at the shared zero line while non-empty sides retain complete calculated values.
    return Object.fromEntries(CAT_KEYS.map((category) => [category, 0])) as Record<CatKey, number>;
}

/** Own saved roster hydration, temporary candidate choices, responsive rows, and graph comparison. */
export function TeamWorkspace() {
    const profile = useDraftProfileStore((state) => state.profile);
    const [hydrated, setHydrated] = useState(false);
    const [workspace, setWorkspace] = useState<TeamLabState>(() => createTeamLabState([]));
    const [rosterNames, setRosterNames] = useState<Record<string, string>>({});
    const [storageStatus, setStorageStatus] = useState<StorageStatus>('loading');
    const [storageMessage, setStorageMessage] = useState<string | null>(null);
    const [searchTarget, setSearchTarget] = useState<SearchTarget>(null);
    const [mobileSide, setMobileSide] = useState<Side>('team');
    const [strengthMode, setStrengthMode] = useState<'average' | 'total'>('average');

    // Fetch the current CSV catalog once and score every player against the same all-nine-category universe.
    const playersQuery = useQuery({ queryKey: ['team-lab', 'players'], queryFn: loadPlayers });
    const rankedUniverse = useMemo(
        () => (playersQuery.data ? rankTeamLabUniverse(playersQuery.data) : []),
        [playersQuery.data]
    );
    const playerById = useMemo(
        () => new Map((playersQuery.data ?? []).map((player) => [player.playerId, player])),
        [playersQuery.data]
    );
    // Read the isolated roster key after mount so browser storage never runs during server rendering.
    useEffect(() => {
        if (hydrated || typeof window === 'undefined') return;
        try {
            const parsed = parseTeamRosterRecord(window.localStorage.getItem(TEAM_ROSTER_STORAGE_KEY));
            if (parsed.status === 'valid') {
                setWorkspace(createTeamLabState(parsed.record.playerIds));
                setRosterNames(parsed.record.playerNames);
                setStorageStatus('saved');
            } else {
                setWorkspace(createTeamLabState([]));
                setStorageStatus('ready');
                if (parsed.status === 'invalid') {
                    setStorageMessage('The saved roster could not be read. Add players to create a fresh roster.');
                }
            }
        } catch {
            setWorkspace(createTeamLabState([]));
            setStorageStatus('unavailable');
            setStorageMessage('Browser storage is unavailable. Your roster will work for this visit only.');
        }
        setHydrated(true);
    }, [hydrated]);

    // Derive both lineups from stable row ownership and the current swap state.
    const savedIds = workspace.rows
        .map((row) => row.rosterPlayerId)
        .filter((playerId): playerId is string => playerId !== null);
    const proposedIds = workspace.rows
        .map((row) => displayedTeamLabPlayerIds(workspace, row).left)
        .filter((playerId): playerId is string => playerId !== null);
    const currentStrength = useMemo(
        () => aggregateTeamStrength(rankedUniverse, savedIds, strengthMode),
        [rankedUniverse, savedIds.join('|'), strengthMode]
    );
    const proposedStrength = useMemo(
        () => aggregateTeamStrength(rankedUniverse, proposedIds, strengthMode),
        [rankedUniverse, proposedIds.join('|'), strengthMode]
    );
    const previewActive = workspace.bulkControlledRowIds !== null || Object.keys(workspace.manualSwaps).length > 0;
    const enabledCats = profile?.enabledCats ?? [...CAT_KEYS];
    const categories = CAT_KEYS.filter((category) => enabledCats.includes(category));
    const candidates = workspace.rows.map((row) => row.candidatePlayerId).filter((id): id is string => id !== null);
    const isDesktop = useMediaQuery('(min-width: 768px)');

    // Update local roster memory first, then persist the separate versioned record when browser storage allows it.
    function saveRoster(nextWorkspace: TeamLabState, nextNames: Record<string, string>) {
        setWorkspace(nextWorkspace);
        const nextIds = nextWorkspace.rows
            .map((row) => row.rosterPlayerId)
            .filter((playerId): playerId is string => playerId !== null);
        const names = Object.fromEntries(Object.entries(nextNames).filter(([playerId]) => nextIds.includes(playerId)));
        setRosterNames(names);
        try {
            window.localStorage.setItem(
                TEAM_ROSTER_STORAGE_KEY,
                serializeTeamRosterRecord(createTeamRosterRecord(nextIds, names))
            );
            setStorageStatus('saved');
            setStorageMessage(null);
        } catch {
            setStorageStatus('unavailable');
            setStorageMessage('Browser storage is unavailable. Your roster will work for this visit only.');
        }
    }

    // Commit an actual teammate to the requested row, creating a new empty row if no saved slot is free.
    function addTeammate(rowId: string, player: PlayerSeason) {
        let nextWorkspace = workspace;
        if (!workspace.rows.some((row) => row.rowId === rowId)) nextWorkspace = appendTeamLabRow(workspace, rowId);
        nextWorkspace = setTeamLabRosterPlayer(nextWorkspace, rowId, player.playerId);
        nextWorkspace = ensureTrailingBlankRow(nextWorkspace);
        saveRoster(nextWorkspace, { ...rosterNames, [player.playerId]: player.name });
    }

    // Remove saved membership immediately while retaining any candidate already aligned to that row.
    function removeTeammate(row: TeamLabRow) {
        const nextWorkspace = setTeamLabRosterPlayer(workspace, row.rowId, null);
        saveRoster(nextWorkspace, rosterNames);
    }

    // Candidate selection changes only temporary row state and therefore never writes the saved roster key.
    function addCandidate(rowId: string, player: PlayerSeason) {
        let nextWorkspace = workspace;
        if (!workspace.rows.some((row) => row.rowId === rowId)) nextWorkspace = appendTeamLabRow(workspace, rowId);
        nextWorkspace = setTeamLabCandidate(nextWorkspace, rowId, player.playerId);
        setWorkspace(ensureTrailingBlankRow(nextWorkspace));
        setSearchTarget(null);
    }

    // Keep the existing saved roster read-only after a swap starts previewing proposed membership.
    function handleSearchSelect(player: PlayerSeason) {
        if (!searchTarget) return;
        if (searchTarget.side === 'team') addTeammate(searchTarget.rowId, player);
        else addCandidate(searchTarget.rowId, player);
    }

    // Apply stores the complete left-side lineup, clears every candidate, and resets swap ownership.
    function applyPreview() {
        const applied = applyTeamLabPreview(workspace);
        const nextNames = Object.fromEntries(
            applied.rosterPlayerIds.map((playerId) => [
                playerId,
                playerById.get(playerId)?.name ?? rosterNames[playerId] ?? playerId
            ])
        );
        saveRoster(applied.state, nextNames);
    }

    const unavailableStorage = storageStatus === 'unavailable';
    const loading = !hydrated || playersQuery.isPending;

    return (
        <div className='grid gap-6'>
            <header className='flex flex-col gap-2 border-b border-border pb-5 md:flex-row md:items-end md:justify-between'>
                <div>
                    <h1 className='text-2xl font-semibold tracking-tight md:text-3xl'>Team lab</h1>
                    <p className='mb-0 mt-1 max-w-2xl text-sm text-muted-foreground'>
                        See how your category build changes as you try players.
                    </p>
                </div>
                <p className='mb-0 text-sm text-muted-foreground'>2025–26 per-game CSV · players with 20+ games</p>
            </header>

            {storageMessage ? (
                <p role='status' className='mb-0 rounded-lg border border-border bg-muted px-4 py-3 text-sm'>
                    {storageMessage}
                </p>
            ) : null}

            <section
                aria-labelledby='strength-heading'
                className='min-w-0 rounded-xl border border-border bg-card p-4 md:p-6'
            >
                <div className='flex flex-wrap items-start justify-between gap-4'>
                    <div>
                        <h2 id='strength-heading' className='mb-1 text-lg font-semibold'>
                            Category strength
                        </h2>
                        <p className='mb-0 text-sm text-muted-foreground'>
                            Unweighted player z-scores ·{' '}
                            {strengthMode === 'average' ? 'average per player' : 'combined total'}
                        </p>
                    </div>
                    <div
                        role='group'
                        aria-label='Strength calculation'
                        className='inline-grid grid-cols-2 items-center gap-1 rounded-lg border border-border p-1'
                    >
                        <ModeButton active={strengthMode === 'average'} onClick={() => setStrengthMode('average')}>
                            Average
                        </ModeButton>
                        <ModeButton active={strengthMode === 'total'} onClick={() => setStrengthMode('total')}>
                            Total
                        </ModeButton>
                    </div>
                </div>

                {loading ? (
                    <p role='status' className='mb-0 mt-6 text-sm text-muted-foreground'>
                        Loading team data…
                    </p>
                ) : playersQuery.isError ? (
                    <div className='mt-6 flex flex-wrap items-center justify-between gap-3'>
                        <p role='alert' className='mb-0 text-sm text-destructive'>
                            Could not load the player data.
                        </p>
                        <Button type='button' variant='outline' onClick={() => void playersQuery.refetch()}>
                            Retry
                        </Button>
                    </div>
                ) : (
                    <>
                        {currentStrength.status === 'empty' && proposedStrength.status === 'empty' ? (
                            <p className='mb-0 mt-5 rounded-lg bg-muted px-4 py-5 text-sm text-muted-foreground'>
                                Add players to see your team strengths.
                            </p>
                        ) : currentStrength.status === 'unavailable' || proposedStrength.status === 'unavailable' ? (
                            <p
                                role='status'
                                className='mb-0 mt-5 rounded-lg bg-muted px-4 py-5 text-sm text-muted-foreground'
                            >
                                Complete team scores are unavailable until every selected player has data for all
                                categories.
                            </p>
                        ) : (
                            <>
                                <TeamStrengthChart
                                    categories={categories}
                                    current={
                                        currentStrength.status === 'ready' ? currentStrength.strength : zeroStrength()
                                    }
                                    proposed={
                                        proposedStrength.status === 'ready' ? proposedStrength.strength : zeroStrength()
                                    }
                                    stances={profile?.stances ?? {}}
                                    savedCount={savedIds.length}
                                    previewCount={proposedIds.length}
                                    mode={strengthMode}
                                />
                                <StrengthSummary
                                    categories={categories}
                                    current={
                                        currentStrength.status === 'ready' ? currentStrength.strength : zeroStrength()
                                    }
                                    proposed={
                                        proposedStrength.status === 'ready' ? proposedStrength.strength : zeroStrength()
                                    }
                                />
                                {proposedStrength.status === 'ready' ? (
                                    <RawStats stats={proposedStrength.raw} />
                                ) : (
                                    <p className='mb-0 mt-3 border-t border-border pt-3 text-sm text-muted-foreground'>
                                        Preview lineup has no players.
                                    </p>
                                )}
                            </>
                        )}
                    </>
                )}
            </section>

            <section aria-label='Roster comparison' className='min-w-0'>
                <div className='mb-3 flex flex-wrap items-center justify-between gap-3'>
                    <div>
                        <h2 className='mb-0 text-lg font-semibold'>Lineup</h2>
                        <p className='mb-0 text-sm text-muted-foreground'>
                            {storageStatus === 'saved' ? 'Saved on this device' : 'Changes save on this device'}
                        </p>
                    </div>
                    <div className='flex flex-wrap gap-2'>
                        <Button
                            type='button'
                            variant='secondary'
                            disabled={candidates.length === 0 && workspace.bulkControlledRowIds === null}
                            onClick={() => setWorkspace(toggleTeamLabBulkSwap(workspace))}
                        >
                            {workspace.bulkControlledRowIds === null
                                ? 'Preview all candidates'
                                : 'Restore bulk changes'}
                        </Button>
                        {previewActive ? (
                            <>
                                <Button
                                    type='button'
                                    variant='outline'
                                    onClick={() => setWorkspace(resetTeamLabPreview(workspace))}
                                >
                                    Reset preview
                                </Button>
                                <Button type='button' onClick={applyPreview}>
                                    Apply lineup
                                </Button>
                            </>
                        ) : null}
                    </div>
                </div>

                <div
                    className='mb-3 rounded-lg border border-border bg-muted/70 p-1 md:hidden'
                    role='group'
                    aria-label='Choose roster list'
                >
                    <div className='grid grid-cols-2 gap-1'>
                        <ModeButton active={mobileSide === 'team'} onClick={() => setMobileSide('team')}>
                            Team ({savedIds.length})
                        </ModeButton>
                        <ModeButton active={mobileSide === 'candidates'} onClick={() => setMobileSide('candidates')}>
                            Candidates ({candidates.length})
                        </ModeButton>
                    </div>
                </div>

                <div className='overflow-hidden rounded-xl border border-border bg-card'>
                    <div className='hidden grid-cols-[minmax(0,1fr)_3.5rem_minmax(0,1fr)] border-b border-border bg-muted/70 px-4 py-3 text-sm font-medium md:grid'>
                        <span>
                            Team lineup <span className='font-normal text-muted-foreground'>({savedIds.length})</span>
                        </span>
                        <span className='sr-only'>Swap each row</span>
                        <span>
                            Candidates <span className='font-normal text-muted-foreground'>({candidates.length})</span>
                        </span>
                    </div>
                    {workspace.rows.map((row, index) => (
                        <RosterComparisonRow
                            key={row.rowId}
                            row={row}
                            workspace={workspace}
                            index={index}
                            mobileSide={mobileSide}
                            isDesktop={isDesktop}
                            playerById={playerById}
                            rosterNames={rosterNames}
                            previewActive={previewActive}
                            onSearch={(side) => setSearchTarget({ side, rowId: row.rowId })}
                            onRemoveTeam={() => removeTeammate(row)}
                            onRemoveCandidate={() => setWorkspace(setTeamLabCandidate(workspace, row.rowId, null))}
                            onSwap={() => setWorkspace(swapTeamLabRow(workspace, row.rowId))}
                        />
                    ))}
                </div>
                <p className='mb-0 mt-3 text-xs text-muted-foreground'>
                    Search includes historical CSV players with at least 20 games. Positions and roster size are
                    unrestricted.
                    {unavailableStorage ? ' Changes will not persist after this visit.' : ''}
                </p>
            </section>

            <PlayerSearchDrawer
                open={searchTarget !== null}
                target={searchTarget}
                isDesktop={isDesktop}
                players={playersQuery.data ?? []}
                loading={playersQuery.isPending}
                error={playersQuery.isError}
                selectedIds={
                    new Set(
                        workspace.rows
                            .flatMap((row) => [row.rosterPlayerId, row.candidatePlayerId])
                            .filter((id): id is string => id !== null)
                    )
                }
                onClose={() => setSearchTarget(null)}
                onRetry={() => void playersQuery.refetch()}
                onSelect={handleSearchSelect}
            />
        </div>
    );
}

/** Show each player's aligned counterpart and keep manual saved-roster edits separate from previews. */
function RosterComparisonRow({
    row,
    workspace,
    index,
    mobileSide,
    isDesktop,
    playerById,
    rosterNames,
    previewActive,
    onSearch,
    onRemoveTeam,
    onRemoveCandidate,
    onSwap
}: {
    row: TeamLabRow;
    workspace: TeamLabState;
    index: number;
    mobileSide: Side;
    isDesktop: boolean;
    playerById: Map<string, PlayerSeason>;
    rosterNames: Record<string, string>;
    previewActive: boolean;
    onSearch: (side: Side) => void;
    onRemoveTeam: () => void;
    onRemoveCandidate: () => void;
    onSwap: () => void;
}) {
    // Resolve both visual sides from stable identities so a swap never changes player ownership labels.
    const displayed = displayedTeamLabPlayerIds(workspace, row);
    const canSwap = row.rosterPlayerId !== null || row.candidatePlayerId !== null;
    const mobileSlotPlacement = canSwap ? 'col-start-1' : 'col-span-2';

    return (
        <div className='grid h-32 min-h-32 grid-cols-[minmax(0,1fr)_2.75rem] gap-x-2 border-b border-border px-3 py-2 last:border-b-0 md:h-auto md:min-h-[5.5rem] md:grid-cols-[minmax(0,1fr)_3.5rem_minmax(0,1fr)] md:gap-x-0 md:px-4'>
            <div
                className={`${mobileSide === 'team' ? 'min-w-0' : 'hidden min-w-0 md:block'} ${mobileSlotPlacement} row-start-1 md:col-start-1 md:col-span-1`}
            >
                <PlayerSlot
                    playerId={displayed.left}
                    owner={
                        row.rosterPlayerId === displayed.left && displayed.left !== null
                            ? 'Your team'
                            : displayed.left
                              ? 'Candidate'
                              : null
                    }
                    playerById={playerById}
                    rosterNames={rosterNames}
                    emptyLabel='Add teammate'
                    removable={
                        (row.candidatePlayerId !== null && displayed.left === row.candidatePlayerId) ||
                        (row.rosterPlayerId !== null && !previewActive && displayed.left === row.rosterPlayerId)
                    }
                    addable={!previewActive}
                    onAdd={() => onSearch('team')}
                    onRemove={() => (displayed.left === row.candidatePlayerId ? onRemoveCandidate() : onRemoveTeam())}
                />
                {!isDesktop ? (
                    <p className='mb-0 mt-1 h-5 truncate pl-1 text-xs leading-5 text-muted-foreground'>
                        {displayed.right
                            ? `Compared with ${playerById.get(displayed.right)?.name ?? rosterNames[displayed.right] ?? displayed.right}`
                            : 'No counterpart yet'}
                    </p>
                ) : null}
            </div>

            {canSwap ? (
                <div className='col-start-2 row-start-1 flex items-start justify-end pt-4 md:col-start-2 md:items-center md:justify-center md:py-0'>
                    <Button
                        type='button'
                        size='icon'
                        variant='outline'
                        aria-label={`Swap row ${index + 1}`}
                        title='Swap this row'
                        onClick={onSwap}
                    >
                        <ArrowLeftRight aria-hidden='true' />
                    </Button>
                </div>
            ) : (
                <div aria-hidden='true' className='hidden md:col-start-2 md:row-start-1 md:flex' />
            )}

            <div
                className={`${mobileSide === 'candidates' ? 'min-w-0' : 'hidden min-w-0 md:block'} ${mobileSlotPlacement} row-start-1 md:col-start-3 md:col-span-1`}
            >
                <PlayerSlot
                    playerId={displayed.right}
                    owner={
                        row.candidatePlayerId === displayed.right && displayed.right !== null
                            ? 'Candidate'
                            : displayed.right
                              ? 'Your team'
                              : null
                    }
                    playerById={playerById}
                    rosterNames={rosterNames}
                    emptyLabel='Find candidate'
                    removable={row.candidatePlayerId !== null && displayed.right === row.candidatePlayerId}
                    addable
                    onAdd={() => onSearch('candidates')}
                    onRemove={onRemoveCandidate}
                />
                {!isDesktop ? (
                    <p className='mb-0 mt-1 h-5 truncate pl-1 text-xs leading-5 text-muted-foreground'>
                        {displayed.left
                            ? `Compared with ${playerById.get(displayed.left)?.name ?? rosterNames[displayed.left] ?? displayed.left}`
                            : 'No counterpart yet'}
                    </p>
                ) : null}
            </div>
        </div>
    );
}

/** Render a player, an unresolved saved snapshot, or a full-width search action for one aligned slot. */
function PlayerSlot({
    playerId,
    owner,
    playerById,
    rosterNames,
    emptyLabel,
    removable,
    addable,
    onAdd,
    onRemove
}: {
    playerId: string | null;
    owner: string | null;
    playerById: Map<string, PlayerSeason>;
    rosterNames: Record<string, string>;
    emptyLabel: string;
    removable: boolean;
    addable: boolean;
    onAdd: () => void;
    onRemove: () => void;
}) {
    // Keep empty rows directly actionable and give unavailable saved records a visible recovery path.
    if (playerId === null) {
        if (!addable)
            return (
                <div className='flex h-20 items-center border-b border-border/70 px-3 text-sm text-muted-foreground'>
                    Empty in preview
                </div>
            );
        return (
            <Button
                type='button'
                variant='outline'
                className='h-20 w-full justify-start border-border bg-card px-3 text-left text-foreground hover:border-primary/40 hover:bg-muted'
                onClick={onAdd}
            >
                <Plus aria-hidden='true' /> {emptyLabel}
            </Button>
        );
    }
    const player = playerById.get(playerId);
    const name = player?.name ?? rosterNames[playerId] ?? playerId;

    return (
        <div className='flex h-20 min-w-0 items-center justify-between gap-2 border-b border-border/70 px-3 py-2'>
            <div className='min-w-0 flex-1'>
                <p className='mb-0 truncate text-sm font-semibold leading-5 text-foreground'>{name}</p>
                <p className='mb-0 truncate text-xs leading-4 text-muted-foreground'>
                    {player ? `${player.team} · ${player.pos}` : 'Unavailable in this season'}
                </p>
                {owner ? (
                    <span className='mt-1 inline-flex h-6 w-28 items-center justify-center rounded-md border border-border bg-muted px-3 text-center text-xs font-medium text-foreground'>
                        {owner}
                    </span>
                ) : null}
            </div>
            <div className='grid size-11 shrink-0 place-items-center'>
                {removable ? (
                    <Button type='button' size='icon' variant='ghost' aria-label={`Remove ${name}`} onClick={onRemove}>
                        <X aria-hidden='true' />
                    </Button>
                ) : null}
            </div>
        </div>
    );
}

/** Search the fixed historical player catalog and prevent any selected identity from being added twice. */
function PlayerSearchDrawer({
    open,
    target,
    isDesktop,
    players,
    loading,
    error,
    selectedIds,
    onClose,
    onRetry,
    onSelect
}: {
    open: boolean;
    target: SearchTarget;
    isDesktop: boolean;
    players: PlayerSeason[];
    loading: boolean;
    error: boolean;
    selectedIds: Set<string>;
    onClose: () => void;
    onRetry: () => void;
    onSelect: (player: PlayerSeason) => void;
}) {
    const [query, setQuery] = useState('');
    // Search locally over the loaded catalog so selection is immediate and no external data source is implied.
    const filtered = useMemo(() => {
        const normalized = query.trim().toLocaleLowerCase();
        const available = players.filter((player) => !selectedIds.has(player.playerId));
        const result = normalized
            ? available.filter((player) =>
                  `${player.name} ${player.team} ${player.pos}`.toLocaleLowerCase().includes(normalized)
              )
            : available;
        return result.slice(0, 40);
    }, [players, query, selectedIds]);

    // Clear the previous search each time the drawer opens for another row or ownership side.
    useEffect(() => {
        if (open) setQuery('');
    }, [open, target?.rowId, target?.side]);

    return (
        <Drawer
            open={open}
            onOpenChange={(nextOpen) => !nextOpen && onClose()}
            direction={isDesktop ? 'right' : 'bottom'}
        >
            <DrawerContent aria-labelledby='team-player-search-title' aria-describedby='team-player-search-description'>
                <div className='grid shrink-0 gap-2 border-b border-border px-5 py-4'>
                    <DrawerTitle id='team-player-search-title'>
                        {target?.side === 'team' ? 'Add teammate' : 'Find candidate'}
                    </DrawerTitle>
                    <DrawerDescription id='team-player-search-description'>
                        Search the historical CSV player pool with at least 20 games by name, team, or position.
                    </DrawerDescription>
                    <div className='relative'>
                        <Search aria-hidden='true' className='absolute top-3.5 left-3 size-4 text-muted-foreground' />
                        <Input
                            autoFocus
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder='Search players'
                            className='pl-9'
                            aria-label='Search players'
                        />
                    </div>
                </div>
                <div className='min-h-0 flex-1 overflow-y-auto px-5 py-3'>
                    {loading ? (
                        <p role='status' className='text-sm text-muted-foreground'>
                            Loading players…
                        </p>
                    ) : null}
                    {error ? (
                        <div className='grid justify-items-start gap-3'>
                            <p role='alert' className='mb-0 text-sm text-destructive'>
                                Could not load the player pool.
                            </p>
                            <Button type='button' variant='outline' onClick={onRetry}>
                                Retry
                            </Button>
                        </div>
                    ) : null}
                    {!loading && !error && filtered.length === 0 ? (
                        <p className='mb-0 text-sm text-muted-foreground'>No available players match “{query}”.</p>
                    ) : null}
                    <ul className='m-0 flex list-none flex-col gap-2 p-0'>
                        {!loading && !error
                            ? filtered.map((player) => (
                                  <li
                                      key={player.playerId}
                                      className='overflow-hidden rounded-lg border border-border bg-card'
                                  >
                                      <button
                                          type='button'
                                          className='flex min-h-16 w-full items-center justify-between gap-3 rounded-md border border-border bg-card px-3 text-left text-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50'
                                          onClick={() => onSelect(player)}
                                      >
                                          <span className='min-w-0'>
                                              <span className='block truncate font-semibold text-foreground'>
                                                  {player.name}
                                              </span>
                                              <span className='block truncate text-xs text-muted-foreground'>
                                                  {player.team} · {player.pos}
                                              </span>
                                          </span>
                                          <Plus aria-hidden='true' className='size-4 shrink-0 text-primary' />
                                      </button>
                                  </li>
                              ))
                            : null}
                    </ul>
                </div>
            </DrawerContent>
        </Drawer>
    );
}

/** Overlay the lighter proposed signed bar on saved-team strength on one shared track per category. */
function TeamStrengthChart({
    categories,
    current,
    proposed,
    stances,
    savedCount,
    previewCount,
    mode
}: {
    categories: CatKey[];
    current: Record<CatKey, number>;
    proposed: Record<CatKey, number>;
    stances: Partial<Record<CatKey, CatStance>>;
    savedCount: number;
    previewCount: number;
    mode: 'average' | 'total';
}) {
    // Expand the scale only when a value requires it; row swaps never independently rescale either series.
    const largest = Math.max(
        0,
        ...categories.flatMap((category) => [Math.abs(current[category]), Math.abs(proposed[category])])
    );
    const [scale, setScale] = useState(3);

    // Hold the same axis during row swaps and expand it only when a newly staged lineup exceeds the existing scale.
    useEffect(() => {
        setScale((previous) => Math.max(previous, 3, Math.ceil(largest)));
    }, [largest]);

    return (
        <div className='mt-4'>
            <div
                role='group'
                aria-label='Chart legend'
                className='mb-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground'
            >
                <span className='inline-flex items-center gap-2'>
                    <span aria-hidden='true' className='size-3 rounded-sm bg-foreground' />
                    Saved team ({savedCount}) · solid fill
                </span>
                <span className='inline-flex items-center gap-2'>
                    <span aria-hidden='true' className='size-3 rounded-sm bg-foreground opacity-50' />
                    Preview lineup ({previewCount}) · light overlay
                </span>
            </div>
            <div role='table' aria-label={`${mode === 'average' ? 'Average' : 'Total'} team category strength`}>
                <div
                    role='row'
                    className='grid grid-cols-[3.25rem_minmax(0,1fr)] gap-3 border-b border-border pb-2 text-xs font-medium text-muted-foreground md:grid-cols-[4rem_minmax(0,1fr)]'
                >
                    <span role='columnheader'>Cat</span>
                    <span role='columnheader'>Strength comparison</span>
                </div>
                {categories.map((category) => (
                    <div
                        role='row'
                        key={category}
                        className='grid grid-cols-[3.25rem_minmax(0,1fr)] items-center gap-3 border-b border-border/70 py-2.5 last:border-b-0 md:grid-cols-[4rem_minmax(0,1fr)]'
                    >
                        <span role='rowheader' className='flex flex-col text-sm font-medium leading-4'>
                            <span>{CAT_LABELS[category]}</span>
                            {stances[category] === 'need' || stances[category] === 'punt' ? (
                                <span className='text-[10px] font-medium uppercase tracking-wide text-muted-foreground'>
                                    {stances[category]}
                                </span>
                            ) : null}
                        </span>
                        <div role='cell' className='min-w-0'>
                            <StrengthBar saved={current[category]} preview={proposed[category]} scale={scale} />
                        </div>
                    </div>
                ))}
            </div>
            <p className='mb-0 mt-2 text-xs text-muted-foreground'>Shared zero line · scale ±{scale.toFixed(0)} z</p>
        </div>
    );
}

/** Overlay preview as a translucent signed fill on saved strength in one shared track plus exact values. */
function StrengthBar({ saved, preview, scale }: { saved: number; preview: number; scale: number }) {
    // Place preview over saved at the same center-zero geometry and soften its fill to reveal both extents.
    const savedGeometry = strengthGeometry(saved, scale);
    const previewGeometry = strengthGeometry(preview, scale);
    const accessibleDescription = `Saved team ${formatSignedValue(saved)} z; preview lineup ${formatSignedValue(preview)} z; shared scale plus or minus ${scale.toFixed(0)} z`;
    return (
        <div role='group' className='grid min-w-0 gap-2' aria-label={accessibleDescription}>
            <span className='relative h-8 rounded-sm bg-muted' aria-hidden='true'>
                <span className='absolute inset-y-0 left-1/2 z-30 w-px bg-foreground/40' />
                {savedGeometry.width > 0 ? (
                    <span
                        className={`absolute inset-y-1 z-10 ${savedGeometry.positive ? 'rounded-r-sm' : 'rounded-l-sm'}`}
                        style={{ ...savedGeometry.style, backgroundColor: savedGeometry.color }}
                    />
                ) : null}
                {previewGeometry.width > 0 ? (
                    <span
                        className={`absolute inset-y-1 z-20 ${previewGeometry.positive ? 'rounded-r-sm' : 'rounded-l-sm'}`}
                        style={{ ...previewGeometry.style, backgroundColor: previewGeometry.color, opacity: 0.45 }}
                    />
                ) : null}
            </span>
            <div className='flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs tabular-nums'>
                <span className='text-muted-foreground'>
                    Saved{' '}
                    <strong className='font-semibold' style={{ color: savedGeometry.color }}>
                        {formatSignedValue(saved)}
                    </strong>
                </span>
                <span className='text-muted-foreground'>
                    Preview{' '}
                    <strong className='font-semibold' style={{ color: previewGeometry.color }}>
                        {formatSignedValue(preview)}
                    </strong>
                </span>
            </div>
        </div>
    );
}

/** Convert a signed score into bounded track geometry and sign-aware foreground and border colors. */
function strengthGeometry(value: number, scale: number) {
    // Keep zero at the track center and limit each signed half to fifty percent of the available width.
    const width = Math.min(50, (Math.abs(value) / scale) * 50);
    const positive = value >= 0;
    const sign = positive ? 'good' : 'bad';
    return {
        width,
        positive,
        color: `var(--strength-${sign})`,
        style: positive ? { left: '50%', width: `${width}%` } : { right: '50%', width: `${width}%` }
    };
}

/** Identify the largest positive and negative category changes with deterministic canonical tie order. */
function StrengthSummary({
    categories,
    current,
    proposed
}: {
    categories: CatKey[];
    current: Record<CatKey, number>;
    proposed: Record<CatKey, number>;
}) {
    // Canonical category order breaks equal-delta ties and keeps summary copy stable between renders.
    const changes = CAT_KEYS.filter((category) => categories.includes(category)).map((category) => ({
        category,
        delta: proposed[category] - current[category]
    }));
    const gains = changes.filter((entry) => entry.delta > 0).sort((a, b) => b.delta - a.delta);
    const losses = changes.filter((entry) => entry.delta < 0).sort((a, b) => a.delta - b.delta);

    return (
        <div className='mt-4 border-t border-border pt-3' aria-live='polite' aria-atomic='true'>
            <p className='mb-1 text-sm font-medium'>Biggest category shifts</p>
            <p className='mb-0 text-sm text-muted-foreground'>
                {gains[0] ? (
                    <span className='text-strength-good'>
                        {CAT_LABELS[gains[0].category]} {formatSignedValue(gains[0].delta)}
                    </span>
                ) : (
                    'No category gains'
                )}
                <span aria-hidden='true'> · </span>
                {losses[0] ? (
                    <span className='text-strength-bad'>
                        {CAT_LABELS[losses[0].category]} {formatSignedValue(losses[0].delta)}
                    </span>
                ) : (
                    'No category losses'
                )}
            </p>
        </div>
    );
}

/** Present combined raw per-game output with FG% and FT% calculated from team makes over attempts. */
function RawStats({ stats }: { stats: TeamRawTotals }) {
    // Keep rate denominators visible beside each combined percentage so users can interpret low-volume values.
    const values: [string, string][] = [
        ['PTS', stats.pts.toFixed(1)],
        ['REB', stats.trb.toFixed(1)],
        ['AST', stats.ast.toFixed(1)],
        ['STL', stats.stl.toFixed(1)],
        ['BLK', stats.blk.toFixed(1)],
        ['3PM', stats.fg3.toFixed(1)],
        [
            'FG%',
            stats.fgPct === null ? 'No attempts' : `${(stats.fgPct * 100).toFixed(1)}% (${stats.fga.toFixed(1)} FGA)`
        ],
        [
            'FT%',
            stats.ftPct === null ? 'No attempts' : `${(stats.ftPct * 100).toFixed(1)}% (${stats.fta.toFixed(1)} FTA)`
        ],
        ['TOV', stats.tov.toFixed(1)]
    ];

    return (
        <details className='mt-4 border-t border-border pt-3'>
            <summary className='min-h-11 cursor-pointer py-2 text-sm font-medium'>Combined per-game box score</summary>
            <dl className='mb-0 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 md:grid-cols-5'>
                {values.map(([label, value]) => (
                    <div key={label} className='flex justify-between gap-2 border-b border-border/70 py-1 text-sm'>
                        <dt className='text-muted-foreground'>{label}</dt>
                        <dd className='mb-0 tabular-nums'>{value}</dd>
                    </div>
                ))}
            </dl>
        </details>
    );
}

/** Keep the two chart calculation choices large enough for touch while exposing selection to assistive technology. */
function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
    // Match the board selector's established secondary active and ghost inactive button treatment.
    return (
        <Button
            type='button'
            variant={active ? 'secondary' : 'ghost'}
            aria-pressed={active}
            onClick={onClick}
            className='min-h-10 w-full'
        >
            {children}
        </Button>
    );
}
