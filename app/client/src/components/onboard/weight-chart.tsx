import { IntensityStep } from '@/components/onboard/steps/intensity-step';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { QuizDraft } from '@/lib/quiz';
import { CAT_LABELS, formatTuner, type CatKey, type CatStance } from '@draft-duck/core';
import { useState } from 'react';

const TUNER_MAX = 3;

const TICKS: { label: string; value: number }[] = [
    { label: 'More', value: 3 },
    { label: 'Need', value: 1.5 },
    { label: 'Neutral', value: 1 },
    { label: 'Punt', value: 0 }
];

type WeightChartProps = {
    enabledCats: readonly CatKey[];
    tuners: Partial<Record<CatKey, number>>;
    stances?: Partial<Record<CatKey, CatStance>>;
    interactive?: boolean;
    slidersOpen?: boolean;
    onToggleSliders?: () => void;
};

function tunerOf(tuners: Partial<Record<CatKey, number>>, cat: CatKey): number {
    return tuners[cat] ?? 1;
}

function isPunt(stances: Partial<Record<CatKey, CatStance>> | undefined, cat: CatKey, value: number): boolean {
    if (stances?.[cat] === 'punt') return true;
    return value === 0;
}

export function WeightChart({
    enabledCats,
    tuners,
    stances,
    interactive = false,
    slidersOpen = false,
    onToggleSliders
}: WeightChartProps) {
    const summary = enabledCats.map((cat) => `${CAT_LABELS[cat]} ${formatTuner(tunerOf(tuners, cat))}`).join(', ');

    const plot = (
        <div className='flex min-h-48 min-w-full items-stretch gap-2'>
            {enabledCats.map((cat) => {
                const value = tunerOf(tuners, cat);
                const punted = isPunt(stances, cat, value);
                const pct = Math.max(0, Math.min(100, (value / TUNER_MAX) * 100));
                return (
                    <div key={cat} className='flex min-w-[1.75rem] flex-1 flex-col items-center gap-2'>
                        <div className='relative h-44 w-full rounded-lg bg-muted'>
                            <div
                                className={cn(
                                    'absolute inset-x-0 bottom-0 rounded-lg',
                                    punted ? 'bg-muted-foreground/40' : 'bg-primary',
                                    'transition-[height] duration-300 ease-out motion-reduce:transition-none'
                                )}
                                style={{ height: `${pct}%` }}
                            />
                        </div>
                        <span className='text-muted-foreground'>{CAT_LABELS[cat]}</span>
                    </div>
                );
            })}
        </div>
    );

    const body = (
        <div className='flex gap-3'>
            <div className='relative h-44 w-16 shrink-0 text-muted-foreground'>
                {TICKS.map((tick) => (
                    <span
                        key={tick.label}
                        className='absolute right-0 -translate-y-1/2'
                        style={{ bottom: `${(tick.value / TUNER_MAX) * 100}%` }}
                    >
                        {tick.label}
                    </span>
                ))}
            </div>
            <div className='min-w-0 flex-1 overflow-x-auto'>{plot}</div>
        </div>
    );

    if (!interactive) {
        return (
            <div role='img' aria-label={summary}>
                {body}
            </div>
        );
    }

    return (
        <button
            type='button'
            aria-label='Edit weights'
            aria-expanded={slidersOpen}
            onClick={onToggleSliders}
            className='w-full rounded-lg text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50'
        >
            <span className='sr-only'>{summary}</span>
            {body}
        </button>
    );
}

type WeightChartPanelProps = {
    draft: QuizDraft;
    tuners: Partial<Record<CatKey, number>>;
    interactive: boolean;
    caption?: string | null;
    onChange: (next: QuizDraft) => void;
};

export function WeightChartPanel({ draft, tuners, interactive, caption, onChange }: WeightChartPanelProps) {
    const [slidersOpen, setSlidersOpen] = useState(false);
    const showSliders = interactive && slidersOpen;

    return (
        <div className='grid gap-4'>
            {caption ? <p className='mb-0 text-lg font-semibold tracking-tight md:text-xl'>{caption}</p> : null}
            <WeightChart
                enabledCats={draft.enabledCats}
                tuners={tuners}
                stances={interactive ? draft.stances : undefined}
                interactive={interactive}
                slidersOpen={showSliders}
                onToggleSliders={() => setSlidersOpen((open) => !open)}
            />
            {showSliders ? (
                <div className='grid gap-4'>
                    <IntensityStep value={draft} onChange={onChange} idPrefix='chart-tuner' />
                    <Button
                        type='button'
                        variant='outline'
                        onClick={() => setSlidersOpen(false)}
                        className='w-full md:w-auto'
                    >
                        Done
                    </Button>
                </div>
            ) : null}
        </div>
    );
}
