import { BuildCardFace, namedBuildCardClassName } from '@/components/onboard/build-card-face';
import { PageShell } from '@/components/page-shell';
import { SiteNav } from '@/components/site-nav';
import { EntryCtas } from '@/components/entry-ctas';
import { LinkButton } from '@/components/link-button';
import { CAT_KEYS, NAMED_BUILD_IDS } from '@waiver-warrior/core';
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
            <p className='font-medium text-primary'>Category quiz</p>
            <h1>Waiver Warrior</h1>
            <p className='max-w-md'>Tell us how you want to play. We rank the 2025-26 board for that profile.</p>
            <div className='mt-8 grid gap-4'>
                <div className='grid gap-2 md:grid-cols-2'>
                    {NAMED_BUILD_IDS.map((id) => (
                        <LinkButton
                            key={id}
                            to='/onboard'
                            search={{ step: 'play', build: id }}
                            variant='outline'
                            className={namedBuildCardClassName}
                        >
                            <BuildCardFace id={id} enabledCats={CAT_KEYS} />
                        </LinkButton>
                    ))}
                </div>
                <LinkButton
                    to='/onboard'
                    search={{ step: 'play', build: 'custom' }}
                    variant='ghost'
                    className='h-auto w-full justify-start px-4 py-2 md:w-auto'
                >
                    Custom
                </LinkButton>
            </div>
            <EntryCtas />
            <SiteNav />
        </PageShell>
    );
}
