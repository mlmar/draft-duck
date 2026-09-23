import { ExpandSection } from '@/components/expand-section';
import type { QuizStepProps } from '@/components/onboard/step-types';
import { IntensityStep } from '@/components/onboard/steps/intensity-step';
import { CAT_LABELS, type CatStance } from '@draft-duck/core';
import { cn } from '@/lib/utils';

const STANCES: { value: CatStance; label: string }[] = [
    { value: 'need', label: 'Need' },
    { value: 'neutral', label: 'Neutral' },
    { value: 'punt', label: 'Punt' }
];

// One segmented bar per cat. Punt selected is muted so it does not read as an error.
export function StanceBar({ value, onChange }: QuizStepProps) {
    return (
        <div className='grid gap-3'>
            {value.enabledCats.map((cat) => {
                const selected = value.stances[cat] ?? 'neutral';
                return (
                    <div key={cat} className='grid gap-2'>
                        <p className='mb-0 font-medium'>{CAT_LABELS[cat]}</p>
                        <div
                            role='radiogroup'
                            aria-label={`${CAT_LABELS[cat]} stance`}
                            className='grid grid-cols-3 rounded-lg border border-border p-0.5'
                        >
                            {STANCES.map((stance) => {
                                const isSelected = selected === stance.value;
                                return (
                                    <button
                                        key={stance.value}
                                        type='button'
                                        role='radio'
                                        aria-checked={isSelected}
                                        onClick={() =>
                                            onChange({
                                                ...value,
                                                stances: { ...value.stances, [cat]: stance.value }
                                            })
                                        }
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
    const showFineTune = value.archetypeId === 'custom';

    return (
        <div className='grid gap-6'>
            <StanceBar value={value} onChange={onChange} />
            {showFineTune ? (
                <ExpandSection label='Fine-tune'>
                    <IntensityStep value={value} onChange={(next) => onChange({ ...next, includeIntensity: true })} />
                </ExpandSection>
            ) : null}
        </div>
    );
}
