import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { CsvProvider } from '../src/csv-provider.ts';
import {
    candidateDecision,
    candidateOrder,
    existingSignals,
    fitAndPredict,
    MINUTES_CANDIDATES,
    MINUTES_TRANSITIONS,
    minutesAdjustedSignals,
    minutesSourceBoards,
    mpQuartileSummary,
    percentileChange,
    scoreRankingCandidate,
    signalSummary,
    signalEventMetrics,
    targetCorrelations,
    futureValues,
    transitionTargets,
    type PredictorRecord
} from '../src/minutes-experiment.ts';
import { EXPERIMENT_PROFILE } from '../src/ranking-experiment.ts';
import type { PlayerSeason } from '../src/types.ts';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const outDir = fileURLToPath(new URL('../../../docs/experiments/minutes/', import.meta.url));
const outJson = `${outDir}results.json`;
const outMarkdown = `${outDir}results.md`;
const sha256 = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const inputHashes: Record<string, string> = {};

async function load(year: string, mode: 'per_game' | 'per_36' | 'totals', minGames: number): Promise<PlayerSeason[]> {
    const relative = `app/data/${year}_${mode}.csv`;
    const path = `${root}${relative}`;
    inputHashes[relative] = sha256(await readFile(path));
    return new CsvProvider(path, { minGames }).load();
}

async function source(year: string) {
    const [perGame, per36, totals] = await Promise.all([
        load(year, 'per_game', 20),
        load(year, 'per_36', 20),
        load(year, 'totals', 20)
    ]);
    return { perGame, per36, totals };
}

function adjustedSignalChanges(
    before: Map<string, string | null>,
    after: Map<string, string | null>,
    ids: Set<string>
) {
    let changed = 0;
    const transitions: Record<string, number> = {};
    for (const id of ids) {
        const oldValue = before.get(id) ?? 'untagged';
        const newValue = after.get(id) ?? 'untagged';
        if (oldValue === newValue) continue;
        changed++;
        const key = `${oldValue}->${newValue}`;
        transitions[key] = (transitions[key] ?? 0) + 1;
    }
    return { changed, transitions };
}

function predictionDiffs(records: PredictorRecord[]) {
    const byTarget = new Map<string, PredictorRecord[]>();
    for (const record of records) {
        const group = byTarget.get(record.target) ?? [];
        group.push(record);
        byTarget.set(record.target, group);
    }
    return [...byTarget].map(([target, group]) => ({
        target,
        evaluatedTransitions: group.length,
        meanMaeImprovement: average(group.map((record) => value(record.baseline.mae) - value(record.withMp.mae))),
        meanRmseImprovement: average(group.map((record) => value(record.baseline.rmse) - value(record.withMp.rmse))),
        meanR2Change: average(group.map((record) => value(record.withMp.r2) - value(record.baseline.r2))),
        foldsWithLowerMae: group.filter(
            (record) =>
                record.withMp.mae !== null && record.baseline.mae !== null && record.withMp.mae < record.baseline.mae
        ).length
    }));
}

function value(input: number | null): number {
    return input ?? 0;
}
function average(values: number[]): number {
    return values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
}
function fmt(input: number | null | undefined): string {
    return input === null || input === undefined ? 'n/a' : input.toFixed(3);
}
function quantile(values: number[], p: number): number | null {
    if (!values.length) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const index = (sorted.length - 1) * p;
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    return sorted[lower]! + (sorted[upper]! - sorted[lower]!) * (index - lower);
}

