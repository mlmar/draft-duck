import { LeagueStep } from '@/components/onboard/steps/league-step';
import { ReviewStep } from '@/components/onboard/steps/review-step';
import type { QuizStepProps } from '@/components/onboard/step-types';
import type { ComponentType } from 'react';

export type { QuizStepProps };

// One screen in the quiz. Reorder STEPS to change the flow without touching each component.
export type QuizStepDef = {
    id: string;
    title: string;
    description?: string;
    submit?: boolean;
    continueLabel?: string;
    Component: ComponentType<QuizStepProps>;
};

// Home is the stance picker. League is first. Custom writes Neutral on the home card.
export const STEPS: QuizStepDef[] = [
    {
        id: 'league',
        title: 'League',
        Component: LeagueStep
    },
    {
        id: 'review',
        title: 'Your picks',
        description: 'If everyone took this board in order, these are the names at your pick.',
        submit: true,
        continueLabel: 'See full board',
        Component: ReviewStep
    }
];
