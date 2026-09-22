# Ranking availability

## Intent of the changes

Punt and Need boards were dropping consensus stars into late rounds, so assist treated them as still on the board. Harden on Fortress fell from 18 to 73. Rank now floors those names against an all-neutral consensus rank so they cannot look like late steals.

## What did not change

- Z-score formulas, operator JSON, punt = 0, Need = 1.5.
- `POST /rank` path and request body. `draftSlot` still does not feed scoring.
- Client table, how-it-works copy, and simple-view chrome. They already render API `rank` order.
- No ADP file. No reach clamp on specialists who rise (Giannis/Gobert on Fortress stay early).

## Tradeoffs

- **Asymmetric floor, not a blend.** Mixing fit with consensus would also pull punt specialists down. The floor only promotes people who fell more than one round vs the all-neutral board.
- **Internal consensus, not ADP.** The CSV has no market ADP. All-neutral rank on the same enabled cats is the proxy. Kawhi 4th / Lauri 8th will not match a real ADP list.
- **`composite` stays fit.** Rank can disagree with the number under the name. That is honest: weak fit, still gone early.

## High-level overview of the current implementation

One z-score pass feeds two composites: profile-weighted fit, and all-neutral consensus. Each gets a 1-based order (`fitRank`, `consensusRank`). Final `rank` starts as fit order, then walks consensus-best first and splices anyone past `consensusRank + leagueSize` back up to that floor. `RankOptions.availabilitySlack` overrides slack in tests.

## Surfaces touched

- Core: `rank()`, `RankedPlayer`, ranker goldens.
- API: same `POST /rank` payload, extra fields on each player.
- Docs: M2 availability floor, ADP what-if, remaining gaps.

## User-visible vs contract

- **UI:** Board order changes on punt/Need profiles. No new columns.
- **Contract:** Additive `fitRank` and `consensusRank`. `composite` meaning unchanged. `rank` is availability-aware, not strictly composite order.
- **Restore:** Old clients ignore the new fields. They already sort by `rank` / array order.

## Known gaps

- Scoring page still says the composite is the sort.
- No consensus column on the table, so a promoted star looks like a fit pick.
- Reaches (Gobert in round 1 on Fortress) are still unflagged. That needs ADP or at least a `consensusRank` chip.
- Null % still scores as impact 0. No minutes floor. No VORP.

## How to verify

1. `npm run test` in core. Fortress season golden: Curry and Harden `rank` within 12 of `consensusRank`; Giannis still ahead of consensus.
2. `POST /rank` a Fortress profile. Curry should not sit in round 4+. Gobert/Giannis should still be early.
3. All-neutral profile: `rank`, `fitRank`, and `consensusRank` match.
4. 8-cat: response `z` has no `tov`; consensus uses the eight enabled cats.
5. Open `/draft` on a Fortress profile and confirm round buckets follow the new order. No new UI chrome.

## Next steps

- How-it-works copy: rank can differ from composite; mention the consensus floor.
- Optional table subtitle: show `consensusRank` when it differs from `rank`.
- If an ADP source lands, swap the floor key to ADP overall pick, keep `consensusRank` as our balanced board, and use ADP for reach chips. Do not fake ADP from this board.

## Reference docs

- [M2-ranking-engine.md](../M2-ranking-engine.md)
- [M4-draft-assistant.md](../M4-draft-assistant.md)
- [plans/quiz-centered-ux.md](../plans/quiz-centered-ux.md)
