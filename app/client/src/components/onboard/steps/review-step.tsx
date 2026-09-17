import { LinkButton } from '@/components/link-button';
import type { QuizStepProps } from '@/components/onboard/step-types';
import { CAT_LABELS } from '@waiver-warrior/core';

// Recap of the draft, then a top-10 preview after /rank. Continue to draft only shows on success.

function stanceLabel(stance: string | undefined): string {
    if (stance === 'need') return 'Need';
    if (stance === 'punt') return 'Punt';
    return 'Neutral';
}

export function ReviewStep({ value, rankedPlayers, rankError, ranking }: QuizStepProps) {
    const preview = rankedPlayers?.slice(0, 10) ?? [];

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

            {ranking ? <p className='mb-0'>Ranking the board…</p> : null}
            {rankError ? <p className='mb-0 text-destructive'>{rankError}</p> : null}

            {preview.length > 0 ? (
                <div className='grid gap-3'>
                    <p className='mb-0 font-medium'>Top 10 for this profile</p>
                    <ol className='grid gap-1'>
                        {preview.map((player) => (
                            <li key={player.playerId}>
                                {player.rank}. {player.name}{' '}
                                <span className='text-muted-foreground'>{player.team}</span>
                            </li>
                        ))}
                    </ol>
                    <p className='mb-0 mt-2'>
                        <LinkButton href='/draft'>Continue to draft</LinkButton>
                    </p>
                </div>
            ) : null}
        </div>
    );
}
