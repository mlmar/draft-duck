// Exploratory follow-up. This script never changes the frozen candidate selection.
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'node:url';
import { format } from 'prettier';
import { CsvProvider } from '../src/csv-provider.ts';
import { CANDIDATES, candidateOrder, outcomeValues, sourceBoards } from '../src/ranking-experiment.ts';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const resultsPath = fileURLToPath(new URL('../../../docs/experiments/ranking/results.json', import.meta.url));
const outputPath = fileURLToPath(
    new URL('../../../docs/experiments/ranking/exploratory-diagnostics.md', import.meta.url)
);
const results = JSON.parse(await readFile(resultsPath, 'utf8')) as { selection: { id: string } };
const selected = CANDIDATES.find((candidate) => candidate.id === results.selection.id)!;
const lines = [
    '# Exploratory ranking diagnostics',
    '',
    '**Post-result analysis.** These examples explain where the frozen development-selected rule missed. They did not select or modify the rule, and they are not confirmatory evidence. Reproduce with `node --import tsx app/core/scripts/diagnose-ranking-misses.ts` from the repo root.',
    ''
];

for (const [from, to] of [
    ['23_24', '24_25'],
    ['24_25', '25_26']
]) {
    const paths = ['per_game', 'per_36', 'totals'] as const;
    const [perGame, per36, totals, future] = await Promise.all([
        ...paths.map((mode) => new CsvProvider(`${root}app/data/${from}_${mode}.csv`).load()),
        new CsvProvider(`${root}app/data/${to}_per_game.csv`, { minGames: 0 }).load()
    ]);
    const boards = sourceBoards({ perGame, per36, totals });
    const order = candidateOrder(boards, selected);
    const outcome = outcomeValues(future);
    const sourceById = new Map(perGame.map((player) => [player.playerId, player]));
    const advancedPath = `${root}app/data/${from}_advanced.csv`;
    const advancedBytes = await readFile(advancedPath);
    const rows = parse(advancedBytes, { columns: true, skip_empty_lines: true }) as Record<string, string>[];
    const advanced = new Map<string, Record<string, string>>();
    for (const row of rows) {
        const id = row['Player-additional'];
        if (!id || id === '-9999') continue;
        const existing = advanced.get(id);
        if (!existing || /^\d+TM$/.test(row.Team ?? '') || Number(row.G) > Number(existing.G)) advanced.set(id, row);
    }
    const topMisses = order
        .slice(0, 50)
        .map((id, index) => ({ id, rank: index + 1, value: outcome.values.get(id) ?? 0 }))
        .sort((a, b) => a.value - b.value || a.rank - b.rank)
        .slice(0, 5);
    const overlooked = order
        .slice(156)
        .map((id, index) => ({ id, rank: index + 157, value: outcome.values.get(id) ?? 0 }))
        .sort((a, b) => b.value - a.value || a.rank - b.rank)
        .slice(0, 5);
    lines.push(
        `## ${from} to ${to}`,
        '',
        `Source advanced CSV SHA-256: \`${createHash('sha256').update(advancedBytes).digest('hex')}\`.`,
        '',
        '### Lowest future value among the selected rule’s top 50',
        ''
    );
    for (const row of topMisses) {
        const person = sourceById.get(row.id)!;
        const extra = advanced.get(row.id);
        lines.push(
            `- Rank ${row.rank}: ${person.name}, future value ${row.value.toFixed(2)}, source games ${person.games}, BPM ${extra?.BPM ?? 'n/a'}, WS ${extra?.WS ?? 'n/a'}.`
        );
    }
    lines.push('', '### Highest future value outside the selected rule’s top 156', '');
    for (const row of overlooked) {
        const person = sourceById.get(row.id)!;
        const extra = advanced.get(row.id);
        lines.push(
            `- Rank ${row.rank}: ${person.name}, future value ${row.value.toFixed(2)}, source games ${person.games}, BPM ${extra?.BPM ?? 'n/a'}, WS ${extra?.WS ?? 'n/a'}.`
        );
    }
    lines.push(
        '',
        'These descriptive advanced values can suggest hypotheses for a future protocol. They cannot establish that BPM or WS would improve a ranking without a new holdout.',
        ''
    );
}
await writeFile(outputPath, await format(`${lines.join('\n')}\n`, { parser: 'markdown', printWidth: 120 }));
process.stdout.write(`${outputPath}\n`);
