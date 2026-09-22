import { OnboardQuiz } from '@/components/onboard/onboard-quiz';
import { STEPS } from '@/components/onboard/steps';
import { PageShell } from '@/components/page-shell';
import { searchString } from '@/lib/search';
import { createFileRoute } from '@tanstack/react-router';

export type OnboardSearch = {
    step?: string;
};

export const Route = createFileRoute('/onboard')({
    validateSearch: (search: Record<string, unknown>): OnboardSearch => {
        const step = searchString(search.step);
        return {
            step: STEPS.some((entry) => entry.id === step) ? step : undefined
        };
    },
    component: OnboardPage,
    head: () => ({
        meta: [
            { title: 'Onboard - Waiver Warrior' },
            {
                name: 'description',
                content: 'Set league size, categories, and stances before ranking the board.'
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
