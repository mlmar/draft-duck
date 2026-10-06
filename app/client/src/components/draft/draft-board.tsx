import { PlayerTable, type CatValueMode } from '@/components/draft/player-table';
import { BoardViewDrawer } from '@/components/draft/board-view-drawer';
import { useMediaQuery } from '@/hooks/use-media-query';
import { boardPlayerGroups } from '@/lib/board-players';
import { PlayerDetailDrawer } from '@/components/draft/player-detail-drawer';
import { SettingsDrawer } from '@/components/draft/settings-drawer';
import { WeightsDrawer } from '@/components/onboard/weights-drawer';
import { LoadingCopy } from '@/components/loading-copy';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebouncedValue } from '@/hooks/use-debounce';
import { rankPlayers } from '@/lib/api';
import { readBoardView, writeBoardView } from '@/lib/board-view';
import { readDisplayStatsMode, writeDisplayStatsMode } from '@/lib/display-stats';
import { canPersist, profileToQuizDraft, quizDraftToProfile, type QuizDraft } from '@/lib/quiz';
import { cn } from '@/lib/utils';
import { useDraftProfileStore } from '@/stores/draft-profile';
import {
    catHighlightStrategy,
    DEFAULT_CAT_HIGHLIGHT_MODE,
    draftProfileSchema,
    overallPicksForDraft,
    archetypeLabel,
    stanceSummary,
    type DataMode,
    type RankedPlayer
} from '@draft-duck/core';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Layers, Pencil, Settings } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

const SEARCH_DEBOUNCE_MS = 200;
const CAT_HIGHLIGHT_MODE = DEFAULT_CAT_HIGHLIGHT_MODE;

type DraftBoardProps = {
    assist: boolean;
    valueMode: CatValueMode;
    onTableSettingsChange: (settings: { assist: boolean; valueMode: CatValueMode }) => void;
};

