# Historical ranking replication results

## Procedure and decision

Run `node --import tsx app/core/scripts/run-ranking-extension.ts` from the repository root. The [frozen extension protocol](2026-09-29-extension-protocol.md) and [machine record](2026-09-29-extension-results.json) contain the procedure, source and code hashes, exact rules, and numerical results. The original [development and holdout results](results.md) remain unchanged.

The prespecified check compares the previously selected 70% per-game / 30% totals rule with the strongest single-view baseline on each new 9-cat transition. Both transitions must pass for historical replication support.

- 21_22-to-22_23: 70/30 90.194; strongest single view 92.152; difference -1.958; fail.
- 22_23-to-23_24: 70/30 101.782; strongest single view 103.348; difference -1.566; fail.

**Conclusion:** The fixed rule does not meet the prespecified historical replication criterion. These earlier seasons are retrospective checks, and the previous holdout failure still applies. No validated optimum or production change follows from this result.

## Input checks

Eligible player IDs match across the three source views in both seasons. The supplied advanced files are present and nonempty; they were not used in scoring. Future players with 1–19 games remain in outcomes; missing players receive zero. The exact input hashes are in the machine record.

## Individual test records

### 9-cat population · 21_22-to-22_23

443 eligible source players; 539 future participants; 436 future reference players; replacement composite 0.696.

### 9-cat · 21_22-to-22_23 · per-game

- **Hypothesis:** Establish the per-game reference.
- **Procedure and evidence:** Neutral 9-cat, source minimum 20 games, availability floor off. Weights 1/0/0 (per-game/totals/per-36); minute adjustment off. Hashes and top-12 player IDs are in the [machine record](2026-09-29-extension-results.json).
- **Result:** Discounted top-156 value 92.152; versus reference baseline +0.000. Picks 12/50/156: 37.159 / 73.971 / 92.152.
- **Exceptions:** 61 source players have no future row and receive zero; 1–19-game future players remain scored. No candidate-specific exclusions.
- **Conclusion:** Reference value established. Context only; cannot select a new rule.

### 9-cat · 21_22-to-22_23 · totals

- **Hypothesis:** This fixed candidate exceeds the per-game reference on the primary metric.
- **Procedure and evidence:** Neutral 9-cat, source minimum 20 games, availability floor off. Weights 0/1/0 (per-game/totals/per-36); minute adjustment off. Hashes and top-12 player IDs are in the [machine record](2026-09-29-extension-results.json).
- **Result:** Discounted top-156 value 83.753; versus per-game -8.399. Picks 12/50/156: 35.726 / 66.339 / 83.753.
- **Exceptions:** 61 source players have no future row and receive zero; 1–19-game future players remain scored. No candidate-specific exclusions.
- **Conclusion:** No improvement over per-game on this transition. Context only; cannot select a new rule.

### 9-cat · 21_22-to-22_23 · per-36

- **Hypothesis:** This fixed candidate exceeds the per-game reference on the primary metric.
- **Procedure and evidence:** Neutral 9-cat, source minimum 20 games, availability floor off. Weights 0/0/1 (per-game/totals/per-36); minute adjustment off. Hashes and top-12 player IDs are in the [machine record](2026-09-29-extension-results.json).
- **Result:** Discounted top-156 value 69.286; versus per-game -22.866. Picks 12/50/156: 30.341 / 55.567 / 69.286.
- **Exceptions:** 61 source players have no future row and receive zero; 1–19-game future players remain scored. No candidate-specific exclusions.
- **Conclusion:** No improvement over per-game on this transition. Context only; cannot select a new rule.

### 9-cat · 21_22-to-22_23 · game-70-total-30

