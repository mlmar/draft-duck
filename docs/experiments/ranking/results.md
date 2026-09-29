# Ranking experiment results

## Reproduce

`node --import tsx app/core/scripts/run-ranking-experiment.ts` from the repository root. The [protocol](protocol.md) was frozen before scoring. The [machine-readable record](results.json) contains SHA-256 hashes for the protocol, seven input CSVs, and both evaluator files, plus all candidate rules and full numerical results. No API behavior was changed.

## Data checks and exceptions

- Development: 445 source-eligible players, 569 future participants, 456 future players meeting the 20-game reference rule.
- Holdout: 456 source-eligible players, 582 future participants, 452 future players meeting the 20-game reference rule.
- Per-game, per-36, and totals eligible IDs matched within each source season. Players with no future row received zero value; players with 1–19 games were scored against reference moments. No rows were removed after viewing outcomes.

## Development selection

The frozen primary metric selected **game-70-total-30** at 98.281. This choice was fixed before interpreting the holdout.

## Holdout conclusion

Selected rule: **game-70-total-30**. Holdout primary 74.704; strongest single-view baseline 75.330; difference -0.626. **No blend demonstrated improvement under the frozen rule.** One holdout transition does not establish a validated optimum.

## Individual test records

### 9-CAT · DEVELOPMENT · 23_24-to-24_25 · per-game

- **Hypothesis:** Establish the per-game reference.
- **Evidence and procedure:** Source-season eligible players ranked with the neutral 9-cat profile, availability floor off; candidate weights 1/0/0 (per-game/totals/per-36), minute adjustment off. Input hashes and exact command are in [results.json](results.json).
- **Result:** Primary 91.308; versus per-game +0.000. Discounted value at picks 12/50/156: 34.683 / 69.177 / 91.308.
- **Data exceptions:** 55 source players had no outcome row and received zero value; players with 1–19 games were retained. No candidate-specific exclusions.
- **Conclusion:** Reference baseline; no improvement claim. Eligible for selection by the frozen primary metric.

### 9-CAT · DEVELOPMENT · 23_24-to-24_25 · totals

- **Hypothesis:** This prespecified rule exceeds per-game on discounted value through pick 156.
- **Evidence and procedure:** Source-season eligible players ranked with the neutral 9-cat profile, availability floor off; candidate weights 0/1/0 (per-game/totals/per-36), minute adjustment off. Input hashes and exact command are in [results.json](results.json).
- **Result:** Primary 94.784; versus per-game +3.477. Discounted value at picks 12/50/156: 41.490 / 73.040 / 94.784.
- **Data exceptions:** 55 source players had no outcome row and received zero value; players with 1–19 games were retained. No candidate-specific exclusions.
- **Conclusion:** Measured improvement over per-game on this transition. Eligible for selection by the frozen primary metric.

### 9-CAT · DEVELOPMENT · 23_24-to-24_25 · per-36

- **Hypothesis:** This prespecified rule exceeds per-game on discounted value through pick 156.
- **Evidence and procedure:** Source-season eligible players ranked with the neutral 9-cat profile, availability floor off; candidate weights 0/0/1 (per-game/totals/per-36), minute adjustment off. Input hashes and exact command are in [results.json](results.json).
- **Result:** Primary 69.243; versus per-game -22.065. Discounted value at picks 12/50/156: 29.680 / 52.424 / 69.243.
- **Data exceptions:** 55 source players had no outcome row and received zero value; players with 1–19 games were retained. No candidate-specific exclusions.
- **Conclusion:** No measured improvement over per-game on this transition. Eligible for selection by the frozen primary metric.

### 9-CAT · DEVELOPMENT · 23_24-to-24_25 · game-70-total-30

