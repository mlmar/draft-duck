import type { QuizStepProps } from '@/components/onboard/step-types';
import { CAT_LABELS } from '@waiver-warrior/core';

// Recap of the draft. Rank my board persists and leaves for /draft.

function stanceLabel(stance: string | undefined): string {
    if (stance === 'need') return 'Need';
    if (stance === 'punt') return 'Punt';
    return 'Neutral';
}

export function ReviewStep({ value, parseError }: QuizStepProps) {
    return (
        <div className='grid gap-8'>
            <dl className='grid gap-4'>
                <div className='grid gap-1'>
                    <dt className='text-muted-foreground'>League</dt>
                    <dd>
                        {value.leagueSize} teams, {value.draftRounds} rounds, {value.draftType}
                    </dd>
                </div>
                <div className='grid gap-1'>
                    <dt className='text-muted-foreground'>Categories</dt>
                    <dd>{value.enabledCats.map((cat) => CAT_LABELS[cat]).join(', ')}</dd>
                </div>
                <div className='grid gap-1'>
                    <dt className='text-muted-foreground'>Stances</dt>
                    <dd>
                        <ul className='mt-1 grid gap-1'>
                            {value.enabledCats.map((cat) => (
                                <li key={cat}>
                                    {CAT_LABELS[cat]}: {stanceLabel(value.stances[cat])}
                                    {value.includeIntensity && (value.stances[cat] ?? 'neutral') !== 'punt'
                                        ? ` · intensity ${(value.intensity[cat] ?? 1).toFixed(1)}`
                                        : ''}
                                </li>
                            ))}
                        </ul>
                    </dd>
                </div>
            </dl>

            {parseError ? <p className='mb-0 text-destructive'>{parseError}</p> : null}
        </div>
    );
}
