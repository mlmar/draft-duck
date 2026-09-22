import { INTENSITY_HINT, IntensitySlider } from '@/components/onboard/intensity-slider';
import type { QuizStepProps } from '@/components/onboard/step-types';
import { CAT_LABELS } from '@draft-duck/core';

type IntensityStepProps = QuizStepProps & {
    idPrefix?: string;
};

// Every enabled cat. Punt sliders stay disabled so intensity is not written for them.

export function IntensityStep({ value, onChange, idPrefix = 'intensity' }: IntensityStepProps) {
    return (
        <div className='grid gap-5'>
            <p className='mb-0 text-muted-foreground'>{INTENSITY_HINT}</p>
            {value.enabledCats.map((cat) => {
                const punted = (value.stances[cat] ?? 'neutral') === 'punt';
                return (
                    <IntensitySlider
                        key={cat}
                        id={`${idPrefix}-${cat}`}
                        label={CAT_LABELS[cat]}
                        value={value.intensity[cat] ?? 1}
                        disabled={punted}
                        onChange={(intensity) =>
                            onChange({
                                ...value,
                                intensity: { ...value.intensity, [cat]: intensity }
                            })
                        }
                    />
                );
            })}
        </div>
    );
}
