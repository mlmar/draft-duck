# Draft Duck

Draft Duck is a CSV-backed fantasy basketball category draft helper. The onboarding quiz saves a `DraftProfile`; the Fastify API ranks players with weighted category z-scores; the draft board can group the ranked list into rounds.

## Run locally

Node.js 22 or newer is required. Install with `npm ci`, copy `.env.example` to `.env`, and create the trusted local certificates described in the [HTTPS setup](docs/yahoo.md#local-https-without-a-tunnel). Run `npm run dev:api` and `npm run dev:client` in separate terminals. The client defaults to `http://localhost:3000` and the API to `https://localhost:3300`. Run `npm test` for the workspace tests.

For HTTP development, use `npm run dev:api:http` and set `PUBLIC_API_URL=http://localhost:3300` before restarting the client. Run one API mode at a time.

## Current ranking and research

The live `/rank` endpoint scores the selected 2025–26 per-game, per-36, or totals view. The other views supply sleeper/dud comparisons. It does **not** use the experimental blend. The [ranking spec](docs/M2-ranking-engine.md) explains the production formula.

Five consecutive season sets, including advanced-stat CSVs, support reproducible [ranking experiments](docs/experiments/ranking/README.md). The original held-out comparison and two historical replication checks did not establish a better blended rule, so production ranking remains unchanged.

## Project map

- `app/client`: TanStack Start quiz and draft board
- `app/api`: Fastify `/health`, `/players`, and `/rank`
- `app/core`: CSV provider, profile schema, category ranker, and draft helpers
- `app/data`: season CSV exports
- `docs`: [roadmap](docs/README.md), milestone history, experiment records, and [deployment guide](docs/deploy.md)

The saved browser profile uses `dd.draftProfile`. There are no app accounts, roster imports, or market ADP.

## Optional Yahoo league comparison

The `/league` workspace compares actual weekly category results across a connected Yahoo basketball league. It is independent of onboarding, CSV ranking, and the manually saved Team Lab roster. The API feature is disabled by default; [setup and verification](docs/yahoo.md) cover the dedicated Supabase schema, temporary sessions, and server-only configuration. Roster imports and scheduled player-stat ingestion remain deferred.

For local Yahoo testing, `npm run dev:api` serves the API at `https://localhost:3300` using trusted mkcert certificates. The `dev:api:https` alias also remains available. Set the callback and client API URL as described in the setup guide, then run `npm run dev:client` in a separate terminal.
