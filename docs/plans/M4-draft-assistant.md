# M4 implementation plan

How [M4-draft-assistant.md](../M4-draft-assistant.md) maps onto the tree after M3. This PR is plan plus implementation.

## Product

`/draft` is the primary ranked-stats table. Settings stay editable and re-rank. Draft assistance (off by default) partitions the same `/rank` list into league-size round buckets; the last round is the leftover tail. No mark taken, no session store, no top-5 grid.

## Guardrails

M3 is Done. No Yahoo, auth, or AI. M5 stays seams only. Ranking HTTP stays on Fastify. `partitionByRound` slices `rank()` output; it does not re-z-score. `DraftProfile` stays vendor-free.

## Reuse

- [`rank()`](../../app/core/src/ranker.ts) via existing `POST /rank`
- [`useDraftProfileStore`](../../app/client/src/stores/draft-profile.ts)
- Quiz field components (`LeagueStep`, `PresetStep`, `StancesStep`, `ChoiceRow`, intensity sliders) on a single settings panel
- Persist hydrates after mount so it does not fight prerender of other pages

## Core

`partitionByRound(ranked, leagueSize, draftRounds)`:

- Rounds `1 .. N-1` have length `leagueSize`
- Last round is `slice((N-1)*leagueSize)`
- Vitest: 12-team 13-round windows, tail length, short universe empty rounds

## Client

- Gate `/draft` on a valid profile; else `/onboard`
- Query key is the profile. Discrete chips persist immediately. Intensity debounce 200ms
- Assistance and +/- live in `/draft` search (`assist=1`, `values=pm`). Toggles replace search on the current route.
- Table: overflow-x, sticky rank+name, enabled cats, composite as `text-sm` under the name

## Docs

Rewrite the M4 spec, this file, README v1 cut, home copy. Mark M4 Done when the board ships. API sketch can stay `POST /rank` (no recommendations endpoint).