- **Hypothesis:** This fixed candidate exceeds the per-game reference on the primary metric.
- **Procedure and evidence:** Neutral 9-cat, source minimum 20 games, availability floor off. Weights 0.7/0.3/0 (per-game/totals/per-36); minute adjustment off. Hashes and top-12 player IDs are in the [machine record](2026-09-29-extension-results.json).
- **Result:** Discounted top-156 value 90.194; versus per-game -1.958. Picks 12/50/156: 36.865 / 71.810 / 90.194.
- **Exceptions:** 61 source players have no future row and receive zero; 1–19-game future players remain scored. No candidate-specific exclusions.
- **Conclusion:** No improvement over per-game on this transition. Also compared with the strongest single-view baseline in the decision above.

### 9-cat · 21_22-to-22_23 · game-50-total-50

- **Hypothesis:** This fixed candidate exceeds the per-game reference on the primary metric.
- **Procedure and evidence:** Neutral 9-cat, source minimum 20 games, availability floor off. Weights 0.5/0.5/0 (per-game/totals/per-36); minute adjustment off. Hashes and top-12 player IDs are in the [machine record](2026-09-29-extension-results.json).
- **Result:** Discounted top-156 value 89.999; versus per-game -2.153. Picks 12/50/156: 36.962 / 70.019 / 89.999.
- **Exceptions:** 61 source players have no future row and receive zero; 1–19-game future players remain scored. No candidate-specific exclusions.
- **Conclusion:** No improvement over per-game on this transition. Context only; cannot select a new rule.

### 9-cat · 21_22-to-22_23 · game-55-total-35-rate-10

- **Hypothesis:** This fixed candidate exceeds the per-game reference on the primary metric.
- **Procedure and evidence:** Neutral 9-cat, source minimum 20 games, availability floor off. Weights 0.55/0.35/0.1 (per-game/totals/per-36); minute adjustment off. Hashes and top-12 player IDs are in the [machine record](2026-09-29-extension-results.json).
- **Result:** Discounted top-156 value 90.178; versus per-game -1.974. Picks 12/50/156: 36.884 / 71.586 / 90.178.
- **Exceptions:** 61 source players have no future row and receive zero; 1–19-game future players remain scored. No candidate-specific exclusions.
- **Conclusion:** No improvement over per-game on this transition. Context only; cannot select a new rule.

### 9-cat · 21_22-to-22_23 · game-55-total-35-rate-10-minutes

- **Hypothesis:** This fixed candidate exceeds the per-game reference on the primary metric.
- **Procedure and evidence:** Neutral 9-cat, source minimum 20 games, availability floor off. Weights 0.55/0.35/0.1 (per-game/totals/per-36); minute adjustment on. Hashes and top-12 player IDs are in the [machine record](2026-09-29-extension-results.json).
- **Result:** Discounted top-156 value 90.185; versus per-game -1.967. Picks 12/50/156: 36.884 / 71.586 / 90.185.
- **Exceptions:** 61 source players have no future row and receive zero; 1–19-game future players remain scored. No candidate-specific exclusions.
- **Conclusion:** No improvement over per-game on this transition. Context only; cannot select a new rule.

### 8-cat population · 21_22-to-22_23

443 eligible source players; 539 future participants; 436 future reference players; replacement composite 0.994.

### 8-cat · 21_22-to-22_23 · per-game

- **Hypothesis:** Establish the per-game reference.
- **Procedure and evidence:** Neutral 8-cat, source minimum 20 games, availability floor off. Weights 1/0/0 (per-game/totals/per-36); minute adjustment off. Hashes and top-12 player IDs are in the [machine record](2026-09-29-extension-results.json).
- **Result:** Discounted top-156 value 109.363; versus reference baseline +0.000. Picks 12/50/156: 45.698 / 89.829 / 109.363.
- **Exceptions:** 61 source players have no future row and receive zero; 1–19-game future players remain scored. No candidate-specific exclusions.
- **Conclusion:** Reference value established. Secondary sensitivity; excluded from the decision.

### 8-cat · 21_22-to-22_23 · totals

