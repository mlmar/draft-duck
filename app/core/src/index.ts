// Public surface for the core package. Apps import from here, not the files below.
export type { CatKey, CatStance, DraftProfile, PlayerSeason, RankedPlayer } from './types.ts';
export { CAT_KEYS, CAT_LABELS } from './types.ts';
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
