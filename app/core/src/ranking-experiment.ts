import { DEFAULT_OPERATOR_WEIGHTS } from './operator-weights.ts';
import { rank } from './ranker.ts';
import { mean, std, zScore } from './stats.ts';
import { CAT_KEYS, type CatKey, type DraftProfile, type PlayerSeason } from './types.ts';

export const EXPERIMENT_PROFILE: DraftProfile = {
    leagueSize: 12,
    draftRounds: 13,
    draftType: 'snake',
    enabledCats: [...CAT_KEYS],
    stances: {}
};

export const CANDIDATES = [
    { id: 'per-game', perGame: 1, totals: 0, per36: 0, minutesAdjusted: false },
    { id: 'totals', perGame: 0, totals: 1, per36: 0, minutesAdjusted: false },
    { id: 'per-36', perGame: 0, totals: 0, per36: 1, minutesAdjusted: false },
    { id: 'game-70-total-30', perGame: 0.7, totals: 0.3, per36: 0, minutesAdjusted: false },
    { id: 'game-50-total-50', perGame: 0.5, totals: 0.5, per36: 0, minutesAdjusted: false },
    { id: 'game-55-total-35-rate-10', perGame: 0.55, totals: 0.35, per36: 0.1, minutesAdjusted: false },
    { id: 'game-55-total-35-rate-10-minutes', perGame: 0.55, totals: 0.35, per36: 0.1, minutesAdjusted: true }
] as const;

export type Candidate = (typeof CANDIDATES)[number];
export type ThreeViews = { perGame: PlayerSeason[]; per36: PlayerSeason[]; totals: PlayerSeason[] };
export type Outcome = { values: Map<string, number>; referenceCount: number; playedCount: number; replacement: number };
export type TestResult = {
    id: string;
    candidate: Candidate;
    primary: number;
    at12: number;
    at50: number;
    at156: number;
    missing: number;
    topIds: string[];
};

/** Computes source-season boards only. The target season is never passed to this function. */
export function sourceBoards(views: ThreeViews, profile: DraftProfile = EXPERIMENT_PROFILE) {
    const ids = views.perGame.map((player) => player.playerId);
    if (new Set(ids).size !== ids.length) throw new Error('Duplicate per-game player ids');
    for (const mode of ['per36', 'totals'] as const) {
        const comparison = new Set(views[mode].map((player) => player.playerId));
        if (comparison.size !== ids.length || ids.some((id) => !comparison.has(id))) {
            throw new Error(`Mismatched ${mode} player ids`);
        }
    }
    const ranks = {
        perGame: new Map(rank(views.perGame, profile, { availabilityFloor: false }).map((p) => [p.playerId, p.rank])),
        per36: new Map(rank(views.per36, profile, { availabilityFloor: false }).map((p) => [p.playerId, p.rank])),
        totals: new Map(rank(views.totals, profile, { availabilityFloor: false }).map((p) => [p.playerId, p.rank]))
    };
    return { players: views.perGame, ranks };
}

export function candidateOrder(boards: ReturnType<typeof sourceBoards>, candidate: Candidate): string[] {
    const count = boards.players.length;
    const percentile = (r: number) => (count <= 1 ? 1 : (count - r) / (count - 1));
    return boards.players
        .map((player) => {
            const reliability = candidate.minutesAdjusted ? Math.min(1, Math.max(0, player.mp / 24)) : 1;
            const rateWeight = candidate.per36 * reliability;
            const gameWeight = candidate.perGame + candidate.per36 - rateWeight;
            const score =
                gameWeight * percentile(boards.ranks.perGame.get(player.playerId)!) +
                candidate.totals * percentile(boards.ranks.totals.get(player.playerId)!) +
                rateWeight * percentile(boards.ranks.per36.get(player.playerId)!);
            return { id: player.playerId, score };
        })
        .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
        .map((row) => row.id);
}

/** Fit future category moments on >=20-game players, then score every future participant against them. */
export function outcomeValues(future: PlayerSeason[], profile: DraftProfile = EXPERIMENT_PROFILE): Outcome {
    const reference = future.filter((player) => player.games >= 20);
    if (reference.length < 156) throw new Error('Future reference population is smaller than replacement rank 156');
    const referenceRanked = rank(reference, profile, { availabilityFloor: false });
    const replacement = referenceRanked[155]!.composite;
    const score = makeReferenceScorer(reference, profile);
    const values = new Map<string, number>();
    for (const player of future) {
        if (values.has(player.playerId)) throw new Error(`Duplicate future player ${player.playerId}`);
        values.set(player.playerId, ((score(player) - replacement) * player.games) / 82);
    }
    // Catch evaluator drift from the production z-score implementation.
    for (const player of referenceRanked) {
        if (Math.abs(score(player) - player.composite) > 1e-8) {
            throw new Error(`Outcome scorer disagrees with ranker for ${player.playerId}`);
        }
    }
    return { values, referenceCount: reference.length, playedCount: future.length, replacement };
}

function makeReferenceScorer(reference: PlayerSeason[], profile: DraftProfile): (player: PlayerSeason) => number {
    const metrics = profile.enabledCats.map((cat) => {
        if (cat === 'fgPct' || cat === 'ftPct') {
            const attempts = cat === 'fgPct' ? 'fga' : 'fta';
            const leaguePct = mean(reference.map((p) => p[cat]).filter((v): v is number => v !== null));
            const impact = (p: PlayerSeason) => (p[cat] === null ? 0 : (p[cat] - leaguePct) * p[attempts]);
            const values = reference.map(impact);
            const average = mean(values);
            const deviation = std(values, average);
            return (p: PlayerSeason) => (DEFAULT_OPERATOR_WEIGHTS[cat] ?? 1) * zScore(impact(p), average, deviation);
        }
        const values = reference.map((p) => p[cat] as number);
        const average = mean(values);
        const deviation = std(values, average);
        const direction = cat === 'tov' ? -1 : 1;
        return (p: PlayerSeason) =>
            (DEFAULT_OPERATOR_WEIGHTS[cat as CatKey] ?? 1) * direction * zScore(p[cat] as number, average, deviation);
    });
    return (player) => metrics.reduce((sum, metric) => sum + metric(player), 0);
}

export function evaluateCandidate(order: string[], outcome: Outcome, candidate: Candidate): TestResult {
    const discounted = (limit: number) =>
        order.slice(0, limit).reduce((sum, id, index) => sum + (outcome.values.get(id) ?? 0) / Math.log2(index + 2), 0);
    return {
        id: candidate.id,
        candidate,
        primary: discounted(156),
        at12: discounted(12),
        at50: discounted(50),
        at156: discounted(156),
        missing: order.filter((id) => !outcome.values.has(id)).length,
        topIds: order.slice(0, 12)
    };
}