const transitions: Array<Record<string, unknown> & { id: string }> = [];
const targetsByTransition: Array<{ id: string; rows: ReturnType<typeof transitionTargets> }> = [];
for (const [from, to] of MINUTES_TRANSITIONS) {
    const sourceViews = await source(from);
    const futurePlayers = await load(to, 'per_game', 0);
    const boards = minutesSourceBoards(sourceViews);
    const future = futureValues(futurePlayers);
    const rankingScores = MINUTES_CANDIDATES.map((candidate) =>
        scoreRankingCandidate(candidateOrder(boards, candidate.id), future, candidate.id)
    );
    const rankingById = new Map(rankingScores.map((score) => [score.id, score]));
    const ranking = MINUTES_CANDIDATES.map((candidate) => ({
        ...rankingById.get(candidate.id)!,
        parent: candidate.parent
    }));
    const eightCatProfile = {
        ...EXPERIMENT_PROFILE,
        enabledCats: EXPERIMENT_PROFILE.enabledCats.filter((cat) => cat !== 'tov')
    };
    const eightCatBoards = minutesSourceBoards(sourceViews, eightCatProfile);
    const eightCatOutcome = futureValues(futurePlayers, eightCatProfile);
    const eightCatCandidateScores = MINUTES_CANDIDATES.map((candidate) =>
        scoreRankingCandidate(candidateOrder(eightCatBoards, candidate.id), eightCatOutcome, candidate.id)
    );
    const sourceIds = new Set(sourceViews.perGame.map((player) => player.playerId));
    const actualTop = new Set(
        [...future.values]
            .sort(([idA, a], [idB, b]) => b - a || idA.localeCompare(idB))
            .slice(0, 156)
            .map(([id]) => id)
    );
    const sourceUniverses = { perGame: sourceViews.perGame, per36: sourceViews.per36, totals: sourceViews.totals };
    const originalSignals = existingSignals(sourceUniverses);
    const adjustedSignals = minutesAdjustedSignals(boards);
    const perGameChange = percentileChange(sourceViews.perGame, futurePlayers);
    const targets = transitionTargets(sourceViews.perGame, { players: futurePlayers, outcome: future });
    targetsByTransition.push({ id: `${from}-to-${to}`, rows: targets });
    const totalMinutesById = new Map(sourceViews.totals.map((player) => [player.playerId, player.mp]));
    const originalSignalSummary = signalSummary(
        originalSignals,
        sourceIds,
        future.values,
        actualTop,
        perGameChange.changes
    );
    const adjustedSignalSummary = signalSummary(
        adjustedSignals,
        sourceIds,
        future.values,
        actualTop,
        perGameChange.changes
    );
    const perGameChanges = [...perGameChange.changes.values()];
    const percentileChangeSummary = {
        sourceEligible: perGameChange.sourceEligible,
        futureEligible: perGameChange.futureEligible,
        matched: perGameChange.matched,
        mean: average(perGameChanges),
        median: quantile(perGameChanges, 0.5),
        breakoutsAtLeast010: perGameChanges.filter((change) => change >= 0.1).length,
        declinesAtMostMinus010: perGameChanges.filter((change) => change <= -0.1).length
    };
    transitions.push({
        id: `${from}-to-${to}`,
        from,
        to,
        eligibleSourcePlayers: sourceViews.perGame.length,
        futureParticipants: future.playedCount,
        futureReferencePlayers: future.referenceCount,
        candidateScores: ranking,
        eightCatCandidateScores,
        mpgSpearman: targetCorrelations(sourceViews.perGame, targets, totalMinutesById),
        sourceMpQuartiles: mpQuartileSummary(
            sourceViews.perGame,
            new Map(
                targets
                    .filter((row) => row.signedCompositeChange !== null)
                    .map((row) => [row.id, row.signedCompositeChange!])
            )
        ),
        perGamePercentileChange: percentileChangeSummary,
        signalCounts: {
            original: {
                sleeper: originalSignalSummary[0]!.count,
                untagged: originalSignalSummary[1]!.count,
                dud: originalSignalSummary[2]!.count
            },
            mpAdjusted: {
                sleeper: adjustedSignalSummary[0]!.count,
                untagged: adjustedSignalSummary[1]!.count,
                dud: adjustedSignalSummary[2]!.count
            },
            changes: adjustedSignalChanges(originalSignals, adjustedSignals, sourceIds)
        },
        signalOutcomes: { original: originalSignalSummary, mpAdjusted: adjustedSignalSummary },
        signalEvents: {
            original: signalEventMetrics(originalSignals, sourceIds, perGameChange.changes),
            mpAdjusted: signalEventMetrics(adjustedSignals, sourceIds, perGameChange.changes)
        },
        totalMpObservedPlayers: totalMinutesById.size
    });
}

const predictionRecords: PredictorRecord[] = [];
for (let testIndex = 1; testIndex < targetsByTransition.length; testIndex++) {
    const training = targetsByTransition.slice(0, testIndex);
    const test = targetsByTransition[testIndex]!;
    for (const target of ['futurePerGameComposite', 'futureSeasonValue', 'futureVolatility'] as const) {
        predictionRecords.push(
            fitAndPredict(
                training.map((entry) => entry.rows),
                test.rows,
                target,
                test.id,
                training.map((entry) => entry.id)
            )
        );
    }
}

