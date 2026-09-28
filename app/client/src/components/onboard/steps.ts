import { LeagueStep } from '@/components/onboard/steps/league-step';
import { ReviewStep } from '@/components/onboard/steps/review-step';
import { StancesStep } from '@/components/onboard/steps/stances-step';
import { WalkStep } from '@/components/onboard/steps/walk-step';
import type { QuizStepProps } from '@/components/onboard/step-types';
import type { OnboardPath, QuizDraft } from '@/lib/quiz';
import { walkQuestion } from '@draft-duck/core';
import type { ComponentType } from 'react';

export type { QuizStepProps };

export type QuizStepDef = {
    id: string;
    title: string;
    description?: string;
    submit?: boolean;
    continueLabel?: string;
    hideContinue?: boolean;
    Component: ComponentType<QuizStepProps>;
};

export const ONBOARD_STEP_IDS = ['walk', 'stances', 'league', 'review'] as const;

export function isOnboardStepId(value: string | undefined): value is (typeof ONBOARD_STEP_IDS)[number] {
    return value !== undefined && (ONBOARD_STEP_IDS as readonly string[]).includes(value);
}

const LEAGUE_STEP: QuizStepDef = {
    id: 'league',
    title: 'League',
    Component: LeagueStep
};

const REVIEW_STEP: QuizStepDef = {
    id: 'review',
    title: 'Your picks',
    description: 'If everyone took this board in order, these are the names at your pick.',
    submit: true,
    continueLabel: 'See full board',
    Component: ReviewStep
};

const STANCES_STEP: QuizStepDef = {
    id: 'stances',
    title: 'Need and Punt',
    description: 'Presets write the weights. Tap the chart if you want the sliders.',
    Component: StancesStep
};

const WALK_STEP: QuizStepDef = {
    id: 'walk',
    title: 'Not sure',
    hideContinue: true,
    Component: WalkStep
};

export function walkQuestionIndex(draft: QuizDraft, q: number): number {
    const count = draft.walkQuestionIds?.length ?? 0;
    if (count === 0) return 0;
    return Math.min(Math.max(0, q), count - 1);
}

export function currentWalkQuestionId(draft: QuizDraft, q: number): string | undefined {
    const ids = draft.walkQuestionIds ?? [];
    if (ids.length === 0) return undefined;
    return ids[walkQuestionIndex(draft, q)];
}

export function walkStepTitle(draft: QuizDraft, q: number): string {
    const id = currentWalkQuestionId(draft, q);
    return (id && walkQuestion(id)?.prompt) || WALK_STEP.title;
}

export function stepsForPath(path: OnboardPath, draft: QuizDraft): QuizStepDef[] {
    if (path === 'custom') return [STANCES_STEP, LEAGUE_STEP, REVIEW_STEP];
    if (path === 'named') return [LEAGUE_STEP, REVIEW_STEP];
    const walkCount = draft.walkQuestionIds?.length ?? 0;
    if (walkCount === 0) return [LEAGUE_STEP, REVIEW_STEP];
    return [WALK_STEP, LEAGUE_STEP, REVIEW_STEP];
}

export function stepProgress(
    path: OnboardPath,
    draft: QuizDraft,
    stepId: string,
    q: number
): { index: number; count: number } {
    const walkCount = draft.walkQuestionIds?.length ?? 0;
    if (path === 'not-sure' && walkCount > 0) {
        const count = walkCount + 2;
        if (stepId === 'walk') return { index: walkQuestionIndex(draft, q), count };
        if (stepId === 'league') return { index: walkCount, count };
        return { index: walkCount + 1, count };
    }
    const steps = stepsForPath(path, draft);
    const found = steps.findIndex((entry) => entry.id === stepId);
    return { index: found === -1 ? 0 : found, count: steps.length };
}

export function currentStepDef(path: OnboardPath, draft: QuizDraft, stepId: string, q: number): QuizStepDef {
    const steps = stepsForPath(path, draft);
    const match = steps.find((entry) => entry.id === stepId);
    if (match?.id === 'walk') return { ...match, title: walkStepTitle(draft, q) };
    return match ?? steps[0] ?? LEAGUE_STEP;
}

// Fallback for search validation and first paint before the path is known.
export const STEPS: QuizStepDef[] = [LEAGUE_STEP, REVIEW_STEP];
