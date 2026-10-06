import { useEffect, useRef, useState } from 'react';
import { catHeatStyle } from '@/lib/cat-heat';
import { formatDisplayedCatStat } from '@/lib/format-stats';
import { YourPickMark } from '@/components/draft/your-pick-mark';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Activity, Info, Sparkles } from 'lucide-react';
import {
    CAT_LABELS,
    formatSignedScore,
    type CatHighlightStrategy,
    type CatKey,
    type DataMode,
    type DraftProfile,
    type RankedPlayer
} from '@draft-duck/core';

export type PlayerTableGroup = {
    id: string;
    label?: string;
    players: RankedPlayer[];
};

// +/- is the highlight score as text. Raw shows the selected dataset's stats. Heat uses the same score either way.
export type CatValueMode = 'raw' | 'plusMinus';

type PlayerTableProps = {
    groups: PlayerTableGroup[];
    enabledCats: CatKey[];
    emptyLabel: string;
    profile: DraftProfile;
    highlight: CatHighlightStrategy;
    valueMode: CatValueMode;
    displayStatsMode: DataMode;
    yourOverallPicks?: ReadonlySet<number>;
    // Optional so non-board PlayerTable consumers keep their existing static name presentation.
    onPlayerSelect?: (player: RankedPlayer, trigger: HTMLButtonElement) => void;
    // Prevent explaining placeholder rows using a different saved profile's weights.
    playerDetailsDisabled?: boolean;
    stickyTop?: number;
};

const IDENTITY_COLS = 4;

// 4.5rem fits a three-digit rank and the pick star while trimming unused rank-column space.
const colRank = 'w-[4.5rem] min-w-[4.5rem]';
const colName = 'w-48 min-w-48';
const colTeam = 'w-14 min-w-14';
const colPos = 'w-12 min-w-12';
const colCat = 'w-16 min-w-16';

const stickyRank = `sticky left-0 z-10 ${colRank}`;
// Name only pins from md up. Rank plus Name is 16.5rem and covers cats on a phone.
const stickyName = `z-10 ${colName} md:sticky md:left-[4.5rem]`;
const stickyRankHead = `sticky left-0 z-30 ${colRank} bg-background`;
const stickyNameHead = `z-30 ${colName} bg-background md:sticky md:left-[4.5rem]`;

// Selected picks use the same restrained cobalt wash as the board controls.
const yourPickFill =
    'bg-[color-mix(in_srgb,var(--brand)_15%,var(--background))] hover:bg-[color-mix(in_srgb,var(--brand)_20%,var(--background))] group-hover:bg-[color-mix(in_srgb,var(--brand)_20%,var(--background))]';

function stripeFill(odd: boolean): string {
    const hover =
        'hover:bg-[color-mix(in_srgb,var(--brand)_12%,var(--background))] group-hover:bg-[color-mix(in_srgb,var(--brand)_12%,var(--background))]';
    return odd ? `bg-muted ${hover}` : `bg-background ${hover}`;
}

function rowFill(odd: boolean, isYourPick: boolean): string {
    return isYourPick ? yourPickFill : stripeFill(odd);
}

// A visual header follows horizontal table scrolling and pins below the build header.
// The real table retains its semantic header and page scrolling.

