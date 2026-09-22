import { catHeatStyle } from '@/lib/cat-heat';
import { formatCatStat } from '@/lib/format-stats';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
    CAT_LABELS,
    formatSignedScore,
    type CatHighlightStrategy,
    type CatKey,
    type DraftProfile,
    type RankedPlayer
} from '@draft-duck/core';

export type PlayerTableGroup = {
    id: string;
    label?: string;
    players: RankedPlayer[];
};

// +/- is the highlight score as text. Raw keeps per-game stats. Heat uses the same score either way.
export type CatValueMode = 'raw' | 'plusMinus';

type PlayerTableProps = {
    groups: PlayerTableGroup[];
    enabledCats: CatKey[];
    emptyLabel: string;
    profile: DraftProfile;
    highlight: CatHighlightStrategy;
    valueMode: CatValueMode;
    yourOverallPicks?: ReadonlySet<number>;
};

const IDENTITY_COLS = 4;

const colRank = 'w-16 min-w-16';
// w-40 clips Gilgeous-Alexander. Keep it fixed, just wider, so the table still does not grow with the name.
const colName = 'w-64 min-w-64';
const colTeam = 'w-16 min-w-16';
const colPos = 'w-16 min-w-16';
const colCat = 'w-20 min-w-20';

const stickyRank = `sticky left-0 z-10 ${colRank}`;
const stickyName = `sticky left-16 z-10 ${colName}`;
const stickyRankHead = `sticky left-0 top-0 z-30 ${colRank} bg-background`;
const stickyNameHead = `sticky left-16 top-0 z-30 ${colName} bg-background`;

// Mix in srgb so #78A3CF stays pale blue. oklch interpolation landed in pink.
const yourPickFill =
    'bg-[color-mix(in_srgb,var(--primary)_15%,var(--background))] hover:bg-[color-mix(in_srgb,var(--primary)_20%,var(--background))] group-hover:bg-[color-mix(in_srgb,var(--primary)_20%,var(--background))]';

function stripeFill(odd: boolean): string {
    return odd ? 'bg-muted hover:bg-muted group-hover:bg-muted' : 'bg-background hover:bg-muted group-hover:bg-muted';
}

function rowFill(odd: boolean, isYourPick: boolean): string {
    return isYourPick ? yourPickFill : stripeFill(odd);
}

export function HeatLegend({ highlight }: { highlight: CatHighlightStrategy }) {
    return (
        <p className='mb-0 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground'>
            {/* Legend copy comes from the strategy so a later mode can rename the ends. */}
            <span className='flex items-center gap-2'>
                <span className='size-4 rounded-lg bg-[var(--heat-bad)]' aria-hidden='true' />
                {highlight.legend.worse}
            </span>
            <span className='flex items-center gap-2'>
                <span className='size-4 rounded-lg bg-muted' aria-hidden='true' />
                {highlight.legend.average}
            </span>
            <span className='flex items-center gap-2'>
                <span className='size-4 rounded-lg bg-[var(--heat-good)]' aria-hidden='true' />
                {highlight.legend.better}
            </span>
            <span>Color is vs your CAT profile. Punted cats stay uncolored.</span>
        </p>
    );
}

// One overflow from Table. Groups are tbodies so assistance rounds share a scrollbar.
// Thead sticks on a tall board. Rank/name stick left. Corner heads use a higher z.
// table-fixed plus pinned col widths: raw vs +/- (and long names) must not move columns.
// Opaque fills on sticky cells, not inherit, so heat mixes cannot show through on scroll.
// border-separate so collapse does not break left stickies.

export function PlayerTable({
    groups,
    enabledCats,
    emptyLabel,
    profile,
    highlight,
    valueMode,
    yourOverallPicks
}: PlayerTableProps) {
    const hasPlayers = groups.some((group) => group.players.length > 0);
    if (!hasPlayers) {
        return <p className='mb-0 text-muted-foreground'>{emptyLabel}</p>;
    }

    const colSpan = IDENTITY_COLS + enabledCats.length;

    return (
        <Table className='table-fixed min-w-[73rem] border-separate border-spacing-0'>
            <colgroup>
                <col className={colRank} />
                <col className={colName} />
                <col className={colTeam} />
                <col className={colPos} />
                {enabledCats.map((cat) => (
                    <col key={cat} className={colCat} />
                ))}
            </colgroup>
            <TableHeader className='sticky top-0 z-20 bg-background'>
                <TableRow className='text-muted-foreground hover:bg-transparent'>
                    <TableHead className={stickyRankHead}>Rank</TableHead>
                    <TableHead className={stickyNameHead}>Name</TableHead>
                    <TableHead className={`bg-background ${colTeam}`}>
                        <span className='text-sm font-normal'>Team</span>
                    </TableHead>
                    <TableHead className={`bg-background ${colPos}`}>
                        <span className='text-sm font-normal'>Pos</span>
                    </TableHead>
                    {enabledCats.map((cat) => (
                        <TableHead key={cat} className={`bg-background text-right ${colCat}`}>
                            {CAT_LABELS[cat]}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            {groups.map((group) => (
                <TableBody key={group.id}>
                    {group.label ? (
                        <TableRow className='bg-muted/60 hover:bg-muted/60'>
                            <TableCell colSpan={colSpan} className='font-medium'>
                                {/* Colspan cells span the table. Stick the label, not the cell. */}
                                <span className='sticky left-3'>{group.label}</span>
                            </TableCell>
                        </TableRow>
                    ) : null}
                    {group.players.map((player, index) => {
                        const isYourPick = yourOverallPicks?.has(player.rank) ?? false;
                        const fill = rowFill(index % 2 === 1, isYourPick);
                        return (
                            <TableRow key={player.playerId} className={cn('group', fill)}>
                                <TableCell
                                    className={cn(
                                        stickyRank,
                                        fill,
                                        'tabular-nums',
                                        isYourPick && 'border-l-2 border-l-primary'
                                    )}
                                >
                                    {player.rank}
                                </TableCell>
                                <TableCell className={`${stickyName} ${fill} overflow-hidden`}>
                                    <span className='block truncate font-medium'>{player.name}</span>
                                    <span className='mt-0.5 block text-sm text-muted-foreground'>
                                        {player.composite.toFixed(2)}
                                    </span>
                                </TableCell>
                                <TableCell className={`text-sm text-muted-foreground ${colTeam}`}>
                                    {player.team}
                                </TableCell>
                                <TableCell className={`text-sm text-muted-foreground ${colPos}`}>
                                    {player.pos}
                                </TableCell>
                                {enabledCats.map((cat) => {
                                    const heat = highlight.score({ player, cat, profile });
                                    const value =
                                        valueMode === 'plusMinus'
                                            ? formatSignedScore(heat.score)
                                            : formatCatStat(player, cat);
                                    return (
                                        <TableCell
                                            key={cat}
                                            className={`text-right tabular-nums ${colCat}`}
                                            style={catHeatStyle(heat.score)}
                                            title={heat.title}
                                        >
                                            {value}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        );
                    })}
                </TableBody>
            ))}
        </Table>
    );
}
