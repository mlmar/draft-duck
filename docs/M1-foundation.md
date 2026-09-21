# M1 — Foundation

## Goal

Scaffold the monorepo, ship a static home, a Fastify health route, and a `CsvProvider` that yields one `PlayerSeason` per Basketball-Reference id.

After M1 you can ingest [`app/data/25_26_per_game.csv`](../app/data/25_26_per_game.csv) from the API (or a core script) and open the homepage. No ranking UI yet.

## In scope

- Root npm workspaces: `app/client`, `app/api`, `app/core`
- Client app: TanStack Start SPA, Tailwind, `@` src alias if you use one
- Static `/` with a link to `/onboard` (onboard page may be a stub)
- Fastify server: listen, CORS for the client origin, `GET /health`
- `PlayerSeason` type + `PlayerStatsProvider` interface in `app/core`
- `CsvProvider`:
    - Read per-game CSV
    - Drop the League Average row (`Player-additional` = `-9999`)
    - Collapse multi-team players to **one row per `Player-additional`**
    - Apply a min-games filter (default **G ≥ 20**, overridable constant)
    - Map columns onto the 9-cat player model
- Optional: `GET /players` returning the ingested universe (debug)

## Out of scope

- Z-scores / `/rank` (M2)
- Quiz UI (M3)
- Draft session (M4)
- Totals / per-36 files
- Live NBA fetch, auth, DB, Docker

## Stack / touchpoints

| Piece                      | Where                         |
| -------------------------- | ----------------------------- |
| Workspaces                 | root `package.json`           |
| Client + React + Tailwind  | `app/client`                  |
| Fastify + CORS             | `app/api`                     |
| Types, CSV parse, provider | `app/core`                    |
| Source file                | `app/data/25_26_per_game.csv` |

CSV columns to map (header names as in the file):

| CSV                  | Model                       |
| -------------------- | --------------------------- |
| `Player-additional`  | `playerId`                  |
| `Player`             | `name`                      |
| `Team`               | `team`                      |
| `Pos`                | `pos`                       |
| `Age`                | `age`                       |
| `G`                  | `games`                     |
| `MP`                 | `mp`                        |
| `PTS`                | `pts`                       |
| `TRB`                | `trb`                       |
| `AST`                | `ast`                       |
| `STL`                | `stl`                       |
| `BLK`                | `blk`                       |
| `3P`                 | `fg3`                       |
| `3PA`                | `fg3a` (keep; useful later) |
| `FG` / `FGA` / `FG%` | `fg`, `fga`, `fgPct`        |
| `FT` / `FTA` / `FT%` | `ft`, `fta`, `ftPct`        |
| `TOV`                | `tov`                       |

Empty `%` fields (no attempts) must become `null`, not `0`. Keep `fg`/`fga`/`ft`/`fta` for volume-adjusted % z-scores in M2.

### Multi-team collapse

The dump repeats traded players: per-stint team rows plus a combined row (`2TM` / `3TM` / `4TM`).

**Rule:** keep the combined `2TM`/`3TM`/`4TM` row when present; otherwise keep the single team row. Never keep both a stint and the combined row for the same `playerId`.

### Player model (minimum)

```ts
type PlayerSeason = {
    playerId: string;
    name: string;
    team: string;
    pos: string;
    age: number;
    games: number;
    mp: number;
    pts: number;
    trb: number;
    ast: number;
    stl: number;
    blk: number;
    fg3: number;
    fg3a: number;
    fg: number;
    fga: number;
    fgPct: number | null;
    ft: number;
    fta: number;
    ftPct: number | null;
    tov: number;
};
```

## Acceptance checks

- `npm` workspace install from repo root works; `app/client` and `app/api` each have a dev script.
- `GET /health` returns `{ ok: true }`.
- `/` is a static home page (no quiz required).
- Loading the CSV yields **unique `playerId`s**, no `-9999` row, no duplicate traded-player ids.
- Players with `G < 20` are excluded at the default filter.
- `fgPct` / `ftPct` are `null` when attempts are 0 / blank.
- Core can be imported from the Fastify app without pulling the client.

## Suggested build order

1. Root workspace + empty `app/core` (types only).
2. `CsvProvider` + a small node script or Vitest that prints row counts (unique ids, dropped league average).
3. Fastify `GET /health` (and optional `GET /players`).
4. Client `/` with Tailwind and a “Start” link.
5. Stub `app/client/src/routes/onboard.tsx` so the link does not 404.
