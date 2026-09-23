# Ranking availability

## Intent of the changes

Punt and Need boards drop consensus stars into late rounds. Harden on Fortress fell from 18 to 73. An availability floor exists in `rank()`, but v1 leaves it **off**. Draft position is the raw punt-weighted fit list. That is necessary: we do not have ADP, and promoting against an all-neutral proxy hid the punt.

## What did not change

- Z-score formulas, operator JSON, punt = 0, Need = 1.5.
- `POST /rank` path and request body. `draftSlot` still does not feed scoring.
- Client table columns and simple-view chrome. They already render API `rank` order.
- No ADP file. No reach clamp on specialists who rise (Giannis/Gobert on Fortress stay early).

## Tradeoffs

- **Fit order on purpose.** Assist will treat buried stars as reachable. Prefer that over a fake-ADP floor until a market source exists.
- **Switch, not a delete.** `ranker.json` `availabilityFloor` defaults to false. Flip to true and restart the API. Payload still includes `fitRank` and `consensusRank`.
- **Asymmetric floor when on, not a blend.** Mixing fit with consensus would also pull punt specialists down.

## High-level overview of the current implementation

One z-score pass feeds two composites: profile-weighted fit, and all-neutral consensus. Each gets a 1-based order (`fitRank`, `consensusRank`). Default `rank` is fit order. When the flag is on, `rank()` walks consensus-best first and splices anyone past `consensusRank + leagueSize` back up to that floor. `RankOptions.availabilityFloor` / `availabilitySlack` override in tests.

## Surfaces touched

- Core: `rank()`, `RankedPlayer`, `ranker.json`, ranker goldens.
- API: same `POST /rank` payload. Restart after flipping the JSON.
- Scoring: rank is the weighted fit list; punt can drop stars.
- Docs: M2/M4 floor-off, quiz-centered-ux caption circular again.

## User-visible vs contract

- **UI:** Punt/Need boards show fit order. Scoring matches. No new columns.
- **Contract:** Additive `fitRank` and `consensusRank`. `composite` is fit. While the floor is off, `rank === fitRank`.
- **Restore:** Old clients ignore the new fields. They already sort by `rank` / array order.

## Known gaps

- Fortress can bury Curry/Harden. Assist still slices that list.
- Reaches (Gobert in round 1 on Fortress) are still unflagged. That needs ADP or at least a `consensusRank` chip.
- Null % still scores as impact 0. No minutes floor. No VORP.

## How to verify

1. `npm run test` in core. Default Fortress: Curry/Harden `rank === fitRank`. Floor-on golden still keeps them within one round of consensus.
2. `POST /rank` a Fortress profile with the flag off. Curry can sit in round 4+. Gobert/Giannis should still be early.
3. All-neutral profile: `rank`, `fitRank`, and `consensusRank` match.
4. 8-cat: response `z` has no `tov`; consensus uses the eight enabled cats.
5. Open `/draft` on a Fortress profile and confirm round buckets follow fit order. Scoring does not mention a live floor.

## Next steps

- If an ADP source lands, turn the floor on and swap the floor key to ADP overall pick. Keep `consensusRank` as our balanced board. Do not fake ADP from this board.
- Optional table subtitle: show `consensusRank` when it differs from `rank`.

## Reference docs

- [M2-ranking-engine.md](../M2-ranking-engine.md)
- [M4-draft-assistant.md](../M4-draft-assistant.md)
- [plans/quiz-centered-ux.md](../plans/quiz-centered-ux.md)
