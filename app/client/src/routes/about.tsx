import { EntryCtas } from '@/components/entry-ctas';
import { PageShell } from '@/components/page-shell';
import { SiteNav } from '@/components/site-nav';
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
            <p className='font-medium text-primary'>About</p>
            <h1>A CAT quiz that ranks a board</h1>
            <p>
                Draft Duck is a first-run helper for category fantasy basketball. Answer a short quiz, save a profile on
                this device, and get a weighted ranking of the 2025-26 per-game board.
            </p>
            <p>
                There are no accounts. The quiz writes <code className='text-foreground'>dd.draftProfile</code> in{' '}
                <code className='text-foreground'>localStorage</code>. Ranking stays on a local Fastify API over a CSV.
                Live NBA fetch and Yahoo leagues are later work.
            </p>
            <p className='mb-0'>The quiz sets the weights. The table is the result.</p>
            <EntryCtas />
            <SiteNav />
        </PageShell>
    );
}
