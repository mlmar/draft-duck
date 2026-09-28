import type { QuizStepProps } from '@/components/onboard/step-types';
import { setCatStance } from '@/lib/quiz';
import { CAT_LABELS, type CatStance } from '@draft-duck/core';
import { cn } from '@/lib/utils';

const STANCES: { value: Exclude<CatStance, 'custom'>; label: string }[] = [
    { value: 'need', label: 'Need' },
    { value: 'neutral', label: 'Neutral' },
    { value: 'punt', label: 'Punt' }
];

// Three-segment bar. Custom is empty selection plus a label, not a fourth radio.
export function StanceBar({ value, onChange }: QuizStepProps) {
    return (
        <div className='grid gap-3'>
            {value.enabledCats.map((cat) => {
                const selected = value.stances[cat] ?? 'neutral';
                const isCustom = selected === 'custom';
                return (
                    <div key={cat} className='grid gap-2'>
                        <p className='mb-0 font-medium'>
                            {CAT_LABELS[cat]}
                            {isCustom ? <span className='font-normal text-muted-foreground'> Custom</span> : null}
                        </p>
                        <div
                            role='radiogroup'
                            aria-label={`${CAT_LABELS[cat]} stance`}
                            className='grid grid-cols-3 rounded-lg border border-border p-0.5'
                        >
                            {STANCES.map((stance) => {
                                const isSelected = !isCustom && selected === stance.value;
                                return (
                                    <button
                                        key={stance.value}
                                        type='button'
                                        role='radio'
                                        aria-checked={isSelected}
                                        onClick={() => onChange(setCatStance(value, cat, stance.value))}
                                        className={cn(
                                            'h-11 rounded-md text-base',
                                            isSelected && stance.value === 'punt' && 'bg-muted text-muted-foreground',
                                            isSelected &&
                                                stance.value !== 'punt' &&
                                                'bg-primary text-primary-foreground',
                                            !isSelected && 'bg-transparent text-muted-foreground hover:bg-muted/60'
                                        )}
                                    >
                                        {stance.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export function StancesStep({ value, onChange }: QuizStepProps) {
    return <StanceBar value={value} onChange={onChange} />;
}
