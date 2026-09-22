# Ranked board

## Intent of the changes

Close M4. `/draft` is the primary ranked-stats table for the saved quiz. The user can edit the profile there and re-rank. Optional draft assistance splits the same list into equal round buckets, with leftovers in the last round.

## What did not change

- Ranker formulas, operator JSON, and `POST /rank` request/response shape.
- `/onboard` stepper and `dd.draftProfile` persist.
- No accounts, no mark-taken session, no Yahoo fields, no `POST /draft/recommendations`.

## Tradeoffs

- **Slice `/rank`, do not re-z-score.** Round 5 is ranks 49-60 on a 12-team board if everyone took BPA on this list. Re-ranking remaining players would drift composites from the default table.
- **Width is league size, last round is the tail.** Equal `universe / rounds` buckets would not mean "draft round 5". The CSV is larger than a roster, so round 13 holds everyone past pick 144.
- **Settings panel on `/draft`, quiz stays first-run.** Sending people back through `/onboard` would unmount the table. Archetype swipe stays quiz-only; it is not on `DraftProfile`.
- **Assistance toggle is React state.** Default view stays the flat table after refresh.

## High-level overview of the current implementation

`/onboard` still writes `dd.draftProfile` and links to `/draft`. The draft island hydrates that profile, redirects to `/onboard` if it is missing, and `POST`s `/rank`. The table shows rank, name, team, pos, and enabled-cat stats. Edit profile is a `<details>` that reuses the quiz field components. Discrete chips persist immediately. Intensity sliders debounce 200ms. Draft assistance runs `partitionByRound` on the ranked list.

## Surfaces touched

- Pages: `/`, `/draft` island.
- Island: `DraftBoard`, `PlayerTable`, `ProfileSettings`.
- Core: `partitionByRound`.
- Docs: M4 spec, plan, README v1 cut, product loop, M5 `/rank` wording.

## User-visible vs contract

- **UI:** Ranked table is the app. Assistance adds `Round k` subsections. Toggle does not persist.
- **Contract:** `DraftProfile` and `POST /rank` are unchanged. No draft session key.
- **Restore:** Refresh keeps the profile and the flat table. Invalid settings edits do not overwrite the last good profile.

## Known gaps

- Rank fetch needs `npm run dev:api`. Failure shows on `/draft` and keeps any previous rows.
- The table is rank-order only. No column sort, search, or taken list.
- Sticky rank/name can still fight horizontal scroll on very small phones.

## How to verify

1. Complete `/onboard` (12-team snake). Continue to board. Confirm a ranked table with stats, not a stub.
2. Open Edit profile. Punt FG%. Confirm order moves and the column stays. Switch to 8-cat. Confirm TOV is gone.
3. Turn on draft assistance. Round 1 has 12 players. Round 5 starts at rank 49. Round 13 is longer than 12.
4. Refresh. Toggle is off. Profile edits are still there.
5. Clear `dd.draftProfile` and open `/draft`. Lands on `/onboard`.

## Next steps

M5 stays seams only. No Yahoo, live stats, or CPU opponents.

Later product/shell (not this PR): TanStack Start as a middle ground between Astro SSG and a full SPA. Revisit the design system on that pass. `client:only` on `/draft` is the current persist choice, not a lock.

## Reference docs

- [M4-draft-assistant.md](../M4-draft-assistant.md)
- [plans/M4-draft-assistant.md](../plans/M4-draft-assistant.md)
- [README.md](../README.md)
