# Ranking experiment index

The [frozen protocol](protocol.md) specifies the hypotheses, population, candidate rules, outcome, metric, and decision criterion. The [test report](results.md) records every candidate on the development and holdout transitions, with numerical evidence in [results.json](results.json). [Exploratory diagnostics](exploratory-diagnostics.md) inspect notable misses without changing the frozen decision.

The [2026-09-29 extension protocol](2026-09-29-extension-protocol.md) and [extension results](2026-09-29-extension-results.md) add 2021–22 and 2022–23 data, creating two earlier transition tests. Their [machine record](2026-09-29-extension-results.json) includes individual scores and input hashes. The previously selected 70/30 blend trails the strongest single-view baseline on both new 9-cat transitions, so it does not meet the extension's historical replication criterion.

**Conclusion:** the development transition selected a 70% per-game / 30% totals blend. It fell below the per-game-only baseline on the original held-out transition and both newly tested earlier transitions. No blend has demonstrated a reliable improvement under the prespecified checks, so the app's `/rank` behavior remains unchanged. Four overlapping historical transitions cannot establish a validated optimum.

Run the report from the repository root with `node --import tsx app/core/scripts/run-ranking-experiment.ts`. Run the explicitly post-result diagnostics with `node --import tsx app/core/scripts/diagnose-ranking-misses.ts`. The JSON report records input and evaluator SHA-256 hashes. A changed input or code hash means a new run must be recorded and interpreted as such.

Run the extension with `node --import tsx app/core/scripts/run-ranking-extension.ts`. Its protocol was frozen before scoring the added seasons, and it preserves the original report.
