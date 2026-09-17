import { ArchetypeStep } from '@/components/onboard/steps/archetype-step';
import { DraftTypeStep } from '@/components/onboard/steps/draft-type-step';
import { IntensityStep } from '@/components/onboard/steps/intensity-step';
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

// Edit this list to reorder, drop, or insert screens.
export const STEPS: QuizStepDef[] = [
    {
        id: 'league',
        title: 'League',
        description: 'Team count and roster depth change who is still on the board in later rounds.',
        Component: LeagueStep
    },
    {
        id: 'draftType',
        title: 'Draft type',
        description: 'Snake reverses pick order each round. Linear keeps the same order every round.',
        Component: DraftTypeStep
    },
    {
        id: 'preset',
        title: 'Categories',
        description: 'Only the cats you play affect ranking. 8-cat drops turnovers.',
        Component: PresetStep
    },
    {
        id: 'stances',
        title: 'Stances',
        description: 'Need boosts that cat. Punt ignores it. Neutral is the default.',
        Component: StancesStep
    },
    {
        id: 'intensity',
        title: 'Intensity',
        description: 'How hard to lean into each remaining cat. Skip if 1.0 is fine.',
        optional: true,
        skipLabel: 'Use defaults',
        Component: IntensityStep,
        applyContinue: (draft) => ({ ...draft, includeIntensity: true }),
        applySkip: (draft) => ({ ...draft, includeIntensity: false })
    },
    {
        id: 'archetype',
        title: 'Build',
        description: 'One tap. Stocks marks steals and blocks as Need. Points marks scoring. Existing punts stay.',
        optional: true,
        skipLabel: 'Skip this',
        Component: ArchetypeStep
    },
    {
        id: 'review',
        title: 'Review',
        description: 'Check the profile, then rank. The top 10 is a preview, not the draft board.',
        submit: true,
        continueLabel: 'Rank my board',
        Component: ReviewStep
    }
];
