import { rank } from './ranker.ts';
import { rankWithDataModeSignals, type PlayerUniverses } from './rank-modes.ts';
import { mean, std } from './stats.ts';
import { type DraftProfile, type PlayerSeason, type RankedPlayer } from './types.ts';
import {
    outcomeValues,
    EXPERIMENT_PROFILE,
    type Outcome,
    type ThreeViews,
    sourceBoards
} from './ranking-experiment.ts';

export const MINUTES_TRANSITIONS = [
    ['21_22', '22_23'],
    ['22_23', '23_24'],
    ['23_24', '24_25'],
    ['24_25', '25_26']
] as const;

export const MINUTES_CANDIDATES = [
    { id: 'per-game', parent: null, kind: 'view' },
    { id: 'totals', parent: null, kind: 'view' },
    { id: 'per-36', parent: null, kind: 'view' },
    { id: 'game-70-total-30', parent: null, kind: 'blend' },
    { id: 'game-55-total-35-rate-10', parent: null, kind: 'blend' },
    { id: 'mp-added-per-game-10', parent: 'per-game', kind: 'mp-blend' },
    { id: 'mp-added-blend-10', parent: 'game-55-total-35-rate-10', kind: 'mp-blend' },
    { id: 'game-55-total-35-rate-10-minutes', parent: 'game-55-total-35-rate-10', kind: 'minutes-adjusted' }
] as const;

export type MinutesCandidate = (typeof MINUTES_CANDIDATES)[number];
export type FutureOutcomes = { players: PlayerSeason[]; outcome: Outcome };
export type LinearPrediction = {
    n: number;
    mae: number | null;
    rmse: number | null;
    r2: number | null;
    coefficients: Record<string, number> | null;
};
export type PredictorRecord = {
    target: 'futurePerGameComposite' | 'futureSeasonValue' | 'futureVolatility';
    trainTransitions: string[];
    testTransition: string;
    baseline: LinearPrediction;
    withMp: LinearPrediction;
};

export function minutesSourceBoards(views: ThreeViews, profile: DraftProfile = EXPERIMENT_PROFILE) {
    const boards = sourceBoards(views, profile);
    const ranked = Object.fromEntries(
        (['perGame', 'per36', 'totals'] as const).map((mode) => [
            mode,
            rank(views[mode], profile, { availabilityFloor: false })
        ])
    ) as Record<keyof ThreeViews, RankedPlayer[]>;
    const ranks = Object.fromEntries(
        (['perGame', 'per36', 'totals'] as const).map((mode) => [
            mode,
            new Map(ranked[mode].map((player) => [player.playerId, player.rank]))
        ])
    ) as Record<keyof ThreeViews, Map<string, number>>;
    const count = views.perGame.length;
    const pct = (place: number) => (count <= 1 ? 1 : (count - place) / (count - 1));
    const percentiles = Object.fromEntries(
        (['perGame', 'per36', 'totals'] as const).map((mode) => [
            mode,
            new Map([...ranks[mode]].map(([id, place]) => [id, pct(place)]))
        ])
    ) as Record<keyof ThreeViews, Map<string, number>>;
    const mpgPercentile = tiedPercentiles(
        views.perGame.map((player) => [player.playerId, player.mp] as const),
        false
    );
    const baseline = new Map<string, Map<string, number>>();
    for (const player of views.perGame) {
        const id = player.playerId;
        const pg = percentiles.perGame.get(id)!;
        const totals = percentiles.totals.get(id)!;
        const rate = percentiles.per36.get(id)!;
        baseline.set(
            id,
            new Map([
                ['per-game', pg],
                ['totals', totals],
                ['per-36', rate],
                ['game-70-total-30', 0.7 * pg + 0.3 * totals],
                ['game-55-total-35-rate-10', 0.55 * pg + 0.35 * totals + 0.1 * rate]
            ])
        );
    }
    const scoreByCandidate = new Map<string, Map<string, number>>();
    for (const candidate of MINUTES_CANDIDATES) {
        const scores = new Map<string, number>();
        for (const player of views.perGame) {
            const id = player.playerId;
            const base = baseline.get(id)!;
            let score: number;
            if (candidate.id === 'mp-added-per-game-10') {
                score = 0.9 * base.get('per-game')! + 0.1 * mpgPercentile.get(id)!;
            } else if (candidate.id === 'mp-added-blend-10') {
                score = 0.9 * base.get('game-55-total-35-rate-10')! + 0.1 * mpgPercentile.get(id)!;
            } else if (candidate.kind === 'minutes-adjusted') {
                const reliability = Math.min(1, Math.max(0, player.mp / 24));
                const rateWeight = 0.1 * reliability;
                score =
                    (0.55 + 0.1 - rateWeight) * percentiles.perGame.get(id)! +
                    0.35 * percentiles.totals.get(id)! +
                    rateWeight * percentiles.per36.get(id)!;
            } else {
                score = base.get(candidate.id)!;
            }
            scores.set(id, score);
        }
        scoreByCandidate.set(candidate.id, scores);
    }
    return { ...boards, scoreByCandidate, percentiles, mpgPercentile };
}

