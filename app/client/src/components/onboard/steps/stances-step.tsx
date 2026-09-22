import { ChoiceRow } from '@/components/onboard/choice-row';
import { IntensityStep } from '@/components/onboard/steps/intensity-step';
import type { QuizStepProps } from '@/components/onboard/step-types';
import { CAT_LABELS, type CatStance } from '@draft-duck/core';

// Need / Neutral / Punt for each enabled cat. Fine-tune stays closed until Custom opens it.

const STANCES: { value: CatStance; label: string }[] = [
    { value: 'need', label: 'Need' },
    { value: 'neutral', label: 'Neutral' },
    { value: 'punt', label: 'Punt' }
];

export function StanceBar({ value, onChange }: QuizStepProps) {
    return (
        <div className='grid gap-3'>
            {value.enabledCats.map((cat) => (
                <div key={cat} className='grid gap-2 sm:grid-cols-[4.5rem_1fr] sm:items-center'>
                    <p className='mb-0 font-medium'>{CAT_LABELS[cat]}</p>
                    <ChoiceRow
                        value={value.stances[cat] ?? 'neutral'}
                        options={STANCES}
                        onChange={(stance) =>
                            onChange({
                                ...value,
                                stances: { ...value.stances, [cat]: stance }
                            })
                        }
                    />
                </div>
            ))}
        </div>
    );
}

export function StancesStep({ value, onChange }: QuizStepProps) {
    const showFineTune = value.archetypeId === 'custom';

    return (
        <div className='grid gap-6'>
            <StanceBar value={value} onChange={onChange} />
            {showFineTune ? (
                <details className='rounded-lg border border-border bg-card px-4 py-3'>
                    <summary className='cursor-pointer font-medium'>Fine-tune</summary>
                    <div className='mt-4'>
                        <IntensityStep
                            value={value}
                            onChange={(next) => onChange({ ...next, includeIntensity: true })}
                        />
                    </div>
                </details>
            ) : null}
        </div>
    );
}
