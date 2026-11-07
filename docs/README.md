# Draft Duck roadmap

Category-league fantasy basketball helper: quiz for CAT preferences, rank players with weighted z-scores, then optionally group that board into draft-round buckets.

This folder describes the CSV-backed draft helper and its historical milestones. M1–M4 are complete; M5 records extension seams. The client and API deployment setup is in [deploy.md](deploy.md). The optional Yahoo weekly comparison is tracked separately; accounts, live player-stat ingestion, and AI remain future work.

## Active feature roadmaps

- [Yahoo weekly league comparison](plans/2026-11-06-yahoo-league-comparison.md): implemented on `feat/yahoo-league-comparison`, disabled by default. The plan records current regression checks and review corrections. The user confirmed local OAuth; Fantasy reads remain blocked by Yahoo 403. Weekly-value accuracy, hosted permissions, rendered browser acceptance, and Docker validation remain pending. This correction pass performs no hosted migration or deployment.

- [Team lab](plans/2026-10-06-team-lab.md): responsive roster and candidate workspace, average/total category chart, and reversible row/bulk swap previews are implemented on `main` as of `996e875`. Final user acceptance and deployment have not been verified in this review.

- [Player visualizations](plans/2026-10-02-player-visualizations.md): authoritative category contributions, the player detail drawer, and compact charts on all six named build cards are implemented on `main` as of `b345808`. Previous automated and generated-output evidence is recorded in the plan. Browser validation, Phase 2.2/2.3 acceptance, and final acceptance remain pending; deployment has not been verified.

## Status

This table tracks shipped milestone status. Later experiments do not change that status unless app behavior changes.

| Milestone          | Status                    |
| ------------------ | ------------------------- |
| M1 Foundation      | Done                      |
| M2 Ranking engine  | Done                      |
| M3 Onboarding      | Done                      |
| M4 Draft assistant | Done                      |
| M5 Extensibility   | Seams only (during M1–M4) |

## v1 cut

A first-time user (no account) should be able to:

1. Answer a short onboarding quiz (league size, draft type, CAT need / punt).
2. Get a ranked stats table from the selected 2025–26 per-game, per-36, or totals CSV in [`app/data/`](../app/data/). The other views drive sleeper/dud tags.
3. Edit that profile on `/draft` and optionally turn on draft assistance to see equal round buckets (leftovers in the last round).

## How to read these docs

| Doc                                                                                          | When to open it                                        |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| [00-product-and-stack.md](00-product-and-stack.md)                                           | Stack, repo layout, API sketch, non-goals              |
| [M1-foundation.md](M1-foundation.md)                                                         | Workspaces, client home, Fastify health, CSV ingest    |
| [M2-ranking-engine.md](M2-ranking-engine.md)                                                 | Current scoring formula and rank contract              |
| [experiments/ranking/README.md](experiments/ranking/README.md)                               | Frozen five-season ranking experiments and results     |
| [M3-onboarding.md](M3-onboarding.md)                                                         | Quiz and `DraftProfile`                                |
| [M4-draft-assistant.md](M4-draft-assistant.md)                                               | Ranked table and optional round sections               |
| [plans/M4-draft-assistant.md](plans/M4-draft-assistant.md)                                   | M4 implementation plan (current tree)                  |
| [plans/2026-09-21-quiz-centered-ux.md](plans/2026-09-21-quiz-centered-ux.md)                 | Quiz-first onboarding and board UX direction           |
| [plans/2026-09-22-design-system.md](plans/2026-09-22-design-system.md)                       | Visual system, mobile chrome, draft Settings drawer    |
| [M5-extensibility.md](M5-extensibility.md)                                                   | NBA adapter, suggestion hook, Yahoo seams              |
| [deploy.md](deploy.md)                                                                       | Pages + Cloud Run, WIF, GitHub Actions                 |
| [plans/2026-09-25-deploy-review.md](plans/2026-09-25-deploy-review.md)                       | Review follow-up for the first public deploy           |
| [plans/2026-09-26-punt-complement-reweight.md](plans/2026-09-26-punt-complement-reweight.md) | Tuner 0–3, stance presets, onboarding chart mix        |
| [plans/2026-09-26-onboarding-chart.md](plans/2026-09-26-onboarding-chart.md)                 | Weight chart, two opens, locked Not sure question bank |
| [plans/2026-09-28-onboarding-g-review.md](plans/2026-09-28-onboarding-g-review.md)           | Review follow-up: comments, walk guards, no migrate    |

Each milestone has **goal, in scope, out of scope, stack/touchpoints, acceptance checks, suggested build order**. M1–M4 are sequential. M5 is “do not paint into a corner” plus later optional work.

Product specs stay in `docs/M1`–`docs/M5`. [`docs/plans/`](plans/README.md) contains historical implementation plans. Dated implementation notes live in [`docs/changes/`](changes/).

## Stack (one line)

TanStack Start SPA with selective prerender (`app/client`) → Fastify (`app/api`) → shared TypeScript ranker (`app/core`). Details in [00-product-and-stack.md](00-product-and-stack.md).

## Later live-season work

Yahoo roster/settings import, persistent visitor connections, scheduled player statistics, accounts, injury/news, auction drafts, and AI writeups remain deferred. The [weekly comparison](plans/2026-11-06-yahoo-league-comparison.md) is a narrower, independently enabled feature and does not change CSV ranking.
