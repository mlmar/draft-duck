import { LeagueWorkspace } from '@/components/league/league-workspace';
import { PageShell } from '@/components/page-shell';
import { seoMeta } from '@/lib/seo';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/league')({
    ssr: false,
    component: LeaguePage,
    head: () =>
        seoMeta({
            title: 'League Comparison | Draft Duck',
            description: 'Compare weekly fantasy basketball category results from Yahoo.',
            path: '/league',
            noIndex: true
        })
});

function LeaguePage() {
    return (
        <PageShell wide className='py-5 md:py-8'>
            <LeagueWorkspace />
        </PageShell>
    );
}