export function PlayerTable({
    groups,
    enabledCats,
    emptyLabel,
    profile,
    highlight,
    valueMode,
    displayStatsMode,
    yourOverallPicks,
    onPlayerSelect,
    playerDetailsDisabled = false,
    stickyTop = 0
}: PlayerTableProps) {
    const wrapper = useRef<HTMLDivElement>(null);
    const [pinned, setPinned] = useState<{
        top: number;
        left: number;
        width: number;
        tableWidth: number;
        scrollLeft: number;
    } | null>(null);
    useEffect(() => {
        const node = wrapper.current;
        const scroller = node?.querySelector<HTMLElement>('[data-slot=table-container]');
        if (!node || !scroller) return;
        const update = () => {
            const rect = scroller.getBoundingClientRect();
            const table = scroller.querySelector('table')!;
            const top = stickyTop;
            setPinned(
                rect.top < top && rect.bottom > top + 40
                    ? {
                          top,
                          left: rect.left + 1,
                          width: rect.width - 2,
                          tableWidth: table.getBoundingClientRect().width,
                          scrollLeft: scroller.scrollLeft
                      }
                    : null
            );
        };
        const observer = new ResizeObserver(update);
        observer.observe(scroller);
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        scroller.addEventListener('scroll', update, { passive: true });
        update();
        return () => {
            observer.disconnect();
            window.removeEventListener('scroll', update);
            window.removeEventListener('resize', update);
            scroller.removeEventListener('scroll', update);
        };
    }, [stickyTop, groups, enabledCats]);
    const hasPlayers = groups.some((group) => group.players.length > 0);
    if (!hasPlayers) {
        return <p className='mb-0 text-muted-foreground'>{emptyLabel}</p>;
    }

    const colSpan = IDENTITY_COLS + enabledCats.length;

    const columnsAndHead = (
        <>
            <colgroup>
                <col className={colRank} />
                <col className={colName} />
                <col className={`hidden md:table-column ${colTeam}`} />
                <col className={colPos} />
                {enabledCats.map((cat) => (
                    <col key={cat} className={colCat} />
                ))}
            </colgroup>
            <TableHeader className='bg-background'>
                <TableRow className='text-muted-foreground hover:bg-transparent'>
                    <TableHead className={stickyRankHead}>Rank</TableHead>
                    <TableHead className={stickyNameHead}>Name</TableHead>
                    <TableHead className={`hidden bg-background md:table-cell ${colTeam}`}>
                        <span className='text-sm font-normal'>Team</span>
                    </TableHead>
                    <TableHead className={`bg-background ${colPos}`}>
                        <span className='text-sm font-normal'>Pos</span>
                    </TableHead>
                    {enabledCats.map((cat) => (
                        <TableHead key={cat} className={`bg-background text-right text-sm ${colCat}`}>
                            {CAT_LABELS[cat]}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
        </>
    );

    return (
        <div ref={wrapper} className='min-w-0'>
            {pinned ? (
                <div
                    aria-hidden='true'
                    className='fixed z-30 overflow-hidden border-b border-border bg-background pointer-events-none'
                    style={{ top: pinned.top, left: pinned.left, width: pinned.width }}
                >
                    <table
                        className='table-fixed border-separate border-spacing-0 text-base'
                        style={{ width: pinned.tableWidth, marginLeft: -pinned.scrollLeft }}
                    >
                        {columnsAndHead}
                    </table>
                </div>
            ) : null}
            <Table
                containerLabel='Player statistics'
                className='table-fixed border-separate border-spacing-0'
                style={{ minWidth: `${19.5 + enabledCats.length * 4}rem`, width: '100%' }}
                containerClassName='overflow-x-auto rounded-lg border border-border bg-background'
            >
                {columnsAndHead}
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
                                        className={cn(stickyRank, fill, 'tabular-nums transition-colors duration-150')}
                                    >
                                        <span className='inline-flex items-center gap-1'>
                                            {player.rank}
                                            {isYourPick ? <YourPickMark /> : null}
                                        </span>
                                    </TableCell>
                                    <TableCell
                                        className={cn(
                                            stickyName,
                                            fill,
                                            'overflow-hidden transition-colors duration-150',
                                            onPlayerSelect && 'p-0'
                                        )}
                                    >
                                        {onPlayerSelect ? (
                                            <Button
                                                type='button'
                                                variant='ghost'
                                                aria-haspopup='dialog'
                                                disabled={playerDetailsDisabled}
                                                onClick={(event) => onPlayerSelect(player, event.currentTarget)}
                                                className='h-full min-h-11 w-full min-w-0 justify-start gap-2 rounded-none px-3 py-2 text-left font-medium text-foreground transition-colors duration-150 hover:bg-transparent hover:text-foreground hover:underline focus-visible:bg-transparent focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60'
                                            >
                                                <span className='min-w-0 truncate'>{player.name}</span>
                                                {player.upsideSignal ? (
                                                    <span
                                                        className={cn(
                                                            'inline-flex shrink-0 items-center gap-1 text-sm font-medium',
                                                            player.upsideSignal === 'sleeper'
                                                                ? 'text-sky-800'
                                                                : 'text-amber-800'
                                                        )}
                                                        title={
                                                            player.upsideSignal === 'sleeper'
                                                                ? 'High per-36 rank with below-median per-game and totals ranks this season.'
                                                                : 'Low per-36 rank with top-half per-game and totals ranks this season; this does not measure game-to-game consistency.'
                                                        }
                                                    >
                                                        {player.upsideSignal === 'sleeper' ? (
                                                            <>
                                                                <Sparkles aria-hidden='true' className='size-3.5' />
                                                                <span>Upside</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Activity aria-hidden='true' className='size-3.5' />
                                                                <span>Streaky</span>
                                                            </>
                                                        )}
                                                    </span>
                                                ) : null}
                                                {/* Keep a visible drawer cue on touch devices where hover is unavailable. */}
                                                <Info
                                                    aria-hidden='true'
                                                    className='size-4 shrink-0 text-muted-foreground'
                                                />
                                            </Button>
                                        ) : (
                                            <span className='flex items-center gap-2 overflow-hidden'>
                                                <span className='truncate font-medium'>{player.name}</span>
                                                {player.upsideSignal ? (
                                                    <span
                                                        className={cn(
                                                            'inline-flex shrink-0 items-center gap-1 text-sm font-medium',
                                                            player.upsideSignal === 'sleeper'
                                                                ? 'text-sky-800'
                                                                : 'text-amber-800'
                                                        )}
                                                        title={
                                                            player.upsideSignal === 'sleeper'
                                                                ? 'High per-36 rank with below-median per-game and totals ranks this season.'
                                                                : 'Low per-36 rank with top-half per-game and totals ranks this season; this does not measure game-to-game consistency.'
                                                        }
                                                    >
                                                        {player.upsideSignal === 'sleeper' ? (
                                                            <>
                                                                <Sparkles aria-hidden='true' className='size-3.5' />
                                                                <span>Upside</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Activity aria-hidden='true' className='size-3.5' />
                                                                <span>Streaky</span>
                                                            </>
                                                        )}
                                                    </span>
                                                ) : null}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell
                                        className={`hidden text-sm text-muted-foreground transition-colors duration-150 md:table-cell ${colTeam}`}
                                    >
                                        {player.team}
                                    </TableCell>
                                    <TableCell
                                        className={`text-sm text-muted-foreground transition-colors duration-150 ${colPos}`}
                                    >
                                        {player.pos}
                                    </TableCell>
                                    {enabledCats.map((cat) => {
                                        const heat = highlight.score({ player, cat, profile });
                                        const value =
                                            valueMode === 'plusMinus'
                                                ? formatSignedScore(heat.score)
                                                : formatDisplayedCatStat(
                                                      player,
                                                      cat,
                                                      displayStatsMode,
                                                      profile.dataMode ?? 'perGame'
                                                  );
                                        return (
                                            <TableCell
                                                key={cat}
                                                className={`text-right text-sm tabular-nums transition-colors duration-150 ${colCat}`}
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
        </div>
    );
}
