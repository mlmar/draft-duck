# M4 — Draft assistant

## Goal

On `/draft`, the user runs a mock draft: at each of **their** picks, Fastify returns the **top 3–5 remaining** players for the saved `DraftProfile`. Anyone’s pick can be marked taken so the pool shrinks. v1 does **not** simulate other teams’ brains.

## In scope

- Astro page `/draft` with one React island (`client:load`)
- Draft session in Zustand (`localStorage`): round, pick index, snake vs linear, `takenPlayerIds`, `myTeamIds`
- `POST /draft/recommendations` `{ profile, takenPlayerIds, limit?: 3 | 4 | 5 }`
- UI: 3–5 recommendation cards, search/mark any player taken, mark as **my** pick, advance
- Whose pick it is (user vs others) derived from league size + draft type + pick number
- Redirect to `/onboard` if no valid `DraftProfile` in storage
- Re-rank remaining pool only (filter taken, then same composite as M2)

## Out of scope

- Auction
- CPU mock of other teams (no ADP opponent model)
- Positional slot limits / roster construction rules
- Replacement-level / scarcity (still later)
- Yahoo / live league
- Undo beyond a simple “remove last taken” is nice-to-have, not required

## Stack / touchpoints

| Piece                        | Where                                                            |
| ---------------------------- | ---------------------------------------------------------------- |
| `/draft.astro`               | `app/client`                                                     |
| Draft island + session store | React + Zustand persist                                          |
| Recommendations              | Fastify `POST /draft/recommendations`                            |
| Ranker reuse                 | `app/core` — same `composite` as `/rank`, minus `takenPlayerIds` |

### Session model

```ts
type DraftSession = {
    pickNumber: number; // 1-based overall pick in the draft
    takenPlayerIds: string[];
    myTeamIds: string[];
    recommendationLimit: 3 | 4 | 5; // default 5
};
```

League size, rounds, and `draftType` come from `DraftProfile`, not duplicated unless you want a snapshot. Total picks = `leagueSize * draftRounds`.

**Linear:** pick `k` belongs to team `((k - 1) % leagueSize) + 1`. User is team 1 in v1 (first pick of round 1) unless you add a “draft slot” field later. Document: **v1 assumes the user is slot 1**.

**Snake:** even rounds reverse. User slot 1 picks: 1, `2*leagueSize`, `2*leagueSize+1`, …

When it is the user’s pick, fetch and show recommendations. When it is another team’s pick, UI is “mark who went” (search remaining). After marking taken, increment `pickNumber`.

If the user marks a player as **my pick** off-turn, still append to `myTeamIds` and `takenPlayerIds` (manual override).

### Recommendations endpoint

1. Validate `DraftProfile`.
2. Load universe (M1).
3. Drop ids in `takenPlayerIds`.
4. Score like `/rank` (M2), including `SuggestionHook`.
5. Return the first `limit` (default 5, clamp 3–5) as `picks`.

Do not mutate operator weights per round in v1.

### UI (minimum)

- Header: round, overall pick, “your pick” vs “other pick”
- Recommendation cards (your pick only, or always visible for planning)
- Taken list / my team chips
- Player search over remaining names to mark taken
- End state when `pickNumber` exceeds total picks or remaining is empty

## Acceptance checks

- Without a profile, `/draft` sends the user back to `/onboard`.
- Snake, 12-team: picks 1 and 24 are the user’s (slot 1); pick 2 is not.
- Marking a player taken removes them from the next recommendations.
- `limit=3` returns at most 3 players.
- My picks appear on the team list and cannot be recommended again.
- Refresh restores session from `localStorage`.
- Recommendations use the same composites as `/rank` filtered to remaining ids (spot-check one profile).

## Suggested build order

1. `recommendations(profile, takenIds, limit)` in `app/core` + Vitest (taken filter).
2. Fastify `POST /draft/recommendations`.
3. Session store + snake/linear pick ownership.
4. Draft island: cards, mark taken, my pick, advance.
5. Empty profile redirect + draft complete state.
