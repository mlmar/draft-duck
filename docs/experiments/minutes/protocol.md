# Minutes and next-season value experiment protocol

**Frozen on 2026-10-02 before scoring this experiment.** This is a retrospective analysis: the five source seasons and their four transitions were already used in previous ranking experiments. Findings will be reported as descriptive predictive evidence, not causal effects or an untouched holdout result. The protocol, evaluator, runner, inputs, and scoring dependencies are hashed in the result record.

## Questions and decision rules

1. Does source-season minutes per game (MPG) predict next-season per-game category value or season-long value beyond source per-game fantasy composite, games played, and age?
2. Does adding MPG to the source ranking improve next-season season-long value versus the same base ranking without MPG?
3. Do Sleeper/Dud tags formed with an MP-adjusted rate signal better identify next-season breakouts and declines?
4. Does source MPG predict season-to-season variability in per-game fantasy composite?

For each MP-aware ranking candidate, call it **retrospectively promising** only when it improves the primary metric over its named parent rule in at least three of four transitions and has a positive unweighted mean difference across all four. This is a descriptive screen, not a significance test or production-selection rule. Always report every transition and its comparison with the strongest single-view baseline. No weights or thresholds may be retuned after scoring.

## Inputs and populations

Use `app/data/{21_22,22_23,23_24,24_25,25_26}_{per_game,per_36,totals}.csv` for the four chronological transitions. Load each source view with `CsvProvider` and its existing 20-game minimum; load future per-game views with a zero-game minimum. Keep combined trade rows and `Player-additional` player IDs. Source views must have identical eligible IDs or the evaluator fails before writing results. Source MPG is `MP` from the per-game file. Total MP is `MP` from the totals file; it is diagnostic and is never substituted with rounded MPG × games. Advanced CSVs are not inputs.

The ranking population is each source season's players with at least 20 games. A source player with no future row receives zero season value. Players with 1–19 future games remain in the season-value outcome and are scored against moments fit on future players with at least 20 games. Per-game performance and volatility analyses require at least 20 games in both seasons; report the source and future counts, matched count, and exclusions for each transition.

## Outcomes and procedures

Use the existing neutral 9-cat ranker with availability floor off, operator weights from the checked-in config, and the original discounted top-156 season-value metric. Future season value is `(future neutral composite − replacement composite at future reference rank 156) × future games / 82`; reference moments are fit on future players with at least 20 games and applied to all future participants. The primary comparison is 9-cat. Repeat ranking candidates in neutral 8-cat as a sensitivity analysis without changing decisions.

For each eligible player, report Spearman correlation of source MPG with next-season per-game composite, and of source total MP with next-season season value. Additionally compare two fixed linear models with intercept: baseline features are source neutral per-game composite, source games, and age; the MP model adds MPG. Standardize input features using training-transition means and population standard deviations only; a zero-variance feature becomes zero. Fit ordinary least squares with Gaussian elimination and partial pivoting. A rank-deficient design is an evaluator error. The earliest transition trains the first model and is not scored out of sample. Then expand the training set chronologically: train through 2022–23 → test 2023–24, train through 2023–24 → test 2024–25, and train through 2024–25 → test 2025–26. Report MAE, RMSE, and held-out R² separately for each transition and target. Targets are next-season per-game composite, season value, and absolute composite change (seasonal volatility). Report coefficients and Spearman associations as descriptive quantities; do not calculate player-level p-values.

Convert ranking candidate ranks to percentiles with `(N − rank) / (N − 1)` and `1` when `N = 1`. Source rank ties use the ranker's existing stable player-ID order. Equal MPG values receive their average rank before conversion, with higher MPG receiving the higher percentile. Candidate scores and parent rules are:

| Candidate                                    | Score                                                                                              |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Per-game                                     | Per-game rank percentile                                                                           |
| Totals                                       | Totals rank percentile                                                                             |
| Per-36                                       | Per-36 rank percentile                                                                             |
| 70/30                                        | `0.70 × per-game + 0.30 × totals`                                                                  |
| 55/35/10                                     | `0.55 × per-game + 0.35 × totals + 0.10 × per-36`                                                  |
| MP-added per-game (parent: per-game)         | `0.90 × per-game + 0.10 × MPG`                                                                     |
| MP-added blend (parent: 55/35/10)            | `0.90 × (55/35/10 blend) + 0.10 × MPG`                                                             |
| Minutes-adjusted 55/35/10 (parent: 55/35/10) | Multiply the 10% per-36 weight by `clamp(MPG / 24, 0, 1)` and return its unused weight to per-game |

For each candidate report discounted value through picks 12, 50, and 156, top-156 overlap with actual next-season top 156, and missing future rows. Actual top 156 sorts the full future outcome population by realized season value, descending, with player ID as the tie-breaker. Candidates rank only source-eligible players.

For Upside, the existing source-season Sleeper/Dud signal uses the app's thresholds. The MP-adjusted alternative uses `reliability × per-36 percentile + (1 − reliability) × per-game percentile`, with `reliability = clamp(MPG / 24, 0, 1)`. Rank that adjusted score (player ID breaks score ties), then apply the existing top-quarter/below-median Sleeper and bottom-quarter/top-half Dud rules using the original per-game and totals ranks. Report signal counts, transition matrix, unique player counts, outcome coverage, mean/median next-season value and matched-cohort per-game percentile change, and top-156 hit rate with denominators. A Sleeper breakout is a matched player's gain of at least 0.10 percentile points; a Dud decline is a loss of at least 0.10 points. Report event precision and recall as diagnostics, not candidate-selection criteria. Missing future rows are reported as exits and excluded from percentile-change/event precision calculations.

Define Streaky as a seasonal proxy: next-season minus source-season neutral per-game composite, plus its absolute value, both seasons scored using their own 20-game reference populations. MPG quartile cut points use the full source-eligible MPG distribution (linear type-7 quantiles); tied values remain in the lower quartile at a shared cut. Report matched-player counts, retention, signed/absolute changes, and future exclusions for each group. This proxy does not measure game-to-game streakiness.

## Integrity, reproduction, and limits

The evaluator writes a Markdown report and JSON record with exact command, runtime, protocol hash, input CSV hashes, evaluator/runner/scoring-code hashes, per-transition eligibility and outcomes, all candidate scores, and chronological model records. Results remain retrospective because the seasons have been examined; defer any production decision until a prospective 2025–26 → 2026–27 result is available.

Run from the repository root with `node --import tsx app/core/scripts/run-minutes-experiment.ts`. Tests cover source ID alignment, MPG ties, fixed candidate formulas and parent comparisons, tag boundaries and movement, matched cohorts, missing/low-game outcomes, volatility quartiles, and chronological model splits with training-only feature scaling.
