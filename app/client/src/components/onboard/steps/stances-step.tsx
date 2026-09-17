import { ChoiceRow } from '@/components/onboard/choice-row';
import type { QuizStepProps } from '@/components/onboard/step-types';
import { CAT_LABELS, type CatStance } from '@waiver-warrior/core';

// Need / Neutral / Punt for each enabled cat. Missing stance reads as Neutral.

const STANCES: { value: CatStance; label: string }[] = [
    { value: 'need', label: 'Need' },
    { value: 'neutral', label: 'Neutral' },
    { value: 'punt', label: 'Punt' }
];

export function StancesStep({ value, onChange }: QuizStepProps) {
    return (
        <div className='grid gap-5'>
            <p className='mb-0 text-muted-foreground'>
                Need boosts the cat. Punt drops it from ranking. Neutral is the baseline.
            </p>
            {value.enabledCats.map((cat) => (
                <div key={cat} className='grid gap-2'>
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
