import { Button } from '@/components/ui/button';
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerTitle } from '@/components/ui/drawer';
import { useMediaQuery } from '@/hooks/use-media-query';
import { formatCatStat } from '@/lib/format-stats';
import { contributionSummary, formatSignedValue, signedBarGeometry, strengthDatum } from '@/lib/player-strength-chart';
import {
    CAT_KEYS,
    CAT_LABELS,
    formatTuner,
    profileWeight,
    type CatKey,
    type DraftProfile,
    type RankedPlayer
} from '@draft-duck/core';
import { X } from 'lucide-react';

type PlayerDetailDrawerProps = {
    open: boolean;
    player: RankedPlayer | null;
    profile: DraftProfile;
    onOpenChange: (open: boolean) => void;
};

// Match signed geometry to an uncluttered five-tick symmetric zero-centered scale.
const Z_TICKS = [
    { value: 3, top: 0, label: '+3' },
    { value: 1.5, top: 25, label: '+1.5' },
    { value: 0, top: 50, label: 'Average (0)' },
    { value: -1.5, top: 75, label: '−1.5' },
    { value: -3, top: 100, label: '−3' }
] as const;

// Keep the drawer mounted for reliable dialog dismissal while rendering its content only for a selected player.
export function PlayerDetailDrawer({ open, player, profile, onOpenChange }: PlayerDetailDrawerProps) {
    const isDesktop = useMediaQuery('(min-width: 768px)');

    return (
        <Drawer
            open={open && player !== null}
            onOpenChange={onOpenChange}
            direction={isDesktop ? 'right' : 'bottom'}
            autoFocus
        >
            {player ? (
                <DrawerContent
                    id='player-details'
                    aria-labelledby='player-details-title'
                    aria-describedby='player-details-description'
                    className='gap-0'
                >
                    <div className='flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-3'>
                        <div className='grid min-w-0 gap-1'>
                            <DrawerTitle id='player-details-title' className='truncate'>
                                {player.name}
                            </DrawerTitle>
                            <DrawerDescription id='player-details-description'>
                                {player.team} · {player.pos} · Rank {player.rank} · {dataModeLabel(profile)}
                            </DrawerDescription>
                        </div>
                        <DrawerClose asChild>
                            <Button type='button' variant='ghost' size='icon' aria-label='Close player details'>
                                <X aria-hidden='true' />
                            </Button>
                        </DrawerClose>
                    </div>
                    <div className='min-h-0 flex-1 overflow-y-auto px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]'>
                        <SignedStrengthChart player={player} enabledCats={profile.enabledCats} />
                        <PlayerFitExplanation player={player} profile={profile} />
                    </div>
                </DrawerContent>
            ) : null}
        </Drawer>
    );
}

