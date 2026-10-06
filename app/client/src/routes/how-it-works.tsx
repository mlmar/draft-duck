import { EntryCtas } from '@/components/entry-ctas';
import { PageShell } from '@/components/page-shell';
import { seoMeta } from '@/lib/seo';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/how-it-works')({
    component: HowItWorksPage,
    head: () =>
        seoMeta({
            title: 'Fantasy Basketball Scoring and Rankings Explained | Draft Duck',
            description:
                'Learn how fantasy basketball category rankings work, how punts and category weights affect player scores, and how to read your Draft Duck board.',
            path: '/how-it-works'
        })
});

function HowItWorksPage() {
    return (
        <PageShell className='max-w-3xl'>
            <header className='mb-10 max-w-[68ch]'>
                <h1 className='mb-4'>How fantasy basketball rankings work</h1>
                <p className='mb-0 text-lg leading-relaxed text-muted-foreground'>
                    In a category league, the best player depends on what your team needs. Draft Duck compares players
                    across the categories you care about, then sorts them into a board shaped around your build.
                </p>
            </header>

            <section aria-labelledby='steps-title' className='mb-10'>
                <h2 id='steps-title' className='mb-5 text-2xl'>
                    From your build to your board
                </h2>
                <ol className='grid list-decimal gap-6 pl-6 marker:font-semibold marker:text-primary'>
                    <li className='pl-2'>
                        <h3 className='mb-2 text-lg'>Choose your categories</h3>
                        <p className='mb-0'>
                            Start with the categories in your league. In an 8-cat league, turnovers can be left out; in
                            a 9-cat league, they can count like the other categories.
                        </p>
                    </li>
                    <li className='pl-2'>
                        <h3 className='mb-2 text-lg'>Set your priorities</h3>
                        <p className='mb-0'>
                            Mark a category <strong>Need</strong> to give it more weight, <strong>Neutral</strong> to
                            keep its usual weight, or <strong>Punt</strong> to stop counting it. A punt means you are
                            willing to give up that category to focus on others.
                        </p>
                    </li>
                    <li className='pl-2'>
                        <h3 className='mb-2 text-lg'>Read the ranked board</h3>
                        <p className='mb-0'>
                            A <strong>z-score</strong> shows how far a player is above or below the eligible-player
                            average in a category. Draft Duck adjusts each category by your priorities, adds the
                            results, and sorts the board by that total.
                        </p>
                    </li>
                </ol>
            </section>

            <section aria-labelledby='example-title' className='mb-10 border-y border-border py-6'>
                <h2 id='example-title' className='mb-3 text-xl'>
                    A simple punt example
                </h2>
                <p className='mb-0'>
                    Imagine a player who is one standard deviation above average in both points and free-throw
                    percentage. If points are marked Need, they contribute 1.5 points to the player’s score. If
                    free-throw percentage is Punted, it contributes zero. The board still counts every other enabled
                    category.
                </p>
            </section>

            <section aria-labelledby='signals-title' className='mb-10'>
                <h2 id='signals-title' className='mb-3 text-xl'>
                    What the extra signals mean
                </h2>
                <p className='mb-0'>
                    Upside and Streaky compare a player’s per-36 rank with their per-game and season-total ranks for one
                    season. They describe a rate-versus-production gap; Streaky does not measure game-to-game
                    consistency, and neither label predicts future performance.
                </p>
            </section>

            <section aria-labelledby='details-title' className='mb-10'>
                <h2 id='details-title' className='mb-4 text-xl'>
                    Scoring details
                </h2>
                <div className='divide-y divide-border border-y border-border'>
                    <details className='group py-4'>
                        <summary className="group cursor-pointer list-none pr-8 font-semibold text-foreground marker:hidden after:ml-3 after:font-normal after:text-primary after:content-['+'] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-primary group-open:after:content-['−']">
                            How the category scores are calculated
                        </summary>
                        <div className='pt-4 text-muted-foreground'>
                            <p>
                                Choose per-game, per-36, or season totals as the statistical view. Players with fewer
                                than 20 games are excluded. For counting stats, a z-score is (player stat minus the
                                eligible-player average) divided by the standard deviation. Turnovers are reversed so
                                fewer is better.
                            </p>
                            <p className='mb-0'>
                                For FG% and FT%, the score uses volume-adjusted impact: (player percentage minus the
                                league rate) multiplied by attempts, then standardized as a z-score. A missing
                                percentage with no attempts has a raw impact of zero before standardization.
                            </p>
                        </div>
                    </details>
                    <details className='group py-4'>
                        <summary className="group cursor-pointer list-none pr-8 font-semibold text-foreground marker:hidden after:ml-3 after:font-normal after:text-primary after:content-['+'] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-primary group-open:after:content-['−']">
                            Weights, custom tuners, and 8-cat leagues
                        </summary>
                        <div className='pt-4 text-muted-foreground'>
                            <p>
                                The weight control ranges from 0 to 3. Need starts at 1.5, Neutral at 1, and Punt at 0.
                                Some Neutral categories that complement a preset punt use 1.25; custom builds use the
                                values you set. The app’s internal category weights currently start at 1.
                            </p>
                            <p className='mb-0'>
                                Each enabled category contributes category weight × your tuner × category z-score.
                                Contributions are added to form a player’s composite score. Punting a category gives it
                                a tuner of zero. An 8-cat preset removes turnovers from the enabled categories entirely,
                                which differs from leaving turnovers enabled and punting them.
                            </p>
                        </div>
                    </details>
                    <details className='group py-4'>
                        <summary className="group cursor-pointer list-none pr-8 font-semibold text-foreground marker:hidden after:ml-3 after:font-normal after:text-primary after:content-['+'] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-primary group-open:after:content-['−']">
                            Upside, Streaky, and draft assistance
                        </summary>
                        <div className='pt-4 text-muted-foreground'>
                            <p>
                                Upside marks a top-quarter per-36 rank with below-median per-game and totals ranks.
                                Streaky marks a bottom-quarter per-36 rank with top-half per-game and totals ranks.
                                These are single-season comparisons, not forecasts.
                            </p>
                            <p className='mb-0'>
                                Draft assistance does not change player order. It divides the ranked list into round
                                groups the size of your league; the last group includes everyone beyond a full roster.
                                Your pick slot marks your place in each round.
                            </p>
                        </div>
                    </details>
                </div>
            </section>
            <EntryCtas />
        </PageShell>
    );
}
