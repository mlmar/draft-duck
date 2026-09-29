# Ranking experiment

## Intent of the changes

Test whether a single draft ranking can use per-game, totals, and per-36 views more effectively than the existing one-view ranking, while documenting every comparison for later review.

## What did not change

The live `/rank` endpoint, quiz profile, stored browser data, and draft board still use the selected stats view. No experimental weight is applied to production ranking. The user's season CSVs and existing package-lock change were not edited.

## Tradeoffs

The comparison uses a small prespecified candidate set rather than fitting many weights to one transition. A discounted next-season value above replacement is the primary target. Advanced stats are diagnostic only. One transition selects and one holds out, so even a win would be provisional.

## High-level overview of the current implementation

An offline evaluator ranks source-season eligible players under each fixed rule, scores their next-season 9-cat value above a rank-156 replacement baseline, and saves a machine-readable record with data and code hashes. The development season selected a 70/30 per-game/totals blend. It scored below per-game alone on the holdout, so the frozen rule reports no demonstrated blend improvement. A separate script records exploratory player misses and source advanced stats.

## Surfaces touched

Core experiment math and tests, two experiment scripts, protocol and result records, the root README, roadmap, and milestone status notes.

## User-visible vs contract

There is no user-visible rank change and no API or persistence change. The new command-line evaluator and experiment documents are for research and review.

## Known gaps

Two season transitions are not enough independent evidence to establish stable optimal weights. The outcome measures season-long neutral 9-cat value above a generic replacement player; it does not model weekly lineup substitutions, punt builds, injuries known before draft day, or market ADP.

## How to verify

1. Run `npm run test -w @draft-duck/core` and `npx tsc --noEmit -p app/core/tsconfig.json`.
2. Run `node --import tsx app/core/scripts/run-ranking-experiment.ts`; inspect the selected rule and holdout delta in `docs/experiments/ranking/results.md`.
3. Compare the input and evaluator hashes in `results.json` with the local files.
4. Run `node --import tsx app/core/scripts/diagnose-ranking-misses.ts`; confirm its examples remain labelled exploratory.

## Next steps

Add more independent season transitions and freeze a new protocol before testing additional weights or advanced features. Keep the live ranker unchanged until a candidate passes its prespecified holdout criterion.

## Reference docs

- [Ranking experiment protocol](../experiments/ranking/protocol.md)
- [Ranking results](../experiments/ranking/results.md)
- [Ranking engine](../M2-ranking-engine.md)
