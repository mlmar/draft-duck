import { DraftBoard } from '@/components/draft/draft-board';
import type { CatValueMode } from '@/components/draft/player-table';
import { PageShell } from '@/components/page-shell';
import { searchString } from '@/lib/search';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

export type DraftSearch = {
    assist?: string;
    values?: string;
};

export const Route = createFileRoute('/draft')({
    // Client-only. Needs localStorage and POST /rank, so it is not prerendered.
    ssr: false,
    validateSearch: (search: Record<string, unknown>): DraftSearch => {
        const assist = searchString(search.assist);
        const values = searchString(search.values);
        return {
            assist: assist === '1' ? assist : undefined,
            values: values === 'pm' || values === 'raw' ? values : undefined
        };
    },
    component: DraftPage,
    head: () => ({
        meta: [{ title: 'Draft - Draft Duck' }]
    })
});

function DraftPage() {
    const search = Route.useSearch();
    const navigate = useNavigate({ from: '/draft' });
    const assist = search.assist === '1';
    const valueMode: CatValueMode = search.values === 'raw' ? 'raw' : 'plusMinus';

    return (
        <PageShell wide className='py-3 md:py-6'>
            <DraftBoard
                assist={assist}
                valueMode={valueMode}
                onTableSettingsChange={({ assist: nextAssist, valueMode: nextValueMode }) => {
                    void navigate({
                        search: (prev) => ({
                            ...prev,
                            assist: nextAssist ? '1' : undefined,
                            values: nextValueMode === 'raw' ? 'raw' : undefined
                        }),
                        replace: true,
                        resetScroll: false
                    });
                }}
            />
        </PageShell>
    );
}
