import { AboutLink } from '@/components/about-link';
import { EntryCtas } from '@/components/entry-ctas';
import { PageShell } from '@/components/page-shell';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/how-it-works')({
    component: HowItWorksPage,
    head: () => ({
        meta: [
            { title: 'Scoring - Draft Duck' },
            {
                name: 'description',
                content: 'How Draft Duck turns category stances into a weighted z-score board.'
            }
        ]
    })
});

function HowItWorksPage() {
    return (
        <PageShell>
            <h1>How the board is ranked</h1>
            <p>
                Need cats count more. Punt cats count as zero. Assistance only slices the list. Rank is still that
                weighted order.
            </p>

            <h2>Z-scores, then weights</h2>
            <p>
                Counting stats are z-scored versus league mean. Turnovers flip: fewer is better. Percentages use
                volume-adjusted impact, so a 70% shooter on two attempts does not beat a 55% shooter on fifteen.
            </p>
            <p>
                Need is 1.5. Neutral is 1. Punt is 0. Optional intensity (0–2, default 1) scales a non-punt cat. The
                composite is operator weight times your profile weight times that z-score, summed across enabled cats.
            </p>

            <h2>Punts and 8-cat</h2>
            <p>
                Punt zeroes that cat in the sum. An 8-cat preset drops turnovers from the board entirely, which is not
                the same as punting them.
            </p>

            <h2>Draft assistance</h2>
            <p className='mb-0'>
                Assistance does not re-rank. It slices the list into round buckets of league size. The last round holds
                everyone past a full roster. Your pick slot only marks which name in each round is yours.
            </p>
            <EntryCtas />
            <AboutLink />
        </PageShell>
    );
}
