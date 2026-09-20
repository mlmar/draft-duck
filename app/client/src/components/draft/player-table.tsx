import { formatCatStat } from '@/lib/format-stats';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CAT_LABELS, type CatKey, type RankedPlayer } from '@waiver-warrior/core';

type PlayerTableProps = {
    players: RankedPlayer[];
    enabledCats: CatKey[];
    emptyLabel: string;
};

const stickyRank = 'sticky left-0 z-10 w-16 min-w-16 bg-background';
const stickyName = 'sticky left-16 z-10 min-w-40 bg-background';

// Rank and name stay put while cat columns scroll. Team/pos are secondary meta.

export function PlayerTable({ players, enabledCats, emptyLabel }: PlayerTableProps) {
    if (players.length === 0) {
        return <p className='mb-0 text-muted-foreground'>{emptyLabel}</p>;
    }

    return (
        <Table className='min-w-[56rem]'>
            <TableHeader>
                <TableRow className='text-muted-foreground hover:bg-transparent'>
                    <TableHead className={stickyRank}>Rank</TableHead>
                    <TableHead className={stickyName}>Name</TableHead>
                    <TableHead>
                        <span className='text-sm font-normal'>Team</span>
                    </TableHead>
                    <TableHead>
                        <span className='text-sm font-normal'>Pos</span>
                    </TableHead>
                    {enabledCats.map((cat) => (
                        <TableHead key={cat} className='text-right'>
                            {CAT_LABELS[cat]}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {players.map((player) => (
                    <TableRow key={player.playerId}>
                        <TableCell className={`${stickyRank} tabular-nums`}>{player.rank}</TableCell>
                        <TableCell className={stickyName}>
                            <span className='font-medium'>{player.name}</span>
                            <span className='mt-0.5 block text-sm text-muted-foreground'>
                                {player.composite.toFixed(2)}
                            </span>
                        </TableCell>
                        <TableCell className='text-sm text-muted-foreground'>{player.team}</TableCell>
                        <TableCell className='text-sm text-muted-foreground'>{player.pos}</TableCell>
                        {enabledCats.map((cat) => (
                            <TableCell key={cat} className='text-right tabular-nums'>
                                {formatCatStat(player, cat)}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