// Put chart labels and a text-only score description together so screen readers can understand every signed bar.
function SignedStrengthChart({ player, enabledCats }: { player: RankedPlayer; enabledCats: CatKey[] }) {
    const cats = CAT_KEYS.filter((cat) => enabledCats.includes(cat));
    const description = cats.map((cat) => chartDescription(player, cat)).join('. ');
    const chartWidth = `${cats.length * 1.75}rem`;

    return (
        <figure className='mb-6 grid gap-2'>
            <figcaption className='grid gap-1'>
                <span className='font-medium'>Category strength</span>
                <span className='text-xs text-muted-foreground'>Standardized strength (z-score)</span>
            </figcaption>
            <div
                role='img'
                aria-label={`Category strength chart for ${player.name}. ${description}`}
                className='flex items-stretch gap-2 overflow-hidden'
            >
                <div className='relative h-56 w-[3.5rem] shrink-0 text-right text-[0.65rem] text-muted-foreground'>
                    {Z_TICKS.map((tick) => (
                        <span
                            key={tick.label}
                            className={`absolute right-0 whitespace-nowrap bg-card px-0.5 ${tick.top === 0 ? '' : tick.top === 100 ? '-translate-y-full' : '-translate-y-1/2'}`}
                            style={{ top: `${tick.top}%` }}
                        >
                            {tick.label}
                        </span>
                    ))}
                </div>
                <div className='min-w-0 flex-1 overflow-x-auto pb-1' aria-hidden='true'>
                    <div className='relative h-56' style={{ minWidth: chartWidth }}>
                        {Z_TICKS.map((tick) => (
                            <div
                                key={tick.label}
                                className={`absolute inset-x-0 border-t ${tick.value === 0 ? 'border-foreground/60' : 'border-border/70'}`}
                                style={{ top: `${tick.top}%` }}
                            />
                        ))}
                        <div
                            className='absolute inset-0 grid'
                            style={{ gridTemplateColumns: `repeat(${cats.length}, minmax(1.75rem, 1fr))` }}
                        >
                            {cats.map((cat) => (
                                <StrengthColumn key={cat} player={player} cat={cat} />
                            ))}
                        </div>
                    </div>
                    <div
                        className='grid pt-2 text-center text-[0.65rem] font-medium text-muted-foreground'
                        style={{
                            gridTemplateColumns: `repeat(${cats.length}, minmax(1.75rem, 1fr))`,
                            minWidth: chartWidth
                        }}
                    >
                        {cats.map((cat) => (
                            <span key={cat}>{CAT_LABELS[cat]}</span>
                        ))}
                    </div>
                </div>
            </div>
        </figure>
    );
}

// Draw strengths from the zero line; profile stance and weight never affect bar direction, size, or color.
function StrengthColumn({ player, cat }: { player: RankedPlayer; cat: CatKey }) {
    const datum = strengthDatum(player, cat);
    const geometry = datum.state === 'scored' ? datum.geometry : null;
    const positive = geometry?.direction === 'positive';
    const negative = geometry?.direction === 'negative';

    return (
        <div className='relative h-full'>
            {positive ? (
                <div
                    className='absolute left-1/2 bottom-1/2 w-3 -translate-x-1/2 rounded-t-md bg-foreground'
                    style={{ height: `${geometry.halfHeightPercent}%` }}
                />
            ) : null}
            {negative ? (
                <div
                    className='absolute left-1/2 top-1/2 w-3 -translate-x-1/2 rounded-b-md bg-foreground'
                    style={{ height: `${geometry.halfHeightPercent}%` }}
                />
            ) : null}
            {geometry?.clipped ? <ClippedEndpoint positive={positive} /> : null}
        </div>
    );
}

// Mark scores beyond ±3 at the chart edge without changing the exact value announced to assistive technology.
function ClippedEndpoint({ positive }: { positive: boolean }) {
    return (
        <span
            className='absolute left-1/2 size-2 -translate-x-1/2 rounded-full bg-foreground ring-2 ring-card'
            style={positive ? { top: 0 } : { bottom: 0 }}
        />
    );
}

// Explain fit from authoritative server terms while retaining useful stat and stance details for older responses.
function PlayerFitExplanation({ player, profile }: { player: RankedPlayer; profile: DraftProfile }) {
    const cats = CAT_KEYS.filter((cat) => profile.enabledCats.includes(cat));
    const summary = contributionSummary(player, cats);

    return (
        <section aria-labelledby='why-player-title' className='grid gap-3'>
            <h2 id='why-player-title' className='mb-0 text-base font-semibold'>
                Why this player?
            </h2>
            {summary ? <ContributionSummaryText summary={summary} /> : null}
            <p className='mb-0 text-xs leading-relaxed text-muted-foreground'>
                Category z-scores compare players in the ranked pool. FG% and FT% account for attempts; lower turnovers
                are better. A no-attempt rate has no chart bar, though the ranker may retain its standardized neutral
                impact. Profile weight multiplies category z-score; contribution is its weighted score term.
            </p>
            {!summary ? (
                <p className='mb-0 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground'>
                    Score breakdown is unavailable in this response.
                </p>
            ) : null}
            <div className='grid gap-2'>
                {cats.map((cat) => (
                    <CategoryExplanation
                        key={cat}
                        player={player}
                        profile={profile}
                        cat={cat}
                        showContribution={summary !== null}
                    />
                ))}
            </div>
        </section>
    );
}

