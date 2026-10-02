# Minutes experiment results

Reproduce with `node --import tsx app/core/scripts/run-minutes-experiment.ts` from the repository root. The [frozen protocol](protocol.md) was hashed before scoring. The [machine record](results.json) includes input and code hashes, candidate rules, cohort counts, and all per-transition results.

## Interpretation limits

All available transitions were examined by earlier ranking work, so these are retrospective replications, not untouched holdouts. Results describe predictive associations and ranking performance; they do not establish that minutes cause future production. The Streaky result is season-to-season composite volatility, not game-to-game streakiness.

## Summary of findings

Source MPG has a strong raw association with next-season per-game composite (Spearman 0.654 to 0.789). Total source MP has a moderate association with next-season season value (Spearman 0.439 to 0.554).
After controlling for source composite, games, and age, adding MPG has effectively zero mean MAE change for next-season per-game composite and lowers MAE in 1/3 chronological tests. For season value, the mean MAE improvement is 0.010 and it lowers MAE in 2/3 tests. MPG does not improve volatility MAE consistently (1/3 tests improved).
Neither direct MPG blend meets the fixed ranking criterion. The minutes-adjusted per-36 blend does (4/4 transitions), with a mean primary-score gain of 0.086 over its parent; three of the four gains are below 0.01.
The MP-adjusted Sleeper signal has 0 to 3 tags per season, versus 11 to 14 original Sleeper tags. Its tiny cohorts limit precision and recall estimates.

## Ranking results

| Transition | Candidate | Primary | vs parent | Top-156 hits | Missing outcomes |
| --- | --- | ---: | ---: | ---: | ---: |
| 21_22-to-22_23 | per-game | 92.152 | — | 116 | 61 |
| 21_22-to-22_23 | totals | 83.753 | — | 110 | 61 |
| 21_22-to-22_23 | per-36 | 69.286 | — | 91 | 61 |
| 21_22-to-22_23 | game-70-total-30 | 90.194 | — | 114 | 61 |
| 21_22-to-22_23 | game-55-total-35-rate-10 | 90.178 | — | 116 | 61 |
| 21_22-to-22_23 | mp-added-per-game-10 | 89.560 | -2.592 | 116 | 61 |
| 21_22-to-22_23 | mp-added-blend-10 | 89.138 | -1.039 | 115 | 61 |
| 21_22-to-22_23 | game-55-total-35-rate-10-minutes | 90.185 | +0.007 | 116 | 61 |
| 22_23-to-23_24 | per-game | 103.348 | — | 122 | 45 |
| 22_23-to-23_24 | totals | 96.761 | — | 117 | 45 |
| 22_23-to-23_24 | per-36 | 86.268 | — | 100 | 45 |
| 22_23-to-23_24 | game-70-total-30 | 101.782 | — | 122 | 45 |
| 22_23-to-23_24 | game-55-total-35-rate-10 | 102.057 | — | 122 | 45 |
| 22_23-to-23_24 | mp-added-per-game-10 | 102.642 | -0.707 | 122 | 45 |
| 22_23-to-23_24 | mp-added-blend-10 | 102.384 | +0.327 | 123 | 45 |
| 22_23-to-23_24 | game-55-total-35-rate-10-minutes | 102.057 | +0.001 | 122 | 45 |
| 23_24-to-24_25 | per-game | 91.308 | — | 125 | 55 |
| 23_24-to-24_25 | totals | 94.784 | — | 123 | 55 |
| 23_24-to-24_25 | per-36 | 69.243 | — | 99 | 55 |
| 23_24-to-24_25 | game-70-total-30 | 98.281 | — | 125 | 55 |
| 23_24-to-24_25 | game-55-total-35-rate-10 | 97.907 | — | 124 | 55 |
| 23_24-to-24_25 | mp-added-per-game-10 | 90.842 | -0.466 | 126 | 55 |
| 23_24-to-24_25 | mp-added-blend-10 | 92.776 | -5.131 | 125 | 55 |
| 23_24-to-24_25 | game-55-total-35-rate-10-minutes | 97.914 | +0.007 | 124 | 55 |
| 24_25-to-25_26 | per-game | 75.330 | — | 113 | 47 |
| 24_25-to-25_26 | totals | 66.669 | — | 104 | 47 |
| 24_25-to-25_26 | per-36 | 59.454 | — | 92 | 47 |
| 24_25-to-25_26 | game-70-total-30 | 74.704 | — | 113 | 47 |
| 24_25-to-25_26 | game-55-total-35-rate-10 | 74.112 | — | 111 | 47 |
| 24_25-to-25_26 | mp-added-per-game-10 | 73.878 | -1.452 | 112 | 47 |
| 24_25-to-25_26 | mp-added-blend-10 | 74.618 | +0.505 | 113 | 47 |
| 24_25-to-25_26 | game-55-total-35-rate-10-minutes | 74.440 | +0.328 | 112 | 47 |

