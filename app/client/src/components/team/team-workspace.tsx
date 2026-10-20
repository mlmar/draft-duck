import {
    CAT_KEYS,
    aggregateTeamStrength,
    appendTeamLabRow,
    applyTeamLabPreview,
    createTeamLabState,
    displayedTeamLabPlayerIds,
    rankTeamLabUniverse,
    resetTeamLabPreview,
    setTeamLabCandidate,
    setTeamLabRosterPlayer,
    swapTeamLabRow,
    toggleTeamLabBulkSwap,
    type PlayerSeason,
    type TeamLabRow,
    type TeamLabState
} from '@draft-duck/core';
import { PlayerSearchDrawer } from '@/components/team/player-search-drawer';
import { TeamRosterPanel } from '@/components/team/team-roster-panel';
import { TeamStrengthPanel } from '@/components/team/team-strength-panel';
import type { TeamLabSearchTarget, TeamLabSide } from '@/components/team/team-lab-ui-types';
import { useTeamRosterStorage } from '@/components/team/use-team-roster-storage';
import { useMediaQuery } from '@/hooks/use-media-query';
import { loadPlayers } from '@/lib/api';
import { useDraftProfileStore } from '@/stores/draft-profile';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

/** Keep page-level data and roster transitions here; focused components own the visible panels. */
export function TeamWorkspace() {
    const profile = useDraftProfileStore((state) => state.profile);
    const rosterStorage = useTeamRosterStorage();
    const rosterNames = rosterStorage.playerNames;
    const [workspace, setWorkspace] = useState<TeamLabState>(() => createTeamLabState([]));
    const [workspaceHydrated, setWorkspaceHydrated] = useState(false);
    const [searchTarget, setSearchTarget] = useState<TeamLabSearchTarget>(null);
    const [strengthMode, setStrengthMode] = useState<'average' | 'total'>('average');
    const isDesktop = useMediaQuery('(min-width: 768px)');

    const playersQuery = useQuery({ queryKey: ['team-lab', 'players'], queryFn: loadPlayers });
    const rankedUniverse = useMemo(
        () => (playersQuery.data ? rankTeamLabUniverse(playersQuery.data) : []),
        [playersQuery.data]
    );
    const playerById = useMemo(
        () => new Map((playersQuery.data ?? []).map((player) => [player.playerId, player])),
        [playersQuery.data]
    );

    useEffect(() => {
        if (!rosterStorage.hydrated || workspaceHydrated) {
            return;
        }
        setWorkspace(createTeamLabState(rosterStorage.playerIds));
        setWorkspaceHydrated(true);
    }, [rosterStorage.hydrated, rosterStorage.playerIds, workspaceHydrated]);

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
    const selectedIds = useMemo(
        () =>
            new Set(
                workspace.rows
                    .flatMap((row) => [row.rosterPlayerId, row.candidatePlayerId])
                    .filter((playerId): playerId is string => playerId !== null)
            ),
        [workspace.rows]
    );

    function saveRoster(nextWorkspace: TeamLabState, nextNames: Record<string, string>) {
        setWorkspace(nextWorkspace);
        const nextIds = nextWorkspace.rows
            .map((row) => row.rosterPlayerId)
            .filter((playerId): playerId is string => playerId !== null);
        const names = Object.fromEntries(Object.entries(nextNames).filter(([playerId]) => nextIds.includes(playerId)));
        rosterStorage.saveRoster(nextIds, names);
    }

    function addTeammate(rowId: string, player: PlayerSeason) {
        let nextWorkspace = workspace;
        if (!workspace.rows.some((row) => row.rowId === rowId)) {
            nextWorkspace = appendTeamLabRow(workspace, rowId);
        }
        nextWorkspace = setTeamLabRosterPlayer(nextWorkspace, rowId, player.playerId);
        nextWorkspace = ensureTrailingBlankRow(nextWorkspace);
        saveRoster(nextWorkspace, { ...rosterNames, [player.playerId]: player.name });
    }

    function removeTeammate(row: TeamLabRow) {
        const nextWorkspace = setTeamLabRosterPlayer(workspace, row.rowId, null);
        saveRoster(nextWorkspace, rosterNames);
    }

    function addCandidate(rowId: string, player: PlayerSeason) {
        let nextWorkspace = workspace;
        if (!workspace.rows.some((row) => row.rowId === rowId)) {
            nextWorkspace = appendTeamLabRow(workspace, rowId);
        }
        nextWorkspace = setTeamLabCandidate(nextWorkspace, rowId, player.playerId);
        setWorkspace(ensureTrailingBlankRow(nextWorkspace));
        setSearchTarget(null);
    }

    function handleSearchSelect(player: PlayerSeason) {
        if (!searchTarget) {
            return;
        }
        if (searchTarget.side === 'team') {
            addTeammate(searchTarget.rowId, player);
        } else {
            addCandidate(searchTarget.rowId, player);
        }
    }

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

    function openSearch(side: TeamLabSide, rowId: string) {
        setSearchTarget({ side, rowId });
    }

    function removeCandidate(row: TeamLabRow) {
        setWorkspace(setTeamLabCandidate(workspace, row.rowId, null));
    }

    function swapRow(rowId: string) {
        setWorkspace(swapTeamLabRow(workspace, rowId));
    }

    function toggleBulkPreview() {
        setWorkspace(toggleTeamLabBulkSwap(workspace));
    }

    function resetPreview() {
        setWorkspace(resetTeamLabPreview(workspace));
    }

    function retryPlayers() {
        void playersQuery.refetch();
    }

    const unavailableStorage = rosterStorage.status === 'unavailable';

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

            {rosterStorage.message ? (
                <p role='status' className='mb-0 rounded-lg border border-border bg-muted px-4 py-3 text-sm'>
                    {rosterStorage.message}
                </p>
            ) : null}

            <TeamStrengthPanel
                categories={categories}
                current={currentStrength}
                proposed={proposedStrength}
                stances={profile?.stances ?? {}}
                savedCount={savedIds.length}
                previewCount={proposedIds.length}
                mode={strengthMode}
                onModeChange={setStrengthMode}
                loading={!workspaceHydrated || playersQuery.isPending}
                error={playersQuery.isError}
                onRetry={retryPlayers}
            />

            {workspaceHydrated ? (
                <TeamRosterPanel
                    workspace={workspace}
                    playerById={playerById}
                    rosterNames={rosterNames}
                    previewActive={previewActive}
                    storageSaved={rosterStorage.status === 'saved'}
                    unavailableStorage={unavailableStorage}
                    onSearch={openSearch}
                    onRemoveTeam={removeTeammate}
                    onRemoveCandidate={removeCandidate}
                    onSwap={swapRow}
                    onBulkSwap={toggleBulkPreview}
                    onResetPreview={resetPreview}
                    onApplyPreview={applyPreview}
                />
            ) : (
                <p role='status' className='mb-0 text-sm text-muted-foreground'>
                    Loading saved lineup…
                </p>
            )}

            <PlayerSearchDrawer
                open={searchTarget !== null}
                target={searchTarget}
                isDesktop={isDesktop}
                players={playersQuery.data ?? []}
                loading={playersQuery.isPending}
                error={playersQuery.isError}
                selectedIds={selectedIds}
                onClose={() => setSearchTarget(null)}
                onRetry={retryPlayers}
                onSelect={handleSearchSelect}
            />
        </div>
    );
}

/** Keep one explicit empty row after each roster selection consumes the current final slot. */
function ensureTrailingBlankRow(state: TeamLabState): TeamLabState {
    const last = state.rows.at(-1);
    if (!last || (last.rosterPlayerId === null && last.candidatePlayerId === null)) {
        return state;
    }

    let suffix = state.rows.length + 1;
    while (state.rows.some((row) => row.rowId === `row-${suffix}`)) {
        suffix += 1;
    }
    return appendTeamLabRow(state, `row-${suffix}`);
}
