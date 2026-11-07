import type { CatKey } from './types.ts';

export type ComparisonCategory = {
    key: CatKey;
    label: string;
    direction: 'higher' | 'lower';
    format: 'count' | 'percentage';
};

export type ComparisonTeam = {
    teamKey: string;
    name: string;
    isOwned: boolean;
    values: Partial<Record<CatKey, number | null>>;
};

export type LeagueComparison = {
    league: {
        leagueKey: string;
        name: string;
        season: number;
        teamCount: number;
        currentWeek: number;
        weeks: number[];
        isFinished?: boolean;
    };
    week: number;
    inProgress: boolean;
    fetchedAt: string;
    categories: ComparisonCategory[];
    teams: ComparisonTeam[];
};

export type RankedComparisonTeam = ComparisonTeam & { ranks: Partial<Record<CatKey, number | null>> };

/** Assign competition ranks (1, 2, 2, 4), omitting teams without a usable category value. */
export function competitionRanks(teams: ComparisonTeam[], category: ComparisonCategory): Map<string, number | null> {
    const sorted = [...teams]
        .filter((team) => typeof team.values[category.key] === 'number' && Number.isFinite(team.values[category.key]))
        .sort((a, b) => {
            const av = a.values[category.key] as number;
            const bv = b.values[category.key] as number;
            const delta = category.direction === 'higher' ? bv - av : av - bv;
            return delta || a.name.localeCompare(b.name) || a.teamKey.localeCompare(b.teamKey);
        });
    const result = new Map(teams.map((team) => [team.teamKey, null as number | null]));
    let previous: number | undefined;
    let rank = 0;
    sorted.forEach((team, index) => {
        const value = team.values[category.key] as number;
        if (previous === undefined || value !== previous) rank = index + 1;
        result.set(team.teamKey, rank);
        previous = value;
    });
    return result;
}

/** Sort by one category while keeping missing values last and all ties deterministic. */
export function sortComparisonTeams(teams: ComparisonTeam[], category: ComparisonCategory): ComparisonTeam[] {
    return [...teams].sort((a, b) => {
        const av = a.values[category.key];
        const bv = b.values[category.key];
        if (typeof av !== 'number')
            return typeof bv !== 'number' ? a.name.localeCompare(b.name) || a.teamKey.localeCompare(b.teamKey) : 1;
        if (typeof bv !== 'number') return -1;
        const delta = category.direction === 'higher' ? bv - av : av - bv;
        return delta || a.name.localeCompare(b.name) || a.teamKey.localeCompare(b.teamKey);
    });
}

/** Format source values without changing their precision; percentages arrive as Yahoo decimals. */
export function formatComparisonValue(value: number | null | undefined, format: ComparisonCategory['format']): string {
    if (value == null || !Number.isFinite(value)) return '—';
    return format === 'percentage'
        ? `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 10 }).format(value * 100)}%`
        : new Intl.NumberFormat('en-US', { maximumFractionDigits: 10 }).format(value);
}

/** Rank each enabled category independently and retain explicit unranked slots for missing values. */
export function rankComparison(teams: ComparisonTeam[], categories: ComparisonCategory[]): RankedComparisonTeam[] {
    const byCategory = new Map(categories.map((category) => [category.key, competitionRanks(teams, category)]));
    return teams.map((team) => ({
        ...team,
        ranks: Object.fromEntries(
            categories.map(({ key }) => [key, byCategory.get(key)?.get(team.teamKey) ?? null])
        ) as Partial<Record<CatKey, number | null>>
    }));
}