## Prespecified ranking decisions

| Candidate | Parent | Positive transitions | Mean difference | Retrospectively promising |
| --- | --- | ---: | ---: | --- |
| mp-added-per-game-10 | per-game | 0/4 | -1.304 | No |
| mp-added-blend-10 | game-55-total-35-rate-10 | 2/4 | -1.335 | No |
| game-55-total-35-rate-10-minutes | game-55-total-35-rate-10 | 4/4 | 0.086 | Yes |

## 8-cat sensitivity

The 8-cat sensitivity removes turnovers from the neutral category profile and applies the same candidate rules. It does not affect the prespecified 9-cat decision.

| Transition | Candidate | Discounted value | Top-156 hits |
| --- | --- | ---: | ---: |
| 21_22-to-22_23 | per-game | 109.363 | 119 |
| 21_22-to-22_23 | totals | 101.384 | 115 |
| 21_22-to-22_23 | per-36 | 89.219 | 95 |
| 21_22-to-22_23 | game-70-total-30 | 109.681 | 119 |
| 21_22-to-22_23 | game-55-total-35-rate-10 | 109.258 | 119 |
| 21_22-to-22_23 | mp-added-per-game-10 | 105.427 | 119 |
| 21_22-to-22_23 | mp-added-blend-10 | 106.773 | 119 |
| 21_22-to-22_23 | game-55-total-35-rate-10-minutes | 109.260 | 119 |
| 22_23-to-23_24 | per-game | 124.764 | 123 |
| 22_23-to-23_24 | totals | 119.258 | 119 |
| 22_23-to-23_24 | per-36 | 107.563 | 98 |
| 22_23-to-23_24 | game-70-total-30 | 124.195 | 123 |
| 22_23-to-23_24 | game-55-total-35-rate-10 | 123.324 | 122 |
| 22_23-to-23_24 | mp-added-per-game-10 | 123.067 | 122 |
| 22_23-to-23_24 | mp-added-blend-10 | 125.139 | 123 |
| 22_23-to-23_24 | game-55-total-35-rate-10-minutes | 123.323 | 122 |
| 23_24-to-24_25 | per-game | 110.993 | 125 |
| 23_24-to-24_25 | totals | 114.896 | 122 |
| 23_24-to-24_25 | per-36 | 86.958 | 97 |
| 23_24-to-24_25 | game-70-total-30 | 118.743 | 124 |
| 23_24-to-24_25 | game-55-total-35-rate-10 | 119.083 | 125 |
| 23_24-to-24_25 | mp-added-per-game-10 | 112.677 | 125 |
| 23_24-to-24_25 | mp-added-blend-10 | 113.804 | 125 |
| 23_24-to-24_25 | game-55-total-35-rate-10-minutes | 119.089 | 125 |
| 24_25-to-25_26 | per-game | 95.933 | 119 |
| 24_25-to-25_26 | totals | 86.474 | 110 |
| 24_25-to-25_26 | per-36 | 77.507 | 93 |
| 24_25-to-25_26 | game-70-total-30 | 96.136 | 119 |
| 24_25-to-25_26 | game-55-total-35-rate-10 | 94.906 | 116 |
| 24_25-to-25_26 | mp-added-per-game-10 | 95.850 | 118 |
| 24_25-to-25_26 | mp-added-blend-10 | 95.583 | 118 |
| 24_25-to-25_26 | game-55-total-35-rate-10-minutes | 94.905 | 116 |

