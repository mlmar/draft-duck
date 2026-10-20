import { TeamWorkspace } from '@/components/team/team-workspace';
import { PageShell } from '@/components/page-shell';
import { seoMeta } from '@/lib/seo';
import { createFileRoute } from '@tanstack/react-router';

/** Keep Team Lab client-only because saved roster state is hydrated from local browser storage. */
export const Route = createFileRoute('/team')({
    ssr: false,
    component: TeamPage,
    head: () =>
        seoMeta({
            title: 'Team Lab | Draft Duck',
            description: 'Compare fantasy basketball team strengths and test roster changes.',
            path: '/team',
            noIndex: true
        })
});

/** Host the roster workspace in the same wide shell as the draft board. */
function TeamPage() {
    return (
        <PageShell wide className='py-5 md:py-8'>
            <TeamWorkspace />
        </PageShell>
    );
}
