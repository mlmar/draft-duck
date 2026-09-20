import { PlayerTable } from '@/components/draft/player-table';
import { ProfileSettings } from '@/components/draft/profile-settings';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/use-debounce';
import { rankPlayers } from '@/lib/api';
import { canContinue, profileToQuizDraft, quizDraftToProfile, type QuizDraft } from '@/lib/quiz';
import { useDraftProfileStore } from '@/stores/draft-profile';
import { draftProfileSchema, partitionByRound } from '@waiver-warrior/core';
import { QueryClient, QueryClientProvider, keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

const INTENSITY_DEBOUNCE_MS = 200;

function createQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false }
        }
    });
}

export function DraftBoard() {
    const [queryClient] = useState(createQueryClient);
    return (
        <QueryClientProvider client={queryClient}>
            <DraftBoardInner />
        </QueryClientProvider>
    );
}

function DraftBoardInner() {
    const profile = useDraftProfileStore((state) => state.profile);
    const setProfile = useDraftProfileStore((state) => state.setProfile);
    const [draft, setDraft] = useState<QuizDraft | null>(null);
    const [hydrated, setHydrated] = useState(false);
    // Onboard hands off with ?assist=1. Direct /draft visits stay a flat table.
    const [assistance, setAssistance] = useState(
        () => new URLSearchParams(window.location.search).get('assist') === '1'
    );

    function persistDraft(next: QuizDraft) {
        if (!canContinue('league', next) || !canContinue('preset', next)) return;
        const parsed = draftProfileSchema.safeParse(quizDraftToProfile(next));
        if (!parsed.success) return;
        setProfile(parsed.data);
    }

    const persistIntensity = useDebounce(persistDraft, INTENSITY_DEBOUNCE_MS);

    useEffect(() => {
        const applySaved = () => {
            const saved = useDraftProfileStore.getState().profile;
            if (!saved) {
                window.location.replace('/onboard');
                return;
            }
            setDraft(profileToQuizDraft(saved));
            setHydrated(true);
        };

        const unsub = useDraftProfileStore.persist.onFinishHydration(applySaved);
        if (useDraftProfileStore.persist.hasHydrated()) applySaved();
        return unsub;
    }, []);

    const rankQuery = useQuery({
        queryKey: ['rank', profile],
        queryFn: () => rankPlayers(profile!),
        enabled: hydrated && profile !== null,
        placeholderData: keepPreviousData
    });

    function handleDiscreteChange(next: QuizDraft) {
        persistIntensity.cancel();
        setDraft(next);
        persistDraft(next);
    }

    function handleIntensityChange(next: QuizDraft) {
        setDraft(next);
        persistIntensity(next);
    }

    if (!hydrated || draft === null || profile === null) {
        return <p className='mb-0'>Loading board…</p>;
    }

    const players = rankQuery.data ?? [];
    const sections = partitionByRound(players, profile.leagueSize, profile.draftRounds);
    const rankError = rankQuery.error instanceof Error ? rankQuery.error.message : null;

    return (
        <div className='grid gap-8'>
            <header className='grid gap-3'>
                <p className='mb-0 font-medium text-primary'>Board</p>
                <h1 className='mb-0'>Ranked players</h1>
                <p className='mb-0 max-w-xl'>
                    Sorted by your quiz. Edit the profile to re-rank. Draft assistance groups the same list into round
                    buckets.
                </p>
                <div className='flex flex-wrap items-center gap-3'>
                    <Button
                        type='button'
                        variant={assistance ? 'default' : 'outline'}
                        aria-pressed={assistance}
                        onClick={() => setAssistance((on) => !on)}
                    >
                        {assistance ? 'Draft assistance on' : 'Draft assistance off'}
                    </Button>
                </div>
            </header>

            <details className='rounded-lg border border-border bg-card p-4'>
                <summary className='cursor-pointer font-medium'>Edit profile</summary>
                <div className='mt-6'>
                    <ProfileSettings
                        value={draft}
                        onChange={handleDiscreteChange}
                        onIntensityChange={handleIntensityChange}
                    />
                </div>
            </details>

            {rankQuery.isFetching ? <p className='mb-0'>Ranking the board…</p> : null}
            {rankError ? <p className='mb-0 text-destructive'>{rankError}</p> : null}

            {assistance ? (
                <div className='grid gap-10'>
                    {sections.map((section) => (
                        <div key={section.round} className='grid gap-3'>
                            <div className='flex flex-wrap items-baseline gap-x-3 gap-y-1'>
                                <h2 className='mb-0 text-xl font-semibold md:text-2xl'>Round {section.round}</h2>
                                <p className='mb-0 text-sm text-muted-foreground'>
                                    {section.players.length} {section.players.length === 1 ? 'player' : 'players'}
                                </p>
                            </div>
                            <PlayerTable
                                players={section.players}
                                enabledCats={profile.enabledCats}
                                emptyLabel='No players in this round.'
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <PlayerTable
                    players={players}
                    enabledCats={profile.enabledCats}
                    emptyLabel='No players on this board.'
                />
            )}
        </div>
    );
}
