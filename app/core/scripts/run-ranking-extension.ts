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

const root = fileURLToPath(new URL('../../../', import.meta.url));
const reportBase = 'docs/experiments/ranking/2026-09-29-extension';
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const inputSha256: Record<string, string> = {};

async function readHashed(relative: string): Promise<Uint8Array> {
    const contents = await readFile(`${root}${relative}`);
    inputSha256[relative] = hash(contents);
    return contents;
}

async function load(year: string, mode: 'per_game' | 'per_36' | 'totals', minGames: number) {
    const relative = `app/data/${year}_${mode}.csv`;
    await readHashed(relative);
    return new CsvProvider(`${root}${relative}`, { minGames }).load();
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
    const views = await source(from);
    const future = await load(to, 'per_game', 0);
    const profiles = [
        { id: '9-cat', value: EXPERIMENT_PROFILE },
        {
            id: '8-cat',
            value: {
                ...EXPERIMENT_PROFILE,
                enabledCats: EXPERIMENT_PROFILE.enabledCats.filter((cat) => cat !== 'tov')
            }
        }
    ] as const;
    const scored = profiles.map(({ id, value }) => {
        const boards = sourceBoards(views, value);
        const outcome = outcomeValues(future, value);
        return {
            profile: id,
            sourceEligible: boards.players.length,
            futureParticipants: outcome.playedCount,
            futureReference: outcome.referenceCount,
            replacementComposite: outcome.replacement,
            tests: CANDIDATES.map((candidate) =>
                evaluateCandidate(candidateOrder(boards, candidate), outcome, candidate)
            )
        };
    });
    return { id: `${from}-to-${to}`, from, to, profiles: scored };
}

// Integrity gates run before any result is written.
const advancedSha256 = Object.fromEntries(
    await Promise.all(
        ['21_22', '22_23'].map(async (year) => {
            const path = `app/data/${year}_advanced.csv`;
            const contents = await readFile(`${root}${path}`);
            if (contents.length === 0) throw new Error(`Empty advanced CSV: ${path}`);
            return [path, hash(contents)] as const;
        })
    )
);
const transitions = await Promise.all([transition('21_22', '22_23'), transition('22_23', '23_24')]);
const comparisons = transitions.map((transition) => {
    const tests = transition.profiles[0]!.tests;
    const selected = tests.find((test) => test.id === 'game-70-total-30')!;
    const strongestBaseline = Math.max(
        ...tests.filter((test) => ['per-game', 'totals', 'per-36'].includes(test.id)).map((test) => test.primary)
    );
    return {
        transition: transition.id,
        fixedCandidate: selected.id,
        candidatePrimary: selected.primary,
        strongestBaseline,
        difference: selected.primary - strongestBaseline,
        beatsAllSingleViews: selected.primary > strongestBaseline
    };
});
const historicalReplicationSupport = comparisons.every((comparison) => comparison.beatsAllSingleViews);
const protocol = `${reportBase}-protocol.md`;
const runner = 'app/core/scripts/run-ranking-extension.ts';
const evaluator = 'app/core/src/ranking-experiment.ts';
const record = {
    protocol,
    protocolSha256: hash(await readFile(`${root}${protocol}`)),
    command: 'node --import tsx app/core/scripts/run-ranking-extension.ts',
    nodeVersion: process.version,
    codeSha256: {
        runner: hash(await readFile(`${root}${runner}`)),
        evaluator: hash(await readFile(`${root}${evaluator}`))
    },
    inputSha256: Object.fromEntries(Object.entries(inputSha256).sort(([a], [b]) => a.localeCompare(b))),
    advancedPresenceSha256: advancedSha256,
    transitions,
    comparisons,
    historicalReplicationSupport
};
await writeFile(`${root}${reportBase}-results.json`, `${JSON.stringify(record, null, 2)}\n`);

