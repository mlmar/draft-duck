# Onboarding G review follow-up

Implemented on the Not sure PR. Approach G and the Not sure walk already shipped. **No old-profile migrate.** Intensity is the 0-3 tuner. Missing intensity uses the stance preset. Do not convert stance × slider payloads.

This pass is the leftover review: comments on the dense blocks, a few correctness guards, and one source of tuner constants. Not pass 3 walk-preview chrome.

## Done, do not reopen

- `weightModel` and `migrateDraftProfile` are gone.
- Zod does not transform old Need × 2 into tuner 3.
- `rank()` / `profileWeight()` read intensity as the weight. That is the contract.

## Remainder (implemented)

### 1. `presetTuner` must not treat Custom as Neutral

[`app/core/src/tuners.ts`](../../app/core/src/tuners.ts). Custom has no preset. Today `custom` falls through to the Neutral 1 / 1.25 path if the 4th argument is omitted. `tunersForStances` special-cases Custom, so current callers are fine. The next `presetTuner(cat, stances, enabled)` on a Custom row will lie.

Make Custom explicit: only Neutral (passed in) gets the complement default. Chip writes keep passing Need / Neutral / Punt. One comment: Custom has no preset. Test: `presetTuner` with `stances[cat] === 'custom'` and no 4th arg does not return 1.25 just because FT% is punted.

### 2. Name the walk classifier choices

[`app/core/src/walk-questions.ts`](../../app/core/src/walk-questions.ts). Three branches need why-comments, same grain as `previewFromAnswers` (fold from Balanced, do not inverse-lerp).

- Tie-break is gallery order: loop `NAMED_BUILD_IDS`, keep the first on equal distance. Name the `1e-12` slack or comment that `<=` would change Balanced vs Sniper ties.
- Invisible builds are skipped. `'balanced'` is the fallback because Balanced is always visible. Snap Balanced in the quiz if the fallback ever matters.
- `mulberry32` is on `pickWalkQuestions` so Back does not reshuffle the player extra.

No math change unless a test proves a tie is wrong.

### 3. Document the quiz adapter flags

[`app/client/src/lib/quiz.ts`](../../app/client/src/lib/quiz.ts).

- `withArchetypeFromStances`: any Custom cat, or a named map that no longer matches, becomes `custom`. Home Custom stays `custom` even when every chip is Neutral, so it does not snap to Balanced.
- `onboardPath`: `walkQuestionIds !== undefined` is a session flag, including `[]`. After snap those fields stay so League Back can undo. After persist they are gone, so a returning Fortress user is `named`. Clearing `walkQuestionIds` on snap would dump Back to Home and shrink the progress bar from 9 to 2.

Comments only. Do not drop walk fields on snap.

### 4. Label hydrate paths. Hide the restore banner on Not sure

[`app/client/src/components/onboard/onboard-quiz.tsx`](../../app/client/src/components/onboard/onboard-quiz.tsx) mount effect.

Comment the three entries: Not sure, Custom, named. Fourth: no eligible walk questions, snap Balanced, go League.

Correctness: a returning user who clicks Not sure still sets `Editing Fortress` after `startWalk` has wiped stances. Skip the restore banner when `start=not-sure`. League size from the saved profile can stay.

### 5. Drive Continue from the step list. Gate walk answers

Same file.

- `handleContinue` hardcodes stances → league → review. Use the next id from `stepsForPath(path, draft)` so a new step cannot be skipped.
- Walk Back and League-after-snap Back are a pair. Comment them: pop one answer, do not inverse-lerp. From League, also clear snapped stances / archetype and return to the last question.
- `handleWalkAnswer` should no-op unless the current answer count matches `q` before append. A stale tap or a `?q=` that does not match `walkAnswers` must not append onto a finished walk and snap twice.

Tests: Back from League restores the last question and the previous bars. A second tap after snap does not change `archetypeId`.

### 6. Chart ticks from core constants

[`app/client/src/components/onboard/weight-chart.tsx`](../../app/client/src/components/onboard/weight-chart.tsx).

Import `TUNER_MAX`, `TUNER_NEED`, `TUNER_NEUTRAL`, `TUNER_PUNT` for the axis. Local copies will lie if the scale moves.

Comment `isPunt(..., value === 0)`: 0 is a visual floor, not a stance write. Comment `role="button"` on the plot: a native `<button>` ate the flex layout. Do not switch it back.

## Out of scope

- Walk-preview chrome (dashed bars, preview caption). Pass 3.
- Persisting the unsnapped walk.
- Chart on Home or a required chart on `/draft`.
- Re-adding migrate, `weightModel`, or Need × 2 → tuner 3.

## Order

1. `presetTuner` Custom + test.
2. Walk classifier comments (and named epsilon if the line stays).
3. Quiz adapter comments.
4. Hydrate comments + Not sure banner.
5. Continue / Back / walk-answer gate + tests.
6. Chart constants + comments.
7. `npm run format` and `npm test`. Browser: Not sure from a saved Fortress board shows no "Editing Fortress" line on question 1. Custom chips still do not snap to Balanced.

## How to verify

1. Core: Custom stance without a 4th arg does not pick up complement 1.25. Fortress Need is still 1.5. Punt FT% still presets FG% 1.25 when the chip is Neutral.
2. Same seed still yields the same seven walk ids. Back to zero answers is all 1s.
3. Home Custom, all Neutral, persist: `/draft` headline is Custom, not Balanced.
4. Saved Fortress, Home → Not sure: no restore banner naming Fortress. Walk still starts at Balanced bars.
5. Named / Custom / Not sure Continue still hits League then Review. Walk Back from League returns to question 7 with the previous mix, not a new player extra.
6. Chart ticks still read More / Need / Neutral / Punt. Tap still opens sliders. A Custom thumb at 0 looks muted and does not flip the chip to Punt.
