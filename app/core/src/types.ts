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