export function DraftBoard({ assist, valueMode, onTableSettingsChange }: DraftBoardProps) {
    const navigate = useNavigate();
    const boardHeader = useRef<HTMLDivElement>(null);
    const [headerHeight, setHeaderHeight] = useState(192);
    const isDesktop = useMediaQuery('(min-width: 768px)');
    const profile = useDraftProfileStore((state) => state.profile);

    const setProfile = useDraftProfileStore((state) => state.setProfile);
    const [draft, setDraft] = useState<QuizDraft | null>(null);
    const [hydrated, setHydrated] = useState(false);
    useEffect(() => {
        const node = boardHeader.current;
        if (!node) return;
        const observer = new ResizeObserver(() => setHeaderHeight(node.getBoundingClientRect().height));
        observer.observe(node);
        return () => observer.disconnect();
    }, [profile, hydrated, draft]);

    const [nameQuery, setNameQuery] = useState('');
    // Input stays live. The table filters after the pause so each key is not a full rebuild.
    const debouncedNameQuery = useDebouncedValue(nameQuery, SEARCH_DEBOUNCE_MS);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [weightsOpen, setWeightsOpen] = useState(false);
    const [playerDetailsOpen, setPlayerDetailsOpen] = useState(false);
    const [showRest, setShowRest] = useState(false);
    const [simpleView, setSimpleView] = useState(() => readBoardView() === 'simple');
    const [displayStatsMode, setDisplayStatsMode] = useState<DataMode>(() => readDisplayStatsMode());
    const [selectedDetails, setSelectedDetails] = useState<{
        playerId: string;
        profile: NonNullable<typeof profile>;
    } | null>(null);
    const settingsButtonRef = useRef<HTMLButtonElement>(null);
    const detailTriggerRef = useRef<HTMLButtonElement | null>(null);

    function persistDraft(next: QuizDraft) {
        if (!canPersist(next)) return;
        const parsed = draftProfileSchema.safeParse(quizDraftToProfile(next));
        if (!parsed.success) return;
        setProfile(parsed.data);
    }

    useEffect(() => {
        const applySaved = () => {
            const saved = useDraftProfileStore.getState().profile;
            if (!saved) {
                void navigate({ to: '/', replace: true });
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

    // Close immediately when the saved profile changes so previous rankings are never explained with new weights.
    useEffect(() => {
        if (!selectedDetails || selectedDetails.profile === profile) return;
        setPlayerDetailsOpen(false);
        setSelectedDetails(null);
        const frame = window.requestAnimationFrame(restorePlayerDetailFocus);
        return () => window.cancelAnimationFrame(frame);
    }, [profile, selectedDetails]);

    function handleDiscreteChange(next: QuizDraft) {
        setDraft(next);
        persistDraft(next);
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
    const selectedPlayer =
        selectedDetails?.profile === profile && !rankQuery.isPlaceholderData
            ? (players.find((player) => player.playerId === selectedDetails.playerId) ?? null)
            : null;
    const yourPicks = useMemo(() => (profile ? overallPicksForDraft(profile) : []), [profile]);
    const yourPickSet = useMemo(() => new Set(yourPicks), [yourPicks]);

    if (!hydrated || draft === null || profile === null) {
        return (
            <div className='grid min-h-[60vh] place-items-center'>
                <LoadingCopy />
            </div>
        );
    }

    const rankError = rankQuery.error instanceof Error ? rankQuery.error.message : null;
    const highlight = catHighlightStrategy(CAT_HIGHLIGHT_MODE);
    const query = debouncedNameQuery.trim().toLowerCase();
    const hasSlot = Boolean(profile.draftSlot);
    const showSimple = simpleView && hasSlot;
    const capped = boardPlayerGroups(players, profile, { query, yourPicksOnly: showSimple, assist, showRest });
    const hasRows = capped.groups.some((group) => group.players.length > 0);
    const headline = archetypeLabel(profile.archetypeId) ?? 'Your draft board';
    const summary = stanceSummary(profile);
    const plusMinus = valueMode === 'plusMinus';
    const modeLabels: Record<DataMode, string> = {
        perGame: 'Per game',
        per36: 'Per 36 minutes',
        totals: 'Season totals'
    };

    // Store the real name-button trigger so dismissal can restore focus after filtering or view changes.
    function handlePlayerSelect(player: RankedPlayer, trigger: HTMLButtonElement) {
        const activeProfile = profile;
        if (rankQuery.isPlaceholderData || !activeProfile) return;
        detailTriggerRef.current = trigger;
        setSelectedDetails({ playerId: player.playerId, profile: activeProfile });
        setPlayerDetailsOpen(true);
    }

    // Focus the original name when it still exists, or the persistent settings control if the row disappeared.
    function restorePlayerDetailFocus() {
        const trigger = detailTriggerRef.current;
        if (trigger?.isConnected) trigger.focus();
        else settingsButtonRef.current?.focus();
        detailTriggerRef.current = null;
    }

    // Keep the player selected until Vaul finishes closing so its exit animation can remain mounted.
    function handlePlayerDrawerOpenChange(open: boolean) {
        setPlayerDetailsOpen(open);
    }

    // Clear closed content and restore focus only after Vaul's exit animation completes.
    function handlePlayerDrawerAnimationEnd(open: boolean) {
        if (open || !selectedDetails) return;
        setSelectedDetails(null);
        window.requestAnimationFrame(restorePlayerDetailFocus);
    }

    const settingsButton = (
        <Button
            ref={settingsButtonRef}
            type='button'
            variant='outline'
            aria-label='Settings'
            aria-expanded={settingsOpen}
            aria-controls='draft-settings'
            onClick={() => setSettingsOpen(true)}
            className={!isDesktop ? 'size-11 px-0' : undefined}
        >
            <Settings aria-hidden='true' /> <span className='hidden md:inline'>Settings</span>
        </Button>
    );
    const viewControls = (
        <div className='flex flex-wrap items-center gap-2'>
            <div
                role='group'
                aria-label='Player selection'
                className='flex rounded-lg border border-border bg-card p-1'
            >
                <Button
                    type='button'
                    variant={!showSimple ? 'secondary' : 'ghost'}
                    aria-pressed={!showSimple}
                    onClick={() => handleSimpleViewChange(false)}
                >
                    All players
                </Button>
                {hasSlot ? (
                    <Button
                        type='button'
                        variant={showSimple ? 'secondary' : 'ghost'}
                        aria-pressed={showSimple}
                        onClick={() => handleSimpleViewChange(true)}
                    >
                        Your picks
                    </Button>
                ) : null}
            </div>
            {!showSimple ? (
                <Button
                    type='button'
                    variant={assist ? 'secondary' : 'outline'}
                    aria-pressed={assist}
                    onClick={() => onTableSettingsChange({ assist: !assist, valueMode })}
                >
                    <Layers aria-hidden='true' /> Group by round
                </Button>
            ) : null}
            <>
                {!showSimple ? (
                    <select
                        aria-label='Category values'
                        value={valueMode}
                        onChange={(event) =>
                            onTableSettingsChange({
                                assist,
                                valueMode: event.target.value === 'raw' ? 'raw' : 'plusMinus'
                            })
                        }
                        className='h-11 max-w-full rounded-lg border border-input bg-card pl-3 pr-10 text-base'
                    >
                        <option value='plusMinus'>Category scores</option>
                        <option value='raw'>Raw stats</option>
                    </select>
                ) : null}
                {showSimple || !plusMinus ? (
                    <select
                        aria-label='Display stats'
                        value={displayStatsMode}
                        onChange={(event) => {
                            const mode = event.target.value as DataMode;
                            setDisplayStatsMode(mode);
                            writeDisplayStatsMode(mode);
                        }}
                        className='h-11 max-w-full rounded-lg border border-input bg-card pl-3 pr-10 text-base'
                    >
                        <option value='perGame'>Per game</option>
                        <option value='per36'>Per 36 minutes</option>
                        <option value='totals'>Season totals</option>
                    </select>
                ) : null}
            </>
        </div>
    );

    return (
        <div
            className='min-w-0 grid gap-3 md:gap-5'
            style={{ '--board-header-height': `${headerHeight}px` } as CSSProperties}
        >
            <div
                ref={boardHeader}
                className='sticky top-[env(safe-area-inset-top,0px)] z-40 -mx-4 grid gap-3 border-b border-border bg-background px-4 py-3 md:mx-0 md:px-0'
            >
                <header className='flex items-start justify-between gap-3'>
                    <div className='min-w-0 grid gap-1'>
                        <h1 className='mb-0 text-2xl md:text-3xl'>{headline}</h1>
                        <p className='mb-0 text-sm text-muted-foreground'>
                            {profile.leagueSize}-team {profile.draftType} · {profile.draftRounds} rounds
                            {profile.draftSlot ? ` · Pick ${profile.draftSlot}` : ''}
                        </p>
                        <p className='mb-0 hidden text-sm font-medium md:block'>{summary}</p>
                        <p className='mb-0 hidden text-sm text-muted-foreground md:block'>
                            Ranked using {modeLabels[profile.dataMode ?? 'perGame'].toLowerCase()} statistics.
                        </p>
                    </div>
                    {isDesktop ? (
                        <Button type='button' variant='outline' onClick={() => setWeightsOpen(true)}>
                            <Pencil aria-hidden='true' /> Edit weights
                        </Button>
                    ) : (
                        settingsButton
                    )}
                </header>
                <div className='flex items-center gap-2 md:gap-3'>
                    <Input
                        type='search'
                        value={nameQuery}
                        onChange={(event) => setNameQuery(event.target.value)}
                        placeholder='Search players'
                        aria-label='Search players'
                        className='min-w-0 flex-1 bg-card md:max-w-md'
                    />
                    {isDesktop ? settingsButton : <BoardViewDrawer>{viewControls}</BoardViewDrawer>}
                </div>
                {isDesktop ? viewControls : null}
            </div>

            <WeightsDrawer
                open={weightsOpen}
                onOpenChange={setWeightsOpen}
                value={draft}
                onApply={handleDiscreteChange}
            />
            <SettingsDrawer
                open={settingsOpen}
                onOpenChange={handleSettingsOpenChange}
                value={draft}
                updating={rankQuery.isFetching}
                onApply={handleDiscreteChange}
            />
            <PlayerDetailDrawer
                open={playerDetailsOpen}
                player={selectedPlayer}
                profile={profile}
                onOpenChange={handlePlayerDrawerOpenChange}
                onAnimationEnd={handlePlayerDrawerAnimationEnd}
            />

            {showSimple ? (
                <p className='mb-0 max-w-2xl text-sm text-muted-foreground'>
                    If the room follows this ranking order, these are the players at your picks. This is a reference,
                    not a prediction of availability.
                </p>
            ) : null}
            <p className='mb-0 text-sm text-muted-foreground'>
                {showSimple || !plusMinus
                    ? `${modeLabels[displayStatsMode]} raw stats. Changing this display does not change rankings.`
                    : 'Category scores show standardized strength. Punted categories are excluded; weights affect ranking.'}{' '}
                Select a player to explore their fit.
            </p>
            {rankError ? (
                <div
                    role='alert'
                    className='flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4'
                >
                    <p className='mb-0 text-destructive'>{rankError}</p>
                    <Button type='button' variant='outline' onClick={() => void rankQuery.refetch()}>
                        Retry rankings
                    </Button>
                </div>
            ) : null}
            {rankQuery.isFetching && players.length > 0 ? (
                <p role='status' className='mb-0 text-sm text-muted-foreground'>
                    Updating rankings…
                </p>
            ) : null}
            <div aria-busy={rankQuery.isFetching} className='min-w-0'>
                {rankQuery.isFetching && players.length === 0 ? (
                    <>
                        <LoadingCopy ranking />
                        <div aria-hidden='true' className='grid gap-3'>
                            {[0, 1, 2].map((row) => (
                                <div key={row} className='h-16 rounded-lg bg-muted motion-safe:animate-pulse' />
                            ))}
                        </div>
                    </>
                ) : !hasRows && !rankError ? (
                    <div className='grid justify-items-start gap-3 rounded-lg border border-border bg-card p-6'>
                        <h2 className='mb-0 text-lg'>
                            {query ? 'No players match that name.' : 'No players on this board.'}
                        </h2>
                        <p className='mb-0 text-muted-foreground'>
                            {query
                                ? 'Try another name or return to the full list.'
                                : 'Check your build settings, then try ranking again.'}
                        </p>
                        <Button
                            type='button'
                            variant='outline'
                            onClick={() => (query ? setNameQuery('') : setSettingsOpen(true))}
                        >
                            {query ? 'Clear search' : 'Review settings'}
                        </Button>
                    </div>
                ) : hasRows ? (
                    <PlayerTable
                        stickyTop={headerHeight}
                        groups={capped.groups}
                        enabledCats={profile.enabledCats}
                        emptyLabel='No players on this board.'
                        profile={profile}
                        highlight={highlight}
                        valueMode={showSimple ? 'raw' : valueMode}
                        displayStatsMode={displayStatsMode}
                        yourOverallPicks={yourPickSet}
                        onPlayerSelect={handlePlayerSelect}
                        playerDetailsDisabled={rankQuery.isPlaceholderData}
                    />
                ) : null}
            </div>
            {capped.hiddenCount > 0 ? (
                <Button
                    type='button'
                    variant='outline'
                    className='justify-self-start'
                    onClick={() => setShowRest(true)}
                >
                    Show {capped.hiddenCount} remaining players
                </Button>
            ) : null}
        </div>
    );
}
