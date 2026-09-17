# M4 implementation plan

How [M4-draft-assistant.md](../M4-draft-assistant.md) maps onto the tree after M3. Spec still owns goal, acceptance, and out of scope. This file is the work PR’s checklist. Status in [README.md](../README.md) stays **Not started** until that PR ships.

## Guardrails

M3 is Done. Do not start Yahoo, auth, or AI. M5 stays seams only:

- Ranking HTTP stays on Fastify. No Astro server routes.
- `PlayerStatsProvider` stays injected at API bootstrap ([`app/api/src/index.ts`](../../app/api/src/index.ts) already loads `CsvProvider` once).
- `POST /draft/recommendations` must call `SuggestionHook` the same way `/rank` does (identity today, via `rank()`).
- `DraftProfile` and session ids stay vendor-free. Player ids stay Basketball-Reference `Player-additional`.

Do not mutate operator weights per round. Do not add a `docs/changes/` note here. That note belongs in the work PR.

## Reuse

| Existing                                                                                        | M4 use                                                                                 |
| ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| [`rank()`](../../app/core/src/ranker.ts)                                                        | Score remaining players. Same composites, operator JSON, stable sort, hook as `/rank`. |
| [`draftProfileSchema`](../../app/core/src/profile.ts)                                           | Validate the recommendations body.                                                     |
| [`useDraftProfileStore`](../../app/client/src/stores/draft-profile.ts) (`ww.draftProfile`)      | Gate `/draft`. Redirect to `/onboard` if missing or invalid.                           |
| `GET /players` in [`app/api/src/index.ts`](../../app/api/src/index.ts)                          | Remaining-name search. Already shipped.                                                |
| [`rankPlayers`](../../app/client/src/lib/api.ts) + TanStack Query                               | Same fetch wrapper and QueryClient-per-island pattern as the quiz.                     |
| Onboard persist                                                                                 | Raw JSON in `localStorage`, namespaced key, drop invalid on read.                      |
| shadcn Card / Button / Input + [design-aesthetic.mdc](../../.cursor/rules/design-aesthetic.mdc) | Rec cards and search. Public Sans, light theme, primary `#78A3CF`.                     |

**Hydration.** The spec says `client:load`. Follow M3: `client:only="react"` on the draft island so persist does not fight SSR. Draft session is also `localStorage`. Call this out in the work PR change note.

## Core

Add `recommendations(universe, profile, takenPlayerIds, limit, options?)` in `app/core`:

1. Drop ids in `takenPlayerIds` (unknown ids ignored).
2. Call `rank(remaining, profile, options)`. Do not copy z-score math.
3. Clamp `limit` to 3–5, default 5. Return the first `limit` as `picks`.

Empty `takenPlayerIds` must match `/rank` order and composites (spot-check one profile). Taken players never appear.

Pick ownership also lives in core so snake vs linear is a Vitest, not a UI story. v1 user is **slot 1**.

```ts
isUserPick(pickNumber, leagueSize, draftType);
roundForPick(pickNumber, leagueSize);
totalPicks(leagueSize, draftRounds);
```

- Linear: pick `k` belongs to team `((k - 1) % leagueSize) + 1`.
- Snake: even rounds reverse. Slot 1 picks: 1, `2 * leagueSize`, `2 * leagueSize + 1`, …
- Lock: 12-team snake, picks 1 and 24 are the user; pick 2 is not.

Zod, export from the core barrel:

```ts
recommendationsRequestSchema = {
    profile: draftProfileSchema,
    takenPlayerIds: string[],
    limit?: 3 | 4 | 5 // default 5
}
```

Vitest: taken filter, `limit=3`, empty taken matches `rank()`, snake/linear ownership. Fixtures only. No CSV HTTP in tests.

## API

Thin handler next to `/rank` in [`app/api/src/index.ts`](../../app/api/src/index.ts):

- Zod-parse body. 400 on failure.
- `recommendations(players, profile, takenPlayerIds, limit)` on the already-loaded universe.
- Response `{ picks: RankedPlayer[] }`.

Provider stays `CsvProvider` at boot. Hook stays identity because `rank()` already annotates.

## Session store

New Zustand persist store, same storage style as the profile (raw JSON, key `ww.draftSession`):

```ts
type DraftSession = {
    pickNumber: number; // 1-based overall
    takenPlayerIds: string[];
    myTeamIds: string[];
    recommendationLimit: 3 | 4 | 5; // default 5
};
```

League size, rounds, and `draftType` stay on `DraftProfile`. Total picks = `leagueSize * draftRounds`.

Actions: `markTaken(playerId)`, `markMyPick(playerId)` (writes both lists, allowed off-turn), `reset()`. After mark, increment `pickNumber`. Skip multi-step undo. Refresh restores from `localStorage`.

## `/draft` island

Replace the stub in [`app/client/src/pages/draft.astro`](../../app/client/src/pages/draft.astro) with one island.

- After persist hydrate, if no valid `DraftProfile`, `window.location.replace('/onboard')`.
- Header: round, overall pick, “your pick” vs “other pick”, derived from profile + `pickNumber`.
- Your pick: TanStack Query `POST /draft/recommendations` with `{ profile, takenPlayerIds, limit }`. Show 3–5 cards (name, team, pos, composite/rank). Primary action: take as **my pick**.
- Other pick: search remaining names (`GET /players`, drop `takenPlayerIds`, match on name). Mark taken. Recs are not the main action.
- Always: my-team chips, taken list, search to mark anyone remaining.
- End: `pickNumber > totalPicks` or remaining empty. Show roster, no more recs.
- Limit default 5; a 3/4/5 control so the `limit=3` check is reachable from the UI.

Load remaining names once via `GET /players`. Do not send the full board through recommendations.

Review already links to `/draft`. No quiz schema change.

## Build order

1. `recommendations()` + pick-ownership helpers + Vitest.
2. Fastify `POST /draft/recommendations` + client fetch helper.
3. Session store wired to the profile’s league size / draft type.
4. Draft island: cards, search/mark taken, my pick, advance, end state.
5. Empty-profile redirect.

Then `npm run format`, `npm test`, and a browser pass: onboard → continue to draft → snake 12-team pick 1 recs → mark other taken → pick 2 is not yours → pick 24 is yours → taken names gone from recs → refresh restores session → wipe profile and open `/draft` → lands on `/onboard`.

The work PR marks M4 **Done** in the README status table and adds a change note under `docs/changes/`.

## Out of scope (work PR too)

Auction, CPU opponents, roster slot limits, replacement-level scarcity, Yahoo, accounts, mutating operator weights per round, a real `SuggestionHook` annotator, undo beyond a simple last-taken (nice-to-have, skip unless cheap).
