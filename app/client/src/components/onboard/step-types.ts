import type { QuizDraft } from '@/lib/quiz';

// Props every step screen receives. parseError is set on Review when persist fails.
// onChosen is Play-only: tap writes the map and leaves the screen.
export type QuizStepProps = {
    value: QuizDraft;
    onChange: (next: QuizDraft) => void;
    parseError?: string | null;
    onChosen?: (next: QuizDraft) => void;
};