const rankingTransitions = transitions.map((transition) => ({
    transition: transition.id,
    scores: transition.candidateScores as Array<{ id: string; primary: number }>
}));
const decisions = candidateDecision(rankingTransitions);
const predictorSummary = predictionDiffs(predictionRecords);
const codeFiles = [
    'app/core/src/minutes-experiment.ts',
    'app/core/scripts/run-minutes-experiment.ts',
    'app/core/src/ranker.ts',
    'app/core/src/ranking-experiment.ts',
    'app/core/src/rank-modes.ts',
    'app/core/src/csv-provider.ts',
    'app/core/src/profile.ts',
    'app/core/src/stats.ts',
    'app/core/src/types.ts',
    'app/core/src/operator-weights.ts',
    'app/core/config/category-weights.json',
    'app/core/config/ranker.json'
];
const codeHashes = Object.fromEntries(
    await Promise.all(
        codeFiles.map(async (relative) => [relative, sha256(await readFile(`${root}${relative}`))] as const)
    )
);
const protocolRelative = 'docs/experiments/minutes/protocol.md';
const protocolHash = sha256(await readFile(`${root}${protocolRelative}`));
const record = {
    protocol: protocolRelative,
    protocolSha256: protocolHash,
    command: 'node --import tsx app/core/scripts/run-minutes-experiment.ts',
    nodeVersion: process.version,
    codeSha256: codeHashes,
    inputSha256: Object.fromEntries(Object.entries(inputHashes).sort(([a], [b]) => a.localeCompare(b))),
    transitions,
    rankingDecision: decisions,
    predictorEvaluation: predictionRecords,
    predictorSummary,
    limits: {
        retrospective: true,
        priorRankingStudiesUsedTheseSeasons: true,
        sleeperDudCurrentSourceCohortCounts: transitions.map((transition) => ({
            transition: transition.id,
            counts: transition.signalCounts
        }))
    }
};
await writeFile(outJson, `${JSON.stringify(record, null, 2)}\n`);

const lines = [
    '# Minutes experiment results',
    '',
    `Reproduce with \`${record.command}\` from the repository root. The [frozen protocol](protocol.md) was hashed before scoring. The [machine record](results.json) includes input and code hashes, candidate rules, cohort counts, and all per-transition results.`,
    '',
    '## Interpretation limits',
    '',
    'All available transitions were examined by earlier ranking work, so these are retrospective replications, not untouched holdouts. Results describe predictive associations and ranking performance; they do not establish that minutes cause future production. The Streaky result is season-to-season composite volatility, not game-to-game streakiness.',
    '',
    '## Summary of findings',
    '',
    `Source MPG has a strong raw association with next-season per-game composite (Spearman ${fmt(Math.min(...transitions.map((transition) => (transition.mpgSpearman as { mpgVsFuturePerGame: number }).mpgVsFuturePerGame)))} to ${fmt(Math.max(...transitions.map((transition) => (transition.mpgSpearman as { mpgVsFuturePerGame: number }).mpgVsFuturePerGame)))}). Total source MP has a moderate association with next-season season value (Spearman ${fmt(Math.min(...transitions.map((transition) => (transition.mpgSpearman as { totalMinutesVsFutureSeasonValue: number }).totalMinutesVsFutureSeasonValue)))} to ${fmt(Math.max(...transitions.map((transition) => (transition.mpgSpearman as { totalMinutesVsFutureSeasonValue: number }).totalMinutesVsFutureSeasonValue)))}).`,
    `After controlling for source composite, games, and age, adding MPG has effectively zero mean MAE change for next-season per-game composite and lowers MAE in ${predictorSummary.find((row) => row.target === 'futurePerGameComposite')?.foldsWithLowerMae}/3 chronological tests. For season value, the mean MAE improvement is ${fmt(predictorSummary.find((row) => row.target === 'futureSeasonValue')?.meanMaeImprovement)} and it lowers MAE in ${predictorSummary.find((row) => row.target === 'futureSeasonValue')?.foldsWithLowerMae}/3 tests. MPG does not improve volatility MAE consistently (${predictorSummary.find((row) => row.target === 'futureVolatility')?.foldsWithLowerMae}/3 tests improved).`,
    `Neither direct MPG blend meets the fixed ranking criterion. The minutes-adjusted per-36 blend does (4/4 transitions), with a mean primary-score gain of ${fmt(decisions.find((row) => row.id === 'game-55-total-35-rate-10-minutes')?.meanDifference)} over its parent; three of the four gains are below 0.01.`,
    `The MP-adjusted Sleeper signal has ${Math.min(...transitions.map((transition) => (transition.signalCounts as { mpAdjusted: { sleeper: number } }).mpAdjusted.sleeper))} to ${Math.max(...transitions.map((transition) => (transition.signalCounts as { mpAdjusted: { sleeper: number } }).mpAdjusted.sleeper))} tags per season, versus ${Math.min(...transitions.map((transition) => (transition.signalCounts as { original: { sleeper: number } }).original.sleeper))} to ${Math.max(...transitions.map((transition) => (transition.signalCounts as { original: { sleeper: number } }).original.sleeper))} original Sleeper tags. Its tiny cohorts limit precision and recall estimates.`,
    '',
    '## Implication for the app',
    '',
    'Do not add historical MP as a standalone adjustment to current per-game or totals rankings, or change Sleeper/Dud labels based on this experiment. Per-game rates already describe production independent of playing time, while season totals already reflect minutes and games played. The small retrospective gains from the minutes-adjusted per-36 blend are not enough to justify changing production rankings.',
    'The most promising future use is a projection layer: scale per-36 counting-stat rates by projected minutes, and use expected games to estimate season totals. The available data here contains historical minutes, not a validated forecast of future minutes; this experiment did not evaluate such a forecast.',
    '',
    '## Ranking results',
    '',
    '| Transition | Candidate | Primary | vs parent | Top-156 hits | Missing outcomes |',
    '| --- | --- | ---: | ---: | ---: | ---: |'
];
for (const transition of transitions) {
    const rows = transition.candidateScores as Array<{
        id: string;
        parent: string | null;
        primary: number;
        top156Hits: number;
        missing: number;
    }>;
    for (const score of rows) {
        const parent = score.parent ? rows.find((row) => row.id === score.parent) : undefined;
        const delta = parent ? score.primary - parent.primary : null;
        lines.push(
            `| ${transition.id} | ${score.id} | ${fmt(score.primary)} | ${delta === null ? '—' : `${delta >= 0 ? '+' : ''}${fmt(delta)}`} | ${score.top156Hits} | ${score.missing} |`
        );
    }
}
lines.push(
    '',
    '## Prespecified ranking decisions',
    '',
    '| Candidate | Parent | Positive transitions | Mean difference | Retrospectively promising |',
    '| --- | --- | ---: | ---: | --- |'
);
for (const decision of decisions)
    lines.push(
        `| ${decision.id} | ${decision.parent} | ${decision.positiveTransitions}/4 | ${fmt(decision.meanDifference)} | ${decision.retrospectivelyPromising ? 'Yes' : 'No'} |`
    );