## MP prediction

| Target | Test transition | Train transitions | N | Baseline MAE | MP MAE | Baseline RMSE | MP RMSE | Baseline R² | MP R² |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| futurePerGameComposite | 22_23-to-23_24 | 21_22-to-22_23 | 357 | 1.712 | 1.712 | 2.150 | 2.149 | 0.758 | 0.758 |
| futureSeasonValue | 22_23-to-23_24 | 21_22-to-22_23 | 436 | 1.403 | 1.388 | 1.755 | 1.738 | 0.627 | 0.634 |
| futureVolatility | 22_23-to-23_24 | 21_22-to-22_23 | 357 | 1.106 | 1.102 | 1.368 | 1.368 | -0.030 | -0.032 |
| futurePerGameComposite | 23_24-to-24_25 | 21_22-to-22_23, 22_23-to-23_24 | 357 | 1.599 | 1.602 | 2.047 | 2.046 | 0.767 | 0.767 |
| futureSeasonValue | 23_24-to-24_25 | 21_22-to-22_23, 22_23-to-23_24 | 445 | 1.403 | 1.404 | 1.770 | 1.772 | 0.569 | 0.568 |
| futureVolatility | 23_24-to-24_25 | 21_22-to-22_23, 22_23-to-23_24 | 357 | 1.067 | 1.069 | 1.344 | 1.354 | 0.013 | -0.002 |
| futurePerGameComposite | 24_25-to-25_26 | 21_22-to-22_23, 22_23-to-23_24, 23_24-to-24_25 | 358 | 2.000 | 1.998 | 2.533 | 2.526 | 0.631 | 0.633 |
| futureSeasonValue | 24_25-to-25_26 | 21_22-to-22_23, 22_23-to-23_24, 23_24-to-24_25 | 456 | 1.545 | 1.530 | 1.946 | 1.929 | 0.440 | 0.450 |
| futureVolatility | 24_25-to-25_26 | 21_22-to-22_23, 22_23-to-23_24, 23_24-to-24_25 | 358 | 1.292 | 1.298 | 1.695 | 1.695 | -0.060 | -0.060 |

Standardized model coefficients (input features are standardized from training rows; intercept remains in target units) are included in `results.json`.

### MP rank correlations

| Transition | Future per-game N | MPG vs future per-game | Total MP vs season value | MPG vs volatility |
| --- | ---: | ---: | ---: | ---: |
| 21_22-to-22_23 | 354 | 0.714 | 0.455 | -0.063 |
| 22_23-to-23_24 | 357 | 0.771 | 0.539 | 0.047 |
| 23_24-to-24_25 | 357 | 0.789 | 0.554 | 0.063 |
| 24_25-to-25_26 | 358 | 0.654 | 0.439 | -0.095 |

## Sleeper/Dud signal

