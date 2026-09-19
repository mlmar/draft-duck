import { formatCatStat } from '@/lib/format-stats';
import { CAT_LABELS, type CatKey, type RankedPlayer } from '@waiver-warrior/core';

type PlayerTableProps = {
    players: RankedPlayer[];
    enabledCats: CatKey[];
    emptyLabel: string;
};

// Rank and name stay put while cat columns scroll. Team/pos are secondary meta.

export function PlayerTable({ players, enabledCats, emptyLabel }: PlayerTableProps) {
    if (players.length === 0) {
        return <p className='mb-0 text-muted-foreground'>{emptyLabel}</p>;
    }

    return (
        <div className='overflow-x-auto'>
            <table className='w-full min-w-[56rem] border-collapse text-left'>
                <thead>
                    <tr className='border-b border-border text-muted-foreground'>
                        <th className='sticky left-0 z-10 w-16 min-w-16 bg-background py-2 pr-3 font-medium'>Rank</th>
                        <th className='sticky left-16 z-10 min-w-40 bg-background px-3 py-2 font-medium'>Name</th>
                        <th className='px-3 py-2 font-medium'>
                            <span className='text-sm font-normal'>Team</span>
                        </th>
                        <th className='px-3 py-2 font-medium'>
                            <span className='text-sm font-normal'>Pos</span>
                        </th>
                        {enabledCats.map((cat) => (
                            <th key={cat} className='px-3 py-2 text-right font-medium'>
                                {CAT_LABELS[cat]}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {players.map((player) => (
                        <tr key={player.playerId} className='border-b border-border/80'>
                            <td className='sticky left-0 z-10 w-16 min-w-16 bg-background py-2 pr-3 tabular-nums'>
                                {player.rank}
                            </td>
                            <td className='sticky left-16 z-10 bg-background px-3 py-2'>
                                <span className='font-medium'>{player.name}</span>
                                <span className='mt-0.5 block text-sm text-muted-foreground'>
                                    {player.composite.toFixed(2)}
                                </span>
                            </td>
                            <td className='px-3 py-2 text-sm text-muted-foreground'>{player.team}</td>
                            <td className='px-3 py-2 text-sm text-muted-foreground'>{player.pos}</td>
                            {enabledCats.map((cat) => (
                                <td key={cat} className='px-3 py-2 text-right tabular-nums'>
                                    {formatCatStat(player, cat)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