- **Hypothesis:** This prespecified rule exceeds per-game on discounted value through pick 156.
- **Evidence and procedure:** Source-season eligible players ranked with the neutral 9-cat profile, availability floor off; candidate weights 0.7/0.3/0 (per-game/totals/per-36), minute adjustment off. Input hashes and exact command are in [results.json](results.json).
- **Result:** Primary 98.281; versus per-game +6.974. Discounted value at picks 12/50/156: 42.650 / 76.160 / 98.281.
- **Data exceptions:** 55 source players had no outcome row and received zero value; players with 1–19 games were retained. No candidate-specific exclusions.
- **Conclusion:** Measured improvement over per-game on this transition. Eligible for selection by the frozen primary metric.

### 9-CAT · DEVELOPMENT · 23_24-to-24_25 · game-50-total-50

- **Hypothesis:** This prespecified rule exceeds per-game on discounted value through pick 156.
- **Evidence and procedure:** Source-season eligible players ranked with the neutral 9-cat profile, availability floor off; candidate weights 0.5/0.5/0 (per-game/totals/per-36), minute adjustment off. Input hashes and exact command are in [results.json](results.json).
- **Result:** Primary 97.723; versus per-game +6.416. Discounted value at picks 12/50/156: 42.964 / 76.810 / 97.723.
- **Data exceptions:** 55 source players had no outcome row and received zero value; players with 1–19 games were retained. No candidate-specific exclusions.
- **Conclusion:** Measured improvement over per-game on this transition. Eligible for selection by the frozen primary metric.

### 9-CAT · DEVELOPMENT · 23_24-to-24_25 · game-55-total-35-rate-10

- **Hypothesis:** This prespecified rule exceeds per-game on discounted value through pick 156.
- **Evidence and procedure:** Source-season eligible players ranked with the neutral 9-cat profile, availability floor off; candidate weights 0.55/0.35/0.1 (per-game/totals/per-36), minute adjustment off. Input hashes and exact command are in [results.json](results.json).
- **Result:** Primary 97.907; versus per-game +6.599. Discounted value at picks 12/50/156: 41.590 / 76.051 / 97.907.
- **Data exceptions:** 55 source players had no outcome row and received zero value; players with 1–19 games were retained. No candidate-specific exclusions.
- **Conclusion:** Measured improvement over per-game on this transition. Eligible for selection by the frozen primary metric.

### 9-CAT · DEVELOPMENT · 23_24-to-24_25 · game-55-total-35-rate-10-minutes

- **Hypothesis:** This prespecified rule exceeds per-game on discounted value through pick 156.
- **Evidence and procedure:** Source-season eligible players ranked with the neutral 9-cat profile, availability floor off; candidate weights 0.55/0.35/0.1 (per-game/totals/per-36), minute adjustment on. Input hashes and exact command are in [results.json](results.json).
- **Result:** Primary 97.914; versus per-game +6.606. Discounted value at picks 12/50/156: 41.590 / 76.051 / 97.914.
- **Data exceptions:** 55 source players had no outcome row and received zero value; players with 1–19 games were retained. No candidate-specific exclusions.
- **Conclusion:** Measured improvement over per-game on this transition. Eligible for selection by the frozen primary metric.

### 9-CAT · HOLDOUT · 24_25-to-25_26 · per-game

- **Hypothesis:** Establish the per-game reference.
- **Evidence and procedure:** Source-season eligible players ranked with the neutral 9-cat profile, availability floor off; candidate weights 1/0/0 (per-game/totals/per-36), minute adjustment off. Input hashes and exact command are in [results.json](results.json).
- **Result:** Primary 75.330; versus per-game +0.000. Discounted value at picks 12/50/156: 36.818 / 62.650 / 75.330.
- **Data exceptions:** 47 source players had no outcome row and received zero value; players with 1–19 games were retained. No candidate-specific exclusions.
- **Conclusion:** Reference baseline; no improvement claim. Holdout result; no retuning permitted.

### 9-CAT · HOLDOUT · 24_25-to-25_26 · totals

- **Hypothesis:** This prespecified rule exceeds per-game on discounted value through pick 156.
- **Evidence and procedure:** Source-season eligible players ranked with the neutral 9-cat profile, availability floor off; candidate weights 0/1/0 (per-game/totals/per-36), minute adjustment off. Input hashes and exact command are in [results.json](results.json).
- **Result:** Primary 66.669; versus per-game -8.662. Discounted value at picks 12/50/156: 33.534 / 55.599 / 66.669.
- **Data exceptions:** 47 source players had no outcome row and received zero value; players with 1–19 games were retained. No candidate-specific exclusions.
- **Conclusion:** No measured improvement over per-game on this transition. Holdout result; no retuning permitted.

