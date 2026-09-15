import { readFile } from 'node:fs/promises';
import { parse } from 'csv-parse/sync';
import type { PlayerStatsProvider } from './provider.ts';
import type { PlayerSeason } from './types.ts';

// Skip guys who barely played. Tiny samples blow up z-scores.
export const DEFAULT_MIN_GAMES = 20;

// Basketball-Reference dumps a league-average row. Not a real player.
const LEAGUE_AVERAGE_ID = '-9999';
// Traded players get a combined row like 2TM or 3TM. Prefer that over split stints.
const COMBINED_TEAM = /^\d+TM$/;

export type CsvProviderOptions = {
    minGames?: number;
};

type CsvRow = Record<string, string>;

// Reads a Basketball-Reference per-game CSV into one PlayerSeason per person.
export class CsvProvider implements PlayerStatsProvider {
    private readonly minGames: number;

    constructor(
        private readonly csvPath: string,
        options: CsvProviderOptions = {}
    ) {
        this.minGames = options.minGames ?? DEFAULT_MIN_GAMES;
    }

    async load(): Promise<PlayerSeason[]> {
        const raw = await readFile(this.csvPath, 'utf8');
        // Excel and BR exports sometimes prefix a BOM. csv-parse chokes on it as a header.
        const rows = parse(raw.replace(/^\uFEFF/, ''), {
            columns: true,
            skip_empty_lines: true,
            relax_column_count: true
        }) as CsvRow[];

        return collapseRows(rows)
            .map(mapRow)
            .filter((player) => player.games >= this.minGames);
    }
}

// One row per player id. Drops the league-average line and trade duplicates.
function collapseRows(rows: CsvRow[]): CsvRow[] {
    const byId = new Map<string, CsvRow[]>();

    for (const row of rows) {
        const playerId = row['Player-additional'] ?? '';
        if (!playerId || playerId === LEAGUE_AVERAGE_ID) continue;
        const group = byId.get(playerId);
        if (group) group.push(row);
        else byId.set(playerId, [row]);
    }

    const collapsed: CsvRow[] = [];
    for (const group of byId.values()) {
        const combined = group.find((row) => COMBINED_TEAM.test(row.Team ?? ''));
        if (combined) {
            collapsed.push(combined);
            continue;
        }
        const only = group[0];
        if (group.length === 1 && only) {
            collapsed.push(only);
            continue;
        }
        // No combined row (rare). Keep the stint with the most games.
        const first = group[0];
        if (!first) continue;
        collapsed.push(group.reduce((best, row) => (parseNumber(row.G) > parseNumber(best.G) ? row : best), first));
    }

    return collapsed;
}

function mapRow(row: CsvRow): PlayerSeason {
    const fga = parseNumber(row.FGA);
    const fta = parseNumber(row.FTA);

    return {
        playerId: row['Player-additional'] ?? '',
        name: row.Player ?? '',
        team: row.Team ?? '',
        pos: row.Pos ?? '',
        age: parseNumber(row.Age),
        games: parseNumber(row.G),
        mp: parseNumber(row.MP),
        pts: parseNumber(row.PTS),
        trb: parseNumber(row.TRB),
        ast: parseNumber(row.AST),
        stl: parseNumber(row.STL),
        blk: parseNumber(row.BLK),
        fg3: parseNumber(row['3P']),
        fg3a: parseNumber(row['3PA']),
        fg: parseNumber(row.FG),
        fga,
        fgPct: parsePct(row['FG%'], fga),
        ft: parseNumber(row.FT),
        fta,
        ftPct: parsePct(row['FT%'], fta),
        tov: parseNumber(row.TOV)
    };
}

function parseNumber(value: string | undefined): number {
    if (value === undefined || value.trim() === '') {
        throw new Error('Expected a number, got an empty CSV field');
    }
    const n = Number(value);
    if (!Number.isFinite(n)) {
        throw new Error(`Expected a number, got ${JSON.stringify(value)}`);
    }
    return n;
}

// Empty percent with zero attempts is "did not shoot", not 0%. Callers can treat null as N/A.
function parsePct(value: string | undefined, attempts: number): number | null {
    if (attempts === 0 || value === undefined || value.trim() === '') return null;
    return parseNumber(value);
}
