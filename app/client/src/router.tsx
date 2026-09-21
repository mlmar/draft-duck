import { PendingFallback } from '@/components/pending-fallback';
import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

export function getRouter() {
    return createRouter({
        routeTree,
        scrollRestoration: true,
        defaultPreload: 'intent',
        // SPA shell and non-prerendered routes show this until the match hydrates.
        defaultPendingComponent: PendingFallback
    });
}