export function candidateOrder(boards: ReturnType<typeof minutesSourceBoards>, candidateId: string): string[] {
    const scores = boards.scoreByCandidate.get(candidateId);
    if (!scores) throw new Error(`Unknown minutes candidate ${candidateId}`);
    return [...scores].sort(([idA, a], [idB, b]) => b - a || idA.localeCompare(idB)).map(([id]) => id);
}

export function realizedTop156(order: string[], outcome: Outcome): { ids: Set<string>; count: number } {
    const ranked = [...outcome.values].sort(([idA, a], [idB, b]) => b - a || idA.localeCompare(idB));
    const ids = new Set(ranked.slice(0, 156).map(([id]) => id));
    return { ids, count: Math.min(156, ranked.length) };
}

export function scoreRankingCandidate(order: string[], outcome: Outcome, candidateId: string) {
    const discounted = (limit: number) =>
        order.slice(0, limit).reduce((sum, id, index) => sum + (outcome.values.get(id) ?? 0) / Math.log2(index + 2), 0);
    const actual = realizedTop156(order, outcome);
    return {
        id: candidateId,
        primary: discounted(156),
        at12: discounted(12),
        at50: discounted(50),
        at156: discounted(156),
        top156Hits: order.slice(0, 156).filter((id) => actual.ids.has(id)).length,
        missing: order.filter((id) => !outcome.values.has(id)).length
    };
}

export function neutralComposites(
    players: PlayerSeason[],
    profile: DraftProfile = EXPERIMENT_PROFILE
): Map<string, number> {
    return new Map(
        rank(players, profile, { availabilityFloor: false }).map((player) => [player.playerId, player.composite])
    );
}

export function percentileChange(
    source: PlayerSeason[],
    future: PlayerSeason[],
    profile: DraftProfile = EXPERIMENT_PROFILE
) {
    const currentEligible = new Map(
        source.filter((player) => player.games >= 20).map((player) => [player.playerId, player])
    );
    const futureEligible = new Map(
        future.filter((player) => player.games >= 20).map((player) => [player.playerId, player])
    );
    const ids = [...currentEligible.keys()].filter((id) => futureEligible.has(id)).sort();
    const currentComposites = neutralComposites([...currentEligible.values()], profile);
    const nextComposites = neutralComposites([...futureEligible.values()], profile);
    const currentRanks = percentileForIds(currentComposites, ids);
    const futureRanks = percentileForIds(nextComposites, ids);
    const changes = new Map(ids.map((id) => [id, futureRanks.get(id)! - currentRanks.get(id)!]));
    return {
        ids: new Set(ids),
        changes,
        currentComposites,
        futureComposites: nextComposites,
        sourceEligible: currentEligible.size,
        futureEligible: futureEligible.size,
        matched: ids.length
    };
}

function percentileForIds(values: Map<string, number>, ids: string[]): Map<string, number> {
    const ordered = ids
        .map((id) => [id, values.get(id)!] as const)
        .sort(([idA, a], [idB, b]) => b - a || idA.localeCompare(idB));
    const n = ordered.length;
    return new Map(ordered.map(([id], index) => [id, n <= 1 ? 1 : (n - index - 1) / (n - 1)]));
}

export type Signal = 'sleeper' | 'dud' | null;
export function existingSignals(
    views: PlayerUniverses,
    profile: DraftProfile = EXPERIMENT_PROFILE
): Map<string, Signal> {
    const signals = rankWithDataModeSignals(views, profile);
    return new Map(signals.map((player) => [player.playerId, player.upsideSignal ?? null]));
}