- **Hypothesis:** This fixed candidate exceeds the per-game reference on the primary metric.
- **Procedure and evidence:** Neutral 8-cat, source minimum 20 games, availability floor off. Weights 0/1/0 (per-game/totals/per-36); minute adjustment off. Hashes and top-12 player IDs are in the [machine record](2026-09-29-extension-results.json).
- **Result:** Discounted top-156 value 101.384; versus per-game -7.979. Picks 12/50/156: 44.879 / 82.342 / 101.384.
- **Exceptions:** 61 source players have no future row and receive zero; 1–19-game future players remain scored. No candidate-specific exclusions.
- **Conclusion:** No improvement over per-game on this transition. Secondary sensitivity; excluded from the decision.

### 8-cat · 21_22-to-22_23 · per-36

- **Hypothesis:** This fixed candidate exceeds the per-game reference on the primary metric.
- **Procedure and evidence:** Neutral 8-cat, source minimum 20 games, availability floor off. Weights 0/0/1 (per-game/totals/per-36); minute adjustment off. Hashes and top-12 player IDs are in the [machine record](2026-09-29-extension-results.json).
- **Result:** Discounted top-156 value 89.219; versus per-game -20.144. Picks 12/50/156: 44.627 / 74.586 / 89.219.
- **Exceptions:** 61 source players have no future row and receive zero; 1–19-game future players remain scored. No candidate-specific exclusions.
- **Conclusion:** No improvement over per-game on this transition. Secondary sensitivity; excluded from the decision.

### 8-cat · 21_22-to-22_23 · game-70-total-30

- **Hypothesis:** This fixed candidate exceeds the per-game reference on the primary metric.
- **Procedure and evidence:** Neutral 8-cat, source minimum 20 games, availability floor off. Weights 0.7/0.3/0 (per-game/totals/per-36); minute adjustment off. Hashes and top-12 player IDs are in the [machine record](2026-09-29-extension-results.json).
- **Result:** Discounted top-156 value 109.681; versus per-game +0.318. Picks 12/50/156: 46.940 / 87.561 / 109.681.
- **Exceptions:** 61 source players have no future row and receive zero; 1–19-game future players remain scored. No candidate-specific exclusions.
- **Conclusion:** Higher than per-game on this transition. Secondary sensitivity; excluded from the decision.

### 8-cat · 21_22-to-22_23 · game-50-total-50

- **Hypothesis:** This fixed candidate exceeds the per-game reference on the primary metric.
- **Procedure and evidence:** Neutral 8-cat, source minimum 20 games, availability floor off. Weights 0.5/0.5/0 (per-game/totals/per-36); minute adjustment off. Hashes and top-12 player IDs are in the [machine record](2026-09-29-extension-results.json).
- **Result:** Discounted top-156 value 108.055; versus per-game -1.308. Picks 12/50/156: 45.576 / 85.202 / 108.055.
- **Exceptions:** 61 source players have no future row and receive zero; 1–19-game future players remain scored. No candidate-specific exclusions.
- **Conclusion:** No improvement over per-game on this transition. Secondary sensitivity; excluded from the decision.

### 8-cat · 21_22-to-22_23 · game-55-total-35-rate-10

- **Hypothesis:** This fixed candidate exceeds the per-game reference on the primary metric.
- **Procedure and evidence:** Neutral 8-cat, source minimum 20 games, availability floor off. Weights 0.55/0.35/0.1 (per-game/totals/per-36); minute adjustment off. Hashes and top-12 player IDs are in the [machine record](2026-09-29-extension-results.json).
- **Result:** Discounted top-156 value 109.258; versus per-game -0.105. Picks 12/50/156: 46.777 / 86.206 / 109.258.
- **Exceptions:** 61 source players have no future row and receive zero; 1–19-game future players remain scored. No candidate-specific exclusions.
- **Conclusion:** No improvement over per-game on this transition. Secondary sensitivity; excluded from the decision.

### 8-cat · 21_22-to-22_23 · game-55-total-35-rate-10-minutes

