import { IntensityStep } from '@/components/onboard/steps/intensity-step';
import { LeagueStep } from '@/components/onboard/steps/league-step';
import { PresetStep } from '@/components/onboard/steps/preset-step';
import { StanceBar } from '@/components/onboard/steps/stances-step';
import type { QuizDraft } from '@/lib/quiz';
import { DATA_MODES } from '@draft-duck/core';

type ProfileSettingsProps = {
    value: QuizDraft;
    onChange: (next: QuizDraft) => void;
    onIntensityChange: (next: QuizDraft) => void;
};

// League, cats, chips, then sliders. Lives in the draft Settings drawer only.
export function ProfileSettings({ value, onChange, onIntensityChange }: ProfileSettingsProps) {
    return (
        <div className='grid gap-8'>
            <div className='grid gap-2'>
                <h2 className='mb-0 text-lg font-medium md:text-lg'>Ranking stats</h2>
                <select
                    id='ranking-data-mode'
                    className='h-11 w-full max-w-sm rounded-lg border border-input bg-transparent px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'
                    value={value.dataMode}
                    onChange={(event) =>
                        onChange({ ...value, dataMode: event.target.value as (typeof DATA_MODES)[number] })
                    }
                >
                    <option value='perGame'>Per game</option>
                    <option value='per36'>Per 36 minutes</option>
                    <option value='totals'>Season totals</option>
                </select>
                <p className='mb-0 text-sm text-muted-foreground'>
                    Sleeper and dud tags compare per-36 rates with per-game and totals rankings for this season.
                </p>
            </div>
            <div className='grid gap-3'>
                <h2 className='mb-0 text-lg font-medium md:text-lg'>League</h2>
                <LeagueStep value={value} onChange={onChange} slotControl='select' />
            </div>
            <div className='grid gap-3 border-t border-border pt-6'>
                <h2 className='mb-0 text-lg font-medium md:text-lg'>Categories</h2>
                <PresetStep value={value} onChange={onChange} />
            </div>
            <div className='grid gap-3 border-t border-border pt-6'>
                <h2 className='mb-0 text-lg font-medium md:text-lg'>Need and Punt</h2>
                <StanceBar value={value} onChange={onChange} />
                <p className='mb-0 text-sm text-muted-foreground'>Punted cats stay uncolored on the full table.</p>
            </div>
            <div className='grid gap-3 border-t border-border pt-6'>
                <h2 className='mb-0 text-lg font-medium md:text-lg'>Weights</h2>
                <IntensityStep value={value} idPrefix='board-intensity' onChange={onIntensityChange} />
            </div>
        </div>
    );
}
