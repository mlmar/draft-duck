# M4 — Draft assistant

## Goal

On `/draft`, the saved `DraftProfile` ranks the universe into a **stats table**. The user can edit every profile field there and the table re-ranks. Optional **draft assistance** splits that same list into round subsections. v1 does **not** simulate other teams’ brains and does not mark players taken.

## In scope

- `/draft` route. Persist hydrates after mount so it does not fight prerender of other pages.
- Default view: one table sorted by `rank` (name, team, pos, enabled-cat stats)
- Profile editor on `/draft` (league size, rounds, draft type, cats, stances, intensity). Valid edits persist to `dd.draftProfile` and `POST /rank` again
- Draft assistance toggle (off by default unless `?assist=1`): `draftRounds` subsections of width `leagueSize`; last round is the leftover tail. View flags live in the URL, not `localStorage`.
- Redirect to `/onboard` if no valid `DraftProfile` in storage
- Same composites as `/rank`. Partition is a slice, not a re-z-score

## Out of scope

- Auction
- CPU mock of other teams (no ADP opponent model)
- Mark taken / my pick / draft session
- Positional slot limits / roster construction rules
- Replacement-level / scarcity
- Yahoo / live league
- Sorting the table by arbitrary columns
- User draft slot (v1 is not pick-by-pick)

## Stack / touchpoints

| Piece         | Where                            |
| ------------- | -------------------------------- |
| `/draft`      | `app/client`                     |
| Board         | React + existing profile Zustand |
| Rank fetch    | Fastify `POST /rank`             |
| Round buckets | `app/core` `partitionByRound`    |

### Round buckets

Width = league size (picks in a round). Snake vs linear does not change who sits in a subsection.

- Rounds `1 .. draftRounds-1`: `ranked.slice((k-1)*leagueSize, k*leagueSize)`
- Last round: `ranked.slice((draftRounds-1)*leagueSize)` (everyone left)

12-team, 13-round: rounds 1–12 have 12 players; round 13 is rank 145 through the end of the CSV universe.

### Settings

First-time quiz stays on `/onboard`. After that, `/draft` edits the same `DraftProfile` fields. Archetype swipe stays quiz-only (it is not on the schema). Intensity sliders debounce so a drag is not one rank call per tick. Invalid in-progress values keep the last good table.

## Acceptance checks

- Without a profile, `/draft` sends the user back to `/onboard`.
- Default view is one ranked table with rank, identity, and enabled cat stats. 8-cat hides `TOV`.
- Editing a stance or preset persists a valid profile and refreshes order and columns.
- Assistance off: no round headings. Assistance on: `draftRounds` subsections, equal size except the last, which is the tail.
- 12-team, 13-round: round 5 is ranks 49–60; round 13 is longer than 12.
- Refresh restores the profile. `?assist=1` and `?values=pm` keep assistance and +/-. No query means flat table and raw stats.
- Composites in the table match `/rank` for that profile (spot-check).

## Suggested build order

1. `partitionByRound` in `app/core` + Vitest.
2. `/draft` board: table from `POST /rank`, redirect if empty profile.
3. Settings panel + assistance toggle.
4. Spec, README, home copy.
