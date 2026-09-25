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
            <p className='mb-0 max-w-md'>Pick a stance, we'll rank it.</p>
            <p className='max-w-md text-muted-foreground'>get your ducks in a row.</p>
            <div className='mt-8 grid gap-4'>
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
                <LinkButton
                    to='/onboard'
                    search={{ build: 'custom' }}
                    variant='ghost'
                    className='h-auto w-full justify-start px-3 py-2 md:w-auto'
                >
                    Custom
                </LinkButton>
            </div>
            <EntryCtas />
        </PageShell>
    );
}