export function minutesAdjustedSignals(boards: ReturnType<typeof minutesSourceBoards>): Map<string, Signal> {
    const n = boards.players.length;
    const adjusted = new Map<string, number>();
    for (const player of boards.players) {
        const id = player.playerId;
        const reliability = Math.min(1, Math.max(0, player.mp / 24));
        adjusted.set(
            id,
            reliability * boards.percentiles.per36.get(id)! + (1 - reliability) * boards.percentiles.perGame.get(id)!
        );
    }
    const order = [...adjusted].sort(([idA, a], [idB, b]) => b - a || idA.localeCompare(idB)).map(([id]) => id);
    const rankById = new Map(order.map((id, index) => [id, index + 1]));
    const top = Math.ceil(n / 4);
    const half = Math.ceil(n / 2);
    const result = new Map<string, Signal>();
    for (const player of boards.players) {
        const id = player.playerId;
        const perGameRank = boards.ranks.perGame.get(id)!;
        const totalsRank = boards.ranks.totals.get(id)!;
        const adjustedRank = rankById.get(id)!;
        const sleeper = adjustedRank <= top && perGameRank > half && totalsRank > half;
        const dud = adjustedRank > n - top && perGameRank <= half && totalsRank <= half;
        result.set(id, sleeper ? 'sleeper' : dud ? 'dud' : null);
    }
    return result;
}

export function signalSummary(
    signals: Map<string, Signal>,
    sourceIds: Set<string>,
    futureValues: Map<string, number>,
    top156Ids: Set<string>,
    percentileChanges: Map<string, number>,
    idsBySignal: ReadonlyArray<Signal> = ['sleeper', null, 'dud']
) {
    return idsBySignal.map((signal) => {
        const ids = [...sourceIds].filter((id) => (signals.get(id) ?? null) === signal);
        const outcomes = ids.map((id) => futureValues.get(id)).filter((value): value is number => value !== undefined);
        const changes = ids
            .map((id) => percentileChanges.get(id))
            .filter((value): value is number => value !== undefined);
        const hits = ids.filter((id) => top156Ids.has(id)).length;
        return {
            signal: signal ?? 'untagged',
            count: ids.length,
            uniquePlayers: new Set(ids).size,
            outcomeCount: outcomes.length,
            missingOutcomeCount: ids.length - outcomes.length,
            top156Hits: hits,
            top156Rate: ids.length ? hits / ids.length : null,
            meanSeasonValue: outcomes.length ? mean(outcomes) : null,
            meanPercentileChange: changes.length ? mean(changes) : null,
            medianPercentileChange: changes.length ? quantile(changes, 0.5) : null
        };
    });
}

export function signalEventMetrics(signals: Map<string, Signal>, sourceIds: Set<string>, changes: Map<string, number>) {
    const matchedIds = [...sourceIds].filter((id) => changes.has(id));
    const breakoutIds = new Set(matchedIds.filter((id) => changes.get(id)! >= 0.1));
    const declineIds = new Set(matchedIds.filter((id) => changes.get(id)! <= -0.1));
    const tagged = (signal: Signal) => new Set(matchedIds.filter((id) => (signals.get(id) ?? null) === signal));
    const sleeperIds = tagged('sleeper');
    const dudIds = tagged('dud');
    const metric = (taggedIds: Set<string>, eventIds: Set<string>) => {
        const truePositive = [...taggedIds].filter((id) => eventIds.has(id)).length;
        const predicted = taggedIds.size;
        const events = eventIds.size;
        return {
            taggedMatched: predicted,
            eventCount: events,
            truePositive,
            precision: predicted ? truePositive / predicted : null,
            recall: events ? truePositive / events : null
        };
    };
    return {
        matchedCount: matchedIds.length,
        breakoutThreshold: 0.1,
        declineThreshold: -0.1,
        sleeperBreakout: metric(sleeperIds, breakoutIds),
        dudDecline: metric(dudIds, declineIds)
    };
}

