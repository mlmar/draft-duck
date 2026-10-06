import { Button } from '@/components/ui/button';
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerTitle } from '@/components/ui/drawer';
import { useMediaQuery } from '@/hooks/use-media-query';
import { formatCatStat } from '@/lib/format-stats';
import { contributionSummary, formatSignedValue, strengthDatum } from '@/lib/player-strength-chart';
import { CAT_KEYS, CAT_LABELS, type CatKey, type DraftProfile, type RankedPlayer, whyCopy } from '@draft-duck/core';
import { X } from 'lucide-react';

type PlayerDetailDrawerProps = {
    open: boolean;
    player: RankedPlayer | null;
    profile: DraftProfile;
    onOpenChange: (open: boolean) => void;
    onAnimationEnd: (open: boolean) => void;
};

// Keep the drawer mounted for reliable dialog dismissal while rendering its content only for a selected player.
export function PlayerDetailDrawer({ open, player, profile, onOpenChange, onAnimationEnd }: PlayerDetailDrawerProps) {
    const isDesktop = useMediaQuery('(min-width: 768px)');
    const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

    // Vaul reports the transition after 500ms; reduced-motion users close immediately after motion is disabled.
    function handleOpenChange(nextOpen: boolean) {
        onOpenChange(nextOpen);
        if (!nextOpen && prefersReducedMotion) onAnimationEnd(false);
    }

    return (
        <Drawer
            open={open && player !== null}
            onOpenChange={handleOpenChange}
            onAnimationEnd={onAnimationEnd}
            direction={isDesktop ? 'right' : 'bottom'}
            autoFocus
        >
            {player ? (
                <DrawerContent
                    id='player-details'
                    aria-labelledby='player-details-title'
                    aria-describedby='player-details-description'
                    disableAnimation={prefersReducedMotion}
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
                        <div className='mb-6 grid gap-2'>
                            <h2 className='mb-0 text-lg'>Why this player?</h2>
                            <p className='mb-0 text-muted-foreground'>{whyCopy(player, profile)}</p>
                        </div>
                        <SignedStrengthChart player={player} enabledCats={profile.enabledCats} />
                        <PlayerFitExplanation player={player} profile={profile} />
                    </div>
                </DrawerContent>
            ) : null}
        </Drawer>
    );
}

