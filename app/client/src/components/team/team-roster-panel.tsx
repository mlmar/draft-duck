import { Button } from '@/components/ui/button';
import { TeamLabModeButton } from '@/components/team/team-lab-mode-button';
import type { TeamLabSide } from '@/components/team/team-lab-ui-types';
import { useMediaQuery } from '@/hooks/use-media-query';
import { displayedTeamLabPlayerIds, type PlayerSeason, type TeamLabRow, type TeamLabState } from '@draft-duck/core';
import { ArrowLeftRight, Plus, X } from 'lucide-react';
import { useState } from 'react';

/** Own the responsive lineup presentation while leaving roster and preview transitions to the page. */
export function TeamRosterPanel({
    workspace,
    playerById,
    rosterNames,
    previewActive,
    storageSaved,
    unavailableStorage,
    onSearch,
    onRemoveTeam,
    onRemoveCandidate,
    onSwap,
    onBulkSwap,
    onResetPreview,
    onApplyPreview
}: {
    workspace: TeamLabState;
    playerById: Map<string, PlayerSeason>;
    rosterNames: Record<string, string>;
    previewActive: boolean;
    storageSaved: boolean;
    unavailableStorage: boolean;
    onSearch: (side: TeamLabSide, rowId: string) => void;
    onRemoveTeam: (row: TeamLabRow) => void;
    onRemoveCandidate: (row: TeamLabRow) => void;
    onSwap: (rowId: string) => void;
    onBulkSwap: () => void;
    onResetPreview: () => void;
    onApplyPreview: () => void;
}) {
    const [mobileSide, setMobileSide] = useState<TeamLabSide>('team');
    const isDesktop = useMediaQuery('(min-width: 768px)');
    const savedCount = workspace.rows.filter((row) => row.rosterPlayerId !== null).length;
    const candidateCount = workspace.rows.filter((row) => row.candidatePlayerId !== null).length;

    return (
        <section aria-label='Roster comparison' className='min-w-0'>
            <div className='mb-3 flex flex-wrap items-center justify-between gap-3'>
                <div>
                    <h2 className='mb-0 text-lg font-semibold'>Lineup</h2>
                    <p className='mb-0 text-sm text-muted-foreground'>
                        {storageSaved ? 'Saved on this device' : 'Changes save on this device'}
                    </p>
                </div>
                <div className='flex flex-wrap gap-2'>
                    <Button
                        type='button'
                        variant='secondary'
                        disabled={candidateCount === 0 && workspace.bulkControlledRowIds === null}
                        onClick={onBulkSwap}
                    >
                        {workspace.bulkControlledRowIds === null ? 'Preview all candidates' : 'Restore bulk changes'}
                    </Button>
                    {previewActive ? (
                        <>
                            <Button type='button' variant='outline' onClick={onResetPreview}>
                                Reset preview
                            </Button>
                            <Button type='button' onClick={onApplyPreview}>
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
                    <TeamLabModeButton active={mobileSide === 'team'} onClick={() => setMobileSide('team')}>
                        Team ({savedCount})
                    </TeamLabModeButton>
                    <TeamLabModeButton active={mobileSide === 'candidates'} onClick={() => setMobileSide('candidates')}>
                        Candidates ({candidateCount})
                    </TeamLabModeButton>
                </div>
            </div>

            <div className='overflow-hidden rounded-xl border border-border bg-card'>
                <div className='hidden grid-cols-[minmax(0,1fr)_3.5rem_minmax(0,1fr)] border-b border-border bg-muted/70 px-4 py-3 text-sm font-medium md:grid'>
                    <span>
                        Team lineup <span className='font-normal text-muted-foreground'>({savedCount})</span>
                    </span>
                    <span className='sr-only'>Swap each row</span>
                    <span>
                        Candidates <span className='font-normal text-muted-foreground'>({candidateCount})</span>
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
                        onSearch={(side) => onSearch(side, row.rowId)}
                        onRemoveTeam={() => onRemoveTeam(row)}
                        onRemoveCandidate={() => onRemoveCandidate(row)}
                        onSwap={() => onSwap(row.rowId)}
                    />
                ))}
            </div>
            <p className='mb-0 mt-3 text-xs text-muted-foreground'>
                Search includes historical CSV players with at least 20 games. Positions and roster size are
                unrestricted.
                {unavailableStorage ? ' Changes will not persist after this visit.' : ''}
            </p>
        </section>
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
    mobileSide: TeamLabSide;
    isDesktop: boolean;
    playerById: Map<string, PlayerSeason>;
    rosterNames: Record<string, string>;
    previewActive: boolean;
    onSearch: (side: TeamLabSide) => void;
    onRemoveTeam: () => void;
    onRemoveCandidate: () => void;
    onSwap: () => void;
}) {
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
                    onRemove={() => {
                        if (displayed.left === row.candidatePlayerId) {
                            onRemoveCandidate();
                        } else {
                            onRemoveTeam();
                        }
                    }}
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
    if (playerId === null) {
        if (!addable) {
            return (
                <div className='flex h-20 items-center border-b border-border/70 px-3 text-sm text-muted-foreground'>
                    Empty in preview
                </div>
            );
        }
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