| Transition | Signal version | Group | N | Outcomes | Top-156 rate | Mean next-season value | Mean percentile change |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| 21_22-to-22_23 | Original | sleeper | 12 | 9 | 0.000 | -1.321 | 0.116 |
| 21_22-to-22_23 | Original | untagged | 425 | 367 | 0.325 | 0.165 | -0.003 |
| 21_22-to-22_23 | Original | dud | 6 | 6 | 0.167 | -0.617 | -0.003 |
| 21_22-to-22_23 | MP-adjusted | sleeper | 3 | 3 | 0.000 | -0.848 | 0.049 |
| 21_22-to-22_23 | MP-adjusted | untagged | 435 | 374 | 0.320 | 0.142 | 0.000 |
| 21_22-to-22_23 | MP-adjusted | dud | 5 | 5 | 0.000 | -1.113 | -0.036 |
| 21_22-to-22_23 | Original events | Sleeper breakout | 9 tagged / 91 events | 6 matches | precision 0.667 | recall 0.066 |
| 21_22-to-22_23 | Original events | Dud decline | 6 tagged / 89 events | 1 matches | precision 0.167 | recall 0.011 |
| 21_22-to-22_23 | MP-adjusted events | Sleeper breakout | 3 tagged / 91 events | 2 matches | precision 0.667 | recall 0.022 |
| 21_22-to-22_23 | MP-adjusted events | Dud decline | 5 tagged / 89 events | 1 matches | precision 0.200 | recall 0.011 |
| 22_23-to-23_24 | Original | sleeper | 11 | 7 | 0.000 | -1.444 | 0.075 |
| 22_23-to-23_24 | Original | untagged | 417 | 376 | 0.343 | 0.109 | -0.003 |
| 22_23-to-23_24 | Original | dud | 8 | 8 | 0.500 | -0.115 | 0.081 |
| 22_23-to-23_24 | MP-adjusted | sleeper | 0 | 0 | n/a | n/a | n/a |
| 22_23-to-23_24 | MP-adjusted | untagged | 430 | 385 | 0.335 | 0.078 | -0.001 |
| 22_23-to-23_24 | MP-adjusted | dud | 6 | 6 | 0.500 | -0.046 | 0.086 |
| 22_23-to-23_24 | Original events | Sleeper breakout | 6 tagged / 85 events | 3 matches | precision 0.500 | recall 0.035 |
| 22_23-to-23_24 | Original events | Dud decline | 8 tagged / 81 events | 0 matches | precision 0.000 | recall 0.000 |
| 22_23-to-23_24 | MP-adjusted events | Sleeper breakout | 0 tagged / 85 events | 0 matches | precision n/a | recall 0.000 |
| 22_23-to-23_24 | MP-adjusted events | Dud decline | 6 tagged / 81 events | 0 matches | precision 0.000 | recall 0.000 |
| 23_24-to-24_25 | Original | sleeper | 13 | 12 | 0.000 | -2.125 | 0.017 |
| 23_24-to-24_25 | Original | untagged | 426 | 372 | 0.343 | 0.164 | -0.000 |
| 23_24-to-24_25 | Original | dud | 6 | 6 | 0.333 | -0.240 | -0.011 |
| 23_24-to-24_25 | MP-adjusted | sleeper | 1 | 1 | 0.000 | -2.243 | -0.194 |
| 23_24-to-24_25 | MP-adjusted | untagged | 440 | 385 | 0.332 | 0.088 | -0.000 |
| 23_24-to-24_25 | MP-adjusted | dud | 4 | 4 | 0.500 | 0.601 | 0.117 |
| 23_24-to-24_25 | Original events | Sleeper breakout | 11 tagged / 85 events | 2 matches | precision 0.182 | recall 0.024 |
| 23_24-to-24_25 | Original events | Dud decline | 5 tagged / 82 events | 2 matches | precision 0.400 | recall 0.024 |
| 23_24-to-24_25 | MP-adjusted events | Sleeper breakout | 1 tagged / 85 events | 0 matches | precision 0.000 | recall 0.000 |
| 23_24-to-24_25 | MP-adjusted events | Dud decline | 3 tagged / 82 events | 0 matches | precision 0.000 | recall 0.000 |
| 24_25-to-25_26 | Original | sleeper | 14 | 12 | 0.214 | -1.012 | 0.189 |
| 24_25-to-25_26 | Original | untagged | 438 | 393 | 0.315 | -0.277 | -0.005 |
| 24_25-to-25_26 | Original | dud | 4 | 4 | 0.250 | -1.420 | -0.105 |
| 24_25-to-25_26 | MP-adjusted | sleeper | 0 | 0 | n/a | n/a | n/a |
| 24_25-to-25_26 | MP-adjusted | untagged | 453 | 406 | 0.311 | -0.299 | 0.001 |
| 24_25-to-25_26 | MP-adjusted | dud | 3 | 3 | 0.333 | -1.751 | -0.165 |
| 24_25-to-25_26 | Original events | Sleeper breakout | 11 tagged / 96 events | 6 matches | precision 0.545 | recall 0.063 |
| 24_25-to-25_26 | Original events | Dud decline | 4 tagged / 103 events | 2 matches | precision 0.500 | recall 0.019 |
| 24_25-to-25_26 | MP-adjusted events | Sleeper breakout | 0 tagged / 96 events | 0 matches | precision n/a | recall 0.000 |
| 24_25-to-25_26 | MP-adjusted events | Dud decline | 3 tagged / 103 events | 2 matches | precision 0.667 | recall 0.019 |