// Show only available contribution details and retain saved stance labels even when a legacy tuner overrides them.
function CategoryExplanation({
    player,
    profile,
    cat,
    showContribution
}: {
    player: RankedPlayer;
    profile: DraftProfile;
    cat: CatKey;
    showContribution: boolean;
}) {
    const stance = profile.stances[cat] ?? 'neutral';
    const weight = profileWeight(profile, cat);
    const stat =
        (cat === 'fgPct' || cat === 'ftPct') && player[cat] === null ? 'No attempts' : formatCatStat(player, cat);
    const z = player.z[cat];
    const geometry = signedBarGeometry(z);
    const contribution = player.contributions?.[cat];
    const ignored = weight === 0;
    const strength =
        typeof z === 'number' && Number.isFinite(z)
            ? `${formatSignedValue(z)}${geometry?.clipped ? ' · bar clipped at the ±3 endpoint' : ''}`
            : 'Unavailable';

    return (
        <div className='grid gap-1 rounded-md border border-border px-3 py-2 text-sm'>
            <div className='flex flex-wrap items-baseline justify-between gap-x-3'>
                <h3 className='mb-0 font-medium'>{CAT_LABELS[cat]}</h3>
                <span className='tabular-nums text-muted-foreground'>{stat}</span>
            </div>
            <p className='mb-0 text-xs leading-relaxed text-muted-foreground'>
                Strength {strength} · Saved stance {capitalize(stance)} · Profile weight {formatTuner(weight)}
                {ignored ? ' · Ignored · contributes 0' : ''}
                {showContribution && !ignored && typeof contribution === 'number' && Number.isFinite(contribution)
                    ? ` · Contribution ${formatSignedValue(contribution)}`
                    : ''}
            </p>
        </div>
    );
}

// Summarize the largest positive and negative score terms using the same sign and precision as category rows.
function ContributionSummaryText({ summary }: { summary: NonNullable<ReturnType<typeof contributionSummary>> }) {
    const parts = [
        summary.largestPositive
            ? `Largest boost: ${CAT_LABELS[summary.largestPositive.cat]} ${formatSignedValue(summary.largestPositive.value)}`
            : null,
        summary.mostNegative
            ? `Largest drag: ${CAT_LABELS[summary.mostNegative.cat]} ${formatSignedValue(summary.mostNegative.value)}`
            : null
    ].filter((part): part is string => part !== null);

    return (
        <div className='grid gap-1 text-sm'>
            <p className='mb-0'>
                {parts.length ? parts.join(' · ') : 'No category adds to or subtracts from this score.'}
            </p>
            <p className='mb-0 tabular-nums text-muted-foreground'>
                Total contribution: {formatSignedValue(summary.total)}. Displayed terms are rounded to two decimals.
            </p>
        </div>
    );
}

// Keep the accessible label explicit about sign and clipping, independent from the visual bar color.
function chartDescription(player: RankedPlayer, cat: CatKey): string {
    const datum = strengthDatum(player, cat);
    if (datum.state === 'no-attempts') return `${CAT_LABELS[cat]}: No attempts`;
    if (datum.state === 'unavailable') return `${CAT_LABELS[cat]}: Unavailable`;
    const direction = datum.z > 0 ? 'positive' : datum.z < 0 ? 'negative' : 'average';
    const clipping = datum.geometry.clipped ? ', clipped at the chart endpoint' : '';
    return `${CAT_LABELS[cat]}: ${direction} ${formatSignedValue(datum.z)} z-score${clipping}`;
}

// Legacy profiles without a stored mode continue to identify the board as per-game.
function dataModeLabel(profile: DraftProfile): string {
    const mode = profile.dataMode ?? 'perGame';
    return mode === 'perGame' ? 'Per game' : mode === 'per36' ? 'Per 36 minutes' : 'Totals';
}

// Present saved labels in readable title case without changing the stored stance value.
function capitalize(value: string): string {
    return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}
