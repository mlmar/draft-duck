import { OnboardQuiz } from '@/components/onboard/onboard-quiz';
import { STEPS } from '@/components/onboard/steps';
import { PageShell } from '@/components/page-shell';
import { searchString } from '@/lib/search';
import { ARCHETYPE_IDS, type ArchetypeId } from '@waiver-warrior/core';
import { createFileRoute } from '@tanstack/react-router';

export type OnboardSearch = {
    step?: string;
    build?: ArchetypeId;
};

function isArchetypeId(value: string): value is ArchetypeId {
    return (ARCHETYPE_IDS as readonly string[]).includes(value);
}

export const Route = createFileRoute('/onboard')({
    validateSearch: (search: Record<string, unknown>): OnboardSearch => {
        const step = searchString(search.step);
        const build = searchString(search.build);
        return {
            step: STEPS.some((entry) => entry.id === step) ? step : undefined,
            build: build && isArchetypeId(build) ? build : undefined
        };
    },
    component: OnboardPage,
    head: () => ({
        meta: [
            { title: 'Onboard - Waiver Warrior' },
            {
                name: 'description',
                content: 'Tell us how you want to play, then rank the 2025-26 board for that profile.'
            }
        ]
    })
});

function OnboardPage() {
    return (
        <PageShell>
            <OnboardQuiz />
        </PageShell>
    );
}
