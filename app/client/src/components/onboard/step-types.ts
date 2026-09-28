import type { QuizDraft } from '@/lib/quiz';
import type { WalkChoiceId } from '@draft-duck/core';

// Props every step screen receives. parseError is set on Review when persist fails.
export type QuizStepProps = {
    value: QuizDraft;
    onChange: (next: QuizDraft) => void;
    parseError?: string | null;
    questionId?: string;
    onWalkAnswer?: (side: WalkChoiceId) => void;
};
