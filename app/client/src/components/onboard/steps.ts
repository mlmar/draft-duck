import { PlayStep } from '@/components/onboard/steps/play-step';
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

// Play tap goes to league. Custom writes Neutral; stance edits live on Review or the board.
export const STEPS: QuizStepDef[] = [
    {
        id: 'play',
        title: 'How do you want to play?',
        description:
            'A named build writes the stance map. Custom starts Neutral; tune Need / Punt on Review or the board.',
        Component: PlayStep
    },
    {
        id: 'league',
        title: 'League',
        description: 'Size, rounds, snake or linear, and optionally the pick you will sit in.',
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
