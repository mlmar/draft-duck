import { PendingFallback } from '@/components/pending-fallback';
import { parseSearch, stringifySearch } from '@/lib/search';
import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

export function getRouter() {
    return createRouter({
        routeTree,
        parseSearch,
        stringifySearch,
        scrollRestoration: true,
        defaultPreload: 'intent',
        // SPA shell and non-prerendered routes show this until the match hydrates.
        defaultPendingComponent: PendingFallback
    });
}
