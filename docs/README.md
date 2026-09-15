# Waiver Warrior roadmap

Category-league fantasy basketball helper: quiz for CAT preferences, rank players with weighted z-scores, then suggest **top 3–5 remaining** players at each draft pick.

This folder is the living product plan. Build in milestone order. Do not start Yahoo, auth, or AI analysis until v1 is shipped.

## v1 cut

A first-time user (no account) should be able to:

1. Answer a short onboarding quiz (league size, draft type, CAT need / punt).
2. Get a ranked board from the 2025–26 per-game CSV in [`app/data/`](../app/data/).
3. Run a mock draft: mark players taken, see the next 3–5 recommendations for _their_ profile.

## How to read these docs

| Doc                                                | When to open it                                    |
| -------------------------------------------------- | -------------------------------------------------- |
| [00-product-and-stack.md](00-product-and-stack.md) | Stack, repo layout, API sketch, non-goals          |
| [M1-foundation.md](M1-foundation.md)               | Workspaces, Astro home, Fastify health, CSV ingest |
| [M2-ranking-engine.md](M2-ranking-engine.md)       | Z-score formulas, weights, Vitest goldens          |
| [M3-onboarding.md](M3-onboarding.md)               | Quiz island and `DraftProfile`                     |
| [M4-draft-assistant.md](M4-draft-assistant.md)     | Draft session and top 3–5 UI                       |
| [M5-extensibility.md](M5-extensibility.md)         | NBA adapter, suggestion hook, Yahoo seams          |

Each milestone has **goal, in scope, out of scope, stack/touchpoints, acceptance checks, suggested build order**. M1–M4 are sequential. M5 is “do not paint into a corner” plus later optional work.

## Stack (one line)

Astro static site + React islands (`app/client`) → Fastify (`app/api`) → shared TypeScript ranker (`app/core`). Details in [00-product-and-stack.md](00-product-and-stack.md).

## Explicitly later (not this app yet)

Yahoo OAuth, upload current team, live league standings, injury/news, auction drafts, AI writeups, Astro SSR. Recorded only as seams in [M5-extensibility.md](M5-extensibility.md).
