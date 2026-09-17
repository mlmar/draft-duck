import type { QuizDraft } from '@/lib/quiz';
import type { RankedPlayer } from '@waiver-warrior/core';

// Props every step screen receives. Rank fields are empty until Review posts /rank.
export type QuizStepProps = {
    value: QuizDraft;
    onChange: (next: QuizDraft) => void;
    rankedPlayers?: RankedPlayer[];
    rankError?: string | null;
    ranking?: boolean;
};
