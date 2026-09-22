# 00 — Product and stack

## Goal

Lock the product loop, TypeScript stack, repo layout, and HTTP sketch so later milestones do not re-litigate architecture.

## Product loop

```text
quiz → DraftProfile JSON
CSV  → player universe
profile + operator weights + universe → weighted z-score table
optional draft assistance → same list, sliced into round buckets
```

No accounts. Quiz + profile live in `localStorage`. Analysis is **pure math** with two weight layers (operator + profile). Narrative AI is a no-op hook only (see [M5-extensibility.md](M5-extensibility.md)).

## In scope for this document

- Locked stack and package layout
- TanStack Start SPA plus selective prerender
- Fastify as the only ranking HTTP surface
- Shared Zod schemas in `app/core`
- Explicit non-goals

## Out of scope

- Implementing the app
- Ranking formulas (see [M2-ranking-engine.md](M2-ranking-engine.md))
- Quiz copy and screen list (see [M3-onboarding.md](M3-onboarding.md))

## Stack (locked)

All TypeScript. No Python, no Next.js, no database in v1.

### `app/client` — TanStack Start (SPA + selective SSG)

Client-side Start app. Fastify still owns ranking HTTP. Do not add Start server functions for `/rank`.

- **SPA mode.** The app hydrates on the client. `/draft` is not prerendered: it needs `localStorage` and `POST /rank`.
- **Prerender only the public/entry pages:** `/`, `/about`, `/how-it-works`, `/onboard`. Do not auto-discover or crawl every file route (home links to `/draft`).
- **File routes** in `src/routes/*.tsx`. TanStack Router owns navigation.
- **Keep:** TanStack Query (API calls), Zustand (`localStorage` persist), Tailwind.
- Quiz/draft stay multi-step React trees inside `/onboard` and `/draft`. Do not create a route per quiz question.

Routes:

- `/` — home / start onboarding (prerender)
- `/about` — what the app is (prerender)
- `/how-it-works` — ranking explained in plain language (prerender)
- `/onboard` — quiz entry (prerender the first step; persist hydrates after mount)
- `/draft` — ranked board (SPA only)
- `/cats` — CAT glossary (optional; can wait until copy exists)

### `app/api` — Fastify

Thin HTTP over `app/core`. Zod-validate request bodies in handlers (or a Fastify Zod serializer). Enable CORS for the client origin in dev.

Ranking is **not** done in Start server functions or server routes. Fastify stays the API so a later NBA fetch does not live in the static site. Start SSR as a ranking host is out of v1.

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
draft-duck/
  app/
    client/              # TanStack Start
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

| Method | Path      | Body                        | Response                      |
| ------ | --------- | --------------------------- | ----------------------------- |
| `GET`  | `/health` | —                           | `{ ok: true }`                |
| `POST` | `/rank`   | `{ profile: DraftProfile }` | `{ players: RankedPlayer[] }` |

`RankedPlayer` includes `playerId`, identity fields, per-game cats, per-cat z, `composite`, `rank`, `fitRank`, `consensusRank`. Exact field list is locked in M2.

`GET /players` is optional in M1 for debugging the ingested universe; not required for the product loop.

## Non-goals (whole product, not just v1 of this doc)

- Yahoo OAuth / current team / live league
- User accounts
- Simulating other teams’ draft brains
- Replacement-level / positional scarcity (later, not M2)
- Auction drafts

## Acceptance checks

- A new contributor can name the three packages and which process owns ranking HTTP.
- Prerender vs SPA split is unambiguous: `/`, `/about`, `/how-it-works`, `/onboard` are static HTML; `/draft` is client-only.
- `DraftProfile` has no vendor ids.

## Suggested build order

This document is the lock file. Implement starting at [M1-foundation.md](M1-foundation.md).
