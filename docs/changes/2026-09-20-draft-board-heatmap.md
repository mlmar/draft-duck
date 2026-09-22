# Draft board heatmap

## Intent of the changes

Make the ranked board easier to scan. Assistance rounds share one horizontal scroll. Rows stripe. Category cells use a muted red-to-green fill from league z, with a toggle to show that same score as +/- instead of raw stats.

## What did not change

- Ranker formulas, operator JSON, and `POST /rank` request/response shape.
- `/onboard` stepper and `dd.draftProfile` persist.
- No team-need coloring, no taken list, no re-z-score per round.
- No purple text. No stickers.

## Tradeoffs

- **One table, not synced scroll.** Separate round tables each had their own overflow, so cat columns drifted. Groups are tbodies under one overflow.
- **Strategy then ramp.** `PlayerTable` does not read `player.z`. A `CatHighlightStrategy` returns a signed score. A shared ramp turns that into color. Team need later is a new strategy plus a setting flip, not a second color function.
- **+/- is the highlight score.** It is not NBA box-score plus-minus. A later `teamNeed` mode changes both color and +/- text.
- **Assistance and +/- are React state.** Refresh returns to the flat table and raw stats, same as M4's assistance toggle.
- **Opaque zebra.** `bg-muted/40` let scrolling cat fills show through sticky rank/name. Odd rows use opaque `bg-muted`.

## High-level overview of the current implementation

`/draft` still hydrates `dd.draftProfile` and `POST`s `/rank`. Draft assistance still slices with `partitionByRound`. Those slices now feed one `PlayerTable` as labeled groups.

Cat heat uses `leagueZ`: ranker z vs the filtered universe, TOV already flipped, null shot rates uncolored. Average scores stay transparent so zebra still reads. Raw vs +/- only changes cell text. The highlight mode is a named constant (`leagueZ`) so a later setting can point at `teamNeed`.

## Surfaces touched

- Pages: `/draft` island.
- Island: `DraftBoard`, `PlayerTable`.
- Core: `CatHighlightStrategy`, `leagueZ`, `heatFromScore`, `formatSignedScore`.
- Tokens: `--heat-good`, `--heat-bad`.

## User-visible vs contract

- **UI:** One scrollbar in assistance mode. Round labels sit in the table. Zebra on identity columns. Cat cells tint. Raw stats / +/- toggle. Heat legend under the table.
- **Contract:** `DraftProfile` and `POST /rank` are unchanged.
- **Restore:** Refresh keeps the profile. Assistance and +/- reset.

## Known gaps

- Rank fetch still needs `npm run dev:api`.
- Highlight mode is a constant, not a control. `teamNeed` is not implemented.
- Sticky rank/name can still fight horizontal scroll on very small phones.
- `overflow-x-auto` on the table wrapper can blunt page-level sticky thead.

## How to verify

1. Open `/draft` with a saved profile. Confirm zebra rows and tinted cat cells. High PTS should read green. High TOV should read red if that player is a turnstile.
2. Click +/-. Cat cells show `+1.24` style z, not per-game counts. Heat stays. Rank/name/team/pos do not change. Refresh returns to raw stats.
3. Turn on draft assistance. Confirm one horizontal scrollbar. Scroll cats. Round 1 and later rounds stay aligned. Round labels stay readable.
4. Punt FG% or switch to 8-cat in Edit profile. Columns still match the profile. Null FG% stays uncolored.
5. Narrow the viewport. Confirm overflow, sticky rank/name, and readable heat.

## Next steps

Future PR (not this work): make the text purple and add stickers as deemed necessary.

Add a `teamNeed` highlight strategy that reads `stances`, register it, and point the highlight setting at it. Table, ramp, and tokens stay put.

## Reference docs

- [M4-draft-assistant.md](../M4-draft-assistant.md)
- [2026-09-19-ranked-board.md](./2026-09-19-ranked-board.md)
