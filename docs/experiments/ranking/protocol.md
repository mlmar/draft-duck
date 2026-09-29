# Ranking blend experiment protocol

**Frozen before running the comparisons on 2026-09-28.** This is a retrospective comparison, not a randomized experiment. Results are exploratory until replicated across more independent seasons. Do not revise this protocol in response to its holdout result; record a new protocol for a new experiment. A post-run clerical correction changed the input-file count from six to seven; no candidate, metric, split, or decision rule changed.

## Question and hypotheses

Does combining per-game, season-total, and per-36 rankings improve next-season neutral 9-cat draft value compared with the strongest single-view board?

- Null: the selected blend does not exceed the strongest single-view baseline on the held-out transition's primary metric.
- Alternative: it exceeds that baseline on the held-out transition's primary metric.
- Decision: select the highest-scoring candidate on 2023–24 → 2024–25 only. On 2024–25 → 2025–26, report provisional support only if it beats **each** single-view baseline. Otherwise report no demonstrated improvement. No holdout retuning.

## Inputs and population

Use `app/data/{23_24,24_25,25_26}_{per_game,per_36,totals}.csv`. Advanced CSVs are for explanation of misses only and cannot affect scores. Read with `CsvProvider`, retaining its combined trade rows, `Player-additional` ID, and source-season minimum of 20 games. A source-season player remains in the outcome set even if absent or below 20 games next season. Require the three source views to have identical eligible IDs. Record SHA-256 of every input in the report.

The first transition is development; the second is the untouched holdout. The candidate population is the source season's eligible players. New players in the outcome season cannot be drafted from that source-season board and are excluded from candidate ordering.

## Neutral scoring and candidates

Use the existing `rank()` z-score formulas and operator weights with a 12-team, 13-round, 9-cat neutral profile, availability floor off. Convert each per-view source rank `r` of `N` players to `(N-r)/(N-1)`; use `1` if `N=1`. Sort candidate blend scores descending and break ties by `playerId` ascending.

The seven candidate rules are: per-game only, totals only, per-36 only, 70/30 per-game/totals, 50/50 per-game/totals, 55/35/10 per-game/totals/per-36, and 55/35/10 with the per-36 weight multiplied by `min(1, per-game minutes / 24)`. In the adjusted rule, the unused per-36 weight returns to per game. The 24-minute threshold is a fixed hypothesis, not a tuned parameter.

## Outcome and primary measure

For the outcome season, use the same neutral category formula with reference means and standard deviations from players with at least 20 games. Apply those fixed moments to players with 1–19 games too. Take the composite of the player at reference rank 156 as the replacement level. A source player's realized value is `(future per-game composite - replacement composite) × future games / 82`; a player with no future row has value `0`. Negative values are retained. This measures season-long production above a replaceable roster slot, with no additional penalty for missed games already covered by replacement.

The primary metric is the sum of realized values for ranks 1–156, each divided by `log2(rank+1)`. Larger is better. Secondary diagnostics: the same discounted value through picks 12 and 50, missed-player counts, top rank misses, and a neutral 8-cat sensitivity check. Secondary diagnostics cannot select a candidate or change the decision. Do not calculate a p-value from player-level resampling; only two independent season transitions are available.

## Required records

The evaluator must emit a reproducible machine-readable result and a human report. For **each** candidate on **each** transition, record: test ID, hypothesis/comparator, input files and hashes, eligible and outcome counts, exact candidate rule and scoring procedure, primary and secondary numerical results, data exceptions, conclusion, and whether the record is development or holdout. A selection record must show all development candidates and the selected ID. A separate holdout conclusion must compare that ID to all three single-view baselines without changing it. Distinguish measured results from interpretation, and label any post-result analysis exploratory.

## Reproduction and references

Run the committed evaluator with the repo's Node.js 22+ runtime; the generated report records the exact command and code revision. Keep source data unchanged. The protocol structure follows [NIST experimental design guidance](https://www.itl.nist.gov/div898/handbook/pri/section1/pri11.htm) and [OSF preregistration guidance](https://help.osf.io/article/330-welcome-to-registrations). They do not establish that this backtest is a randomized experiment or that one held-out transition proves a universal optimum.
