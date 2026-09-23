import { EntryCtas } from '@/components/entry-ctas';
import { PageShell } from '@/components/page-shell';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/about')({
    component: AboutPage,
    head: () => ({
        meta: [
            { title: 'About - Draft Duck' },
            {
                name: 'description',
                content: 'Draft Duck is a no-account category-league fantasy basketball helper.'
            }
        ]
    })
});

function AboutPage() {
    return (
        <PageShell>
            <h1>A quiz that ranks a board</h1>
            <p>
                Answer a few questions about how you want to play. We rank this year's players for that profile. Nothing
                to sign up for. Answers stay on this device.
            </p>
            <p className='mb-0'>The quiz sets the weights. The table is the result.</p>
            <EntryCtas />
        </PageShell>
    );
}
