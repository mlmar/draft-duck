import { IntensityStep } from '@/components/onboard/steps/intensity-step';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { QuizDraft } from '@/lib/quiz';
import { CAT_LABELS, formatTuner, type CatKey, type CatStance } from '@draft-duck/core';
import { useState, type CSSProperties, type KeyboardEvent } from 'react';

const TUNER_MAX = 3;
const TRACK_CLASS = 'h-44';

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

function tickStyle(value: number): { bottom?: string; top?: string; transform?: string } {
    if (value >= TUNER_MAX) return { top: '0' };
    if (value <= 0) return { bottom: '0' };
    return { bottom: `${(value / TUNER_MAX) * 100}%`, transform: 'translateY(50%)' };
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

    const body = (
        <div className='flex items-start gap-3'>
            <div className={cn('relative w-20 shrink-0 text-muted-foreground', TRACK_CLASS)}>
                {TICKS.map((tick) => (
                    <span
                        key={tick.label}
                        className='absolute inset-x-0 text-right leading-none'
                        style={tickStyle(tick.value)}
                    >
                        {tick.label}
                    </span>
                ))}
            </div>
            <div className='min-w-0 flex-1 overflow-x-auto'>
                <div className='grid min-w-full grid-cols-[repeat(var(--cat-count),minmax(1.75rem,1fr))] gap-x-2 gap-y-2'>
                    {enabledCats.map((cat) => {
                        const value = tunerOf(tuners, cat);
                        const punted = isPunt(stances, cat, value);
                        const pct = Math.max(0, Math.min(100, (value / TUNER_MAX) * 100));
                        return (
                            <div
                                key={`${cat}-track`}
                                className={cn('relative w-full rounded-lg bg-muted', TRACK_CLASS)}
                            >
                                <div
                                    className={cn(
                                        'absolute inset-x-0 bottom-0 rounded-lg',
                                        punted ? 'bg-muted-foreground/40' : 'bg-primary',
                                        'transition-[height] duration-300 ease-out motion-reduce:transition-none'
                                    )}
                                    style={{ height: `${pct}%` }}
                                />
                            </div>
                        );
                    })}
                    {enabledCats.map((cat) => (
                        <span key={`${cat}-label`} className='text-center text-muted-foreground'>
                            {CAT_LABELS[cat]}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );

    function handleKey(event: KeyboardEvent<HTMLDivElement>) {
        if (!interactive || !onToggleSliders) return;
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        onToggleSliders();
    }

    if (!interactive) {
        return (
            <div role='img' aria-label={summary} style={{ '--cat-count': enabledCats.length } as CSSProperties}>
                {body}
            </div>
        );
    }

    return (
        <div
            role='button'
            tabIndex={0}
            aria-label='Edit weights'
            aria-expanded={slidersOpen}
            onClick={onToggleSliders}
            onKeyDown={handleKey}
            className='w-full cursor-pointer rounded-lg text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50'
            style={{ '--cat-count': enabledCats.length } as CSSProperties}
        >
            <span className='sr-only'>{summary}</span>
            {body}
        </div>
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
