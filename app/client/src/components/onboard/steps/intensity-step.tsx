import { IntensitySlider } from '@/components/onboard/intensity-slider';
import type { QuizStepProps } from '@/components/onboard/step-types';
import { CAT_LABELS } from '@waiver-warrior/core';

// Optional per-cat weights for enabled non-punt cats. Skip vs continue is decided in the shell.

export function IntensityStep({ value, onChange }: QuizStepProps) {
    const cats = value.enabledCats.filter((cat) => (value.stances[cat] ?? 'neutral') !== 'punt');

    if (cats.length === 0) {
        return <p className='mb-0'>Every enabled category is punted, so there is nothing to weight.</p>;
    }

    return (
        <div className='grid gap-5'>
            {cats.map((cat) => (
                <IntensitySlider
                    key={cat}
                    id={`intensity-${cat}`}
                    label={CAT_LABELS[cat]}
                    value={value.intensity[cat] ?? 1}
                    onChange={(intensity) =>
                        onChange({
                            ...value,
                            intensity: { ...value.intensity, [cat]: intensity }
                        })
                    }
                />
            ))}
        </div>
    );
}