- **Hypothesis:** This fixed candidate exceeds the per-game reference on the primary metric.
- **Procedure and evidence:** Neutral 8-cat, source minimum 20 games, availability floor off. Weights 0.55/0.35/0.1 (per-game/totals/per-36); minute adjustment on. Hashes and top-12 player IDs are in the [machine record](2026-09-29-extension-results.json).
- **Result:** Discounted top-156 value 109.260; versus per-game -0.102. Picks 12/50/156: 46.777 / 86.206 / 109.260.
- **Exceptions:** 61 source players have no future row and receive zero; 1–19-game future players remain scored. No candidate-specific exclusions.
- **Conclusion:** No improvement over per-game on this transition. Secondary sensitivity; excluded from the decision.

### 9-cat population · 22_23-to-23_24

436 eligible source players; 572 future participants; 445 future reference players; replacement composite 0.982.

### 9-cat · 22_23-to-23_24 · per-game

- **Hypothesis:** Establish the per-game reference.
- **Procedure and evidence:** Neutral 9-cat, source minimum 20 games, availability floor off. Weights 1/0/0 (per-game/totals/per-36); minute adjustment off. Hashes and top-12 player IDs are in the [machine record](2026-09-29-extension-results.json).
- **Result:** Discounted top-156 value 103.348; versus reference baseline +0.000. Picks 12/50/156: 45.967 / 82.773 / 103.348.
- **Exceptions:** 45 source players have no future row and receive zero; 1–19-game future players remain scored. No candidate-specific exclusions.
- **Conclusion:** Reference value established. Context only; cannot select a new rule.

### 9-cat · 22_23-to-23_24 · totals

- **Hypothesis:** This fixed candidate exceeds the per-game reference on the primary metric.
- **Procedure and evidence:** Neutral 9-cat, source minimum 20 games, availability floor off. Weights 0/1/0 (per-game/totals/per-36); minute adjustment off. Hashes and top-12 player IDs are in the [machine record](2026-09-29-extension-results.json).
- **Result:** Discounted top-156 value 96.761; versus per-game -6.588. Picks 12/50/156: 40.828 / 78.732 / 96.761.
- **Exceptions:** 45 source players have no future row and receive zero; 1–19-game future players remain scored. No candidate-specific exclusions.
- **Conclusion:** No improvement over per-game on this transition. Context only; cannot select a new rule.

### 9-cat · 22_23-to-23_24 · per-36

- **Hypothesis:** This fixed candidate exceeds the per-game reference on the primary metric.
- **Procedure and evidence:** Neutral 9-cat, source minimum 20 games, availability floor off. Weights 0/0/1 (per-game/totals/per-36); minute adjustment off. Hashes and top-12 player IDs are in the [machine record](2026-09-29-extension-results.json).
- **Result:** Discounted top-156 value 86.268; versus per-game -17.080. Picks 12/50/156: 45.083 / 72.712 / 86.268.
- **Exceptions:** 45 source players have no future row and receive zero; 1–19-game future players remain scored. No candidate-specific exclusions.
- **Conclusion:** No improvement over per-game on this transition. Context only; cannot select a new rule.

### 9-cat · 22_23-to-23_24 · game-70-total-30

- **Hypothesis:** This fixed candidate exceeds the per-game reference on the primary metric.
- **Procedure and evidence:** Neutral 9-cat, source minimum 20 games, availability floor off. Weights 0.7/0.3/0 (per-game/totals/per-36); minute adjustment off. Hashes and top-12 player IDs are in the [machine record](2026-09-29-extension-results.json).
- **Result:** Discounted top-156 value 101.782; versus per-game -1.566. Picks 12/50/156: 45.384 / 82.254 / 101.782.
- **Exceptions:** 45 source players have no future row and receive zero; 1–19-game future players remain scored. No candidate-specific exclusions.
- **Conclusion:** No improvement over per-game on this transition. Also compared with the strongest single-view baseline in the decision above.

### 9-cat · 22_23-to-23_24 · game-50-total-50