export function mpQuartileSummary(source: PlayerSeason[], changes: Map<string, number>) {
    const eligible = source.filter((player) => changes.has(player.playerId));
    const mpg = source.map((player) => player.mp).sort((a, b) => a - b);
    const cuts = [quantile(mpg, 0.25), quantile(mpg, 0.5), quantile(mpg, 0.75)];
    const labels = ['q1', 'q2', 'q3', 'q4'];
    const groups = labels.map((label, index) => ({ label, mpg: [] as number[], changes: [] as number[] }));
    for (const player of eligible) {
        const group = player.mp <= cuts[0]! ? 0 : player.mp <= cuts[1]! ? 1 : player.mp <= cuts[2]! ? 2 : 3;
        groups[group]!.mpg.push(player.mp);
        groups[group]!.changes.push(changes.get(player.playerId)!);
    }
    return {
        sourceEligible: source.length,
        matched: eligible.length,
        missingFuture: source.length - eligible.length,
        cutPoints: cuts,
        groups: groups.map((group) => ({
            id: group.label,
            count: group.changes.length,
            mpgMin: group.mpg.length ? Math.min(...group.mpg) : null,
            mpgMax: group.mpg.length ? Math.max(...group.mpg) : null,
            meanSignedChange: group.changes.length ? mean(group.changes) : null,
            meanAbsoluteChange: group.changes.length ? mean(group.changes.map(Math.abs)) : null,
            medianAbsoluteChange: group.changes.length ? quantile(group.changes.map(Math.abs), 0.5) : null
        }))
    };
}

export function transitionTargets(
    source: PlayerSeason[],
    future: FutureOutcomes,
    profile: DraftProfile = EXPERIMENT_PROFILE
) {
    const sourceEligible = source.filter((player) => player.games >= 20);
    const futureEligible = future.players.filter((player) => player.games >= 20);
    const sourceComposite = neutralComposites(sourceEligible, profile);
    const futureComposite = neutralComposites(futureEligible, profile);
    const futureById = new Map(future.players.map((player) => [player.playerId, player]));
    const rows = sourceEligible.map((player) => {
        const futurePlayer = futureById.get(player.playerId);
        const composite = futureComposite.get(player.playerId);
        return {
            id: player.playerId,
            player,
            sourceComposite: sourceComposite.get(player.playerId)!,
            futurePerGameComposite: futurePlayer && futurePlayer.games >= 20 ? (composite ?? 0) : null,
            futureSeasonValue: future.outcome.values.get(player.playerId) ?? 0,
            futureVolatility:
                futurePlayer && futurePlayer.games >= 20
                    ? Math.abs((composite ?? 0) - sourceComposite.get(player.playerId)!)
                    : null,
            signedCompositeChange:
                futurePlayer && futurePlayer.games >= 20
                    ? (composite ?? 0) - sourceComposite.get(player.playerId)!
                    : null
        };
    });
    return rows;
}

export function fitAndPredict(
    train: ReturnType<typeof transitionTargets>[],
    test: ReturnType<typeof transitionTargets>,
    target: PredictorRecord['target'],
    testTransition: string,
    trainTransitions: string[]
): PredictorRecord {
    const config = {
        futurePerGameComposite: { get: (r: (typeof test)[number]) => r.futurePerGameComposite },
        futureSeasonValue: { get: (r: (typeof test)[number]) => r.futureSeasonValue },
        futureVolatility: { get: (r: (typeof test)[number]) => r.futureVolatility }
    }[target];
    const trainRows = train.flat().filter((row) => config.get(row) !== null);
    const testRows = test.filter((row) => config.get(row) !== null);
    if (trainRows.length < 8 || testRows.length === 0) {
        return {
            target,
            trainTransitions,
            testTransition,
            baseline: emptyPrediction(testRows.length),
            withMp: emptyPrediction(testRows.length)
        };
    }
    const trainMatrix = (includeMp: boolean) =>
        trainRows.map((row) => features(row.player, row.sourceComposite, includeMp));
    const testMatrix = (includeMp: boolean) =>
        testRows.map((row) => features(row.player, row.sourceComposite, includeMp));
    const trainValues = trainRows.map((row) => config.get(row)!);
    const testValues = testRows.map((row) => config.get(row)!);
    const baselineFit = linearPredict(trainMatrix(false), trainValues, testMatrix(false));
    const mpFit = linearPredict(trainMatrix(true), trainValues, testMatrix(true));
    return {
        target,
        trainTransitions,
        testTransition,
        baseline: predictionMetrics(
            testValues,
            baselineFit.predictions,
            coefficientRecord(false, baselineFit.coefficients)
        ),
        withMp: predictionMetrics(testValues, mpFit.predictions, coefficientRecord(true, mpFit.coefficients))
    };
}

