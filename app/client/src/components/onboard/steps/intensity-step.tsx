import { INTENSITY_HINT, IntensitySlider } from '@/components/onboard/intensity-slider';
import type { QuizStepProps } from '@/components/onboard/step-types';
import { setCatTuner } from '@/lib/quiz';
import { CAT_LABELS } from '@draft-duck/core';

type IntensityStepProps = QuizStepProps & {
    idPrefix?: string;
};

export function IntensityStep({ value, onChange, idPrefix = 'intensity' }: IntensityStepProps) {
    return (
        <div className='grid gap-0'>
            <p className='mb-0 text-muted-foreground'>{INTENSITY_HINT}</p>
            {value.enabledCats.map((cat) => {
                return (
                    <IntensitySlider
                        key={cat}
                        id={`${idPrefix}-${cat}`}
                        label={CAT_LABELS[cat]}
                        value={value.intensity[cat] ?? 1}
                        onChange={(tuner) => onChange(setCatTuner(value, cat, tuner))}
                    />
                );
            })}
        </div>
    );
}
