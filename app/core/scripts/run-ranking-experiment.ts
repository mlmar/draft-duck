import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { CsvProvider } from '../src/csv-provider.ts';
import {
    CANDIDATES,
    EXPERIMENT_PROFILE,
    candidateOrder,
    evaluateCandidate,
    outcomeValues,
    sourceBoards,
    type TestResult,
    type ThreeViews
} from '../src/ranking-experiment.ts';
import type { PlayerSeason } from '../src/types.ts';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const outputJson = fileURLToPath(new URL('../../../docs/experiments/ranking/results.json', import.meta.url));
const outputMd = fileURLToPath(new URL('../../../docs/experiments/ranking/results.md', import.meta.url));
const sha256 = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const inputHashes: Record<string, string> = {};

async function load(year: string, mode: 'per_game' | 'per_36' | 'totals', minGames: number): Promise<PlayerSeason[]> {
    const relative = `app/data/${year}_${mode}.csv`;
    const path = `${root}${relative}`;
    inputHashes[relative] = sha256(await readFile(path));
    return new CsvProvider(path, { minGames }).load();
}

async function source(year: string): Promise<ThreeViews> {
    const [perGame, per36, totals] = await Promise.all([
        load(year, 'per_game', 20),
        load(year, 'per_36', 20),
        load(year, 'totals', 20)
    ]);
    return { perGame, per36, totals };
}

async function transition(from: string, to: string) {
    const boards = sourceBoards(await source(from));
    const outcome = outcomeValues(await load(to, 'per_game', 0));
    const tests = CANDIDATES.map((candidate) =>
        evaluateCandidate(candidateOrder(boards, candidate), outcome, candidate)
    );
    const eightCatProfile = {
        ...EXPERIMENT_PROFILE,
        enabledCats: EXPERIMENT_PROFILE.enabledCats.filter((cat) => cat !== 'tov')
    };
    const eightBoards = sourceBoards(await source(from), eightCatProfile);
    const eightOutcome = outcomeValues(await load(to, 'per_game', 0), eightCatProfile);
    const eightCat = CANDIDATES.map((candidate) =>
        evaluateCandidate(candidateOrder(eightBoards, candidate), eightOutcome, candidate)
    );
    return {
        id: `${from}-to-${to}`,
        from,
        to,
        sourceEligible: boards.players.length,
        futureParticipants: outcome.playedCount,
        futureReference: outcome.referenceCount,
        replacementComposite: outcome.replacement,
        tests,
        eightCat
    };
}

const development = await transition('23_24', '24_25');
const holdout = await transition('24_25', '25_26');
const selected = [...development.tests].sort((a, b) => b.primary - a.primary || a.id.localeCompare(b.id))[0]!;
const selectedHoldout = holdout.tests.find((test) => test.id === selected.id)!;
const baselineIds = ['per-game', 'totals', 'per-36'];
const strongestBaseline = Math.max(
    ...holdout.tests.filter((test) => baselineIds.includes(test.id)).map((t) => t.primary)
);
const provisionalSupport = !baselineIds.includes(selected.id) && selectedHoldout.primary > strongestBaseline;
const codeHash = sha256(await readFile(fileURLToPath(new URL('../src/ranking-experiment.ts', import.meta.url))));
const runnerHash = sha256(await readFile(fileURLToPath(import.meta.url)));
const protocolHash = sha256(
    await readFile(fileURLToPath(new URL('../../../docs/experiments/ranking/protocol.md', import.meta.url)))
);
const record = {
    protocol: 'docs/experiments/ranking/protocol.md',
    protocolSha256: protocolHash,
    command: 'node --import tsx app/core/scripts/run-ranking-experiment.ts',
    nodeVersion: process.version,
    codeSha256: { evaluator: codeHash, runner: runnerHash },
    inputSha256: Object.fromEntries(Object.entries(inputHashes).sort(([a], [b]) => a.localeCompare(b))),
    development,
    holdout,
    selection: {
        id: selected.id,
        developmentPrimary: selected.primary,
        holdoutPrimary: selectedHoldout.primary,
        strongestHoldoutBaseline: strongestBaseline,
        holdoutDifference: selectedHoldout.primary - strongestBaseline,
        provisionalSupport
    }
};
await writeFile(outputJson, `${JSON.stringify(record, null, 2)}\n`);