function features(player: PlayerSeason, composite: number, includeMp: boolean): number[] {
    return includeMp ? [composite, player.games, player.age, player.mp] : [composite, player.games, player.age];
}

function linearPredict(
    trainX: number[][],
    trainY: number[],
    testX: number[][]
): { predictions: number[]; coefficients: number[] } {
    const width = trainX[0]!.length;
    const means = Array.from({ length: width }, (_, j) => mean(trainX.map((row) => row[j]!)));
    const deviations = Array.from({ length: width }, (_, j) =>
        std(
            trainX.map((row) => row[j]!),
            means[j]!
        )
    );
    const scale = (rows: number[][]) =>
        rows.map((row) => [
            1,
            ...row.map((value, j) => (deviations[j] === 0 ? 0 : (value - means[j]!) / deviations[j]!))
        ]);
    const x = scale(trainX);
    const y = [...trainY];
    const beta = leastSquares(x, y);
    return {
        predictions: scale(testX).map((row) => row.reduce((sum, value, j) => sum + value * beta[j]!, 0)),
        coefficients: beta
    };
}

function leastSquares(x: number[][], y: number[]): number[] {
    const width = x[0]!.length;
    const augmented = Array.from({ length: width }, (_, i) => [
        ...Array.from({ length: width }, (_, j) => x.reduce((sum, row) => sum + row[i]! * row[j]!, 0)),
        x.reduce((sum, row, k) => sum + row[i]! * y[k]!, 0)
    ]);
    for (let col = 0; col < width; col++) {
        let pivot = col;
        for (let row = col + 1; row < width; row++)
            if (Math.abs(augmented[row]![col]!) > Math.abs(augmented[pivot]![col]!)) pivot = row;
        if (Math.abs(augmented[pivot]![col]!) < 1e-10) throw new Error('Prediction design matrix is rank deficient');
        [augmented[col], augmented[pivot]] = [augmented[pivot]!, augmented[col]!];
        const divisor = augmented[col]![col]!;
        for (let j = col; j <= width; j++) augmented[col]![j] = augmented[col]![j]! / divisor;
        for (let row = 0; row < width; row++) {
            if (row === col) continue;
            const factor = augmented[row]![col]!;
            for (let j = col; j <= width; j++) augmented[row]![j] = augmented[row]![j]! - factor * augmented[col]![j]!;
        }
    }
    return augmented.map((row) => row[width]!);
}

function coefficientRecord(includeMp: boolean, coefficients: number[]): Record<string, number> {
    const names = includeMp
        ? ['intercept', 'sourceCompositeZ', 'sourceGamesZ', 'ageZ', 'mpgZ']
        : ['intercept', 'sourceCompositeZ', 'sourceGamesZ', 'ageZ'];
    return Object.fromEntries(names.map((name, index) => [name, coefficients[index]!]));
}

function predictionMetrics(
    actual: number[],
    predicted: number[],
    coefficients: Record<string, number>
): LinearPrediction {
    const errors = actual.map((value, index) => predicted[index]! - value);
    const average = mean(actual);
    const total = actual.reduce((sum, value) => sum + (value - average) ** 2, 0);
    return {
        n: actual.length,
        mae: mean(errors.map(Math.abs)),
        rmse: Math.sqrt(mean(errors.map((error) => error ** 2))),
        r2: total === 0 ? null : 1 - errors.reduce((sum, error) => sum + error ** 2, 0) / total,
        coefficients
    };
}

function emptyPrediction(n: number): LinearPrediction {
    return { n, mae: null, rmse: null, r2: null, coefficients: null };
}