- **Hypothesis:** This fixed candidate exceeds the per-game reference on the primary metric.
- **Procedure and evidence:** Neutral 9-cat, source minimum 20 games, availability floor off. Weights 0.5/0.5/0 (per-game/totals/per-36); minute adjustment off. Hashes and top-12 player IDs are in the [machine record](2026-09-29-extension-results.json).
- **Result:** Discounted top-156 value 100.994; versus per-game -2.354. Picks 12/50/156: 44.443 / 81.250 / 100.994.
- **Exceptions:** 45 source players have no future row and receive zero; 1–19-game future players remain scored. No candidate-specific exclusions.
- **Conclusion:** No improvement over per-game on this transition. Context only; cannot select a new rule.

### 9-cat · 22_23-to-23_24 · game-55-total-35-rate-10

- **Hypothesis:** This fixed candidate exceeds the per-game reference on the primary metric.
- **Procedure and evidence:** Neutral 9-cat, source minimum 20 games, availability floor off. Weights 0.55/0.35/0.1 (per-game/totals/per-36); minute adjustment off. Hashes and top-12 player IDs are in the [machine record](2026-09-29-extension-results.json).
- **Result:** Discounted top-156 value 102.057; versus per-game -1.292. Picks 12/50/156: 45.162 / 81.670 / 102.057.
- **Exceptions:** 45 source players have no future row and receive zero; 1–19-game future players remain scored. No candidate-specific exclusions.
- **Conclusion:** No improvement over per-game on this transition. Context only; cannot select a new rule.

### 9-cat · 22_23-to-23_24 · game-55-total-35-rate-10-minutes

- **Hypothesis:** This fixed candidate exceeds the per-game reference on the primary metric.
- **Procedure and evidence:** Neutral 9-cat, source minimum 20 games, availability floor off. Weights 0.55/0.35/0.1 (per-game/totals/per-36); minute adjustment on. Hashes and top-12 player IDs are in the [machine record](2026-09-29-extension-results.json).
- **Result:** Discounted top-156 value 102.057; versus per-game -1.291. Picks 12/50/156: 45.162 / 81.670 / 102.057.
- **Exceptions:** 45 source players have no future row and receive zero; 1–19-game future players remain scored. No candidate-specific exclusions.
- **Conclusion:** No improvement over per-game on this transition. Context only; cannot select a new rule.

### 8-cat population · 22_23-to-23_24

436 eligible source players; 572 future participants; 445 future reference players; replacement composite 1.078.

### 8-cat · 22_23-to-23_24 · per-game

- **Hypothesis:** Establish the per-game reference.
- **Procedure and evidence:** Neutral 8-cat, source minimum 20 games, availability floor off. Weights 1/0/0 (per-game/totals/per-36); minute adjustment off. Hashes and top-12 player IDs are in the [machine record](2026-09-29-extension-results.json).
- **Result:** Discounted top-156 value 124.764; versus reference baseline +0.000. Picks 12/50/156: 56.005 / 99.047 / 124.764.
- **Exceptions:** 45 source players have no future row and receive zero; 1–19-game future players remain scored. No candidate-specific exclusions.
- **Conclusion:** Reference value established. Secondary sensitivity; excluded from the decision.

### 8-cat · 22_23-to-23_24 · totals

- **Hypothesis:** This fixed candidate exceeds the per-game reference on the primary metric.
- **Procedure and evidence:** Neutral 8-cat, source minimum 20 games, availability floor off. Weights 0/1/0 (per-game/totals/per-36); minute adjustment off. Hashes and top-12 player IDs are in the [machine record](2026-09-29-extension-results.json).
- **Result:** Discounted top-156 value 119.258; versus per-game -5.506. Picks 12/50/156: 53.707 / 95.966 / 119.258.
- **Exceptions:** 45 source players have no future row and receive zero; 1–19-game future players remain scored. No candidate-specific exclusions.
- **Conclusion:** No improvement over per-game on this transition. Secondary sensitivity; excluded from the decision.

### 8-cat · 22_23-to-23_24 · per-36

