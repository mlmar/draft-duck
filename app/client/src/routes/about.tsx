import { EntryCtas } from '@/components/entry-ctas';
import { PageShell } from '@/components/page-shell';
import { seoMeta } from '@/lib/seo';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/about')({
    component: AboutPage,
    head: () =>
        seoMeta({
            title: 'About Draft Duck | Fantasy Basketball Category Rankings',
            description:
                'Draft Duck helps fantasy basketball managers shape a category build and rank players for their league. Your saved profile stays on your device.',
            path: '/about'
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
            <p className='text-sm text-muted-foreground'>
                Player statistics are sourced from{' '}
                <a
                    href='https://www.basketball-reference.com/'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-foreground underline underline-offset-4 hover:text-brand'
                >
                    Basketball-Reference
                </a>
                .
            </p>
            <EntryCtas />
        </PageShell>
    );
}