export function spearman(x: number[], y: number[]): number | null {
    if (x.length !== y.length || x.length < 2) return null;
    const rx = tiedPercentiles(
        x.map((value, index) => [String(index), value] as const),
        true
    );
    const ry = tiedPercentiles(
        y.map((value, index) => [String(index), value] as const),
        true
    );
    const ax = x.map((_, index) => rx.get(String(index))!);
    const ay = y.map((_, index) => ry.get(String(index))!);
    const mx = mean(ax);
    const my = mean(ay);
    const numerator = ax.reduce((sum, value, i) => sum + (value - mx) * (ay[i]! - my), 0);
    const denominator = Math.sqrt(
        ax.reduce((sum, value) => sum + (value - mx) ** 2, 0) * ay.reduce((sum, value) => sum + (value - my) ** 2, 0)
    );
    return denominator === 0 ? null : numerator / denominator;
}

function tiedPercentiles(values: readonly (readonly [string, number])[], ascending: boolean): Map<string, number> {
    const sorted = [...values].sort((a, b) => (ascending ? a[1] - b[1] : b[1] - a[1]) || a[0].localeCompare(b[0]));
    const result = new Map<string, number>();
    let index = 0;
    while (index < sorted.length) {
        let end = index + 1;
        while (end < sorted.length && sorted[end]![1] === sorted[index]![1]) end++;
        const averageIndex = (index + end - 1) / 2;
        const percentile =
            sorted.length <= 1
                ? 1
                : (ascending ? averageIndex : sorted.length - averageIndex - 1) / (sorted.length - 1);
        for (let i = index; i < end; i++) result.set(sorted[i]![0], percentile);
        index = end;
    }
    return result;
}

function quantile(values: number[], probability: number): number {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const position = (sorted.length - 1) * probability;
    const lower = Math.floor(position);
    const upper = Math.ceil(position);
    return sorted[lower]! + (sorted[upper]! - sorted[lower]!) * (position - lower);
}

export function targetCorrelations(
    source: PlayerSeason[],
    targets: ReturnType<typeof transitionTargets>,
    totalMinutesById: Map<string, number>
) {
    const targetById = new Map(targets.map((row) => [row.id, row]));
    const sourceIds = source.filter((player) => player.games >= 20).map((player) => player.playerId);
    const rateRows = sourceIds
        .map((id) => ({ player: source.find((p) => p.playerId === id)!, target: targetById.get(id)! }))
        .filter((row) => row.target.futurePerGameComposite !== null);
    const seasonRows = sourceIds.map((id) => ({
        player: source.find((p) => p.playerId === id)!,
        target: targetById.get(id)!
    }));
    const volatilityRows = rateRows.filter((row) => row.target.futureVolatility !== null);
    return {
        perGameN: rateRows.length,
        mpgVsFuturePerGame: spearman(
            rateRows.map((row) => row.player.mp),
            rateRows.map((row) => row.target.futurePerGameComposite!)
        ),
        totalMinutesVsFutureSeasonValue: spearman(
            seasonRows.map((row) => totalMinutesById.get(row.player.playerId) ?? 0),
            seasonRows.map((row) => row.target.futureSeasonValue)
        ),
        mpgVsFutureVolatility: spearman(
            volatilityRows.map((row) => row.player.mp),
            volatilityRows.map((row) => row.target.futureVolatility!)
        )
    };
}

export function candidateDecision(
    transitionScores: Array<{ transition: string; scores: Array<{ id: string; primary: number }> }>
) {
    return MINUTES_CANDIDATES.filter((candidate) => candidate.parent !== null).map((candidate) => {
        const deltas = transitionScores.map((transition) => {
            const score = transition.scores.find((row) => row.id === candidate.id)?.primary;
            const parent = transition.scores.find((row) => row.id === candidate.parent)?.primary;
            if (score === undefined || parent === undefined)
                throw new Error(`Missing scores for ${candidate.id} or parent ${candidate.parent}`);
            return { transition: transition.transition, delta: score - parent };
        });
        const positiveTransitions = deltas.filter((row) => row.delta > 0).length;
        const meanDifference = mean(deltas.map((row) => row.delta));
        return {
            id: candidate.id,
            parent: candidate.parent,
            deltas,
            positiveTransitions,
            meanDifference,
            retrospectivelyPromising: positiveTransitions >= 3 && meanDifference > 0
        };
    });
}

export function futureValues(future: PlayerSeason[], profile: DraftProfile = EXPERIMENT_PROFILE): Outcome {
    return outcomeValues(future, profile);
}
