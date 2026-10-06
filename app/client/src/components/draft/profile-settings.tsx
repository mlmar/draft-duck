import { CategoryPriorityEditor } from '@/components/onboard/category-priority-editor';
import { LeagueStep } from '@/components/onboard/steps/league-step';
import { PresetStep } from '@/components/onboard/steps/preset-step';
import type { QuizDraft } from '@/lib/quiz';
import { DATA_MODES } from '@draft-duck/core';

type ProfileSettingsProps = {
    value: QuizDraft;
    onChange: (next: QuizDraft) => void;
};

// One priority editor links presets and precise weights.
export function ProfileSettings({ value, onChange }: ProfileSettingsProps) {
    return (
        <div className='grid gap-8'>
            <div className='grid gap-2'>
                <h2 className='mb-0 text-lg font-medium md:text-lg'>Ranking basis</h2>
                <select
                    id='ranking-data-mode'
                    aria-label='Ranking basis'
                    className='h-11 w-full md:max-w-sm rounded-lg border border-input bg-transparent pl-3 pr-10 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'
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
                    Upside and Streaky markers compare per-36 rates with per-game and totals rankings for this season.
                </p>
            </div>
            <div className='grid gap-3'>
                <h2 className='mb-0 text-lg font-medium md:text-lg'>League</h2>
                <LeagueStep value={value} onChange={onChange} slotControl='select' fullWidth />
            </div>
            <div className='grid gap-3 border-t border-border pt-6'>
                <h2 className='mb-0 text-lg font-medium md:text-lg'>Categories</h2>
                <PresetStep value={value} onChange={onChange} fullWidth />
            </div>
            <div className='grid gap-3 border-t border-border pt-6'>
                <h2 className='mb-0 text-lg font-medium md:text-lg'>Category priorities</h2>
                <CategoryPriorityEditor value={value} onChange={onChange} />
            </div>
        </div>
    );
}
