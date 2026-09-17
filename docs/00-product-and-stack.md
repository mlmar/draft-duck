# 00 — Product and stack

## Goal

Lock the product loop, TypeScript stack, repo layout, and HTTP sketch so later milestones do not re-litigate architecture.

## Product loop

```text
quiz → DraftProfile JSON
CSV  → player universe
profile + operator weights + universe → weighted z-score board
draft session (taken / my picks) → top 3–5 remaining per pick
```

No accounts. Quiz + draft session live in `localStorage`. Analysis is **pure math** with two weight layers (operator + profile). Narrative AI is a no-op hook only (see [M5-extensibility.md](M5-extensibility.md)).

## In scope for this document

- Locked stack and package layout
- Astro static pages vs React islands
- Fastify as the only ranking HTTP surface
- Shared Zod schemas in `app/core`
- Explicit non-goals

## Out of scope

- Implementing the app
- Ranking formulas (see [M2-ranking-engine.md](M2-ranking-engine.md))
- Quiz copy and screen list (see [M3-onboarding.md](M3-onboarding.md))

## Stack (locked)

All TypeScript. No Python, no Next.js, no database in v1.

### `app/client` — Astro + React islands

Same pattern as a static Astro shell with `@astrojs/react`:

- **`output: 'static'`.** Zero-JS pages for marketing / explainers.
- **File routes** in `src/pages/*.astro`. Astro owns navigation. Do not add TanStack Router or a second Vite SPA under `/app`.
- **React 19 islands** for the app:
    - `/onboard` — quiz (`client:only="react"`)
    - `/draft` — draft assistant
- **Keep:** TanStack Query (API calls), Zustand (`localStorage` persist), Tailwind.
- Quiz/draft may be multi-step React trees _inside_ those two pages. Do not create a new Astro page per quiz question.

Suggested static pages for M1+:

- `/` — home / start onboarding
- `/how-it-works` — ranking explained in plain language (no JS)
- `/cats` — CAT glossary (optional; can wait until copy exists)

### `app/api` — Fastify

Thin HTTP over `app/core`. Zod-validate request bodies in handlers (or a Fastify Zod serializer). Enable CORS for the Astro origin in dev.

Ranking is **not** done in Astro server routes or adapters. Fastify stays the API so a later NBA fetch does not live in the static site. Astro SSR / `@astrojs/node` is out of v1.

### `app/core`

Player types, `CsvProvider`, z-score ranker, operator weights JSON, `DraftProfile` Zod schema, no-op `SuggestionHook`. Vitest goldens live here.

### Tooling

- npm workspaces at the repo root
- `csv-parse` for [`app/data/25_26_per_game.csv`](../app/data/25_26_per_game.csv)
- Vitest on `app/core` (ranker). Client tests later

### Not in v1

Auth, DB, Docker, AI copy, live NBA fetch, Python, Yahoo, auction drafts.

## Repo layout (target)

```text
waiver-warrior/
  app/
    client/              # Astro
    api/                 # Fastify
    core/                # ingest + ranker + Zod
      config/
        category-weights.json
    data/                # 25_26_*.csv (source of truth for v1)
  docs/
```

Root `package.json` workspaces: `app/client`, `app/api`, `app/core`.

## Data contract

- Ranking source: **per-game** CSV only. Totals and per-36 stay unused in v1.
- Stable id: Basketball-Reference `Player-additional` (e.g. `doncilu01`). Do not invent Yahoo ids.
- Standard 9-cat: `PTS`, `TRB`, `AST`, `STL`, `BLK`, `3P`, `FG%`, `FT%`, `TOV`.
- Provider interface: `PlayerStatsProvider.load(): Promise<PlayerSeason[]>`.
    - v1: `CsvProvider`
    - later: `NbaApiProvider` stub in M5

## API sketch

All JSON. Prefix `/api` is optional; pick one in M1 and keep it.

| Method | Path                     | Body                                               | Response                      |
| ------ | ------------------------ | -------------------------------------------------- | ----------------------------- |
| `GET`  | `/health`                | —                                                  | `{ ok: true }`                |
| `POST` | `/rank`                  | `{ profile: DraftProfile }`                        | `{ players: RankedPlayer[] }` |
| `POST` | `/draft/recommendations` | `{ profile, takenPlayerIds, limit?: 3 \| 4 \| 5 }` | `{ picks: RankedPlayer[] }`   |

`RankedPlayer` includes `playerId`, identity fields, per-game cats, per-cat z, `composite`, `rank`. Exact field list is locked in M2.

`GET /players` is optional in M1 for debugging the ingested universe; not required for the product loop.

## Non-goals (whole product, not just v1 of this doc)

- Yahoo OAuth / current team / live league
- User accounts
- Simulating other teams’ draft brains
- Replacement-level / positional scarcity (later, not M2)
- Auction drafts

## Acceptance checks

- A new contributor can name the three packages and which process owns ranking HTTP.
- Static vs island split is unambiguous: `.astro` for content, React only on `/onboard` and `/draft`.
- `DraftProfile` has no vendor ids.

## Suggested build order

This document is the lock file. Implement starting at [M1-foundation.md](M1-foundation.md).
