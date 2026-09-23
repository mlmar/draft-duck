# Design system first pass

## Intent of the changes

Ship the UI pass in [design-system.md](../plans/design-system.md): ink buttons with duck-blue as accent, mobile chrome that thumbs can reach, a quiz that reads as a funnel, and a draft board that uses a Settings drawer plus pick cards instead of a 452-row spreadsheet on a phone.

## What did not change

- Quiz order (play, league, review). Ranker formulas, `POST /rank`, and `dd.draftProfile`.
- Named-build labels and helper maps. No quiz drawers. No `view` in the rank payload.
- Availability floor, ADP, taken list, dark mode, accounts.

## Tradeoffs

- **Ink buttons.** Default CTAs are dark on paper. Brand blue is progress, links, and your-pick fill. Selected named-build cards go dark. If that feels like a docs site, the fallback is a darker `#78A3CF` sibling for `default` only.
- **Stances in a drawer (board only).** Review still edits Need / Punt on the page. The board summary line opens Settings. Live re-rank keeps the drawer mounted.
- **Simple vs full out of the URL.** `sessionStorage` `dd.boardView` remembers the last choice. Assist and raw/+/- stay shareable. Browser back no longer toggles the grid.
- **Display cap.** Default list is `leagueSize * draftRounds`. Search and Show rest of board lift it. `partitionByRound` is unchanged.

## High-level overview of the current implementation

`--primary` is ink. `--brand` / `--ring` stay `#78A3CF`. A sticky header (wordmark, plus desktop links) and a phone tab bar (Home, Board, Scoring) wrap the app. `/onboard` hides both the tab bar and header links. The quiz shell is quiet progress plus the question. Review uses pick cards and an in-place Adjust Need and Punt expand.

`/draft` opens a Vaul drawer for league, categories, segmented stances, and Fine-tune. Simple view is pick cards (round, name, `fitMarks`, `whyCopy`). Full view is a contained two-axis grid with a draft-length cap. Team is hidden on small screens.

## Surfaces touched

- Pages: `/`, `/about`, `/how-it-works`, `/onboard`, `/draft`.
- Chrome: `AppFrame`, header, tab bar, `PageShell`.
- Quiz: `QuizShell`, STEPS copy, segmented stances, Review expand, pick cards.
- Board: Settings drawer, simple vs full, display cap, contained table.
- Tokens: `global.css`, `baseline.css`, button kit (no `dark:`).
- Core: `stanceSummary` display helper.

## User-visible vs contract

- **UI:** Ink buttons. No colored eyebrows. Quiz is a funnel. Draft Settings is a drawer. Simple is cards. Full table is capped and contained.
- **Contract:** `DraftProfile` and `POST /rank` are unchanged. `dd.draftProfile` is still the profile. `dd.boardView` is new session chrome only. `/draft?view=simple` is ignored.

## Known gaps

- Rank fetch still needs `npm run dev:api`.
- iOS two-axis scroll on the full table is still the research path. Simple cards are the phone path.
- Board tab appears after persist hydrate, so the tab bar can shift once.
- Search that lifts the cap can still return a 452-row table.

## How to verify

1. Phone: Home, Scoring, and Board are in the tab bar. Quiz Continue is not covered. Wordmark leaves the quiz.
2. Play tap, league grouped, review preview then collapsed adjust. No overlay. Order unchanged.
3. Draft: Settings opens a drawer. View toggles stay on the page. Summary line opens the same drawer. Changing a stance re-ranks without closing it.
4. Simple is pick cards. Full table scrolls in one region. Default list is draft-length. Search can still find a name past the cap.
5. About does not mention Fastify, CSV, or `localStorage` keys.

## Next steps

Browser-check the open drawer over the grid on a phone. Tune `--board-table-max` if the table and the page both scroll. Optional: darker brand fill for `default` buttons if ink feels too heavy.

## Reference docs

- [design-system.md](../plans/design-system.md)
- [quiz-centered-ux.md](../plans/quiz-centered-ux.md)
- [2026-09-21-tanstack-start.md](2026-09-21-tanstack-start.md)
