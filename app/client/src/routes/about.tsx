import { EntryCtas } from '@/components/entry-ctas';
import { PageShell } from '@/components/page-shell';
import { SiteNav } from '@/components/site-nav';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/about')({
    component: AboutPage,
    head: () => ({
        meta: [
            { title: 'About - Waiver Warrior' },
            {
                name: 'description',
                content: 'Waiver Warrior is a no-account category-league fantasy basketball helper.'
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
                Waiver Warrior is a first-run helper for category fantasy basketball. Answer a short quiz, save a
                profile on this device, and get a weighted ranking of the 2025-26 per-game board.
            </p>
            <p>
                There are no accounts. The quiz writes <code className='text-foreground'>ww.draftProfile</code> in{' '}
                <code className='text-foreground'>localStorage</code>. Ranking stays on a local Fastify API over a CSV.
                Live NBA fetch and Yahoo leagues are later work.
            </p>
            <p className='mb-0'>The quiz sets the weights. The table is the result.</p>
            <EntryCtas />
            <SiteNav />
        </PageShell>
    );
}