### 9-CAT · HOLDOUT · 24_25-to-25_26 · per-36

- **Hypothesis:** This prespecified rule exceeds per-game on discounted value through pick 156.
- **Evidence and procedure:** Source-season eligible players ranked with the neutral 9-cat profile, availability floor off; candidate weights 0/0/1 (per-game/totals/per-36), minute adjustment off. Input hashes and exact command are in [results.json](results.json).
- **Result:** Primary 59.454; versus per-game -15.876. Discounted value at picks 12/50/156: 30.757 / 45.149 / 59.454.
- **Data exceptions:** 47 source players had no outcome row and received zero value; players with 1–19 games were retained. No candidate-specific exclusions.
- **Conclusion:** No measured improvement over per-game on this transition. Holdout result; no retuning permitted.

### 9-CAT · HOLDOUT · 24_25-to-25_26 · game-70-total-30

- **Hypothesis:** This prespecified rule exceeds per-game on discounted value through pick 156.
- **Evidence and procedure:** Source-season eligible players ranked with the neutral 9-cat profile, availability floor off; candidate weights 0.7/0.3/0 (per-game/totals/per-36), minute adjustment off. Input hashes and exact command are in [results.json](results.json).
- **Result:** Primary 74.704; versus per-game -0.626. Discounted value at picks 12/50/156: 35.686 / 59.055 / 74.704.
- **Data exceptions:** 47 source players had no outcome row and received zero value; players with 1–19 games were retained. No candidate-specific exclusions.
- **Conclusion:** No measured improvement over per-game on this transition. Holdout result; no retuning permitted.

### 9-CAT · HOLDOUT · 24_25-to-25_26 · game-50-total-50

- **Hypothesis:** This prespecified rule exceeds per-game on discounted value through pick 156.
- **Evidence and procedure:** Source-season eligible players ranked with the neutral 9-cat profile, availability floor off; candidate weights 0.5/0.5/0 (per-game/totals/per-36), minute adjustment off. Input hashes and exact command are in [results.json](results.json).
- **Result:** Primary 71.663; versus per-game -3.667. Discounted value at picks 12/50/156: 35.399 / 58.448 / 71.663.
- **Data exceptions:** 47 source players had no outcome row and received zero value; players with 1–19 games were retained. No candidate-specific exclusions.
- **Conclusion:** No measured improvement over per-game on this transition. Holdout result; no retuning permitted.

### 9-CAT · HOLDOUT · 24_25-to-25_26 · game-55-total-35-rate-10

- **Hypothesis:** This prespecified rule exceeds per-game on discounted value through pick 156.
- **Evidence and procedure:** Source-season eligible players ranked with the neutral 9-cat profile, availability floor off; candidate weights 0.55/0.35/0.1 (per-game/totals/per-36), minute adjustment off. Input hashes and exact command are in [results.json](results.json).
- **Result:** Primary 74.112; versus per-game -1.218. Discounted value at picks 12/50/156: 36.043 / 59.785 / 74.112.
- **Data exceptions:** 47 source players had no outcome row and received zero value; players with 1–19 games were retained. No candidate-specific exclusions.
- **Conclusion:** No measured improvement over per-game on this transition. Holdout result; no retuning permitted.

### 9-CAT · HOLDOUT · 24_25-to-25_26 · game-55-total-35-rate-10-minutes

- **Hypothesis:** This prespecified rule exceeds per-game on discounted value through pick 156.
- **Evidence and procedure:** Source-season eligible players ranked with the neutral 9-cat profile, availability floor off; candidate weights 0.55/0.35/0.1 (per-game/totals/per-36), minute adjustment on. Input hashes and exact command are in [results.json](results.json).
- **Result:** Primary 74.440; versus per-game -0.890. Discounted value at picks 12/50/156: 36.043 / 59.785 / 74.440.
- **Data exceptions:** 47 source players had no outcome row and received zero value; players with 1–19 games were retained. No candidate-specific exclusions.
- **Conclusion:** No measured improvement over per-game on this transition. Holdout result; no retuning permitted.

