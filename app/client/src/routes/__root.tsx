import { LinkButton } from '@/components/link-button';
import { PendingFallback } from '@/components/pending-fallback';
import { PageShell } from '@/components/page-shell';
import appCss from '@/styles/global.css?url';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router';
import { useState, type ReactNode } from 'react';

const DEFAULT_DESCRIPTION = 'Category-league fantasy basketball helper: quiz, weighted ranks, optional round buckets.';

function createQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false }
        }
    });
}

export const Route = createRootRoute({
    head: () => ({
        meta: [
            { charSet: 'utf-8' },
            { name: 'viewport', content: 'width=device-width, initial-scale=1' },
            { title: 'Draft Duck' },
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
    // Created here so prerender does not share one client across requests.
    const [queryClient] = useState(createQueryClient);

    return (
        <html lang='en'>
            <head>
                <HeadContent />
            </head>
            <body className='min-h-dvh bg-background font-sans text-foreground antialiased'>
                <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
                <Scripts />
            </body>
        </html>
    );
}

function NotFound() {
    return (
        <PageShell className='justify-center'>
            <h1>Page not found</h1>
            <p>That route is not in this app.</p>
            <p className='mt-8 mb-0'>
                <LinkButton to='/'>Home</LinkButton>
            </p>
        </PageShell>
    );
}
