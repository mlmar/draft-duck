# Draft Duck

Draft Duck is a CSV-backed fantasy basketball category draft helper. The onboarding quiz saves a `DraftProfile`; the Fastify API ranks players with weighted category z-scores; the draft board can group the ranked list into rounds.

## Run locally

Node.js 22 or newer is required. Install with `npm ci`, copy `.env.example` to `.env`, then run `npm run dev:api` and `npm run dev:client` in separate terminals. The client defaults to `http://localhost:3000` and the API to `http://localhost:3300`. Run `npm test` for the workspace tests.

## Current ranking and research

The live `/rank` endpoint scores the selected 2025–26 per-game, per-36, or totals view. The other views supply sleeper/dud comparisons. It does **not** use the experimental blend. The [ranking spec](docs/M2-ranking-engine.md) explains the production formula.

Three consecutive season sets, including advanced-stat CSVs, support a reproducible [ranking experiment](docs/experiments/ranking/README.md). Its held-out comparison did not establish a better blended rule, so production ranking remains unchanged.

## Project map

- `app/client`: TanStack Start quiz and draft board
- `app/api`: Fastify `/health`, `/players`, and `/rank`
- `app/core`: CSV provider, profile schema, category ranker, and draft helpers
- `app/data`: season CSV exports
- `docs`: [roadmap](docs/README.md), milestone history, experiment records, and [deployment guide](docs/deploy.md)

The saved browser profile uses `dd.draftProfile`. There are no accounts, live league imports, or market ADP.
