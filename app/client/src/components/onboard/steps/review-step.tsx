import { PickCard } from '@/components/draft/pick-card';
import type { QuizStepProps } from '@/components/onboard/step-types';
import { rankPlayers } from '@/lib/api';
import { quizDraftToProfile } from '@/lib/quiz';
import { draftProfileSchema, overallPicksForDraft } from '@draft-duck/core';
import { useQuery } from '@tanstack/react-query';

// Slot preview, not a recap list. Names at each pick come from the current draft.
export function ReviewStep({ value, parseError }: QuizStepProps) {
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
        <div className='grid gap-6'>
            {previewQuery.isFetching ? <p className='mb-0'>lining them up…</p> : null}
            {rankError ? <p className='mb-0 text-destructive'>{rankError}</p> : null}
            {parseError ? <p className='mb-0 text-destructive'>{parseError}</p> : null}

            {!hasSlot && !previewQuery.isFetching ? (
                <p className='mb-0 text-muted-foreground'>
                    Set your pick on the league screen to see names at each slot.
                </p>
            ) : null}

            {slotPicks.length > 0 && profile ? (
                <ol className='grid gap-3'>
                    {slotPicks.map(({ overall, round, player }) => (
                        <li key={`${round}-${player.playerId}`}>
                            <PickCard round={round} overall={overall} player={player} profile={profile} />
                        </li>
                    ))}
                </ol>
            ) : null}
        </div>
    );
}
