import { PendingFallback } from '@/components/pending-fallback';
import { routerBasepath } from '@/lib/base-path';
import { parseSearch, stringifySearch } from '@/lib/search';
import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

export function getRouter() {
    return createRouter({
        routeTree,
        basepath: routerBasepath(import.meta.env.PUBLIC_BASE_PATH),
        parseSearch,
        stringifySearch,
        scrollRestoration: true,
        defaultPreload: 'intent',
        // SPA shell and non-prerendered routes show this until the match hydrates.
        defaultPendingComponent: PendingFallback
    });
}
