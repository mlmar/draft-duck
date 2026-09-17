// One player's per-game line for a season. Percents are null when they never shot.
export type PlayerSeason = {
    playerId: string;
    name: string;
    team: string;
    pos: string;
    age: number;
    games: number;
    mp: number;
    pts: number;
    trb: number;
    ast: number;
    stl: number;
    blk: number;
    fg3: number;
    fg3a: number;
    fg: number;
    fga: number;
    fgPct: number | null;
    ft: number;
    fta: number;
    ftPct: number | null;
    tov: number;
};

// Standard 9-cat keys. Match PlayerSeason field names so the ranker can read stats by key.
export const CAT_KEYS = ['pts', 'trb', 'ast', 'stl', 'blk', 'fg3', 'fgPct', 'ftPct', 'tov'] as const;
export type CatKey = (typeof CAT_KEYS)[number];

export type CatStance = 'need' | 'neutral' | 'punt';

export type DraftProfile = {
    leagueSize: 8 | 10 | 12 | 14;
    draftRounds: number;
    draftType: 'snake' | 'linear';
    enabledCats: CatKey[];
    stances: Partial<Record<CatKey, CatStance>>;
    /** 0-2 intensity. Omit a cat (or the whole map) to default that cat to 1. */
    intensity?: Partial<Record<CatKey, number>>;
};

// RankedPlayer.z only includes enabled cats. Disabled cats are omitted, not zeroed.
export type RankedPlayer = PlayerSeason & {
    z: Partial<Record<CatKey, number>>;
    composite: number;
    rank: number;
    /** Unused in v1. Filled only by an annotator, never by z-score math. */
    notes?: string;
};
