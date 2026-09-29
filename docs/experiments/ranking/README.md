# Ranking experiment index

The [frozen protocol](protocol.md) specifies the hypotheses, population, candidate rules, outcome, metric, and decision criterion. The [test report](results.md) records every candidate on the development and holdout transitions, with numerical evidence in [results.json](results.json). [Exploratory diagnostics](exploratory-diagnostics.md) inspect notable misses without changing the frozen decision.

**Conclusion:** the development transition selected a 70% per-game / 30% totals blend. It fell below the per-game-only baseline on the held-out transition. Under the prespecified rule, no blend demonstrated an improvement and the app's `/rank` behavior was not changed. The two available transitions cannot establish a validated optimum.

Run the report from the repository root with `node --import tsx app/core/scripts/run-ranking-experiment.ts`. Run the explicitly post-result diagnostics with `node --import tsx app/core/scripts/diagnose-ranking-misses.ts`. The JSON report records input and evaluator SHA-256 hashes. A changed input or code hash means a new run must be recorded and interpreted as such.
