import { ExpandSection } from '@/components/expand-section';
import { IntensityStep } from '@/components/onboard/steps/intensity-step';
import { LeagueStep } from '@/components/onboard/steps/league-step';
import { PresetStep } from '@/components/onboard/steps/preset-step';
import { StanceBar } from '@/components/onboard/steps/stances-step';
import type { QuizDraft } from '@/lib/quiz';

type ProfileSettingsProps = {
    value: QuizDraft;
    onChange: (next: QuizDraft) => void;
    onIntensityChange: (next: QuizDraft) => void;
};

// League, cats, stances, and Fine-tune. Lives in the draft Settings drawer only.
export function ProfileSettings({ value, onChange, onIntensityChange }: ProfileSettingsProps) {
    return (
        <div className='grid gap-8'>
            <div className='grid gap-3'>
                <h2 className='mb-0 text-lg font-medium md:text-lg'>League</h2>
                <LeagueStep value={value} onChange={onChange} slotControl='select' />
            </div>
            <div className='grid gap-3'>
                <h2 className='mb-0 text-lg font-medium md:text-lg'>Categories</h2>
                <PresetStep value={value} onChange={onChange} />
            </div>
            <div className='grid gap-3'>
                <h2 className='mb-0 text-lg font-medium md:text-lg'>Need and Punt</h2>
                <StanceBar value={value} onChange={onChange} />
                <p className='mb-0 text-sm text-muted-foreground'>Punted cats stay uncolored on the full table.</p>
                <ExpandSection label='Fine-tune weights'>
                    <IntensityStep
                        value={value}
                        idPrefix='board-intensity'
                        onChange={(next) => onIntensityChange({ ...next, includeIntensity: true })}
                    />
                </ExpandSection>
            </div>
        </div>
    );
}