lines.push(
    '',
    '## 8-cat sensitivity',
    '',
    'The 8-cat sensitivity removes turnovers from the neutral category profile and applies the same candidate rules. It does not affect the prespecified 9-cat decision.',
    '',
    '| Transition | Candidate | Discounted value | Top-156 hits |',
    '| --- | --- | ---: | ---: |'
);
for (const transition of transitions) {
    const rows = transition.eightCatCandidateScores as Array<{ id: string; primary: number; top156Hits: number }>;
    for (const score of rows)
        lines.push(`| ${transition.id} | ${score.id} | ${fmt(score.primary)} | ${score.top156Hits} |`);
}
lines.push(
    '',
    '## MP prediction',
    '',
    '| Target | Test transition | Train transitions | N | Baseline MAE | MP MAE | Baseline RMSE | MP RMSE | Baseline R² | MP R² |',
    '| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |'
);
for (const record of predictionRecords)
    lines.push(
        `| ${record.target} | ${record.testTransition} | ${record.trainTransitions.join(', ')} | ${record.withMp.n} | ${fmt(record.baseline.mae)} | ${fmt(record.withMp.mae)} | ${fmt(record.baseline.rmse)} | ${fmt(record.withMp.rmse)} | ${fmt(record.baseline.r2)} | ${fmt(record.withMp.r2)} |`
    );
