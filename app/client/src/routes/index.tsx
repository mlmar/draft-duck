import { BuildCardFace, namedBuildCardClassName } from '@/components/onboard/build-card-face';
import { PageShell } from '@/components/page-shell';
import { EntryCtas } from '@/components/entry-ctas';
import { LinkButton } from '@/components/link-button';
import { CAT_KEYS, NAMED_BUILD_IDS } from '@draft-duck/core';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
    component: HomePage,
    head: () => ({
        meta: [{ title: 'draft duck' }]
    })
});

function HomePage() {
    return (
        <PageShell className='justify-center'>
            <h1>draft duck</h1>
            <p className='max-w-md text-muted-foreground'>Get your ducks in a row.</p>
            <p className='mb-0 max-w-md'>Pick a stance, we'll rank it.</p>
            <div className='mt-2 grid gap-4'>
                <div className='grid gap-2 md:grid-cols-2'>
                    {NAMED_BUILD_IDS.map((id) => (
                        <LinkButton
                            key={id}
                            to='/onboard'
                            search={{ build: id }}
                            variant='outline'
                            className={namedBuildCardClassName}
                        >
                            <BuildCardFace id={id} enabledCats={CAT_KEYS} />
                        </LinkButton>
                    ))}
                </div>
                <div className='grid gap-2'>
                    <LinkButton
                        to='/onboard'
                        search={{ build: 'custom' }}
                        className='h-11 w-full justify-start bg-primary px-3 text-primary-foreground hover:bg-primary/80 md:w-auto'
                    >
                        Custom
                    </LinkButton>
                    <LinkButton
                        to='/onboard'
                        search={{ start: 'not-sure' }}
                        className='h-11 w-full justify-start bg-primary px-3 text-primary-foreground hover:bg-primary/80 md:w-auto'
                    >
                        Not sure
                    </LinkButton>
                </div>
            </div>
            <EntryCtas />
        </PageShell>
    );
}