## Secondary 8-cat test records

Neutral 8-cat uses the same seven fixed rules and changes only the enabled categories. These checks did not affect selection.

### 8-CAT · DEVELOPMENT · 23_24-to-24_25 · per-game

- **Hypothesis:** Establish the per-game reference.
- **Evidence and procedure:** Source-season eligible players ranked with the neutral 8-cat profile, availability floor off; candidate weights 1/0/0 (per-game/totals/per-36), minute adjustment off. Input hashes and exact command are in [results.json](results.json).
- **Result:** Primary 110.993; versus per-game +0.000. Discounted value at picks 12/50/156: 41.223 / 84.338 / 110.993.
- **Data exceptions:** 55 source players had no outcome row and received zero value; players with 1–19 games were retained. No candidate-specific exclusions.
- **Conclusion:** Reference baseline; no improvement claim. Secondary sensitivity only; excluded from selection.

### 8-CAT · DEVELOPMENT · 23_24-to-24_25 · totals

- **Hypothesis:** This prespecified rule exceeds per-game on discounted value through pick 156.
- **Evidence and procedure:** Source-season eligible players ranked with the neutral 8-cat profile, availability floor off; candidate weights 0/1/0 (per-game/totals/per-36), minute adjustment off. Input hashes and exact command are in [results.json](results.json).
- **Result:** Primary 114.896; versus per-game +3.904. Discounted value at picks 12/50/156: 51.106 / 91.098 / 114.896.
- **Data exceptions:** 55 source players had no outcome row and received zero value; players with 1–19 games were retained. No candidate-specific exclusions.
- **Conclusion:** Measured improvement over per-game on this transition. Secondary sensitivity only; excluded from selection.

### 8-CAT · DEVELOPMENT · 23_24-to-24_25 · per-36

- **Hypothesis:** This prespecified rule exceeds per-game on discounted value through pick 156.
- **Evidence and procedure:** Source-season eligible players ranked with the neutral 8-cat profile, availability floor off; candidate weights 0/0/1 (per-game/totals/per-36), minute adjustment off. Input hashes and exact command are in [results.json](results.json).
- **Result:** Primary 86.958; versus per-game -24.035. Discounted value at picks 12/50/156: 38.373 / 69.888 / 86.958.
- **Data exceptions:** 55 source players had no outcome row and received zero value; players with 1–19 games were retained. No candidate-specific exclusions.
- **Conclusion:** No measured improvement over per-game on this transition. Secondary sensitivity only; excluded from selection.

### 8-CAT · DEVELOPMENT · 23_24-to-24_25 · game-70-total-30

- **Hypothesis:** This prespecified rule exceeds per-game on discounted value through pick 156.
- **Evidence and procedure:** Source-season eligible players ranked with the neutral 8-cat profile, availability floor off; candidate weights 0.7/0.3/0 (per-game/totals/per-36), minute adjustment off. Input hashes and exact command are in [results.json](results.json).
- **Result:** Primary 118.743; versus per-game +7.750. Discounted value at picks 12/50/156: 50.729 / 91.837 / 118.743.
- **Data exceptions:** 55 source players had no outcome row and received zero value; players with 1–19 games were retained. No candidate-specific exclusions.
- **Conclusion:** Measured improvement over per-game on this transition. Secondary sensitivity only; excluded from selection.

### 8-CAT · DEVELOPMENT · 23_24-to-24_25 · game-50-total-50

