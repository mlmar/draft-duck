# M2 — Ranking engine

## Goal

Score the ingested universe with **weighted z-scores** so `/rank` returns a full board for a `DraftProfile`. Formulas are pure math in `app/core`. No AI.

## In scope

- Per-category z-scores vs the **filtered universe from M1**
- Volume-adjusted `FG%` and `FT%`
- Inverted `TOV`
- Two weight layers: operator JSON × profile weights
- `composite` and `rank` (1 = best)
- `POST /rank` on Fastify
- Vitest golden cases
- No-op `SuggestionHook.annotate(ranked) => ranked` (identity in v1)
- `RankedPlayer` type exported from `app/core`

## Out of scope

- Quiz UI (M3) — tests may construct `DraftProfile` objects directly
- Draft remaining-pool / taken ids (M4) — `/rank` scores the **full** universe
- Replacement-level, VORP, positional scarcity
- Per-36 / totals
- Narrative text

## Stack / touchpoints

| Piece                         | Where                                   |
| ----------------------------- | --------------------------------------- |
| Ranker, z-score helpers, hook | `app/core`                              |
| Operator knobs                | `app/core/config/category-weights.json` |
| `POST /rank`                  | `app/api`                               |
| Tests                         | `app/core` Vitest                       |

Default 9-cat keys (match the player model):

`pts`, `trb`, `ast`, `stl`, `blk`, `fg3`, `fgPct`, `ftPct`, `tov`

### Z-score formulas

Universe = M1 output (min-games already applied).

**Counting stats** (`pts`, `trb`, `ast`, `stl`, `blk`, `fg3`):

```text
z = (x - mean) / std
```

If `std === 0`, `z = 0`.

**Turnovers:**

```text
z_tov = - (tov - mean) / std
```

Lower TOV is better.

**Percentages (volume-adjusted):**

Do **not** z-score raw `FG%` / `FT%`. Impact first, then z-score impact:

```text
fg_impact = (fgPct - leagueFgPct) * fga
ft_impact = (ftPct - leagueFtPct) * fta
```

`leagueFgPct` / `leagueFtPct` = mean of **non-null** percentages in the universe (simple mean of player rates is acceptable for v1; document it). Players with `fgPct === null` (no FGA) get `fg_impact = 0` (neutral). Same for FT.

Then:

```text
z_fgPct = (fg_impact - mean_impact) / std_impact
```

**Composite:**

```text
composite = Σ_c operator_w[c] * profile_w[c] * z[c]
```

Only **enabled** cats in the profile are included. Punt ⇒ `profile_w[c] = 0`.

Sort descending by `composite`. `rank` is 1-based after sort. Ties: sort by `playerId` ascending so order is stable.

### Operator weights

`app/core/config/category-weights.json` — default every enabled cat to `1`. Tuning examples (optional, keep commented in the doc / a `README` in config): slight bump to `stl` / `blk` for scarcity. Changing this file must change composites without a code change.

### Profile weights (ranker input)

Until M3 ships the quiz, the ranker accepts:

```ts
type CatKey = 'pts' | 'trb' | 'ast' | 'stl' | 'blk' | 'fg3' | 'fgPct' | 'ftPct' | 'tov';

type CatStance = 'need' | 'neutral' | 'punt';

type DraftProfile = {
    leagueSize: 8 | 10 | 12 | 14;
    draftRounds: number;
    draftType: 'snake' | 'linear';
    enabledCats: CatKey[];
    stances: Partial<Record<CatKey, CatStance>>;
    /** optional 0–2 intensity; default 1 when omitted */
    intensity?: Partial<Record<CatKey, number>>;
};
```

Stance → multiplier (before intensity):

| Stance    | Weight |
| --------- | ------ |
| `need`    | `1.5`  |
| `neutral` | `1`    |
| `punt`    | `0`    |

`profile_w[c] = stanceWeight * (intensity[c] ?? 1)`. Missing stance on an enabled cat = `neutral`. Disabled cats are omitted from the sum (not the same as punt: they should not appear in per-cat z output either).

8-cat (no TO): `enabledCats` omits `tov`.

Zod schema for `DraftProfile` can land in M2 (API needs it) even if the quiz is M3.

### `RankedPlayer`

`PlayerSeason` plus:

- `z: Record<CatKey, number>` (enabled cats only)
- `composite: number`
- `rank: number`

Hook:

```ts
type SuggestionHook = {
    annotate(players: RankedPlayer[]): RankedPlayer[];
};
```

v1 implementation returns the same array. `/rank` runs annotate after sort. Usage, intent, and the later annotator contract live in [M5-extensibility.md](M5-extensibility.md).

## Acceptance checks

- `POST /rank` with a 9-cat all-neutral profile returns every M1 player, unique ranks, finite composites.
- Punting `tov` does not change the relative order implied by the other cats vs a run where `tov` is disabled (punt vs omit: composites may differ by a constant only if other z’s are unchanged — assert **punt tov** vs **enabled + weight 0** matches).
- Volume test: two players with the same `fgPct` but different `fga` do **not** get the same `fgPct` z (unless both impacts equal). Prefer a fixture, not live CSV, for this.
- Golden: a constructed “punt-FG% big” (high `trb`/`blk`, poor volume-adjusted FG%) **rises** when `fgPct` is punted vs all-neutral.
- Operator JSON: doubling `stl` operator weight increases `stl`’s contribution; snapshot one player’s composite in Vitest.
- `SuggestionHook` identity: annotate does not reorder.

## Suggested build order

1. Mean/std helpers + counting-stat z (unit tests on tiny arrays).
2. Volume-adjusted % impact + TOV invert.
3. Weight layers + composite + stable sort.
4. Operator JSON load.
5. `POST /rank`.
6. Golden fixtures (punt big, equal-% different volume).
