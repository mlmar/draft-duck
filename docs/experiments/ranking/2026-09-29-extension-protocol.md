# Historical ranking replication protocol

**Frozen before scoring the newly supplied 2021–22 and 2022–23 seasons on 2026-09-29.** This is an extension of the [original protocol](protocol.md), not a replacement for its development and holdout decision. The seven candidate rules and evaluator are already fixed in `app/core/src/ranking-experiment.ts`. The original 2023–24 → 2024–25 development and 2024–25 → 2025–26 holdout outcomes have already been viewed.

## Question and hypotheses

Does the previously selected 70% per-game / 30% totals rule beat the strongest of the three single-view baselines on each newly available historical transition?

- Null: the fixed 70/30 rule does not beat the strongest single-view baseline on at least one of the two new transitions.
- Alternative: it beats that baseline on both transitions.
- Decision: report historical replication support only if the 70/30 rule's 9-cat primary metric is strictly greater than per-game, totals, and per-36 on **both** new transitions. Any failure means no replication support under this rule. Report the two differences and all seven candidate scores; do not select a new candidate using these data.

This criterion is descriptive, not a p-value or proof of a population optimum. The two transitions share 2022–23, and the 70/30 rule was selected using a later transition. These earlier seasons are newly observed but are not prospective chronological holdouts.

## Data and integrity gates

Use `app/data/{21_22,22_23,23_24}_{per_game,per_36,totals}.csv`. Evaluate 2021–22 → 2022–23 and 2022–23 → 2023–24 separately. Read each source view with `CsvProvider` and a 20-game minimum; read future per-game with a zero-game minimum. The provider collapses trade rows, excludes the league-average row, and uses `Player-additional` IDs. Require identical eligible source IDs across the three views; fail before writing results if they differ. Record input, protocol, evaluator, and runner SHA-256 hashes. The supplied advanced CSVs are checked for presence but cannot affect the ranking or outcome score.

## Procedure and measures

Apply exactly the neutral 9-cat profile, rank percentile conversion, seven candidate rules, outcome reference population, replacement value, and discounted top-156 primary metric in the original protocol. Record discounted value through picks 12 and 50 and missing-outcome counts as diagnostics. Repeat all seven rules in neutral 8-cat, excluding turnovers, as a secondary sensitivity check. No candidate weights or thresholds may be tuned after viewing these results.

For each candidate, transition, and category profile, record its hypothesis, procedure, result, difference from per-game, data exceptions, and conclusion. The 9-cat 70/30 result is also compared with the strongest single-view baseline. If any integrity gate fails, document it and stop scoring. Preserve the original report and its decision unchanged.

## Reproduction

Run `node --import tsx app/core/scripts/run-ranking-extension.ts` from the repository root. The generated [report](2026-09-29-extension-results.md) and [machine record](2026-09-29-extension-results.json) hold the per-test evidence and hashes. No production ranking behavior changes are authorized by this experiment alone.
