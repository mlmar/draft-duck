import { HeatLegend, PlayerTable, type CatValueMode } from '@/components/draft/player-table';
import { PickCard } from '@/components/draft/pick-card';
import { SettingsDrawer } from '@/components/draft/settings-drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LinkButton } from '@/components/link-button';
import { useDebounce } from '@/hooks/use-debounce';
import { rankPlayers } from '@/lib/api';
import { readBoardView, writeBoardView } from '@/lib/board-view';
import { applyDisplayCap } from '@/lib/display-cap';
import { canPersist, profileToQuizDraft, quizDraftToProfile, type QuizDraft } from '@/lib/quiz';
import { useDraftProfileStore } from '@/stores/draft-profile';
import {
    catHighlightStrategy,
    DEFAULT_CAT_HIGHLIGHT_MODE,
    draftProfileSchema,
    overallPicksForDraft,
    partitionByRound,
    profileHeadline,
    stanceSummary
} from '@draft-duck/core';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Settings } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

const INTENSITY_DEBOUNCE_MS = 200;
const CAT_HIGHLIGHT_MODE = DEFAULT_CAT_HIGHLIGHT_MODE;

type DraftBoardProps = {
    assist: boolean;
    valueMode: CatValueMode;
    onAssistChange: (on: boolean) => void;
    onValueModeChange: (mode: CatValueMode) => void;
};

export function DraftBoard({ assist, valueMode, onAssistChange, onValueModeChange }: DraftBoardProps) {
    const navigate = useNavigate();
    const profile = useDraftProfileStore((state) => state.profile);
    const setProfile = useDraftProfileStore((state) => state.setProfile);
    const [draft, setDraft] = useState<QuizDraft | null>(null);
    const [hydrated, setHydrated] = useState(false);
    const [nameQuery, setNameQuery] = useState('');
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [showRest, setShowRest] = useState(false);
    const [simpleView, setSimpleView] = useState(() => readBoardView() !== 'full');
    const settingsButtonRef = useRef<HTMLButtonElement>(null);

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

    function handleSimpleViewChange(on: boolean) {
        setSimpleView(on);
        writeBoardView(on ? 'simple' : 'full');
    }

    function handleSettingsOpenChange(open: boolean) {
        setSettingsOpen(open);
        if (!open) settingsButtonRef.current?.focus();
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
    const displayCap = profile.leagueSize * profile.draftRounds;
    const capped = applyDisplayCap(query ? groups.filter((group) => group.players.length > 0) : groups, {
        cap: displayCap,
        lift: Boolean(query) || showRest,
        clipLastGroup: assist
    });
    const slotCards = yourPicks.flatMap((overall, index) => {
        const player = players[overall - 1];
        return player ? [{ overall, round: index + 1, player }] : [];
    });

    const headline = profileHeadline(profile);
    const summary = stanceSummary(profile);
    // Simple is slot names. No slot would be an empty list, so stay on the full table.
    const hasSlot = Boolean(profile.draftSlot);
    const showSimple = simpleView && hasSlot;
    const tableCaption = query
        ? 'Search is the full ranked list, including names past the draft.'
        : showRest
          ? 'Full ranked list for this profile.'
          : 'Showing this draft, not the full ranked list.';

    return (
        <div className='grid gap-5'>
            <header className='grid gap-2'>
                <h1 className='mb-0'>{headline}</h1>
                <Button
                    type='button'
                    variant='ghost'
                    className='h-auto w-fit justify-start px-0 py-1 text-left font-normal text-muted-foreground hover:bg-transparent hover:text-foreground'
                    onClick={() => setSettingsOpen(true)}
                >
                    {summary}
                </Button>
                {showSimple ? (
                    <p className='mb-0 max-w-xl text-muted-foreground'>
                        If the room drafted this board in order, this is the name at your pick.
                    </p>
                ) : null}
            </header>

            <div className='flex flex-wrap items-center gap-3'>
                {hasSlot ? (
                    <Button type='button' variant='outline' onClick={() => handleSimpleViewChange(!showSimple)}>
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
                <Button
                    ref={settingsButtonRef}
                    type='button'
                    variant='outline'
                    aria-expanded={settingsOpen}
                    aria-controls='draft-settings'
                    onClick={() => setSettingsOpen(true)}
                >
                    <Settings />
                    Settings
                </Button>
                <LinkButton to='/onboard' variant='ghost'>
                    Retake quiz
                </LinkButton>
            </div>

            <SettingsDrawer
                open={settingsOpen}
                onOpenChange={handleSettingsOpenChange}
                value={draft}
                onChange={handleDiscreteChange}
                onIntensityChange={handleIntensityChange}
                updating={rankQuery.isFetching}
            />

            {rankError ? <p className='mb-0 text-destructive'>{rankError}</p> : null}

            {showSimple ? (
                slotCards.length > 0 ? (
                    <ol className='grid gap-3'>
                        {slotCards.map(({ overall, round, player }) => (
                            <li key={`${round}-${player.playerId}`}>
                                <PickCard round={round} overall={overall} player={player} profile={profile} />
                            </li>
                        ))}
                    </ol>
                ) : (
                    <p className='mb-0 text-muted-foreground'>Set your pick in Settings to see names at each slot.</p>
                )
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
                            groups={capped.groups}
                            enabledCats={profile.enabledCats}
                            emptyLabel={query ? 'No players match that name.' : 'No players on this board.'}
                            profile={profile}
                            highlight={highlight}
                            valueMode={valueMode}
                            yourOverallPicks={yourPickSet}
                            caption={tableCaption}
                        />
                        {capped.hiddenCount > 0 ? (
                            <p className='mb-0'>
                                <Button
                                    type='button'
                                    variant='ghost'
                                    className='h-auto px-0'
                                    onClick={() => setShowRest(true)}
                                >
                                    Show rest of board
                                </Button>
                            </p>
                        ) : null}
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
