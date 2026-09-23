import { DEFAULT_OPERATOR_WEIGHTS } from './operator-weights.ts';
import { profileWeight } from './profile.ts';
import { DEFAULT_AVAILABILITY_FLOOR } from './ranker-config.ts';
import { mean, std, zScore } from './stats.ts';
import { identitySuggestionHook, type SuggestionHook } from './suggestion-hook.ts';
import type { CatKey, DraftProfile, PlayerSeason, RankedPlayer } from './types.ts';

export type RankOptions = {
    operatorWeights?: Record<CatKey, number>;
    // Swap at bootstrap. Default is identity. Do not put ranking math in a hook.
    suggestionHook?: SuggestionHook;
    // Default is ranker.json (false). true runs the consensus splice. Tests pass true to cover the floor.
    availabilityFloor?: boolean;
    // Extra ranks a consensus player may fall when the floor is on. Default is leagueSize (one round).
    availabilitySlack?: number;
};

const ATTEMPTS_FOR: Record<'fgPct' | 'ftPct', 'fga' | 'fta'> = {
    fgPct: 'fga',
    ftPct: 'fta'
};

type ScoredPlayer = PlayerSeason & {
    z: Partial<Record<CatKey, number>>;
    composite: number;
    consensusComposite: number;
};

export function rank(universe: PlayerSeason[], profile: DraftProfile, options: RankOptions = {}): RankedPlayer[] {
    const operatorWeights = options.operatorWeights ?? DEFAULT_OPERATOR_WEIGHTS;
    const hook = options.suggestionHook ?? identitySuggestionHook;
    // Disabled cats are omitted from z and the composite. Punt keeps the cat in z with profile_w 0.
    const enabledCats = uniqueCats(profile.enabledCats);

    if (universe.length === 0) return hook.annotate([]);

    const zByIndex = enabledCats.map((cat) => categoryZScores(universe, cat));
    // Same z, Neutral weights, no intensity. Stand-in for ADP until a market source exists.
    const consensusProfile: DraftProfile = { ...profile, stances: {}, intensity: undefined };

    const scored: ScoredPlayer[] = universe.map((player, index) => {
        const z: Partial<Record<CatKey, number>> = {};
        // composite = Σ operator_w[c] * profile_w[c] * z[c] over enabled cats only.
        let composite = 0;
        let consensusComposite = 0;
        for (let catIndex = 0; catIndex < enabledCats.length; catIndex++) {
            const cat = enabledCats[catIndex]!;
            const catZ = zByIndex[catIndex]![index]!;
            z[cat] = catZ;
            composite += (operatorWeights[cat] ?? 1) * profileWeight(profile, cat) * catZ;
            consensusComposite += (operatorWeights[cat] ?? 1) * profileWeight(consensusProfile, cat) * catZ;
        }
        return { ...player, z, composite, consensusComposite };
    });

    const fitOrder = sortByScore(scored, (player) => player.composite);
    const consensusOrder = sortByScore(scored, (player) => player.consensusComposite);
    const fitRankById = rankById(fitOrder);
    const consensusRankById = rankById(consensusOrder);

    // v1 is fit order. The floor is off in ranker.json so a punt board can bury poor-fit stars.
    const availabilityFloor = options.availabilityFloor ?? DEFAULT_AVAILABILITY_FLOOR;
    const slack = options.availabilitySlack ?? profile.leagueSize;
    const ordered = availabilityFloor ? applyAvailabilityFloor(fitOrder, consensusOrder, slack) : fitOrder;

    const ranked = ordered.map((player, index) => {
        const { consensusComposite: _consensusComposite, ...rest } = player;
        return {
            ...rest,
            rank: index + 1,
            fitRank: fitRankById.get(player.playerId)!,
            consensusRank: consensusRankById.get(player.playerId)!
        };
    });

    // Rank is already assigned. Annotate last so a buggy hook cannot become the ranker.
    return hook.annotate(ranked);
}

function sortByScore(players: ScoredPlayer[], score: (player: ScoredPlayer) => number): ScoredPlayer[] {
    return [...players].sort((a, b) => {
        const delta = score(b) - score(a);
        if (delta !== 0) return delta;
        return a.playerId.localeCompare(b.playerId);
    });
}

function rankById(ordered: ScoredPlayer[]): Map<string, number> {
    return new Map(ordered.map((player, index) => [player.playerId, index + 1]));
}

// Walk consensus-best first and splice anyone who fell past consensusRank + slack back up to that floor.
function applyAvailabilityFloor(
    fitOrder: ScoredPlayer[],
    consensusOrder: ScoredPlayer[],
    slack: number
): ScoredPlayer[] {
    const ordered = [...fitOrder];
    const indexById = new Map(ordered.map((player, index) => [player.playerId, index]));

    for (let consensusIndex = 0; consensusIndex < consensusOrder.length; consensusIndex++) {
        const player = consensusOrder[consensusIndex]!;
        const currentIndex = indexById.get(player.playerId);
        if (currentIndex === undefined) continue;
        const floorIndex = Math.min(ordered.length - 1, consensusIndex + slack);
        if (currentIndex <= floorIndex) continue;

        ordered.splice(currentIndex, 1);
        ordered.splice(floorIndex, 0, player);
        for (let index = floorIndex; index <= currentIndex; index++) {
            indexById.set(ordered[index]!.playerId, index);
        }
    }

    return ordered;
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
