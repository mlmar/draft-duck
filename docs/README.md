# Draft Duck roadmap

Category-league fantasy basketball helper: quiz for CAT preferences, rank players with weighted z-scores, then optionally group that board into draft-round buckets.

This folder is the living product plan. v1 (M1–M4) is the product. **Current work is deploying that helper** ([deploy.md](deploy.md)). Yahoo, auth, live NBA fetch, and AI are the second half: live-season services, not this deploy.

## Status

Update this table in the same change that closes a milestone. Do not start a later milestone until the previous one is marked done.

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
2. Get a ranked stats table from the 2025–26 per-game CSV in [`app/data/`](../app/data/).
3. Edit that profile on `/draft` and optionally turn on draft assistance to see equal round buckets (leftovers in the last round).

## How to read these docs

| Doc                                                                    | When to open it                                     |
| ---------------------------------------------------------------------- | --------------------------------------------------- |
| [00-product-and-stack.md](00-product-and-stack.md)                     | Stack, repo layout, API sketch, non-goals           |
| [M1-foundation.md](M1-foundation.md)                                   | Workspaces, client home, Fastify health, CSV ingest |
| [M2-ranking-engine.md](M2-ranking-engine.md)                           | Z-score formulas, weights, Vitest goldens           |
| [M3-onboarding.md](M3-onboarding.md)                                   | Quiz and `DraftProfile`                             |
| [M4-draft-assistant.md](M4-draft-assistant.md)                         | Ranked table and optional round sections            |
| [plans/M4-draft-assistant.md](plans/M4-draft-assistant.md)             | M4 implementation plan (current tree)               |
| [plans/quiz-centered-ux.md](plans/quiz-centered-ux.md)                 | Quiz-first onboarding and board UX direction        |
| [plans/design-system.md](plans/design-system.md)                       | Visual system, mobile chrome, draft Settings drawer |
| [M5-extensibility.md](M5-extensibility.md)                             | NBA adapter, suggestion hook, Yahoo seams           |
| [deploy.md](deploy.md)                                                 | Pages + Cloud Run, WIF, GitHub Actions              |
| [plans/deploy-review.md](plans/deploy-review.md)                       | Review follow-up for the first public deploy        |
| [plans/punt-complement-reweight.md](plans/punt-complement-reweight.md) | Tuner 0–3, stance presets, onboarding chart mix     |

Each milestone has **goal, in scope, out of scope, stack/touchpoints, acceptance checks, suggested build order**. M1–M4 are sequential. M5 is “do not paint into a corner” plus later optional work.

Product specs stay in `docs/M1`–`docs/M5`. Implementation plans live under [`docs/plans/`](plans/). A plan can land in the same PR as the work that closes the milestone.

## Stack (one line)

TanStack Start SPA with selective prerender (`app/client`) → Fastify (`app/api`) → shared TypeScript ranker (`app/core`). Details in [00-product-and-stack.md](00-product-and-stack.md).

## Second half (live season, not this deploy)

Yahoo OAuth, accounts, live NBA stats, injury/news, auction drafts, AI writeups. Recorded only as seams in [M5-extensibility.md](M5-extensibility.md). Do not start those until the draft helper is public.
