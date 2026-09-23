import { HeatLegend, PlayerTable, type CatValueMode } from '@/components/draft/player-table';
import { ProfileSettings } from '@/components/draft/profile-settings';
import { StanceBar } from '@/components/onboard/steps/stances-step';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LinkButton } from '@/components/link-button';
import { useDebounce } from '@/hooks/use-debounce';
import { rankPlayers } from '@/lib/api';
import { canPersist, profileToQuizDraft, quizDraftToProfile, type QuizDraft } from '@/lib/quiz';
import { useDraftProfileStore } from '@/stores/draft-profile';
import {
    catHighlightStrategy,
    DEFAULT_CAT_HIGHLIGHT_MODE,
    draftProfileSchema,
    overallPicksForDraft,
    partitionByRound,
    profileHeadline
} from '@draft-duck/core';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';

const INTENSITY_DEBOUNCE_MS = 200;
const CAT_HIGHLIGHT_MODE = DEFAULT_CAT_HIGHLIGHT_MODE;

type DraftBoardProps = {
    assist: boolean;
    valueMode: CatValueMode;
    simpleView: boolean;
    onAssistChange: (on: boolean) => void;
    onValueModeChange: (mode: CatValueMode) => void;
    onSimpleViewChange: (on: boolean) => void;
};

export function DraftBoard({
    assist,
    valueMode,
    simpleView,
    onAssistChange,
    onValueModeChange,
    onSimpleViewChange
}: DraftBoardProps) {
    const navigate = useNavigate();
    const profile = useDraftProfileStore((state) => state.profile);
    const setProfile = useDraftProfileStore((state) => state.setProfile);
    const [draft, setDraft] = useState<QuizDraft | null>(null);
    const [hydrated, setHydrated] = useState(false);
    const [nameQuery, setNameQuery] = useState('');

    function persistDraft(next: QuizDraft) {
        if (!canPersist(next)) return;
        const parsed = draftProfileSchema.safeParse(quizDraftToProfile(next));
        if (!parsed.success) return;
        setProfile(parsed.data);
    }

    const persistIntensity = useDebounce(persistDraft, INTENSITY_DEBOUNCE_MS);

    useEffect(() => {
        const applySaved = () => {
            const saved = useDraftProfileStore.getState().profile;
            if (!saved) {
                void navigate({ to: '/onboard', replace: true });
                return;
            }
            setDraft(profileToQuizDraft(saved));
            setHydrated(true);
        };

        const unsub = useDraftProfileStore.persist.onFinishHydration(applySaved);
        if (useDraftProfileStore.persist.hasHydrated()) applySaved();
        return unsub;
    }, [navigate]);

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

    const players = rankQuery.data ?? [];
    const yourPicks = useMemo(() => (profile ? overallPicksForDraft(profile) : []), [profile]);
    const yourPickSet = useMemo(() => new Set(yourPicks), [yourPicks]);

    if (!hydrated || draft === null || profile === null) {
        return <p className='mb-0'>Loading board…</p>;
    }

    const sections = partitionByRound(players, profile.leagueSize, profile.draftRounds);
    const rankError = rankQuery.error instanceof Error ? rankQuery.error.message : null;
    const highlight = catHighlightStrategy(CAT_HIGHLIGHT_MODE);
    const query = nameQuery.trim().toLowerCase();
    const groups = assist
        ? sections.map((section) => ({
              id: `round-${section.round}`,
              label: `Round ${section.round} · ${section.players.length} ${
                  section.players.length === 1 ? 'player' : 'players'
              }`,
              players: filterByName(section.players, query)
          }))
        : [{ id: 'board', players: filterByName(players, query) }];
    const visibleGroups = query ? groups.filter((group) => group.players.length > 0) : groups;
    const slotPlayers = yourPicks.flatMap((overall) => {
        const player = players[overall - 1];
        return player ? [player] : [];
    });
    const simpleGroups = [{ id: 'picks', players: slotPlayers }];

    const headline = profileHeadline(profile);
    // Simple is slot names. No slot would be an empty list, so stay on the full table.
    const hasSlot = Boolean(profile.draftSlot);
    const showSimple = simpleView && hasSlot;

    return (
        <div className='grid gap-8'>
            <p className='mb-0'>
                <Link to='/' className='text-muted-foreground hover:text-foreground'>
                    Draft Duck
                </Link>
            </p>
            <header className='grid gap-3'>
                <p className='mb-0 font-medium text-primary'>Board</p>
                <h1 className='mb-0'>Ranked for your CAT profile</h1>
                <p className='mb-0 font-medium'>{headline}</p>
                {showSimple ? (
                    <p className='mb-0 max-w-xl text-muted-foreground'>
                        If the room drafted this board in order, this is the name at your pick.
                    </p>
                ) : (
                    <p className='mb-0 max-w-xl'>
                        Same list the quiz produced. Assistance slices it into round buckets. Last round is the tail.
                    </p>
                )}
                <div className='flex flex-wrap items-center gap-3'>
                    {hasSlot ? (
                        <Button type='button' variant='outline' onClick={() => onSimpleViewChange(!showSimple)}>
                            {showSimple ? 'Full table' : 'Simple view'}
                        </Button>
                    ) : null}
                    {showSimple ? null : (
                        <>
                            <Button
                                type='button'
                                variant={assist ? 'default' : 'outline'}
                                aria-pressed={assist}
                                onClick={() => onAssistChange(!assist)}
                            >
                                {assist ? 'Draft assistance on' : 'Draft assistance off'}
                            </Button>
                            <Button
                                type='button'
                                className='w-32'
                                variant={valueMode === 'plusMinus' ? 'default' : 'outline'}
                                aria-pressed={valueMode === 'plusMinus'}
                                onClick={() => onValueModeChange(valueMode === 'raw' ? 'plusMinus' : 'raw')}
                            >
                                {valueMode === 'plusMinus' ? '+/-' : 'Raw stats'}
                            </Button>
                        </>
                    )}
                    <LinkButton to='/onboard' variant='ghost'>
                        Retake quiz
                    </LinkButton>
                </div>
            </header>

            <StanceBar value={draft} onChange={handleDiscreteChange} />

            <details className='rounded-lg border border-border bg-card p-4'>
                <summary className='cursor-pointer font-medium'>Edit league and intensity</summary>
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

            {showSimple ? (
                <div className='grid gap-3'>
                    <HeatLegend highlight={highlight} />
                    <PlayerTable
                        groups={simpleGroups}
                        enabledCats={profile.enabledCats}
                        emptyLabel='Set your pick in Edit league to see names at each slot.'
                        profile={profile}
                        highlight={highlight}
                        valueMode={valueMode}
                        yourOverallPicks={yourPickSet}
                    />
                </div>
            ) : (
                <div className='grid gap-4'>
                    <div className='max-w-sm'>
                        <Input
                            type='search'
                            value={nameQuery}
                            onChange={(event) => setNameQuery(event.target.value)}
                            placeholder='Search players'
                            aria-label='Search players'
                        />
                    </div>
                    <div className='grid gap-3'>
                        <HeatLegend highlight={highlight} />
                        <PlayerTable
                            groups={visibleGroups}
                            enabledCats={profile.enabledCats}
                            emptyLabel={query ? 'No players match that name.' : 'No players on this board.'}
                            profile={profile}
                            highlight={highlight}
                            valueMode={valueMode}
                            yourOverallPicks={yourPickSet}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

function filterByName<T extends { name: string }>(players: T[], query: string): T[] {
    if (!query) return players;
    return players.filter((player) => player.name.toLowerCase().includes(query));
}