const n = (value: number) => value.toFixed(3);
const lines = [
    '# Historical ranking replication results',
    '',
    '## Procedure and decision',
    '',
    `Run \`${record.command}\` from the repository root. The [frozen extension protocol](2026-09-29-extension-protocol.md) and [machine record](2026-09-29-extension-results.json) contain the procedure, source and code hashes, exact rules, and numerical results. The original [development and holdout results](results.md) remain unchanged.`,
    '',
    'The prespecified check compares the previously selected 70% per-game / 30% totals rule with the strongest single-view baseline on each new 9-cat transition. Both transitions must pass for historical replication support.',
    ''
];
for (const comparison of comparisons) {
    lines.push(
        `- ${comparison.transition}: 70/30 ${n(comparison.candidatePrimary)}; strongest single view ${n(comparison.strongestBaseline)}; difference ${comparison.difference >= 0 ? '+' : ''}${n(comparison.difference)}; ${comparison.beatsAllSingleViews ? 'pass' : 'fail'}.`
    );
}
lines.push(
    '',
    `**Conclusion:** ${historicalReplicationSupport ? 'The fixed rule meets the prespecified historical replication criterion.' : 'The fixed rule does not meet the prespecified historical replication criterion.'} These earlier seasons are retrospective checks, and the previous holdout failure still applies. No validated optimum or production change follows from this result.`,
    '',
    '## Input checks',
    '',
    'Eligible player IDs match across the three source views in both seasons. The supplied advanced files are present and nonempty; they were not used in scoring. Future players with 1–19 games remain in outcomes; missing players receive zero. The exact input hashes are in the machine record.',
    '',
    '## Individual test records',
    ''
);

function testRecord(test: TestResult, baseline: TestResult, profile: string, transition: string): string[] {
    const delta = test.primary - baseline.primary;
    const comparator = test.id === 'per-game' ? 'reference baseline' : 'per-game';
    const conclusion =
        test.id === 'per-game'
            ? 'Reference value established.'
            : delta > 0
              ? 'Higher than per-game on this transition.'
              : 'No improvement over per-game on this transition.';
    return [
        `### ${profile} · ${transition} · ${test.id}`,
        '',
        `- **Hypothesis:** ${test.id === 'per-game' ? 'Establish the per-game reference.' : 'This fixed candidate exceeds the per-game reference on the primary metric.'}`,
        `- **Procedure and evidence:** Neutral ${profile}, source minimum 20 games, availability floor off. Weights ${test.candidate.perGame}/${test.candidate.totals}/${test.candidate.per36} (per-game/totals/per-36); minute adjustment ${test.candidate.minutesAdjusted ? 'on' : 'off'}. Hashes and top-12 player IDs are in the [machine record](2026-09-29-extension-results.json).`,
        `- **Result:** Discounted top-156 value ${n(test.primary)}; versus ${comparator} ${delta >= 0 ? '+' : ''}${n(delta)}. Picks 12/50/156: ${n(test.at12)} / ${n(test.at50)} / ${n(test.at156)}.`,
        `- **Exceptions:** ${test.missing} source players have no future row and receive zero; 1–19-game future players remain scored. No candidate-specific exclusions.`,
        `- **Conclusion:** ${conclusion} ${profile === '8-cat' ? 'Secondary sensitivity; excluded from the decision.' : test.id === 'game-70-total-30' ? 'Also compared with the strongest single-view baseline in the decision above.' : 'Context only; cannot select a new rule.'}`,
        ''
    ];
}
for (const transition of transitions) {
    for (const profile of transition.profiles) {
        lines.push(
            `### ${profile.profile} population · ${transition.id}`,
            '',
            `${profile.sourceEligible} eligible source players; ${profile.futureParticipants} future participants; ${profile.futureReference} future reference players; replacement composite ${n(profile.replacementComposite)}.`,
            ''
        );
        const baseline = profile.tests.find((test) => test.id === 'per-game')!;
        for (const test of profile.tests) lines.push(...testRecord(test, baseline, profile.profile, transition.id));
    }
}
lines.push(
    '## Interpretation limits',
    '',
    'The two new transitions share a season, the selected candidate was chosen using a later transition, and the previously observed holdout did not support it. Treat these as historical replication evidence, not an untouched prospective test. The seven candidate scores permit diagnosis but cannot be used to retrofit a new optimum without a new protocol and new validation data.'
);
await writeFile(`${root}${reportBase}-results.md`, `${lines.join('\n')}\n`);
process.stdout.write(
    `Historical replication support: ${historicalReplicationSupport}; differences ${comparisons.map((c) => `${c.transition} ${n(c.difference)}`).join(', ')}\n`
);
