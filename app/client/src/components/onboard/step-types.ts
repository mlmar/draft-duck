import type { QuizDraft } from '@/lib/quiz';

// Props every step screen receives. parseError is set on Review when persist fails.
export type QuizStepProps = {
    value: QuizDraft;
    onChange: (next: QuizDraft) => void;
    parseError?: string | null;
};
