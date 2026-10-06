import { BuildCardFace } from '@/components/onboard/build-card-face';
import { PageShell } from '@/components/page-shell';
import { EntryCtas } from '@/components/entry-ctas';
import { useHydratedProfile } from '@/hooks/use-hydrated-profile';
import { LinkButton } from '@/components/link-button';
import { seoMeta } from '@/lib/seo';
import { CAT_KEYS, NAMED_BUILD_IDS } from '@draft-duck/core';
import { createFileRoute } from '@tanstack/react-router';
import { ArrowRight, Compass, SlidersHorizontal } from 'lucide-react';

export const Route = createFileRoute('/')({
    component: HomePage,
    head: () =>
        seoMeta({
            title: 'Fantasy Basketball Rankings for Category Leagues | Draft Duck',
            description:
                'Build fantasy basketball rankings around your category priorities. Explore 8-cat and 9-cat builds, choose punts, and find your draft board.',
            path: '/'
        })
});

function HomePage() {
    const { profile } = useHydratedProfile();
    return (
        <PageShell wide className='max-w-6xl'>
            <div className='grid gap-8 py-4 md:grid-cols-[1.1fr_1fr] md:items-center md:gap-16 md:py-8'>
                <div>
                    <h1 className='max-w-lg text-4xl leading-[1.08] tracking-[-0.03em] md:text-6xl'>
                        Get your ducks
                        <br className='hidden md:block' /> in a row.
                    </h1>
                    <p className='mt-5 mb-2 text-xl font-medium'>Fantasy basketball rankings for your build.</p>
                </div>
                <div className='rounded-xl border border-border bg-card p-6 md:p-8'>
                    <h2 className='mb-4 text-2xl'>{profile ? 'Your board is ready.' : 'Start with your style.'}</h2>
                    <EntryCtas inline />
                    <p className='mb-6 text-muted-foreground'>
                        Answer a few category questions to find a build that fits how you want to play.
                    </p>
                    <LinkButton
                        to='/onboard'
                        search={{ start: 'not-sure' }}
                        size='lg'
                        variant={profile ? 'outline' : 'default'}
                        className='w-full justify-between'
                    >
                        <span className='inline-flex items-center gap-2'>
                            <Compass aria-hidden='true' /> Find my build
                        </span>
                        <ArrowRight aria-hidden='true' />
                    </LinkButton>
                    <div className='mt-5 border-t border-border pt-4'>
                        <LinkButton
                            to='/onboard'
                            search={{ build: 'custom' }}
                            variant='ghost'
                            className='w-full justify-between px-4 text-primary'
                        >
                            <span className='inline-flex items-center gap-2'>
                                <SlidersHorizontal aria-hidden='true' /> Pick your punt
                            </span>
                            <ArrowRight aria-hidden='true' />
                        </LinkButton>
                        <p className='mb-0 px-4 text-sm text-muted-foreground'>
                            Set your own priorities. Punting is optional.
                        </p>
                    </div>
                </div>
            </div>
            <section aria-labelledby='builds-title' className='mt-8 border-t border-border pt-8 md:mt-12'>
                <div className='mb-5 flex flex-wrap items-baseline justify-between gap-2'>
                    <h2 id='builds-title' className='mb-0'>
                        Already have a build in mind?
                    </h2>
                    <p className='mb-0 text-sm text-muted-foreground'>Choose a starting point. Fine-tune it later.</p>
                </div>
                <div className='grid gap-3 md:grid-cols-3'>
                    {NAMED_BUILD_IDS.map((id) => (
                        <LinkButton
                            key={id}
                            to='/onboard'
                            search={{ build: id }}
                            variant='outline'
                            className='h-auto min-h-28 w-full items-start justify-between gap-3 bg-card p-5 text-left whitespace-normal hover:border-primary/40 hover:bg-card'
                        >
                            <span className='grid min-w-0 gap-2'>
                                <BuildCardFace id={id} enabledCats={CAT_KEYS} />
                            </span>
                            <ArrowRight aria-hidden='true' className='mt-1 text-muted-foreground' />
                        </LinkButton>
                    ))}
                </div>
            </section>
        </PageShell>
    );
}
