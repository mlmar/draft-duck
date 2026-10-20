import { Button } from '@/components/ui/button';
import { TeamLabModeButton } from '@/components/team/team-lab-mode-button';
import { formatSignedValue } from '@/lib/player-strength-chart';
import { CAT_LABELS, type CatKey, type CatStance, type TeamStrengthResult, type TeamRawTotals } from '@draft-duck/core';
import { useEffect, useState } from 'react';

type TeamStrengthPanelProps = {
    categories: CatKey[];
    current: TeamStrengthResult;
    proposed: TeamStrengthResult;
    stances: Partial<Record<CatKey, CatStance>>;
    savedCount: number;
    previewCount: number;
    mode: 'average' | 'total';
    onModeChange: (mode: 'average' | 'total') => void;
    loading: boolean;
    error: boolean;
    onRetry: () => void;
};

/** Present loading states, comparison bars, category shifts, and combined box-score details. */
export function TeamStrengthPanel({
    categories,
    current,
    proposed,
    stances,
    savedCount,
    previewCount,
    mode,
    onModeChange,
    loading,
    error,
    onRetry
}: TeamStrengthPanelProps) {
    const currentValues = getStrengthValues(current);
    const proposedValues = getStrengthValues(proposed);

    return (
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
                        Unweighted player z-scores · {mode === 'average' ? 'average per player' : 'combined total'}
                    </p>
                </div>
                <div
                    role='group'
                    aria-label='Strength calculation'
                    className='inline-grid grid-cols-2 items-center gap-1 rounded-lg border border-border p-1'
                >
                    <TeamLabModeButton active={mode === 'average'} onClick={() => onModeChange('average')}>
                        Average
                    </TeamLabModeButton>
                    <TeamLabModeButton active={mode === 'total'} onClick={() => onModeChange('total')}>
                        Total
                    </TeamLabModeButton>
                </div>
            </div>

            {loading ? (
                <p role='status' className='mb-0 mt-6 text-sm text-muted-foreground'>
                    Loading team data…
                </p>
            ) : error ? (
                <div className='mt-6 flex flex-wrap items-center justify-between gap-3'>
                    <p role='alert' className='mb-0 text-sm text-destructive'>
                        Could not load the player data.
                    </p>
                    <Button type='button' variant='outline' onClick={onRetry}>
                        Retry
                    </Button>
                </div>
            ) : current.status === 'empty' && proposed.status === 'empty' ? (
                <p className='mb-0 mt-5 rounded-lg bg-muted px-4 py-5 text-sm text-muted-foreground'>
                    Add players to see your team strengths.
                </p>
            ) : current.status === 'unavailable' || proposed.status === 'unavailable' ? (
                <p role='status' className='mb-0 mt-5 rounded-lg bg-muted px-4 py-5 text-sm text-muted-foreground'>
                    Complete team scores are unavailable until every selected player has data for all categories.
                </p>
            ) : (
                <>
                    <TeamStrengthChart
                        categories={categories}
                        current={currentValues}
                        proposed={proposedValues}
                        stances={stances}
                        savedCount={savedCount}
                        previewCount={previewCount}
                        mode={mode}
                    />
                    <StrengthSummary categories={categories} current={currentValues} proposed={proposedValues} />
                    {proposed.status === 'ready' ? (
                        <RawStats stats={proposed.raw} />
                    ) : (
                        <p className='mb-0 mt-3 border-t border-border pt-3 text-sm text-muted-foreground'>
                            Preview lineup has no players.
                        </p>
                    )}
                </>
            )}
        </section>
    );
}

function getStrengthValues(result: TeamStrengthResult): Record<CatKey, number> {
    if (result.status === 'ready') {
        return result.strength;
    }
    return Object.fromEntries(CAT_LABEL_ENTRIES.map(([category]) => [category, 0])) as Record<CatKey, number>;
}

const CAT_LABEL_ENTRIES = Object.entries(CAT_LABELS) as [CatKey, string][];

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
    const largest = Math.max(
        0,
        ...categories.flatMap((category) => [Math.abs(current[category]), Math.abs(proposed[category])])
    );
    const [scale, setScale] = useState(3);

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
                    <StrengthLegendSwatch preview={false} />
                    Saved team ({savedCount}) · solid fill
                </span>
                <span className='inline-flex items-center gap-2'>
                    <StrengthLegendSwatch preview />
                    Preview lineup ({previewCount}) · light overlay
                </span>
            </div>
            <div role='table' aria-label={`${mode === 'average' ? 'Average' : 'Total'} team category strength`}>
                <div
                    className='grid grid-cols-[3.25rem_minmax(0,1fr)] gap-3 border-b border-border pb-2 text-xs font-medium text-muted-foreground md:grid-cols-[4rem_minmax(0,1fr)]'
                    role='row'
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

/** Reflect the chart's signed green/red fills and preview opacity in the legend marker. */
function StrengthLegendSwatch({ preview }: { preview: boolean }) {
    const opacity = preview ? 0.45 : 1;

    return (
        <span aria-hidden='true' className='relative size-3 overflow-hidden rounded-sm bg-muted'>
            <span
                className='absolute inset-y-0 left-0 w-1/2'
                style={{ backgroundColor: 'var(--strength-bad)', opacity }}
            />
            <span
                className='absolute inset-y-0 right-0 w-1/2'
                style={{ backgroundColor: 'var(--strength-good)', opacity }}
            />
            <span className='absolute inset-y-0 left-1/2 z-10 w-px bg-foreground/40' />
        </span>
    );
}

/** Overlay preview as a translucent signed fill on saved strength in one shared track plus exact values. */
function StrengthBar({ saved, preview, scale }: { saved: number; preview: number; scale: number }) {
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

function strengthGeometry(value: number, scale: number) {
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
    const changes = CAT_LABEL_ENTRIES.filter(([category]) => categories.includes(category)).map(([category]) => ({
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
