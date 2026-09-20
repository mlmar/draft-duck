import { IntensitySlider } from '@/components/onboard/intensity-slider';
import { DraftTypeStep } from '@/components/onboard/steps/draft-type-step';
import { LeagueStep } from '@/components/onboard/steps/league-step';
import { PresetStep } from '@/components/onboard/steps/preset-step';
import { StancesStep } from '@/components/onboard/steps/stances-step';
import { CAT_LABELS } from '@waiver-warrior/core';
import type { QuizDraft } from '@/lib/quiz';

type ProfileSettingsProps = {
    value: QuizDraft;
    onChange: (next: QuizDraft) => void;
    onIntensityChange: (next: QuizDraft) => void;
};

// Same quiz fields as /onboard, one screen. Intensity writes go through a debounce at the board.

export function ProfileSettings({ value, onChange, onIntensityChange }: ProfileSettingsProps) {
    const intensityCats = value.enabledCats.filter((cat) => (value.stances[cat] ?? 'neutral') !== 'punt');

    return (
        <div className='grid gap-8'>
            <div className='grid gap-3'>
                <h2 className='mb-0 text-lg font-medium md:text-lg'>League</h2>
                <LeagueStep value={value} onChange={onChange} />
            </div>
            <div className='grid gap-3'>
                <h2 className='mb-0 text-lg font-medium md:text-lg'>Draft type</h2>
                <DraftTypeStep value={value} onChange={onChange} />
            </div>
            <div className='grid gap-3'>
                <h2 className='mb-0 text-lg font-medium md:text-lg'>Categories</h2>
                <PresetStep value={value} onChange={onChange} />
            </div>
            <div className='grid gap-3'>
                <h2 className='mb-0 text-lg font-medium md:text-lg'>Stances</h2>
                <StancesStep value={value} onChange={onChange} />
            </div>
            <div className='grid gap-3'>
                <h2 className='mb-0 text-lg font-medium md:text-lg'>Intensity</h2>
                {intensityCats.length === 0 ? (
                    <p className='mb-0 text-muted-foreground'>
                        Every enabled category is punted, so there is nothing to weight.
                    </p>
                ) : (
                    <div className='grid gap-5'>
                        {intensityCats.map((cat) => (
                            <IntensitySlider
                                key={cat}
                                id={`board-intensity-${cat}`}
                                label={CAT_LABELS[cat]}
                                value={value.intensity[cat] ?? 1}
                                onChange={(intensity) =>
                                    onIntensityChange({
                                        ...value,
                                        includeIntensity: true,
                                        intensity: { ...value.intensity, [cat]: intensity }
                                    })
                                }
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
