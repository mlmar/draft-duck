import { ChoiceRow } from '@/components/onboard/choice-row';
import type { QuizStepProps } from '@/components/onboard/step-types';
import { applyPreset, setCustomCats, type CatPreset } from '@/lib/quiz';
import { CAT_KEYS, CAT_LABELS } from '@waiver-warrior/core';

// 9-cat, 8-cat (drops TOV), or custom toggles. Individual cat chips only appear on Custom.

const PRESETS: { value: CatPreset; label: string; description: string }[] = [
    { value: '9cat', label: '9-cat', description: 'All nine cats' },
    { value: '8cat', label: '8-cat', description: 'No turnovers' },
    { value: 'custom', label: 'Custom', description: 'Pick which cats count' }
];

export function PresetStep({ value, onChange }: QuizStepProps) {
    return (
        <div className='grid gap-6'>
            <ChoiceRow
                value={value.preset}
                options={PRESETS}
                onChange={(preset) => onChange(applyPreset(value, preset))}
            />
            {value.preset === 'custom' ? (
                <div className='grid gap-2'>
                    <p className='mb-0 font-medium'>Categories</p>
                    <ChoiceRow
                        value={undefined}
                        options={CAT_KEYS.map((cat) => ({ value: cat, label: CAT_LABELS[cat] }))}
                        selected={(cat) => value.enabledCats.includes(cat)}
                        onChange={(cat) => {
                            const enabled = value.enabledCats.includes(cat)
                                ? value.enabledCats.filter((entry) => entry !== cat)
                                : [...value.enabledCats, cat];
                            onChange(setCustomCats(value, enabled));
                        }}
                    />
                    {value.enabledCats.length === 0 ? (
                        <p className='mb-0 text-muted-foreground'>Pick at least one category.</p>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