- **Hypothesis:** This prespecified rule exceeds per-game on discounted value through pick 156.
- **Evidence and procedure:** Source-season eligible players ranked with the neutral 8-cat profile, availability floor off; candidate weights 0.5/0.5/0 (per-game/totals/per-36), minute adjustment off. Input hashes and exact command are in [results.json](results.json).
- **Result:** Primary 118.039; versus per-game +7.046. Discounted value at picks 12/50/156: 50.887 / 92.824 / 118.039.
- **Data exceptions:** 55 source players had no outcome row and received zero value; players with 1–19 games were retained. No candidate-specific exclusions.
- **Conclusion:** Measured improvement over per-game on this transition. Secondary sensitivity only; excluded from selection.

### 8-CAT · DEVELOPMENT · 23_24-to-24_25 · game-55-total-35-rate-10

- **Hypothesis:** This prespecified rule exceeds per-game on discounted value through pick 156.
- **Evidence and procedure:** Source-season eligible players ranked with the neutral 8-cat profile, availability floor off; candidate weights 0.55/0.35/0.1 (per-game/totals/per-36), minute adjustment off. Input hashes and exact command are in [results.json](results.json).
- **Result:** Primary 119.083; versus per-game +8.091. Discounted value at picks 12/50/156: 50.127 / 92.325 / 119.083.
- **Data exceptions:** 55 source players had no outcome row and received zero value; players with 1–19 games were retained. No candidate-specific exclusions.
- **Conclusion:** Measured improvement over per-game on this transition. Secondary sensitivity only; excluded from selection.

### 8-CAT · DEVELOPMENT · 23_24-to-24_25 · game-55-total-35-rate-10-minutes

- **Hypothesis:** This prespecified rule exceeds per-game on discounted value through pick 156.
- **Evidence and procedure:** Source-season eligible players ranked with the neutral 8-cat profile, availability floor off; candidate weights 0.55/0.35/0.1 (per-game/totals/per-36), minute adjustment on. Input hashes and exact command are in [results.json](results.json).
- **Result:** Primary 119.089; versus per-game +8.096. Discounted value at picks 12/50/156: 50.127 / 92.325 / 119.089.
- **Data exceptions:** 55 source players had no outcome row and received zero value; players with 1–19 games were retained. No candidate-specific exclusions.
- **Conclusion:** Measured improvement over per-game on this transition. Secondary sensitivity only; excluded from selection.

### 8-CAT · HOLDOUT · 24_25-to-25_26 · per-game

- **Hypothesis:** Establish the per-game reference.
- **Evidence and procedure:** Source-season eligible players ranked with the neutral 8-cat profile, availability floor off; candidate weights 1/0/0 (per-game/totals/per-36), minute adjustment off. Input hashes and exact command are in [results.json](results.json).
- **Result:** Primary 95.933; versus per-game +0.000. Discounted value at picks 12/50/156: 47.220 / 74.393 / 95.933.
- **Data exceptions:** 47 source players had no outcome row and received zero value; players with 1–19 games were retained. No candidate-specific exclusions.
- **Conclusion:** Reference baseline; no improvement claim. Secondary sensitivity only; excluded from selection.

### 8-CAT · HOLDOUT · 24_25-to-25_26 · totals

- **Hypothesis:** This prespecified rule exceeds per-game on discounted value through pick 156.
- **Evidence and procedure:** Source-season eligible players ranked with the neutral 8-cat profile, availability floor off; candidate weights 0/1/0 (per-game/totals/per-36), minute adjustment off. Input hashes and exact command are in [results.json](results.json).
- **Result:** Primary 86.474; versus per-game -9.459. Discounted value at picks 12/50/156: 39.534 / 67.794 / 86.474.
- **Data exceptions:** 47 source players had no outcome row and received zero value; players with 1–19 games were retained. No candidate-specific exclusions.
- **Conclusion:** No measured improvement over per-game on this transition. Secondary sensitivity only; excluded from selection.

### 8-CAT · HOLDOUT · 24_25-to-25_26 · per-36

