// Public surface for the core package. Apps import from here, not the files below.
export type { ArchetypeId, CatKey, CatStance, DraftProfile, PlayerSeason, RankedPlayer } from './types.ts';
export { ARCHETYPE_IDS, CAT_KEYS, CAT_LABELS } from './types.ts';
export {
    ARCHETYPE_LABELS,
    NAMED_BUILD_IDS,
    NAMED_BUILDS,
    archetypeLabel,
    isNamedBuildId,
    isNamedBuildVisible,
    namedBuildHelper,
    profileHeadline,
    restoreSummary,
    stancesForArchetype
} from './named-builds.ts';
export type { NamedBuild, NamedBuildId } from './named-builds.ts';
export { ordinal, overallPick, overallPicksForDraft } from './draft-slot.ts';
export type { OverallPickInput } from './draft-slot.ts';
export { fitMarks, needCatFit, needCats, puntCats, whyCopy } from './need-fit.ts';
export type { FitMark } from './need-fit.ts';
export type { PlayerStatsProvider } from './provider.ts';
export { CsvProvider, DEFAULT_MIN_GAMES } from './csv-provider.ts';
export type { CsvProviderOptions } from './csv-provider.ts';
export { draftProfileSchema, rankRequestSchema, profileWeight } from './profile.ts';
export type { RankRequest } from './profile.ts';
export { DEFAULT_OPERATOR_WEIGHTS } from './operator-weights.ts';
export { mean, std, zScore } from './stats.ts';
export { rank } from './ranker.ts';
export type { RankOptions } from './ranker.ts';
export { identitySuggestionHook } from './suggestion-hook.ts';
export type { SuggestionHook } from './suggestion-hook.ts';
export { partitionByRound } from './partition.ts';
export type { RoundSection } from './partition.ts';
export {
    CAT_HIGHLIGHT_MODES,
    CAT_HIGHLIGHT_STRATEGIES,
    DEFAULT_CAT_HIGHLIGHT_MODE,
    HEAT_CLAMP,
    HEAT_DEAD_ZONE,
    catHighlightStrategy,
    formatSignedScore,
    heatFromScore,
    leagueZHighlight,
    teamNeedHighlight
} from './cat-highlight.ts';
export type {
    CatHighlightInput,
    CatHighlightMode,
    CatHighlightResult,
    CatHighlightStrategy,
    HeatRamp
} from './cat-highlight.ts';