lines.push(
    '',
    'Standardized model coefficients (input features are standardized from training rows; intercept remains in target units) are included in `results.json`.'
);
lines.push(
    '',
    '### MP rank correlations',
    '',
    '| Transition | Future per-game N | MPG vs future per-game | Total MP vs season value | MPG vs volatility |',
    '| --- | ---: | ---: | ---: | ---: |'
);
for (const transition of transitions) {
    const corr = transition.mpgSpearman as {
        perGameN: number;
        mpgVsFuturePerGame: number | null;
        totalMinutesVsFutureSeasonValue: number | null;
        mpgVsFutureVolatility: number | null;
    };
    lines.push(
        `| ${transition.id} | ${corr.perGameN} | ${fmt(corr.mpgVsFuturePerGame)} | ${fmt(corr.totalMinutesVsFutureSeasonValue)} | ${fmt(corr.mpgVsFutureVolatility)} |`
    );
}
lines.push(
    '',
    '## Sleeper/Dud signal',
    '',
    '| Transition | Signal version | Group | N | Outcomes | Top-156 rate | Mean next-season value | Mean percentile change |',
    '| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |'
);
for (const transition of transitions) {
    const outcomes = transition.signalOutcomes as {
        original: Array<Record<string, unknown>>;
        mpAdjusted: Array<Record<string, unknown>>;
    };
    const events = transition.signalEvents as {
        original: Record<string, unknown>;
        mpAdjusted: Record<string, unknown>;
    };
    for (const [version, groups] of [
        ['Original', outcomes.original],
        ['MP-adjusted', outcomes.mpAdjusted]
    ] as const) {
        for (const group of groups)
            lines.push(
                `| ${transition.id} | ${version} | ${group.signal} | ${group.count} | ${group.outcomeCount} | ${fmt(group.top156Rate as number | null)} | ${fmt(group.meanSeasonValue as number | null)} | ${fmt(group.meanPercentileChange as number | null)} |`
            );
    }
    const originalEvents = events.original as {
        matchedCount: number;
        sleeperBreakout: {
            truePositive: number;
            taggedMatched: number;
            eventCount: number;
            precision: number | null;
            recall: number | null;
        };
        dudDecline: {
            truePositive: number;
            taggedMatched: number;
            eventCount: number;
            precision: number | null;
            recall: number | null;
        };
    };
    const mpEvents = events.mpAdjusted as typeof originalEvents;
    for (const [version, row] of [
        ['Original', originalEvents],
        ['MP-adjusted', mpEvents]
    ] as const) {
        lines.push(
            `| ${transition.id} | ${version} events | Sleeper breakout | ${row.sleeperBreakout.taggedMatched} tagged / ${row.sleeperBreakout.eventCount} events | ${row.sleeperBreakout.truePositive} matches | precision ${fmt(row.sleeperBreakout.precision)} | recall ${fmt(row.sleeperBreakout.recall)} |`
        );
        lines.push(
            `| ${transition.id} | ${version} events | Dud decline | ${row.dudDecline.taggedMatched} tagged / ${row.dudDecline.eventCount} events | ${row.dudDecline.truePositive} matches | precision ${fmt(row.dudDecline.precision)} | recall ${fmt(row.dudDecline.recall)} |`
        );
    }
}
lines.push(
    '',
    'Tag groups are small; every rate is shown with its denominator. `Outcomes` counts tagged players with a future row. Event metrics use the matched ≥20-game cohort and fixed ±0.10 percentile thresholds.',
    '',
    '## Seasonal volatility proxy',
    '',
    '| Transition | MPG group | Matched N | MPG range | Mean signed change | Mean absolute change | Median absolute change |',
    '| --- | --- | ---: | ---: | ---: | ---: | ---: |'
);
for (const transition of transitions) {
    const summary = transition.sourceMpQuartiles as {
        sourceEligible: number;
        matched: number;
        missingFuture: number;
        cutPoints: number[];
        groups: Array<Record<string, unknown>>;
    };
    for (const group of summary.groups)
        lines.push(
            `| ${transition.id} | ${group.id} | ${group.count} | ${group.mpgMin === null ? 'n/a' : `${fmt(group.mpgMin as number)}–${fmt(group.mpgMax as number)}`} | ${fmt(group.meanSignedChange as number | null)} | ${fmt(group.meanAbsoluteChange as number | null)} | ${fmt(group.medianAbsoluteChange as number | null)} |`
        );
    lines.push(
        `| ${transition.id} | Matched / excluded | ${summary.matched} / ${summary.missingFuture} | source eligible ${summary.sourceEligible} | cuts ${summary.cutPoints.map(fmt).join(', ')} |  |  |`
    );
}
lines.push(
    '',
    'The machine record also reports per-game matched-cohort counts and percentile-change event totals. Volatility groups use source-season MPG cut points; tied values remain together.',
    '',
    '## Data and reproduction',
    '',
    'The evaluator fails before reporting if source-view player IDs mismatch or the frozen protocol is unavailable. The original production ranker is not modified by this experiment.'
);
await writeFile(outMarkdown, `${lines.join('\n')}\n`);
process.stdout.write(
    `Wrote minutes experiment results for ${transitions.length} transitions and ${predictionRecords.length} chronological predictor evaluations.\n`
);
