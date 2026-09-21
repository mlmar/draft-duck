import { LinkButton } from '@/components/link-button';
import { PageShell } from '@/components/page-shell';
import { SiteNav } from '@/components/site-nav';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/how-it-works')({
    component: HowItWorksPage,
    head: () => ({
        meta: [
            { title: 'Scoring - Waiver Warrior' },
            {
                name: 'description',
                content: 'How Waiver Warrior turns category stances into a weighted z-score board.'
            }
        ]
    })
});

function HowItWorksPage() {
    return (
        <PageShell>
            <p className='font-medium text-primary'>Scoring</p>
            <h1>How the board is ranked</h1>
            <p>
                Every player is scored against the same filtered 2025-26 per-game universe. The quiz does not invent
                stats. It only changes how much each category counts.
            </p>

            <h2>Z-scores, then weights</h2>
            <p>
                Counting stats (points, boards, assists, stocks, threes) are z-scored versus league mean. Turnovers
                flip: fewer is better. Field-goal and free-throw percentage use volume-adjusted impact, so a 70% shooter
                on two attempts does not beat a 55% shooter on fifteen.
            </p>
            <p>
                The composite is operator weight times your profile weight times that z-score, summed across enabled
                cats. Need is 1.5, Neutral is 1, Punt is 0. Optional intensity (0–2, default 1) scales a non-punt cat.
            </p>

            <h2>Punts and 8-cat</h2>
            <p>
                Punt zeroes that cat in the sum. An 8-cat preset drops turnovers from the board entirely, which is not
                the same as punting them.
            </p>

            <h2>Draft assistance</h2>
            <p className='mb-0'>
                Assistance does not re-rank. It slices the same ordered list into round buckets of league size. The last
                round holds everyone past a full roster. Snake versus linear does not change who sits in a bucket.
            </p>
            <p className='mt-8 mb-0'>
                <LinkButton to='/onboard'>Start</LinkButton>
            </p>
            <SiteNav />
        </PageShell>
    );
}
