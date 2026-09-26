# Onboarding chart and Not sure questions

Plan only. Implements after Approach G ([punt-complement-reweight.md](punt-complement-reweight.md), PR #12). This is **pass 2**: the live weight chart, the two opens, and the locked Not sure bank. Do not ship G math here. Walk-preview chrome (dashed bars, “preview” caption) is **pass 3**.

## Why this pass

Home already picks a named build or Custom. `/onboard` is league then review. There is no Not sure path, no live weight chart, and Custom skips straight to league (chips never open). Pass 2 is the chart quiz the G plan called for, plus the actual question set.

```text
Home: named build | Custom | Not sure
         |              |         |
      snap preset    chips    3 static + 2 random
         |           (N/N/P)      |
         +------+-------+---------+
                |
         live chart (tap → in-page sliders)
                |
            League → Review → /draft
```

## Two opens

Same lock as G. Restated here because the sheet vs page choice was still loose.

| Press                    | What opens                                         |
| ------------------------ | -------------------------------------------------- |
| **Custom** on Home       | Need / Neutral / Punt per enabled cat. No sliders. |
| **The chart** (any path) | Sliders only, 0–3. Punt cats locked at 0.          |

The chart is **read-only**. No dragging bars. A slider off the current preset marks that cat Custom.

**In-page, not a drawer.** [design-system.md](design-system.md) keeps `/onboard` a funnel: sticky Back / Continue, no Sheet / Drawer / Dialog. Tap the chart expands native range inputs **under the chart** on the same step. A Done / collapse control hides them. Settings on `/draft` may still stack chips then sliders in the existing drawer.

## Chart

Shared `WeightChart`. X = enabled cats (`CAT_LABELS` order). Y = tuner 0–3.

| Tick    | Value |
| ------- | ----- |
| Punt    | 0     |
| Neutral | 1     |
| Need    | 1.5   |
| More    | 3     |

Do not store signed -3 to 3. Do not put Neutral at a signed 0.

Display:

- Ink bars, Public Sans, no neon, no pills, no uppercase kickers. `#78A3CF` is not a bar fill.
- Punt bars sit at 0 and read muted.
- One bar per enabled cat. Phone: equal-width bars, min ~1.75rem, `overflow-x-auto` if nine do not fit. Labels can abbreviate; keep `text-base` on the numbers.
- The whole chart is a button (`aria-label` along the lines of “Edit weights”). It does not drag.
- `aria` a list of cat + current tuner, not a mystery picture.

Walk and saved board use this **same** style in pass 2. Pass 3 may mute the walk. Never `POST /rank` on a walk tap. The chart is weights. Review still ranks the **snapped** profile.

Complement Neutral bars redraw at 1.25 when a hole is punted from the chip step. That is G. This pass just shows it.

## Paths

Today `STEPS` is league then review. Home `?build=` writes the named map and lands on league. Custom writes Neutral and also lands on league.

| Path        | First-run steps                              | Chart                                        |
| ----------- | -------------------------------------------- | -------------------------------------------- |
| Named build | League → review                              | Bars at that card’s G presets. Tap → sliders |
| Custom      | Chips → league → review                      | Bars follow chips. Tap → sliders             |
| Not sure    | 3 static + 2 random → snap → league → review | Wiggles, then jumps. Tap → sliders           |

League does not write tuners. Review shows the same chart plus the pick preview.

`STEPS` stays data-driven. Build the list from the entry path so progress counts the screens that path actually has (named is two, Custom is three, Not sure is seven: five questions, league, review).

Home: keep the named grid and quiet Custom. Add **Not sure** next to Custom (ghost / outline, not a seventh named tile). No helper essay. Optional one muted line: A few questions.

Entry search: keep `build` for named and `custom`. Add `start=not-sure` (do not overload `ArchetypeId`). On hydrate, seed the walk, drop `start` from the URL the way `build` is dropped today, land on the first question.

Retake stays Home. Returning users still get Open board.

## Not sure engine

Walk-then-snap, as locked in G.

1. Preview starts at the **Balanced** G vector (all enabled tuners 1).
2. Each answer lerps the preview toward that choice’s named-build vector. `alpha = 0.4`.
3. Do not write `stances`, `intensity`, or `archetypeId` during the walk. Do not rank the mix.
4. After the last question, nearest named G vector (Euclidean on enabled cats). Ties: [`NAMED_BUILD_IDS`](../../app/core/src/named-builds.ts) gallery order.
5. Snap with `applyArchetype`. Persist that card. Copy: `Closest build: Fortress`.
6. Fine-tune is tap the chart for sliders, after snap or on `/draft`.

```text
Balanced (all 1)
  → lerp 0.4 toward a card
  → …
  → nearest named vector
  → snap that card (saved)
```

**Recompute from answers on Back.** Do not reverse a lerp. Fold the remaining answers from Balanced every time so Back is exact and a refresh of in-memory state cannot drift.

**Why not persist the walk:** four patches become Neutral chips with 1.3 FG% and 0.4 FT%, complements cannot run, gallery chrome cannot name the board. The walk is a classifier with animation. The saved board is always a named preset.

**Why step toward a card:** nearest-neighbor is only honest if the path lives in the same space as the six presets. No `{ ast: +0.4 }` fingerprints.

Worked lerp, 9-cat, first answer Bigs (Fortress) from Balanced:

| Cat | Balanced | Fortress | After 0.4 |
| --- | -------- | -------- | --------- |
| PTS | 1        | 1.5      | 1.2       |
| REB | 1        | 1.5      | 1.2       |
| AST | 1        | 1        | 1         |
| STL | 1        | 1        | 1         |
| BLK | 1        | 1.5      | 1.2       |
| 3PM | 1        | 1        | 1         |
| FG% | 1        | 1.5      | 1.2       |
| FT% | 1        | 0        | 0.6       |
| TOV | 1        | 1        | 1         |

Repeat Fortress and the preview hugs that card. Mix Fortress and Sniper and geometry decides. The last-question chart is still a mix. The snap may jump. The Closest build line has to be loud.

## Question bank

Source of truth for pass 2. **Thirteen pairs:** three static, then a pool of ten. Session asks **five** (the three openers, then two from the pool). Each side has one `toward: NamedBuildId`. Buttons show the **choice label**, never the build name (that would spoil the snap).

Prompts are the quiz title. Two stacked described buttons, tap to answer and advance (same as the Home gallery: no Continue on a walk step). Back undoes the last answer.

Toward ids are the named-build keys: `balanced`, `puntFg` (Bricks), `puntFt` (Fortress), `guards` (Sniper), `stocks` (Stocks), `puntAst` (Post).

### Static opening

Always this order when eligible. These are the poles the product named.

| Id                | Prompt           | Left   | Toward     | Right  | Toward   |
| ----------------- | ---------------- | ------ | ---------- | ------ | -------- |
| `bigs-or-guards`  | Bigs or guards?  | Bigs   | `puntFt`   | Guards | `guards` |
| `threes-or-dunks` | Threes or dunks? | Threes | `guards`   | Dunks  | `puntFt` |
| `jokic-or-shai`   | Jokic or Shai?   | Jokic  | `balanced` | Shai   | `guards` |

### Random pool

Ten pairs. Session draws **two**. This is where Bricks, Post, and Stocks live. Dropped Curry / Gobert and Steals / Blocks; those only restated the static Fortress vs Sniper split.

| Id                        | Prompt                             | Left          | Toward     | Right            | Toward    |
| ------------------------- | ---------------------------------- | ------------- | ---------- | ---------------- | --------- |
| `giannis-or-embiid`       | Giannis or Embiid?                 | Giannis       | `puntFt`   | Embiid           | `puntFg`  |
| `points-or-stocks`        | Points or stocks?                  | Points        | `guards`   | Stocks           | `stocks`  |
| `dimes-or-paint`          | Dimes or paint?                    | Dimes         | `guards`   | Paint            | `puntAst` |
| `jokic-or-ad`             | Jokic or AD?                       | Jokic         | `balanced` | AD               | `puntAst` |
| `shooting-or-free-throws` | Ugly shooting or ugly free throws? | Ugly shooting | `puntFg`   | Ugly free throws | `puntFt`  |
| `line-or-threes`          | To the line or from three?         | To the line   | `puntFg`   | From three       | `guards`  |
| `ad-or-giannis`           | AD or Giannis?                     | AD            | `puntAst`  | Giannis          | `puntFt`  |
| `scorers-or-specialists`  | Star scorers or specialists?       | Star scorers  | `guards`   | Specialists      | `stocks`  |
| `jokic-or-embiid`         | Jokic or Embiid?                   | Jokic         | `balanced` | Embiid           | `puntFg`  |
| `embiid-or-shai`          | Embiid or Shai?                    | Embiid        | `puntFg`   | Shai             | `guards`  |

### Why these mappings

- **Jokic → Balanced, not Post.** Post punts AST. Jokic is the assist-heavy big. Walking him toward Post would step toward a hole he does not have.
- **Shai → Sniper.** Guard scoring, FT%, threes, not a shot blocker.
- **Dunks → Fortress, not Bricks.** Dunks are high FG%. Bricks punts FG%.
- **Bigs → Fortress, not Post.** Fortress is the default interior card (punt FT%). Post is the assist hole. Pool pairs `dimes-or-paint`, `jokic-or-ad`, and `ad-or-giannis` split the two bigs.
- **Giannis → Fortress, Embiid → Bricks.** Classic FT% hole vs living at the line with FG% as the tax.
- **AD → Post.** Scoring and defensive big, not a passer. `ad-or-giannis` is Post vs Fortress (assist hole vs FT hole).
- **Specialists / Stocks → Stocks.** The “scoring is optional, steal and block” card. Do not point a generic “blocks” answer at Stocks; blocks-as-a-big keep scoring (Fortress).
- **To the line → Bricks.** Need FT%, punt FG%. From three → Sniper. `embiid-or-shai` is the same split with names.
- **Ugly shooting → Bricks, ugly free throws → Fortress.** Same split in plain language if the Embiid pairs missed the draw.
- **Jokic or Embiid → Balanced vs Bricks.** Do-it-all vs the FG% tax, without walking Jokic toward Post.

Do not add a seventh named build to make Jokic a “passing big.” Balanced is that card.

### Coverage

Static three already hit Fortress, Sniper, and Balanced. The pool is what can still reach the other cards.

| Build    | Static               | Pool                                                                             |
| -------- | -------------------- | -------------------------------------------------------------------------------- |
| Fortress | bigs, dunks          | Giannis, ugly free throws, AD or Giannis                                         |
| Sniper   | guards, threes, Shai | points, dimes, from three, star scorers, Embiid or Shai                          |
| Balanced | Jokic or Shai        | Jokic or AD, Jokic or Embiid                                                     |
| Bricks   | none                 | Embiid (vs Giannis), ugly shooting, to the line, Jokic or Embiid, Embiid or Shai |
| Stocks   | none                 | points or stocks, star scorers or specialists                                    |
| Post     | none                 | dimes or paint, Jokic or AD, AD or Giannis                                       |

Bricks, Post, and Stocks are not guaranteed. They only show up if one of the two draws hits them.

## Session picker

**Three static, then two from a pool of ten.**

`STATIC_IDS` = the three openers. `RANDOM_POOL` = the ten. `RANDOM_COUNT = 2`. First run is five questions. If a static pair fails the cat filter, omit it (do not substitute from the pool into the opening). Still draw two from the eligible pool. If the pool has fewer than two eligible, take all of it. If nothing eligible at all, skip the walk and snap Balanced.

Seed once when Not sure starts. Mulberry32 or equivalent from that seed. Store `walkSeed`, `walkQuestionIds`, and `walkAnswers` on the in-memory `QuizDraft` only. **None of that on `DraftProfile`.** Back must not reshuffle the random two. In-progress quiz still dies on refresh (same as today).

Eligible question: both `toward` builds pass `isNamedBuildVisible(id, enabledCats)`. First run is 9-cat, so all thirteen qualify. Retake after custom cats may drop Fortress questions if FT% is off, and so on.

Presentation order is statics first, then the two random ids. Do not shuffle the whole list; the opening should feel like the same quiz every time.

Tap-to-advance through `walkQuestionIds`. `search.q` is the 0-based index while `step=walk`. Back decrements `q`, then Home. After the last answer, snap, then league.

## Data shapes

Keep the bank in core next to named builds so labels cannot drift from the vectors. Client renders it.

```ts
type WalkChoice = {
    id: 'left' | 'right';
    label: string;
    toward: NamedBuildId;
};

type WalkQuestion = {
    id: string;
    prompt: string;
    left: WalkChoice;
    right: WalkChoice;
};
```

Helpers (pure, tested in `app/core`):

- `tunerVector(id, enabledCats)` → G preset tuners in enabled-cat order.
- `lerpTuners(a, b, t)` → `a + (b - a) * t`.
- `previewFromAnswers(questionIds, answers, enabledCats)` → fold from Balanced with `alpha = 0.4`.
- `nearestNamedBuild(preview, enabledCats)` → min Euclidean, gallery-order ties. Skip builds that are not visible.
- `pickWalkQuestions(enabledCats, seed)` → ids (three static that survive, then two from the ten).

Quiz walk fields never reach `quizDraftToProfile`. Snap calls `applyArchetype` and drops the walk fields. Opening sliders after snap is the normal Custom-tuner path from G.

## Chart on every onboard step

Named path: chart sits above league and review with that card’s bars.

Custom path: chart sits above chips. Chips move bars. League and review keep showing it.

Not sure: chart sits above the two buttons. Each tap tweens the bars (CSS / 200–300ms, honor `motion-reduce`). After snap, the same chart shows the card. Then league and review.

Do not mount `WeightChart` on Home. Home is the picker. A static tease is out of scope.

Board `/draft`: not required to show this chart in pass 2. Settings already has chips. After G, sliders stack under them. Optional later: same `WeightChart` under the headline on `/draft`, tap → drawer sliders.

## What this does to existing chrome

- Home Custom still quieter than named cards. Not sure matches Custom’s quietness.
- Custom first-run **gains** the stances step it currently skips.
- Fine-tune `<details>` on Custom goes away. Sliders live behind the chart tap. Board Settings can drop that expand and show sliders under chips.
- Intensity slider `max` is 3 from G, not this pass. This pass assumes that axis.
- Walk uses two full-width buttons, not `ChoiceRow` chips and not named-build faces (those helper lines would name Need / Punt).
- Quiz still must not open a drawer.

## Implementation (when this plan ships)

1. Core bank + `tunerVector` / lerp / nearest / picker. Vitest the tables in [Static opening](#static-opening) and [Random pool](#random-pool), the Fortress 0.4 example, Back-recompute, ties, cat filter, seed stability.
2. `WeightChart` display-only. Story it on a named-build vector in isolation if needed, then mount on league.
3. Home Not sure + `start=not-sure`. Dynamic `STEPS`. Custom lands on chips.
4. Walk step: tap left/right, chart lerp, last question snaps, Closest build copy, then league.
5. Chart tap expands in-page sliders. Punt locked. Off-preset → Custom chip. Collapse without a Sheet.
6. `npm run format` and `npm test`. Browser: see [How to verify](#how-to-verify).

## Tests

- Bank: thirteen unique ids (three static, ten pool), both sides named builds, no `custom`. Static ids are not in the pool.
- `isNamedBuildVisible` false for Fortress when `ftPct` is off → questions with `toward: puntFt` drop (five: two static, three pool).
- 9-cat: first three ids are always `bigs-or-guards`, `threes-or-dunks`, `jokic-or-shai`. Last two are from the ten-id pool, no duplicates, no static ids in the tail.
- Same seed → same five ids and same order. Different seed can change only the last two.
- `ftPct` off: static `bigs-or-guards` and `threes-or-dunks` drop. Opening is `jokic-or-shai` plus two from the remaining eligible pool.
- Lerp example matches the table above.
- `previewFromAnswers` of `[bigs-or-guards: left]` then Back to `[]` returns all 1s.
- Preview of the Fortress vector is nearest `puntFt`. All 1s is `balanced`. Equal distance: earlier in `NAMED_BUILD_IDS`.
- Snap writes `archetypeId: 'puntFt'` (or whichever) and G stances, not the 0.4 mix.
- `quizDraftToProfile` has no walk keys.

## Out of scope

- Approach G ranker, schema `custom`, intensity 0–3, migrate. That is PR #12 / pass 1.
- Walk-preview visual treatment (pass 3).
- Persisting a Not sure fingerprint as Custom cats.
- Dragging chart bars.
- Drawers / sheets on `/onboard`.
- Changing `NAMED_BUILDS` maps or adding a Jokic card.
- Ranking during the walk.
- Stashing the discarded mix so Fine-tune can restore it.
- Chart on Home or a required chart on `/draft`.
- Tinder swipe, emoji, a second gallery.

## How to verify

1. Home shows named cards, Custom, and Not sure.
2. Named: league chart is that card (Fortress FT% at 0, Need cats at 1.5). Tap chart → sliders, no bar drag. Continue still works with sliders open or closed.
3. Custom: chips first. Punt FT% moves FG% / REB / BLK / PTS bars to 1.25 (once G is in). No slider row until the chart is tapped.
4. Not sure: first three prompts are always Bigs or guards, Threes or dunks, Jokic or Shai. The next two are from the pool of ten (Giannis or Embiid, Points or stocks, and so on), vary by seed, and are not the three openers. Chart moves each tap. Back restores the previous bars and does not reshuffle the random two. After the fifth, copy names a card and the bars jump to that preset. Refresh still does not keep in-progress answers.
5. Closest build is one of the six names. `/draft` chrome says that name. Settings chips match the card, not the walk mix.
6. 8-cat (TOV off in Settings, then retake Not sure): questions still run; vectors omit TOV.
7. No neon bars, no pills, no drawer on `/onboard`.