- **Hypothesis:** This fixed candidate exceeds the per-game reference on the primary metric.
- **Procedure and evidence:** Neutral 8-cat, source minimum 20 games, availability floor off. Weights 0/0/1 (per-game/totals/per-36); minute adjustment off. Hashes and top-12 player IDs are in the [machine record](2026-09-29-extension-results.json).
- **Result:** Discounted top-156 value 107.563; versus per-game -17.201. Picks 12/50/156: 56.671 / 91.057 / 107.563.
- **Exceptions:** 45 source players have no future row and receive zero; 1–19-game future players remain scored. No candidate-specific exclusions.
- **Conclusion:** No improvement over per-game on this transition. Secondary sensitivity; excluded from the decision.

### 8-cat · 22_23-to-23_24 · game-70-total-30

- **Hypothesis:** This fixed candidate exceeds the per-game reference on the primary metric.
- **Procedure and evidence:** Neutral 8-cat, source minimum 20 games, availability floor off. Weights 0.7/0.3/0 (per-game/totals/per-36); minute adjustment off. Hashes and top-12 player IDs are in the [machine record](2026-09-29-extension-results.json).
- **Result:** Discounted top-156 value 124.195; versus per-game -0.570. Picks 12/50/156: 55.411 / 99.480 / 124.195.
- **Exceptions:** 45 source players have no future row and receive zero; 1–19-game future players remain scored. No candidate-specific exclusions.
- **Conclusion:** No improvement over per-game on this transition. Secondary sensitivity; excluded from the decision.

### 8-cat · 22_23-to-23_24 · game-50-total-50

- **Hypothesis:** This fixed candidate exceeds the per-game reference on the primary metric.
- **Procedure and evidence:** Neutral 8-cat, source minimum 20 games, availability floor off. Weights 0.5/0.5/0 (per-game/totals/per-36); minute adjustment off. Hashes and top-12 player IDs are in the [machine record](2026-09-29-extension-results.json).
- **Result:** Discounted top-156 value 121.568; versus per-game -3.196. Picks 12/50/156: 54.724 / 98.039 / 121.568.
- **Exceptions:** 45 source players have no future row and receive zero; 1–19-game future players remain scored. No candidate-specific exclusions.
- **Conclusion:** No improvement over per-game on this transition. Secondary sensitivity; excluded from the decision.

### 8-cat · 22_23-to-23_24 · game-55-total-35-rate-10

- **Hypothesis:** This fixed candidate exceeds the per-game reference on the primary metric.
- **Procedure and evidence:** Neutral 8-cat, source minimum 20 games, availability floor off. Weights 0.55/0.35/0.1 (per-game/totals/per-36); minute adjustment off. Hashes and top-12 player IDs are in the [machine record](2026-09-29-extension-results.json).
- **Result:** Discounted top-156 value 123.324; versus per-game -1.440. Picks 12/50/156: 55.368 / 98.037 / 123.324.
- **Exceptions:** 45 source players have no future row and receive zero; 1–19-game future players remain scored. No candidate-specific exclusions.
- **Conclusion:** No improvement over per-game on this transition. Secondary sensitivity; excluded from the decision.

### 8-cat · 22_23-to-23_24 · game-55-total-35-rate-10-minutes

- **Hypothesis:** This fixed candidate exceeds the per-game reference on the primary metric.
- **Procedure and evidence:** Neutral 8-cat, source minimum 20 games, availability floor off. Weights 0.55/0.35/0.1 (per-game/totals/per-36); minute adjustment on. Hashes and top-12 player IDs are in the [machine record](2026-09-29-extension-results.json).
- **Result:** Discounted top-156 value 123.323; versus per-game -1.441. Picks 12/50/156: 55.368 / 98.037 / 123.323.
- **Exceptions:** 45 source players have no future row and receive zero; 1–19-game future players remain scored. No candidate-specific exclusions.
- **Conclusion:** No improvement over per-game on this transition. Secondary sensitivity; excluded from the decision.

## Interpretation limits

The two new transitions share a season, the selected candidate was chosen using a later transition, and the previously observed holdout did not support it. Treat these as historical replication evidence, not an untouched prospective test. The seven candidate scores permit diagnosis but cannot be used to retrofit a new optimum without a new protocol and new validation data.
