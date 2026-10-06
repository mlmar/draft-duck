import { WeightsDrawer } from '@/components/onboard/weights-drawer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { QuizDraft } from '@/lib/quiz';
import {
    CAT_LABELS,
    TUNER_MAX,
    TUNER_NEUTRAL,
    TUNER_PUNT,
    formatTuner,
    stanceSummary,
    type CatKey,
    type CatStance
} from '@draft-duck/core';
import { Pencil } from 'lucide-react';
import { useState } from 'react';

const TRACK_CLASS = 'h-8';

const TICKS = Array.from({ length: TUNER_MAX + 1 }, (_, value) => ({ label: String(value), value }));

type WeightChartProps = {
    enabledCats: readonly CatKey[];
    tuners: Partial<Record<CatKey, number>>;
    stances?: Partial<Record<CatKey, CatStance>>;
    variant?: 'default' | 'mini';
};

function tunerOf(tuners: Partial<Record<CatKey, number>>, cat: CatKey): number {
    return tuners[cat] ?? TUNER_NEUTRAL;
}

// 0 is a visual floor. A Custom thumb at 0 looks muted and does not flip the chip to Punt.
function isPunt(stances: Partial<Record<CatKey, CatStance>> | undefined, cat: CatKey, value: number): boolean {
    if (stances?.[cat] === 'punt') return true;
    return value === TUNER_PUNT;
}

export function WeightChart({ enabledCats, tuners, stances, variant = 'default' }: WeightChartProps) {
    const summary = enabledCats.map((cat) => `${CAT_LABELS[cat]} ${formatTuner(tunerOf(tuners, cat))}`).join(', ');

    if (variant === 'mini') {
        return (
            <div
                role='img'
                aria-label={summary}
                className='grid h-20 gap-x-1 lg:h-48 lg:gap-x-3'
                style={{ gridTemplateColumns: `repeat(${enabledCats.length}, minmax(0, 1fr))` }}
            >
                {enabledCats.map((cat) => {
                    const value = tunerOf(tuners, cat);
                    const punted = isPunt(stances, cat, value);
                    const pct = Math.max(0, Math.min(100, (value / TUNER_MAX) * 100));
                    return (
                        <div key={cat} className='flex min-w-0 flex-col items-center justify-end gap-1'>
                            <div className='relative h-12 w-full overflow-hidden rounded-sm bg-muted lg:h-40'>
                                <div
                                    className={cn(
                                        'absolute inset-x-0 bottom-0 rounded-sm',
                                        punted ? 'bg-muted-foreground/40' : 'bg-primary'
                                    )}
                                    style={{ height: `${pct}%` }}
                                />
                            </div>
                            <span className='max-w-full truncate text-sm leading-none text-muted-foreground'>
                                {CAT_LABELS[cat]}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    }

    const body = (
        <div className='grid gap-2'>
            <div className='grid grid-cols-[3.5rem_minmax(0,1fr)] gap-2 text-sm text-muted-foreground'>
                <span className='text-right'>Weight</span>
                <div className='relative h-5'>
                    {TICKS.map((tick) => (
                        <span
                            key={tick.label}
                            className='absolute -translate-x-1/2 whitespace-nowrap first:-translate-x-0 last:-translate-x-full'
                            style={{ left: `${(tick.value / TUNER_MAX) * 100}%` }}
                        >
                            {tick.label}
                        </span>
                    ))}
                </div>
            </div>
            <div className='grid gap-2'>
                {enabledCats.map((cat) => {
                    const value = tunerOf(tuners, cat);
                    const punted = isPunt(stances, cat, value);
                    const pct = Math.max(0, Math.min(100, (value / TUNER_MAX) * 100));
                    return (
                        <div key={cat} className='grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-2'>
                            <span className='text-right text-base text-muted-foreground'>{CAT_LABELS[cat]}</span>
                            <div className={cn('relative w-full overflow-hidden rounded-lg bg-muted', TRACK_CLASS)}>
                                <div
                                    className={cn(
                                        'absolute inset-y-0 left-0 rounded-lg',
                                        punted ? 'bg-muted-foreground/40' : 'bg-primary',
                                        'transition-[width] duration-300 ease-out motion-reduce:transition-none'
                                    )}
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div role='img' aria-label={summary}>
            {body}
        </div>
    );
}

type WeightChartPanelProps = {
    draft: QuizDraft;
    tuners: Partial<Record<CatKey, number>>;
    editable: boolean;
    caption?: string | null;
    onChange: (next: QuizDraft) => void;
    className?: string;
};

export function WeightChartPanel({ draft, tuners, editable, caption, onChange, className }: WeightChartPanelProps) {
    const [weightsOpen, setWeightsOpen] = useState(false);

    if (!editable) {
        return (
            <aside aria-label='Build priorities' className={cn('grid gap-3', className)}>
                <h2 className='mb-0 text-base'>{caption || 'Your priorities so far'}</h2>
                <WeightChart enabledCats={draft.enabledCats} tuners={tuners} variant='mini' />
            </aside>
        );
    }

    return (
        <aside
            aria-label='Build priorities'
            className={cn('grid gap-4 rounded-lg border border-border bg-card p-5', className)}
        >
            <div className='grid gap-2'>
                <h2 className='mb-0 text-lg'>{caption || 'Your category priorities'}</h2>
                <p className='mb-0 text-muted-foreground'>
                    {editable ? stanceSummary(draft) : 'Your answers shape the category weights below.'}
                </p>
            </div>
            <div className='lg:hidden'>
                <WeightChart enabledCats={draft.enabledCats} tuners={tuners} stances={draft.stances} />
            </div>
            <div className='hidden lg:block'>
                <WeightChart enabledCats={draft.enabledCats} tuners={tuners} stances={draft.stances} variant='mini' />
            </div>
            {editable ? (
                <>
                    <Button type='button' variant='outline' className='w-full' onClick={() => setWeightsOpen(true)}>
                        <Pencil aria-hidden='true' /> Edit weights
                    </Button>
                    <WeightsDrawer open={weightsOpen} onOpenChange={setWeightsOpen} value={draft} onApply={onChange} />
                </>
            ) : null}
            <p className='mb-0 text-sm text-muted-foreground'>
                Need counts more. Neutral stays in play. Punt counts as zero.
            </p>
        </aside>
    );
}
