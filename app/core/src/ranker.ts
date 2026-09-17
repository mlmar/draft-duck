import { DEFAULT_OPERATOR_WEIGHTS } from './operator-weights.ts';
import { profileWeight } from './profile.ts';
import { mean, std, zScore } from './stats.ts';
import { identitySuggestionHook, type SuggestionHook } from './suggestion-hook.ts';
import type { CatKey, DraftProfile, PlayerSeason, RankedPlayer } from './types.ts';

export type RankOptions = {
    operatorWeights?: Record<CatKey, number>;
    // Swap at bootstrap. Default is identity. Do not put ranking math in a hook.
    suggestionHook?: SuggestionHook;
};

const ATTEMPTS_FOR: Record<'fgPct' | 'ftPct', 'fga' | 'fta'> = {
    fgPct: 'fga',
    ftPct: 'fta'
};

export function rank(universe: PlayerSeason[], profile: DraftProfile, options: RankOptions = {}): RankedPlayer[] {
    const operatorWeights = options.operatorWeights ?? DEFAULT_OPERATOR_WEIGHTS;
    const hook = options.suggestionHook ?? identitySuggestionHook;
    // Disabled cats are omitted from z and the composite. Punt keeps the cat in z with profile_w 0.
    const enabledCats = uniqueCats(profile.enabledCats);

    if (universe.length === 0) return hook.annotate([]);

    const zByIndex = enabledCats.map((cat) => categoryZScores(universe, cat));

    const scored: RankedPlayer[] = universe.map((player, index) => {
        const z: Partial<Record<CatKey, number>> = {};
        // composite = Σ operator_w[c] * profile_w[c] * z[c] over enabled cats only.
        let composite = 0;
        for (let catIndex = 0; catIndex < enabledCats.length; catIndex++) {
            const cat = enabledCats[catIndex]!;
            const catZ = zByIndex[catIndex]![index]!;
            z[cat] = catZ;
            composite += (operatorWeights[cat] ?? 1) * profileWeight(profile, cat) * catZ;
        }
        return { ...player, z, composite, rank: 0 };
    });

    // Higher composite first. Equal composites break ties by playerId so order is stable. Rank is 1-based after this sort.
    scored.sort((a, b) => {
        if (b.composite !== a.composite) return b.composite - a.composite;
        return a.playerId.localeCompare(b.playerId);
    });

    const ranked = scored.map((player, index) => ({
        ...player,
        rank: index + 1
    }));

    // Rank is already assigned. Annotate last so a buggy hook cannot become the ranker.
    return hook.annotate(ranked);
}

function uniqueCats(cats: CatKey[]): CatKey[] {
    return [...new Set(cats)];
}

function categoryZScores(universe: PlayerSeason[], cat: CatKey): number[] {
    if (cat === 'fgPct' || cat === 'ftPct') return volumeAdjustedZ(universe, cat);

    // Counting stats: z = (x - mean) / std. Same helper for TOV before the sign flip below.
    const values = universe.map((player) => player[cat] as number);
    const valuesMean = mean(values);
    const valuesStd = std(values, valuesMean);
    const scores = values.map((value) => zScore(value, valuesMean, valuesStd));
    // Lower TOV is better: z_tov = -(tov - mean) / std.
    if (cat === 'tov') return scores.map((score) => -score);
    return scores;
}

function volumeAdjustedZ(universe: PlayerSeason[], cat: 'fgPct' | 'ftPct'): number[] {
    const attemptsKey = ATTEMPTS_FOR[cat];
    // League rate is the simple mean of non-null player percentages, not attempt-weighted.
    const rates = universe.map((player) => player[cat]).filter((value): value is number => value !== null);
    const leaguePct = mean(rates);

    // impact = (pct - leaguePct) * attempts. Null pct (no attempts) => impact 0, treated as neutral.
    const impacts = universe.map((player) => {
        const pct = player[cat];
        if (pct === null) return 0;
        return (pct - leaguePct) * player[attemptsKey];
    });

    const impactMean = mean(impacts);
    const impactStd = std(impacts, impactMean);
    return impacts.map((impact) => zScore(impact, impactMean, impactStd));
}
