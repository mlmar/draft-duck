import { LinkButton } from '@/components/link-button';
import { PageShell } from '@/components/page-shell';
import { SiteNav } from '@/components/site-nav';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
    component: HomePage,
    head: () => ({
        meta: [{ title: 'Waiver Warrior' }]
    })
});

function HomePage() {
    return (
        <PageShell className='justify-center'>
            <p className='font-medium text-primary'>Fantasy basketball</p>
            <h1>Waiver Warrior</h1>
            <p className='max-w-md'>
                Set your category profile, then rank the 2025-26 board. The table is the app. Draft assistance splits
                that list into round buckets.
            </p>
            <p className='mt-8 mb-0'>
                <LinkButton to='/onboard'>Start</LinkButton>
            </p>
            <SiteNav />
        </PageShell>
    );
}
