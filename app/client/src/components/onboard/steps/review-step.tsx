import { rankPlayers } from '@/lib/api';
import { quizDraftToProfile } from '@/lib/quiz';
import {
    draftProfileSchema,
    fitMarks,
    overallPicksForDraft,
    type DraftProfile,
    type RankedPlayer
} from '@draft-duck/core';
import { useQuery } from '@tanstack/react-query';
import type { QuizStepProps } from '@/components/onboard/step-types';
import { StancesStep } from '@/components/onboard/steps/stances-step';

// Slot preview, not a recap list. Stance edits re-rank the names at each pick.
export function ReviewStep({ value, onChange, parseError }: QuizStepProps) {
    const parsed = draftProfileSchema.safeParse(quizDraftToProfile(value));
    const profile = parsed.success ? parsed.data : null;

    const previewQuery = useQuery({
        queryKey: ['rank-preview', profile],
        queryFn: () => rankPlayers(profile!),
        enabled: profile !== null
    });

    const players = previewQuery.data ?? [];
    const rankError = previewQuery.error instanceof Error ? previewQuery.error.message : null;
    const overalls = profile ? overallPicksForDraft(profile) : [];
    const slotPicks = overalls.flatMap((overall, index) => {
        const player = players[overall - 1];
        if (!player) return [];
        return [{ overall, round: index + 1, player }];
    });
    const hasSlot = Boolean(profile?.draftSlot);

    return (
        <div className='grid gap-8'>
            {previewQuery.isFetching ? <p className='mb-0'>Ranking a preview…</p> : null}
            {rankError ? <p className='mb-0 text-destructive'>{rankError}</p> : null}
            {parseError ? <p className='mb-0 text-destructive'>{parseError}</p> : null}

            {!hasSlot && !previewQuery.isFetching ? (
                <p className='mb-0 text-muted-foreground'>
                    Set your pick on the league screen to see names at each slot.
                </p>
            ) : null}

            {slotPicks.length > 0 ? (
                <ol className='grid gap-3'>
                    {slotPicks.map(({ overall, round, player }) => (
                        <li key={`${round}-${player.playerId}`} className='grid gap-0.5'>
                            <p className='mb-0 text-sm text-muted-foreground'>
                                Round {round} · Pick {overall}
                            </p>
                            <p className='mb-0'>
                                <span className='font-medium'>{player.name}</span>
                                <span className='text-muted-foreground'> · {player.pos}</span>
                            </p>
                            {profile ? <NeedCatsLine player={player} profile={profile} /> : null}
                        </li>
                    ))}
                </ol>
            ) : null}

            <details className='rounded-lg border border-border bg-card px-4 py-3'>
                <summary className='cursor-pointer font-medium'>Edit stances</summary>
                <div className='mt-4'>
                    <StancesStep value={value} onChange={onChange} />
                </div>
            </details>
        </div>
    );
}

function NeedCatsLine({ player, profile }: { player: RankedPlayer; profile: DraftProfile }) {
    // Need cats this player posts. Hidden when the profile has none (Balanced).
    const marks = fitMarks(player, profile).filter((mark) => !mark.muted);
    if (marks.length === 0) return null;
    return <p className='mb-0 text-sm text-muted-foreground'>{marks.map((mark) => mark.text).join(' · ')}</p>;
}
