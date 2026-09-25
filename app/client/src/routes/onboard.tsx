import { OnboardQuiz } from '@/components/onboard/onboard-quiz';
import { STEPS } from '@/components/onboard/steps';
import { PageShell } from '@/components/page-shell';
import { searchString } from '@/lib/search';
import { ARCHETYPE_IDS, type ArchetypeId } from '@draft-duck/core';
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
            { title: 'Onboard - draft duck' },
            {
                name: 'description',
                content: "Pick a stance, we'll rank it. get your ducks in a row."
            }
        ]
    })
});

function OnboardPage() {
    return (
        <PageShell inset='quiz'>
            <OnboardQuiz />
        </PageShell>
    );
}
