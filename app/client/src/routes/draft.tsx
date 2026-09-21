import { DraftBoard } from '@/components/draft/draft-board';
import type { CatValueMode } from '@/components/draft/player-table';
import { PageShell } from '@/components/page-shell';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

export type DraftSearch = {
    assist?: '1';
    values?: 'pm';
};

function flagOn(value: unknown): boolean {
    // URL loads parse assist=1 as a number. Client navigate keeps the string '1'.
    return value === '1' || value === 1 || value === true;
}

export const Route = createFileRoute('/draft')({
    // Client-only. Needs localStorage and POST /rank, so it is not prerendered.
    ssr: false,
    validateSearch: (search: Record<string, unknown>): DraftSearch => ({
        assist: flagOn(search.assist) ? '1' : undefined,
        values: search.values === 'pm' ? 'pm' : undefined
    }),
    component: DraftPage,
    head: () => ({
        meta: [{ title: 'Draft - Waiver Warrior' }]
    })
});

function DraftPage() {
    const search = Route.useSearch();
    const navigate = useNavigate({ from: '/draft' });
    const assist = search.assist === '1';
    const valueMode: CatValueMode = search.values === 'pm' ? 'plusMinus' : 'raw';

    return (
        <PageShell wide>
            <DraftBoard
                assist={assist}
                valueMode={valueMode}
                onAssistChange={(on) => {
                    void navigate({
                        search: (prev) => ({ ...prev, assist: on ? '1' : undefined }),
                        replace: true
                    });
                }}
                onValueModeChange={(mode) => {
                    void navigate({
                        search: (prev) => ({
                            ...prev,
                            values: mode === 'plusMinus' ? 'pm' : undefined
                        }),
                        replace: true
                    });
                }}
            />
        </PageShell>
    );
}
