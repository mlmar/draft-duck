# TanStack Start

## Intent of the changes

Move `app/client` from Astro islands to TanStack Start. Keep ranking on Fastify. Prerender the public and entry pages. Leave `/draft` as a client-only SPA route.

## What did not change

- Ranker formulas, operator JSON, and `POST /rank` request/response shape.
- Quiz steps, `ww.draftProfile` persist, and the ranked table behavior.
- No accounts, no Yahoo, no Start server functions for ranking.

## Tradeoffs

- **SPA mode plus a page allow-list.** Home, about, scoring, and onboard are static HTML. `/draft` needs `localStorage` and the API, so it is not prerendered. Auto-discovery and link crawling are off so a Start link to `/draft` does not emit draft HTML. The SPA shell uses mask path `/?spa-shell=1` so it does not collide with prerendered `/`.
- **Router instead of full page loads.** Quiz finish and the empty-profile gate use `navigate`. Marketing pages can still be served as files.
- **Zustand skips hydration on the server.** `/onboard` prerenders the first step from defaults, then persist fills in after mount. That replaces `client:only`.

## High-level overview of the current implementation

`app/client` is Vite + TanStack Start. File routes live under `src/routes`. The Vite plugin enables SPA mode and prerenders `/`, `/about`, `/how-it-works`, and `/onboard`. Everything else hydrates from the SPA shell.

The quiz and board are the same React trees as before. `LinkButton` uses TanStack `Link`. Fastify still serves `/health`, `/players`, and `/rank`.

## Surfaces touched

- Pages: `/`, `/about`, `/how-it-works`, `/onboard`, `/draft`.
- Client shell: Start router, root document, pending fallback.
- Store: `localStorage` guards for prerender.
- Docs: stack lock in `00-product-and-stack.md`.

## User-visible vs contract

- **UI:** Home now links to Scoring and About. Onboard has a home link. Client-side navigation between those routes.
- **Contract:** `DraftProfile` and `POST /rank` are unchanged. `PUBLIC_API_URL` still points at Fastify.

## Known gaps

- Rank fetch still needs `npm run dev:api`.
- CDN hosts still need a rewrite of unknown paths to the SPA shell (`/_shell.html`).
- `/cats` glossary is still unwritten.

## How to verify

1. Open `/`. Start goes to `/onboard`. Scoring and About are readable without the API.
2. Complete the quiz. Lands on `/draft?assist=1` with a ranked table (API running).
3. Refresh `/draft`. Profile and flat table remain. Clear `ww.draftProfile` and open `/draft` again: lands on `/onboard`.
4. `npm run build -w @waiver-warrior/client` emits HTML for `/`, `/about`, `/how-it-works`, `/onboard`, and a `_shell.html`. No prerendered `/draft/index.html`.

## Next steps

Revisit table chrome and density on the Start shell if the board still feels like the Astro island. CAT glossary when copy exists.

## Reference docs

- [00-product-and-stack.md](../00-product-and-stack.md)
- [M3-onboarding.md](../M3-onboarding.md)
- [M4-draft-assistant.md](../M4-draft-assistant.md)
