import { OnboardQuiz } from '@/components/onboard/onboard-quiz';
import { PageShell } from '@/components/page-shell';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/onboard')({
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