// Keep a shared ±3 scale and exact text while giving each category a readable horizontal row.
function SignedStrengthChart({ player, enabledCats }: { player: RankedPlayer; enabledCats: CatKey[] }) {
    const cats = CAT_KEYS.filter((cat) => enabledCats.includes(cat));
    const description = cats.map((cat) => chartDescription(player, cat)).join('. ');
    return (
        <figure className='mb-8 grid gap-4'>
            <figcaption className='grid gap-1'>
                <span className='font-semibold'>Category strength</span>
                <span className='text-sm text-muted-foreground'>Standardized strength before build weights.</span>
            </figcaption>
            <div role='img' aria-label={`Category strength chart for ${player.name}. ${description}`}>
                <div aria-hidden='true' className='grid gap-3'>
                    <div className='grid grid-cols-[2.5rem_minmax(0,1fr)_3rem] gap-3 text-sm text-muted-foreground'>
                        <span />
                        <div className='flex justify-between'>
                            <span>−3</span>
                            <span>Avg (0)</span>
                            <span>+3</span>
                        </div>
                        <span />
                    </div>
                    {cats.map((cat) => {
                        const datum = strengthDatum(player, cat);
                        const geometry = datum.state === 'scored' ? datum.geometry : null;
                        return (
                            <div key={cat} className='grid grid-cols-[2.5rem_minmax(0,1fr)_3rem] items-center gap-3'>
                                <span className='text-sm font-medium'>{CAT_LABELS[cat]}</span>
                                {datum.state === 'scored' && geometry ? (
                                    <>
                                        <div className='relative h-6 rounded-sm bg-muted'>
                                            <span className='absolute inset-y-0 left-1/2 border-l border-foreground/40' />
                                            <span
                                                className='absolute inset-y-1 rounded-sm'
                                                style={{
                                                    left: `${geometry.direction === 'negative' ? 50 - geometry.halfHeightPercent : 50}%`,
                                                    width: `${geometry.halfHeightPercent}%`,
                                                    backgroundColor:
                                                        geometry.direction === 'negative'
                                                            ? 'var(--strength-bad)'
                                                            : 'var(--strength-good)'
                                                }}
                                            />
                                            {geometry.clipped ? (
                                                <span
                                                    className={`absolute inset-y-0 border-l-2 border-foreground ${geometry.direction === 'positive' ? 'right-0' : 'left-0'}`}
                                                />
                                            ) : null}
                                        </div>
                                        <span className='text-right text-sm tabular-nums'>
                                            {formatSignedValue(datum.z)}
                                        </span>
                                    </>
                                ) : (
                                    <span className='col-span-2 text-sm text-muted-foreground'>
                                        {datum.state === 'no-attempts' ? 'No attempts' : 'Unavailable'}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </figure>
    );
}

// Keep the fit summary short and expose category stats beside their authoritative server contributions.
function PlayerFitExplanation({ player, profile }: { player: RankedPlayer; profile: DraftProfile }) {
    const cats = CAT_KEYS.filter((cat) => profile.enabledCats.includes(cat));
    const summary = contributionSummary(player, cats);

    return (
        <section aria-labelledby='why-player-title' className='grid gap-3 p-0'>
            <h2 id='why-player-title' className='mb-0 text-base font-semibold'>
                Score breakdown
            </h2>
            <p className='mb-0 text-sm text-muted-foreground'>
                {dataModeLabel(profile)} ranking stats and their weighted contributions. Punted categories contribute
                zero.
            </p>
            {summary ? <ContributionSummaryText summary={summary} /> : null}
            {!summary ? (
                <p className='mb-0 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground'>
                    Score breakdown is unavailable in this response.
                </p>
            ) : null}
            <div className='grid gap-2'>
                {cats.map((cat) => (
                    <CategoryExplanation key={cat} player={player} cat={cat} showContribution={summary !== null} />
                ))}
            </div>
        </section>
    );
}

// Pair each raw category stat with its server contribution without repeating chart scores or profile controls.
function CategoryExplanation({
    player,
    cat,
    showContribution
}: {
    player: RankedPlayer;
    cat: CatKey;
    showContribution: boolean;
}) {
    const stat =
        (cat === 'fgPct' || cat === 'ftPct') && player[cat] === null ? 'No attempts' : formatCatStat(player, cat);
    const contribution = player.contributions?.[cat];

    return (
        <div className='flex items-baseline justify-between gap-3 border-b border-border/70 py-1.5 text-sm'>
            <span className='min-w-0 truncate'>
                <span className='font-medium'>{CAT_LABELS[cat]}</span>
                <span className='text-muted-foreground'> · {stat}</span>
            </span>
            {showContribution && typeof contribution === 'number' && Number.isFinite(contribution) ? (
                <span
                    className='shrink-0 tabular-nums text-muted-foreground'
                    aria-label={`Contribution ${formatSignedValue(contribution)}`}
                >
                    {formatSignedValue(contribution)}
                </span>
            ) : null}
        </div>
    );
}

// Put the strongest boost and drag on separate lines and retain a compact composite total.
function ContributionSummaryText({ summary }: { summary: NonNullable<ReturnType<typeof contributionSummary>> }) {
    return (
        <dl className='grid gap-1 text-sm'>
            {summary.largestPositive ? (
                <div className='flex justify-between gap-3'>
                    <dt className='text-muted-foreground'>Largest boost</dt>
                    <dd className='mb-0 text-right font-medium'>
                        {CAT_LABELS[summary.largestPositive.cat]} {formatSignedValue(summary.largestPositive.value)}
                    </dd>
                </div>
            ) : null}
            {summary.mostNegative ? (
                <div className='flex justify-between gap-3'>
                    <dt className='text-muted-foreground'>Largest drag</dt>
                    <dd className='mb-0 text-right font-medium'>
                        {CAT_LABELS[summary.mostNegative.cat]} {formatSignedValue(summary.mostNegative.value)}
                    </dd>
                </div>
            ) : null}
            {!summary.largestPositive && !summary.mostNegative ? (
                <div className='text-muted-foreground'>No category adds to or subtracts from this score.</div>
            ) : null}
            <div className='border-t border-border/70 pt-1 tabular-nums text-muted-foreground'>
                Total contribution {formatSignedValue(summary.total)}
            </div>
        </dl>
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
