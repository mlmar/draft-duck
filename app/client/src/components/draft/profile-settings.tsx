import { IntensityStep } from '@/components/onboard/steps/intensity-step';
import { LeagueStep } from '@/components/onboard/steps/league-step';
import { PresetStep } from '@/components/onboard/steps/preset-step';
import type { QuizDraft } from '@/lib/quiz';

type ProfileSettingsProps = {
    value: QuizDraft;
    onChange: (next: QuizDraft) => void;
    onIntensityChange: (next: QuizDraft) => void;
};

// League, cats, and intensity behind Edit. Stances live on the always-visible bar.
export function ProfileSettings({ value, onChange, onIntensityChange }: ProfileSettingsProps) {
    return (
        <div className='grid gap-8'>
            <div className='grid gap-3'>
                <h2 className='mb-0 text-lg font-medium md:text-lg'>League</h2>
                <LeagueStep value={value} onChange={onChange} />
            </div>
            <div className='grid gap-3'>
                <h2 className='mb-0 text-lg font-medium md:text-lg'>Categories</h2>
                <PresetStep value={value} onChange={onChange} />
            </div>
            <div className='grid gap-3'>
                <h2 className='mb-0 text-lg font-medium md:text-lg'>Intensity</h2>
                <IntensityStep
                    value={value}
                    idPrefix='board-intensity'
                    onChange={(next) => onIntensityChange({ ...next, includeIntensity: true })}
                />
            </div>
        </div>
    );
}
