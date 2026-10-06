import { playerPreviewMarks } from '@/lib/board-players';
import { Button } from '@/components/ui/button';
import type { PlayerTableGroup } from '@/components/draft/player-table';
import { whyCopy, type DraftProfile, type RankedPlayer } from '@draft-duck/core';
import { ArrowUpRight } from 'lucide-react';

export function PlayerList({
    groups,
    profile,
    yourOverallPicks,
    disabled,
    onPlayerSelect
}: {
    groups: PlayerTableGroup[];
    profile: DraftProfile;
    yourOverallPicks: ReadonlySet<number>;
    disabled: boolean;
    onPlayerSelect: (player: RankedPlayer, trigger: HTMLButtonElement) => void;
}) {
    return (
        <div className='overflow-hidden rounded-lg border border-border bg-card'>
            {groups.map((group) => (
                <div key={group.id}>
                    {group.label ? (
                        <h2 className='mb-0 border-b border-border bg-muted px-4 py-3 text-base'>{group.label}</h2>
                    ) : null}
                    <ol className='divide-y divide-border'>
                        {group.players.map((player) => {
                            const yourPick = yourOverallPicks.has(player.rank);
                            const marks = playerPreviewMarks(player, profile);
                            return (
                                <li key={player.playerId}>
                                    <Button
                                        type='button'
                                        variant='ghost'
                                        disabled={disabled}
                                        aria-haspopup='dialog'
                                        onClick={(event) => onPlayerSelect(player, event.currentTarget)}
                                        className={`h-auto min-h-16 w-full items-center justify-start gap-2 rounded-none px-3 py-3 text-left whitespace-normal ${yourPick ? 'bg-secondary' : ''}`}
                                    >
                                        <span className='w-6 shrink-0 text-right tabular-nums text-muted-foreground'>
                                            <span className='sr-only'>Rank </span>
                                            {player.rank}
                                        </span>
                                        <span className='grid min-w-0 flex-1 gap-0.5'>
                                            <span className='flex items-start justify-between gap-2'>
                                                <span className='min-w-0 break-words font-semibold'>{player.name}</span>
                                                <ArrowUpRight
                                                    aria-hidden='true'
                                                    className='mt-1 size-4 text-muted-foreground'
                                                />
                                            </span>
                                            <span className='text-sm font-normal text-muted-foreground'>
                                                {player.team} · {player.pos}
                                                {yourPick ? ' · Your pick' : ''}
                                                {yourPick ? (
                                                    <span className='sr-only'>
                                                        , Round {Math.ceil(player.rank / profile.leagueSize)}
                                                    </span>
                                                ) : null}
                                                {' · '}
                                                {marks.length ? marks.join(' · ') : whyCopy(player, profile)}
                                            </span>
                                        </span>
                                    </Button>
                                </li>
                            );
                        })}
                    </ol>
                </div>
            ))}
        </div>
    );
}
