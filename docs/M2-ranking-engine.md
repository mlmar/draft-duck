# M2 — Ranking engine

## Goal

Score the ingested universe with **weighted z-scores** so `/rank` returns a full board for a `DraftProfile`. Formulas are pure math in `app/core`. No AI.

## In scope

- Per-category z-scores vs the **filtered universe from M1**
- Volume-adjusted `FG%` and `FT%`
- Inverted `TOV`
- Two weight layers: operator JSON × profile weights
- `composite` and `rank` (1 = best). v1 `rank` is fit order
- `fitRank` / `consensusRank`, and an availability floor behind `ranker.json` (off by default)
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
| Ranker knobs                  | `app/core/config/ranker.json`           |
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

Sort descending by `composite` to get `fitRank`. Ties: sort by `playerId` ascending so order is stable.

`composite` stays this fit score. While the availability floor is off (v1), `rank === fitRank`. See [Availability floor](#availability-floor).

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
- `composite: number` (fit; punt cats contribute 0)
- `rank: number` (1-based; fit order while the floor is off)
- `fitRank: number` (1-based order by fit composite only)
- `consensusRank: number` (1-based all-neutral order on the same enabled cats; still computed when the floor is off)

Hook:

```ts
type SuggestionHook = {
    annotate(players: RankedPlayer[]): RankedPlayer[];
};
```

v1 implementation returns the same array. `/rank` assigns `rank`, then annotate. Usage, intent, and the later annotator contract live in [M5-extensibility.md](M5-extensibility.md).

### Availability floor

A punt/Need board can drop a consensus top-20 player into late rounds (Fortress: Curry 10 -> 38, Harden 18 -> 73). Assist then treats that order as availability, so the name looks reachable when the room will already have taken them.

**v1 leaves that sink on purpose.** Draft position is the punt-weighted fit list. Promoting against an all-neutral proxy hid the punt, and that proxy is not ADP. Necessary until a real ADP source exists.

The floor is implemented and **off by default** in `app/core/config/ranker.json` (`availabilityFloor: false`). Flip to `true` and restart the API. `RankOptions.availabilityFloor` overrides in tests. `fitRank` / `consensusRank` are always computed so the payload does not change when the flag flips.

There is no ADP in the CSV. The proxy is an all-neutral rank on the **same enabled cats** (Neutral × intensity 1, same z). 8-cat consensus ignores TOV.

When the flag is on:

1. One z-score pass.
2. `fitComposite` = current weighted sum. `consensusComposite` = all-neutral weights.
3. `fitRank` / `consensusRank` from those sorts.
4. Start from fit order. Walk players consensus-best first. If someone fell past `consensusRank + leagueSize`, splice them up to that floor. Only moves **up**. Specialists who rose stay put.
5. Re-number `rank` 1-based.

`leagueSize` is one round of slack. `RankOptions.availabilitySlack` overrides it in tests. Slack at least the universe size restores fit order.

Do not blend fit with consensus. A blend also damps intended rises (Giannis/Gobert on Fortress).

### If we had ADP

ADP is what the rest of the room actually does. All-neutral z-rank is only a stand-in: it will mis-order name-brand, injured, or recency-boosted players.

What would change, and what would not:

- **Floor key.** Promote against ADP overall pick instead of `consensusRank`. Same splice, `floor = adp + slack`. Slack can shrink because the market already prices some punt drafters.
- **Reaches become honest.** Gobert 85 -> 10 on Fortress is a reach vs ADP. Still do **not** pull him down: punt boards exist to take that player early. Expose `adp` so UI can chip "reach" / "value".
- **UI that is circular today becomes legal.** "Likely gone by your pick" using ADP vs `draftSlot`. "ADP 45, don't spend pick 18" on a poor-fit star. Dual column: fit rank vs ADP. Do not fake any of that from this board's ranks.
- **Data, not ranker math.** New ADP CSV/API mapped to Basketball-Reference `playerId`. Fit composite, punt/Need weights, and z-scores stay. `consensusRank` can remain as "our balanced board" beside market ADP.
- **Do not build this now.** No ADP file in-repo.

### Remaining ranking gaps (not this pass)

- Replacement-level / VORP / positional scarcity (later, not M2).
- Minutes floor for low-MP specialists.
- Null FG%/FT% treated as impact 0 (neutral, not missing).
- Need 1.5 × intensity 2 = 3× weight. Stance weights stay. The floor does not cover star-sink while it is off.
- Taken list / remaining-pool re-z.
- Custom punt-only does not tilt leftover Neutrals toward the hole’s usual partners. Named builds already do that with Need 1.5. Plan: [punt-complement-reweight.md](plans/punt-complement-reweight.md).

## Acceptance checks

- `POST /rank` with a 9-cat all-neutral profile returns every M1 player, unique ranks, finite composites.
- Punting `tov` does not change the relative order implied by the other cats vs a run where `tov` is disabled (punt vs omit: composites may differ by a constant only if other z’s are unchanged — assert **punt tov** vs **enabled + weight 0** matches).
- Volume test: two players with the same `fgPct` but different `fga` do **not** get the same `fgPct` z (unless both impacts equal). Prefer a fixture, not live CSV, for this.
- Golden: a constructed “punt-FG% big” (high `trb`/`blk`, poor volume-adjusted FG%) **rises** when `fgPct` is punted vs all-neutral.
- Operator JSON: doubling `stl` operator weight increases `stl`’s contribution; snapshot one player’s composite in Vitest.
- `SuggestionHook` identity: annotate does not reorder.
- All-neutral: `rank === fitRank === consensusRank`.
- Default (`ranker.json` off): punt board `rank === fitRank`. Fortress Curry/Harden may sit late; Giannis still rises.
- Floor on (`availabilityFloor: true`): a consensus star that `fitRank` would bury ends at `rank <= consensusRank + slack`; a fit specialist is not pulled down.
- Season dump + Fortress with the floor on: Curry and Harden stay within one round of `consensusRank`; Giannis still ranks better than consensus.
- 8-cat: `consensusRank` omits TOV.

## Suggested build order

1. Mean/std helpers + counting-stat z (unit tests on tiny arrays).
2. Volume-adjusted % impact + TOV invert.
3. Weight layers + composite + stable sort.
4. Operator JSON load.
5. `POST /rank`.
6. Golden fixtures (punt big, equal-% different volume).