Tag groups are small; every rate is shown with its denominator. `Outcomes` counts tagged players with a future row. Event metrics use the matched ≥20-game cohort and fixed ±0.10 percentile thresholds.

## Seasonal volatility proxy

| Transition | MPG group | Matched N | MPG range | Mean signed change | Mean absolute change | Median absolute change |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| 21_22-to-22_23 | q1 | 62 | 3.000–15.700 | 1.146 | 1.849 | 1.375 |
| 21_22-to-22_23 | q2 | 86 | 15.800–22.000 | -0.307 | 1.949 | 1.821 |
| 21_22-to-22_23 | q3 | 98 | 22.100–29.000 | -1.051 | 1.811 | 1.283 |
| 21_22-to-22_23 | q4 | 108 | 29.100–37.900 | -0.350 | 1.712 | 1.266 |
| 21_22-to-22_23 | Matched / excluded | 354 / 89 | source eligible 443 | cuts 15.750, 22.000, 29.050 |  |  |
| 22_23-to-23_24 | q1 | 65 | 5.300–14.700 | 0.746 | 1.517 | 1.213 |
| 22_23-to-23_24 | q2 | 83 | 14.800–21.200 | -0.036 | 1.750 | 1.401 |
| 22_23-to-23_24 | q3 | 102 | 21.500–29.600 | -0.555 | 1.850 | 1.542 |
| 22_23-to-23_24 | q4 | 107 | 29.800–37.400 | -0.069 | 1.630 | 1.355 |
| 22_23-to-23_24 | Matched / excluded | 357 / 79 | source eligible 436 | cuts 14.775, 21.350, 29.650 |  |  |
| 23_24-to-24_25 | q1 | 64 | 2.500–13.900 | 0.668 | 1.488 | 1.134 |
| 23_24-to-24_25 | q2 | 85 | 14.000–21.100 | 0.351 | 1.668 | 1.336 |
| 23_24-to-24_25 | q3 | 101 | 21.200–29.100 | -0.396 | 1.829 | 1.634 |
| 23_24-to-24_25 | q4 | 107 | 29.200–37.800 | -0.461 | 1.796 | 1.462 |
| 23_24-to-24_25 | Matched / excluded | 357 / 88 | source eligible 445 | cuts 13.900, 21.100, 29.100 |  |  |
| 24_25-to-25_26 | q1 | 70 | 5.200–14.700 | 1.867 | 2.463 | 1.982 |
| 24_25-to-25_26 | q2 | 87 | 14.800–21.500 | 0.224 | 2.078 | 1.670 |
| 24_25-to-25_26 | q3 | 98 | 21.600–28.600 | -0.512 | 1.982 | 1.819 |
| 24_25-to-25_26 | q4 | 103 | 28.800–37.700 | -0.614 | 2.020 | 1.853 |
| 24_25-to-25_26 | Matched / excluded | 358 / 98 | source eligible 456 | cuts 14.775, 21.500, 28.600 |  |  |

The machine record also reports per-game matched-cohort counts and percentile-change event totals. Volatility groups use source-season MPG cut points; tied values remain together.

## Data and reproduction

The evaluator fails before reporting if source-view player IDs mismatch or the frozen protocol is unavailable. The original production ranker is not modified by this experiment.
