import { PendingFallback } from '@/components/pending-fallback';
import { LinkButton } from '@/components/link-button';
import appCss from '@/styles/global.css?url';
import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router';
import type { ReactNode } from 'react';

const DEFAULT_DESCRIPTION = 'Category-league fantasy basketball helper: quiz, weighted ranks, optional round buckets.';

export const Route = createRootRoute({
    head: () => ({
        meta: [
            { charSet: 'utf-8' },
            { name: 'viewport', content: 'width=device-width, initial-scale=1' },
            { title: 'Waiver Warrior' },
            { name: 'description', content: DEFAULT_DESCRIPTION }
        ],
        links: [{ rel: 'stylesheet', href: appCss }]
    }),
    component: RootComponent,
    pendingComponent: PendingFallback,
    notFoundComponent: NotFound
});

function RootComponent() {
    return (
        <RootDocument>
            <Outlet />
        </RootDocument>
    );
}

function RootDocument({ children }: { children: ReactNode }) {
    return (
        <html lang='en'>
            <head>
                <HeadContent />
            </head>
            <body className='min-h-dvh bg-background font-sans text-foreground antialiased'>
                {children}
                <Scripts />
            </body>
        </html>
    );
}

function NotFound() {
    return (
        <main className='mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-10 md:max-w-2xl'>
            <h1>Page not found</h1>
            <p>That route is not in this app.</p>
            <p className='mt-8 mb-0'>
                <LinkButton to='/'>Home</LinkButton>
            </p>
        </main>
    );
}