const number = (value: number) => value.toFixed(3);
function testRecord(
    test: TestResult,
    transitionId: string,
    stage: 'development' | 'holdout',
    baseline: TestResult,
    cats: '9-cat' | '8-cat' = '9-cat'
): string {
    const delta = test.primary - baseline.primary;
    const conclusion =
        test.id === baseline.id
            ? 'Reference baseline; no improvement claim.'
            : delta > 0
              ? 'Measured improvement over per-game on this transition.'
              : 'No measured improvement over per-game on this transition.';
    return (
        `### ${cats.toUpperCase()} · ${stage.toUpperCase()} · ${transitionId} · ${test.id}\n\n` +
        `- **Hypothesis:** ${test.id === baseline.id ? 'Establish the per-game reference.' : 'This prespecified rule exceeds per-game on discounted value through pick 156.'}\n` +
        `- **Evidence and procedure:** Source-season eligible players ranked with the neutral ${cats} profile, availability floor off; candidate weights ${test.candidate.perGame}/${test.candidate.totals}/${test.candidate.per36} (per-game/totals/per-36), minute adjustment ${test.candidate.minutesAdjusted ? 'on' : 'off'}. Input hashes and exact command are in [results.json](results.json).\n` +
        `- **Result:** Primary ${number(test.primary)}; versus per-game ${delta >= 0 ? '+' : ''}${number(delta)}. Discounted value at picks 12/50/156: ${number(test.at12)} / ${number(test.at50)} / ${number(test.at156)}.\n` +
        `- **Data exceptions:** ${test.missing} source players had no outcome row and received zero value; players with 1–19 games were retained. No candidate-specific exclusions.\n` +
        `- **Conclusion:** ${conclusion} ${cats === '8-cat' ? 'Secondary sensitivity only; excluded from selection.' : stage === 'development' ? 'Eligible for selection by the frozen primary metric.' : 'Holdout result; no retuning permitted.'}\n`
    );
}

const lines = [
    '# Ranking experiment results',
    '',
    '## Reproduce',
    '',
    '`node --import tsx app/core/scripts/run-ranking-experiment.ts` from the repository root. The [protocol](protocol.md) was frozen before scoring. The [machine-readable record](results.json) contains SHA-256 hashes for the protocol, seven input CSVs, and both evaluator files, plus all candidate rules and full numerical results. No API behavior was changed.',
    '',
    '## Data checks and exceptions',
    '',
    `- Development: ${development.sourceEligible} source-eligible players, ${development.futureParticipants} future participants, ${development.futureReference} future players meeting the 20-game reference rule.`,
    `- Holdout: ${holdout.sourceEligible} source-eligible players, ${holdout.futureParticipants} future participants, ${holdout.futureReference} future players meeting the 20-game reference rule.`,
    '- Per-game, per-36, and totals eligible IDs matched within each source season. Players with no future row received zero value; players with 1–19 games were scored against reference moments. No rows were removed after viewing outcomes.',
    '',
    '## Development selection',
    '',
    `The frozen primary metric selected **${selected.id}** at ${number(selected.primary)}. This choice was fixed before interpreting the holdout.`,
    '',
    '## Holdout conclusion',
    '',
    `Selected rule: **${selected.id}**. Holdout primary ${number(selectedHoldout.primary)}; strongest single-view baseline ${number(strongestBaseline)}; difference ${number(selectedHoldout.primary - strongestBaseline)}. **${provisionalSupport ? 'Provisional support for this blend.' : 'No blend demonstrated improvement under the frozen rule.'}** One holdout transition does not establish a validated optimum.`,
    '',
    '## Individual test records',
    ''
];
for (const [stage, batch] of [
    ['development', development],
    ['holdout', holdout]
] as const) {
    const baseline = batch.tests.find((test) => test.id === 'per-game')!;
    for (const test of batch.tests) lines.push(testRecord(test, batch.id, stage, baseline));
}
lines.push(
    '## Secondary 8-cat test records',
    '',
    'Neutral 8-cat uses the same seven fixed rules and changes only the enabled categories. These checks did not affect selection.',
    ''
);
for (const [stage, batch] of [
    ['development', development],
    ['holdout', holdout]
] as const) {
    const baseline = batch.eightCat.find((test) => test.id === 'per-game')!;
    for (const test of batch.eightCat) lines.push(testRecord(test, batch.id, stage, baseline, '8-cat'));
}
lines.push(
    'Advanced-stat files were not used as predictors. Player-level diagnosis and any new hypotheses are labelled exploratory in the separate [diagnostics](exploratory-diagnostics.md).',
    '',
    '## Limits and next experiment',
    '',
    'Two consecutive transitions share a season and do not provide enough independent evidence for a stable optimum. Acquire more prior seasons, repeat chronological holdouts, and create a new frozen protocol before fitting extra weights or using advanced stats.'
);
await writeFile(outputMd, `${lines.join('\n')}\n`);
process.stdout.write(
    `Selected ${selected.id}; holdout delta ${number(selectedHoldout.primary - strongestBaseline)}; provisional support ${provisionalSupport}\n`
);
