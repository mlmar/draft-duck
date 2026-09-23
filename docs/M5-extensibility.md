# M5 — Extensibility

## Goal

Leave seams so live NBA stats, optional narrative suggestions, and a future Yahoo league import can land **without rewriting** `DraftProfile`, player ids, or the ranker. v1 does not ship those features.

Treat this as a checklist while building M1–M4, then a later optional slice for stubs only.

## In scope

- `NbaApiProvider` **stub** implementing `PlayerStatsProvider` (throws or returns empty; not wired in production)
- Keep `SuggestionHook` injected (identity in v1) so a later annotator can add optional `notes?: string` without changing z-score math
- Document Yahoo constraints: what not to put on v1 types
- Stable `playerId` = Basketball-Reference `Player-additional` until an explicit id map exists

## Out of scope (do not build now)

- Yahoo OAuth, league settings import, current roster upload
- Calling `nba_api` or any live stats HTTP
- Ranking HTTP on TanStack Start server functions or adapters
- AI writeups, Gemini, or LLM rank explanations
- Injury / news feeds
- Auction drafts
- Auth, Supabase, user accounts
- Replacement-level / positional scarcity (separate ranking milestone if ever)

## Stack / touchpoints

| Seam                  | Rule                                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------------------- |
| `PlayerStatsProvider` | Ranking and draft endpoints depend on the interface, not `CsvProvider` by name. Wire CSV in api bootstrap. |
| `NbaApiProvider`      | Same `PlayerSeason[]` shape. Stub file in `app/core` is enough.                                            |
| `DraftProfile`        | League size, cats, stances only. **No** `yahooLeagueId`, `yahooTeamId`, tokens.                            |
| `playerId`            | BR id string. Yahoo player keys wait for a mapping table later.                                            |
| `SuggestionHook`      | Runs after sort. May append display-only fields; must not change `composite` or `rank` in v1.              |
| Fastify vs Start      | Live fetch stays on Fastify. Do not add ranking endpoints as Start server functions.                       |

### Provider bootstrap

```ts
// app/api — composition root
const provider: PlayerStatsProvider = new CsvProvider(csvPath);
// later: env STATS_PROVIDER=nba → new NbaApiProvider()
```

Do not import CSV paths inside the ranker.

### Suggestion hook

**Intent:** keep z-score math pure. Narrative (punt reasons, later AI or injury copy) must not live inside the ranker.

`rank()` scores, optionally applies the availability floor (`ranker.json`, off by default), assigns 1-based `rank`, then calls `annotate`. The default is identity, so `/rank` today is rank-then-do-nothing. Call identity now instead of skipping `annotate` so ranking HTTP and any later draft slice share one composition point. A real annotator is a bootstrap swap, not a second branch in the z-score loop.

**Later annotator contract:** may set display-only `notes` on `RankedPlayer` (for example “punts FG%”). Must not change `composite`, `rank`, or player order. Must not recompute z-scores. The hook is not where ranking logic lives.

**v1:** do not implement a real annotator. `notes` stays unused.

### Yahoo — do not leak into v1

When Yahoo eventually lands, it should **consume** `DraftProfile` and the ranked board, not replace them:

- OAuth and league APIs live in `app/api`, new routes, new package if needed.
- Map Yahoo scoring cats → our `CatKey` / `enabledCats`.
- Map Yahoo player keys → `playerId` via an explicit table (BR ↔ Yahoo). Never overwrite `playerId` with a Yahoo key.
- “Upload current team” = set `myTeamIds` / `takenPlayerIds` from that map, then reuse M4 recommendations.

If a v1 type would only exist for Yahoo, omit it.

## Acceptance checks (stubs + discipline)

- `app/core` exports `PlayerStatsProvider` and a non-production `NbaApiProvider` stub.
- Ranker tests use fixtures or `CsvProvider`, not NBA HTTP.
- `DraftProfile` Zod schema has no yahoo/oauth fields (grep).
- `/rank` takes a provider in the composition root (injectable in tests). Round buckets slice that list; they do not open files.
- `SuggestionHook` is called in both rank paths; identity hook keeps composites identical.

## Suggested build order

**During M1–M4**

1. M1: provider interface + CSV impl only; ranker never opens files.
2. M2: hook after sort; optional `notes` field unused.
3. M3–M4: profile and session types stay vendor-free.

**Optional later slice (still not Yahoo)**

1. Add `NbaApiProvider` stub + `STATS_PROVIDER` env switch that is illegal in production until implemented.
2. Document BR ↔ future Yahoo map as a future table, not a column on `PlayerSeason`.
