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
                Choose per-game, per-36, or season totals as the stats behind the board. Players below 20 games are
                excluded. For each enabled category, counting stats are z-scored against the eligible-player mean and
                standard deviation. Turnovers flip so fewer is better. FG% and FT% use volume-adjusted impact: the
                difference from the league rate is multiplied by attempts, then z-scored.
            </p>
            <p>
                The slider is the weight, from 0 to 3. Need is 1.5, Neutral is 1, Punt is 0. If you punt a hole,
                leftover Neutral complements sit at 1.25. The composite is operator weight times that tuner times the
                z-score, summed across enabled categories. Players are sorted by this composite to make the board.
            </p>

            <h2>Sleeper and dud signals</h2>
            <p>
                A sleeper signal marks a top-quarter per-36 rank with below-median per-game and totals ranks. A dud
                signal marks the reverse pattern. These tags compare one season’s rate and realized production; they
                are not predictions of future upside or failure. Historical seasons can help test whether the patterns
                predict later results.
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
        </PageShell>
    );
}
