import { PlayStep } from '@/components/onboard/steps/play-step';
import { LeagueStep } from '@/components/onboard/steps/league-step';
import { PresetStep } from '@/components/onboard/steps/preset-step';
import { ReviewStep } from '@/components/onboard/steps/review-step';
import { StancesStep } from '@/components/onboard/steps/stances-step';
import type { QuizStepProps } from '@/components/onboard/step-types';
import type { QuizDraft } from '@/lib/quiz';
import type { ComponentType } from 'react';

export type { QuizStepProps };

// One screen in the quiz. Reorder STEPS to change the flow without touching each component.
export type QuizStepDef = {
    id: string;
    title: string;
    description?: string;
    optional?: boolean;
    submit?: boolean;
    continueLabel?: string;
    skipLabel?: string;
    Component: ComponentType<QuizStepProps>;
    applyContinue?: (draft: QuizDraft) => QuizDraft;
    applySkip?: (draft: QuizDraft) => QuizDraft;
};

// Named path is four screens. Custom inserts stances between play and league.
export const STEPS: QuizStepDef[] = [
    {
        id: 'preset',
        title: 'Categories',
        description: 'Only the cats you play affect ranking. 8-cat drops turnovers.',
        Component: PresetStep
    },
    {
        id: 'play',
        title: 'How do you want to play?',
        description: 'A named build writes the stance map. Custom asks Need / Neutral / Punt next.',
        Component: PlayStep
    },
    {
        id: 'stances',
        title: 'Stances',
        description: 'Need boosts that cat. Punt ignores it. Neutral is the default. Fine-tune is optional.',
        Component: StancesStep
    },
    {
        id: 'league',
        title: 'League',
        description: 'Size, rounds, snake or linear, and the pick you will sit in.',
        Component: LeagueStep
    },
    {
        id: 'review',
        title: 'Review',
        description: 'These are the names at your pick if the room drafted this board in order.',
        submit: true,
        continueLabel: 'Rank my board',
        Component: ReviewStep
    }
];

export function visibleSteps(draft: QuizDraft, currentStepId?: string): QuizStepDef[] {
    const includeStances = draft.archetypeId === 'custom' || currentStepId === 'stances';
    if (includeStances) return STEPS;
    return STEPS.filter((step) => step.id !== 'stances');
}