- **Hypothesis:** This prespecified rule exceeds per-game on discounted value through pick 156.
- **Evidence and procedure:** Source-season eligible players ranked with the neutral 8-cat profile, availability floor off; candidate weights 0/0/1 (per-game/totals/per-36), minute adjustment off. Input hashes and exact command are in [results.json](results.json).
- **Result:** Primary 77.507; versus per-game -18.426. Discounted value at picks 12/50/156: 39.385 / 62.221 / 77.507.
- **Data exceptions:** 47 source players had no outcome row and received zero value; players with 1–19 games were retained. No candidate-specific exclusions.
- **Conclusion:** No measured improvement over per-game on this transition. Secondary sensitivity only; excluded from selection.

### 8-CAT · HOLDOUT · 24_25-to-25_26 · game-70-total-30

- **Hypothesis:** This prespecified rule exceeds per-game on discounted value through pick 156.
- **Evidence and procedure:** Source-season eligible players ranked with the neutral 8-cat profile, availability floor off; candidate weights 0.7/0.3/0 (per-game/totals/per-36), minute adjustment off. Input hashes and exact command are in [results.json](results.json).
- **Result:** Primary 96.136; versus per-game +0.203. Discounted value at picks 12/50/156: 46.679 / 75.288 / 96.136.
- **Data exceptions:** 47 source players had no outcome row and received zero value; players with 1–19 games were retained. No candidate-specific exclusions.
- **Conclusion:** Measured improvement over per-game on this transition. Secondary sensitivity only; excluded from selection.

### 8-CAT · HOLDOUT · 24_25-to-25_26 · game-50-total-50

- **Hypothesis:** This prespecified rule exceeds per-game on discounted value through pick 156.
- **Evidence and procedure:** Source-season eligible players ranked with the neutral 8-cat profile, availability floor off; candidate weights 0.5/0.5/0 (per-game/totals/per-36), minute adjustment off. Input hashes and exact command are in [results.json](results.json).
- **Result:** Primary 92.912; versus per-game -3.021. Discounted value at picks 12/50/156: 45.926 / 72.057 / 92.912.
- **Data exceptions:** 47 source players had no outcome row and received zero value; players with 1–19 games were retained. No candidate-specific exclusions.
- **Conclusion:** No measured improvement over per-game on this transition. Secondary sensitivity only; excluded from selection.

### 8-CAT · HOLDOUT · 24_25-to-25_26 · game-55-total-35-rate-10

- **Hypothesis:** This prespecified rule exceeds per-game on discounted value through pick 156.
- **Evidence and procedure:** Source-season eligible players ranked with the neutral 8-cat profile, availability floor off; candidate weights 0.55/0.35/0.1 (per-game/totals/per-36), minute adjustment off. Input hashes and exact command are in [results.json](results.json).
- **Result:** Primary 94.906; versus per-game -1.027. Discounted value at picks 12/50/156: 46.522 / 74.363 / 94.906.
- **Data exceptions:** 47 source players had no outcome row and received zero value; players with 1–19 games were retained. No candidate-specific exclusions.
- **Conclusion:** No measured improvement over per-game on this transition. Secondary sensitivity only; excluded from selection.

### 8-CAT · HOLDOUT · 24_25-to-25_26 · game-55-total-35-rate-10-minutes

- **Hypothesis:** This prespecified rule exceeds per-game on discounted value through pick 156.
- **Evidence and procedure:** Source-season eligible players ranked with the neutral 8-cat profile, availability floor off; candidate weights 0.55/0.35/0.1 (per-game/totals/per-36), minute adjustment on. Input hashes and exact command are in [results.json](results.json).
- **Result:** Primary 94.905; versus per-game -1.028. Discounted value at picks 12/50/156: 46.522 / 74.363 / 94.905.
- **Data exceptions:** 47 source players had no outcome row and received zero value; players with 1–19 games were retained. No candidate-specific exclusions.
- **Conclusion:** No measured improvement over per-game on this transition. Secondary sensitivity only; excluded from selection.

Advanced-stat files were not used as predictors. Player-level diagnosis and any new hypotheses are labelled exploratory in the separate [diagnostics](exploratory-diagnostics.md).

## Limits and next experiment

Two consecutive transitions share a season and do not provide enough independent evidence for a stable optimum. Acquire more prior seasons, repeat chronological holdouts, and create a new frozen protocol before fitting extra weights or using advanced stats.
