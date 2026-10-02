import { PlayerTable, type CatValueMode } from '@/components/draft/player-table';
import { PlayerDetailDrawer } from '@/components/draft/player-detail-drawer';
import { SettingsDrawer } from '@/components/draft/settings-drawer';
import { WeightsDrawer } from '@/components/onboard/weights-drawer';
import { WeightChart } from '@/components/onboard/weight-chart';
import { LoadingCopy } from '@/components/loading-copy';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebouncedValue } from '@/hooks/use-debounce';
import { rankPlayers } from '@/lib/api';
import { readBoardView, writeBoardView } from '@/lib/board-view';
import { applyDisplayCap } from '@/lib/display-cap';
import { canPersist, profileToQuizDraft, quizDraftToProfile, type QuizDraft } from '@/lib/quiz';
import { cn } from '@/lib/utils';
import { useDraftProfileStore } from '@/stores/draft-profile';
import {
    catHighlightStrategy,
    DEFAULT_CAT_HIGHLIGHT_MODE,
    draftProfileSchema,
    overallPicksForDraft,
    partitionByRound,
    profileHeadline,
    stanceSummary,
    type RankedPlayer
} from '@draft-duck/core';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Eye, Layers, Pencil, Settings, type LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type Ref } from 'react';

const SEARCH_DEBOUNCE_MS = 200;
const CAT_HIGHLIGHT_MODE = DEFAULT_CAT_HIGHLIGHT_MODE;

type DraftBoardProps = {
    assist: boolean;
    valueMode: CatValueMode;
    onTableSettingsChange: (settings: { assist: boolean; valueMode: CatValueMode }) => void;
};

type ToolbarButtonProps = {
    icon: LucideIcon;
    label: string;
    pressed?: boolean;
    expanded?: boolean;
    controls?: string;
    buttonRef?: Ref<HTMLButtonElement>;
    className?: string;
    onClick: () => void;
};

// Icon plus label on desktop. Icon only below md. aria-label stays either way.
function ToolbarButton({
    icon: Icon,
    label,
    pressed,
    expanded,
    controls,
    buttonRef,
    className,
    onClick
}: ToolbarButtonProps) {
    return (
        <Button
            ref={buttonRef}
            type='button'
            variant={pressed || expanded ? 'default' : 'outline'}
            aria-label={label}
            aria-pressed={pressed}
            aria-expanded={expanded}
            aria-controls={controls}
            onClick={onClick}
            className={cn('size-11 px-0 md:h-11 md:w-auto md:px-4', className)}
        >
            <Icon />
            <span className='hidden md:inline'>{label}</span>
        </Button>
    );
}

