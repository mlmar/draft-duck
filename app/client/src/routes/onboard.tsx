import { OnboardQuiz } from '@/components/onboard/onboard-quiz';
import { isOnboardStepId } from '@/components/onboard/steps';
import { PageShell } from '@/components/page-shell';
import { searchString } from '@/lib/search';
import { ARCHETYPE_IDS, type ArchetypeId } from '@draft-duck/core';
import { createFileRoute } from '@tanstack/react-router';

export type OnboardSearch = {
    step?: string;
    build?: ArchetypeId;
    start?: 'not-sure';
    q?: string;
};

function isArchetypeId(value: string): value is ArchetypeId {
    return (ARCHETYPE_IDS as readonly string[]).includes(value);
}

export const Route = createFileRoute('/onboard')({
    validateSearch: (search: Record<string, unknown>): OnboardSearch => {
        const step = searchString(search.step);
        const build = searchString(search.build);
        const start = searchString(search.start);
        const q = searchString(search.q);
        return {
            step: isOnboardStepId(step) ? step : undefined,
            build: build && isArchetypeId(build) ? build : undefined,
            start: start === 'not-sure' ? start : undefined,
            q: q && /^\d+$/.test(q) ? q : undefined
        };
    },
    component: OnboardPage,
    head: () => ({
        meta: [
            { title: 'Onboard - draft duck' },
            {
                name: 'description',
                content: "Get your ducks in a row. Pick a punt, we'll rank it."
            }
        ]
    })
});

function OnboardPage() {
    return (
        <PageShell inset='quiz' wide>
            <OnboardQuiz />
        </PageShell>
    );
}