export function DraftBoard({ assist, valueMode, onTableSettingsChange }: DraftBoardProps) {
    const navigate = useNavigate();
    const profile = useDraftProfileStore((state) => state.profile);
    const setProfile = useDraftProfileStore((state) => state.setProfile);
    const [draft, setDraft] = useState<QuizDraft | null>(null);
    const [hydrated, setHydrated] = useState(false);
    const [nameQuery, setNameQuery] = useState('');
    // Input stays live. The table filters after the pause so each key is not a full rebuild.
    const debouncedNameQuery = useDebouncedValue(nameQuery, SEARCH_DEBOUNCE_MS);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [weightsOpen, setWeightsOpen] = useState(false);
    const [showRest, setShowRest] = useState(false);
    const [simpleView, setSimpleView] = useState(() => readBoardView() !== 'full');
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

    const sections = partitionByRound(players, profile.leagueSize, profile.draftRounds);
    const rankError = rankQuery.error instanceof Error ? rankQuery.error.message : null;
    const highlight = catHighlightStrategy(CAT_HIGHLIGHT_MODE);
    const query = debouncedNameQuery.trim().toLowerCase();
    const groups = assist
        ? sections
              .map((section) => ({
                  id: `round-${section.round}`,
                  label: `Round ${section.round} · ${section.players.length} ${
                      section.players.length === 1 ? 'player' : 'players'
                  }`,
                  players: filterByName(section.players, query)
              }))
              // High draftRounds and a name search can leave empty buckets. Skip those headers.
              .filter((group) => group.players.length > 0)
        : [{ id: 'board', players: filterByName(players, query) }];
    const displayCap = profile.leagueSize * profile.draftRounds;
    const capped = applyDisplayCap(groups, {
        cap: displayCap,
        lift: Boolean(query) || showRest,
        clipLastGroup: assist
    });
    const slotPlayers = yourPicks.flatMap((overall) => {
        const player = players[overall - 1];
        return player ? [player] : [];
    });
    const simpleGroups = [{ id: 'picks', players: slotPlayers }];

    const headline = profileHeadline(profile);
    const summary = stanceSummary(profile);
    // Simple is slot names. No slot would be an empty list, so stay on the full table.
    const hasSlot = Boolean(profile.draftSlot);
    const showSimple = simpleView && hasSlot;
    const plusMinus = valueMode === 'plusMinus';

    // Store the real name-button trigger so dismissal can restore focus after filtering or view changes.
    function handlePlayerSelect(player: RankedPlayer, trigger: HTMLButtonElement) {
        const activeProfile = profile;
        if (rankQuery.isPlaceholderData || !activeProfile) return;
        detailTriggerRef.current = trigger;
        setSelectedDetails({ playerId: player.playerId, profile: activeProfile });
    }

    // Focus the original name when it still exists, or the persistent settings control if the row disappeared.
    function restorePlayerDetailFocus() {
        const trigger = detailTriggerRef.current;
        if (trigger?.isConnected) trigger.focus();
        else settingsButtonRef.current?.focus();
        detailTriggerRef.current = null;
    }

    // Dismissal is controlled here so focus returns consistently for close, Escape, and backdrop actions.
    function handlePlayerDrawerOpenChange(open: boolean) {
        if (open) return;
        setSelectedDetails(null);
        window.requestAnimationFrame(restorePlayerDetailFocus);
    }

    const settingsButton = (
        <ToolbarButton
            icon={Settings}
            label='Settings'
            expanded={settingsOpen}
            controls='draft-settings'
            buttonRef={settingsButtonRef}
            onClick={() => setSettingsOpen(true)}
        />
    );

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
                <WeightChart
                    enabledCats={profile.enabledCats}
                    tuners={draft.intensity}
                    stances={draft.stances}
                    variant='mini'
                />
                <Button
                    type='button'
                    variant='ghost'
                    className='h-auto justify-self-end gap-1 px-1 py-1 text-sm text-muted-foreground hover:bg-transparent hover:text-foreground'
                    onClick={() => setWeightsOpen(true)}
                >
                    <Pencil aria-hidden='true' />
                    Edit weights
                </Button>
                <WeightsDrawer
                    open={weightsOpen}
                    onOpenChange={setWeightsOpen}
                    value={draft}
                    onApply={handleDiscreteChange}
                />
            </header>

            <SettingsDrawer
                open={settingsOpen}
                onOpenChange={handleSettingsOpenChange}
                value={draft}
                updating={rankQuery.isFetching}
                hasSlot={hasSlot}
                simpleView={simpleView}
                assist={assist}
                valueMode={valueMode}
                onApply={(nextDraft, settings) => {
                    handleDiscreteChange(nextDraft);
                    if (settings.simpleView !== simpleView) handleSimpleViewChange(settings.simpleView);
                    if (settings.assist !== assist || settings.valueMode !== valueMode) {
                        onTableSettingsChange({ assist: settings.assist, valueMode: settings.valueMode });
                    }
                }}
            />

            <PlayerDetailDrawer
                open={selectedPlayer !== null}
                player={selectedPlayer}
                profile={profile}
                onOpenChange={handlePlayerDrawerOpenChange}
            />

            {rankError ? <p className='mb-0 text-destructive'>{rankError}</p> : null}

            {/* Pins at the top of the viewport. Headline scrolls away.
                Search sits here too so the page is the only vertical scroller. */}
            <div className='sticky top-[env(safe-area-inset-top,0px)] z-40 -mx-1 grid gap-2 bg-background px-1 py-2'>
                <div className='flex items-center gap-2'>
                    <div className='hidden items-center gap-2 md:flex'>
                        {hasSlot ? (
                            <ToolbarButton
                                icon={Eye}
                                label={showSimple ? 'Full table' : 'Simple view'}
                                // min-w covers both labels so the first control does not resize on toggle.
                                className='md:min-w-44'
                                onClick={() => handleSimpleViewChange(!showSimple)}
                            />
                        ) : null}
                        {showSimple ? null : (
                            <>
                                <ToolbarButton
                                    icon={Layers}
                                    label='Draft assistance'
                                    pressed={assist}
                                    onClick={() => onTableSettingsChange({ assist: !assist, valueMode })}
                                />
                                <Button
                                    type='button'
                                    variant={plusMinus ? 'default' : 'outline'}
                                    aria-label={plusMinus ? '+- Z Scores' : '# Raw Stats'}
                                    aria-pressed={plusMinus}
                                    // Phone matches other toolbar squares. Desktop holds the longer label still.
                                    className='size-11 px-0 md:h-11 md:w-auto md:min-w-36 md:px-4'
                                    onClick={() =>
                                        onTableSettingsChange({ assist, valueMode: plusMinus ? 'raw' : 'plusMinus' })
                                    }
                                >
                                    {plusMinus ? (
                                        <>
                                            +-<span className='hidden md:inline'> Z Scores</span>
                                        </>
                                    ) : (
                                        <>
                                            #<span className='hidden md:inline'> Raw Stats</span>
                                        </>
                                    )}
                                </Button>
                            </>
                        )}
                    </div>
                    <div className='min-w-0 flex-1 md:hidden'>
                        <Input
                            type='search'
                            value={nameQuery}
                            onChange={(event) => setNameQuery(event.target.value)}
                            placeholder='Search players'
                            aria-label='Search players'
                        />
                    </div>
                    {settingsButton}
                </div>
                <div className='hidden max-w-sm md:block'>
                    <Input
                        type='search'
                        value={nameQuery}
                        onChange={(event) => setNameQuery(event.target.value)}
                        placeholder='Search players'
                        aria-label='Search players'
                    />
                </div>
            </div>

            <div
                key={showSimple ? 'simple' : 'full'}
                className='grid animate-in fade-in gap-4 duration-200 motion-reduce:animate-none'
            >
                {showSimple ? (
                    <>
                        <p className='mb-0 max-w-xl text-muted-foreground'>
                            If the room drafted this board in order, this is the name at your pick.
                        </p>
                        {rankQuery.isFetching && slotPlayers.length === 0 ? (
                            <LoadingCopy />
                        ) : (
                            <PlayerTable
                                groups={simpleGroups}
                                enabledCats={profile.enabledCats}
                                emptyLabel='No players on this board.'
                                profile={profile}
                                highlight={highlight}
                                // Raw / +/- is unmounted here. Keep the selected dataset's stats.
                                valueMode='raw'
                                yourOverallPicks={yourPickSet}
                                onPlayerSelect={handlePlayerSelect}
                                playerDetailsDisabled={rankQuery.isPlaceholderData}
                            />
                        )}
                    </>
                ) : (
                    <>
                        <PlayerTable
                            groups={capped.groups}
                            enabledCats={profile.enabledCats}
                            emptyLabel={query ? 'No players match that name.' : 'No players on this board.'}
                            profile={profile}
                            highlight={highlight}
                            valueMode={valueMode}
                            yourOverallPicks={yourPickSet}
                            onPlayerSelect={handlePlayerSelect}
                            playerDetailsDisabled={rankQuery.isPlaceholderData}
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
                    </>
                )}
            </div>
        </div>
    );
}

function filterByName<T extends { name: string }>(players: T[], query: string): T[] {
    if (!query) return players;
    return players.filter((player) => player.name.toLowerCase().includes(query));
}
