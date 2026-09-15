# M3 — Onboarding

## Goal

A first-time user completes a short quiz on `/onboard`, persists a `DraftProfile` in `localStorage`, and can `POST /rank` with that profile. Ranking UI can be a simple ordered list; the draft board is M4.

## In scope

- Astro page `/onboard` with one React island (`client:load`)
- Multi-step quiz **inside** that island (not a new Astro route per question)
- Default flow below (revisable in copy, not in schema)
- Zustand store + `localStorage` persist for `DraftProfile`
- TanStack Query `POST /rank` after review
- Review step showing stance summary before continue
- Navigate to `/draft` on finish (`/draft` may still be a stub until M4)
- Zod parse of profile on the client before POST (same schema as `app/core`)

## Out of scope

- Draft pick tracking and top 3–5 cards (M4)
- Auction
- Accounts
- Tinder-style for every question (one optional swipe pair only)
- Changing ranker math

## Stack / touchpoints

| Piece            | Where                                   |
| ---------------- | --------------------------------------- |
| `/onboard.astro` | `app/client`                            |
| Quiz island      | `app/client` React component(s)         |
| Profile store    | Zustand persist                         |
| Rank fetch       | TanStack Query → Fastify `POST /rank`   |
| Schema           | `app/core` `DraftProfile` Zod (from M2) |

### Default quiz flow

Keep it short. One island, step state in React.

1. **League:** size `8 | 10 | 12 | 14`; draft rounds (default 13, editable).
2. **Draft type:** snake or linear.
3. **CAT preset:** 9-cat (all nine), 8-cat (omit `tov`), or custom toggles for `enabledCats`.
4. **Stances:** for each enabled cat, chips Need / Neutral / Punt. Default Neutral.
5. **Optional intensity:** skippable screen; sliders 0–2 per enabled non-punt cat. Omit from payload when skipped.
6. **Optional archetype swipe (one pair):** e.g. “stocks (stl/blk) vs points”. Skip allowed. If chosen, nudge `stances` or `intensity` (document the nudge in code: e.g. stocks ⇒ `need` on `stl` and `blk`). Do not add more swipe pairs in v1.
7. **Review** → persist → `POST /rank` → link/button to `/draft`.

No Yahoo ids on `DraftProfile`.

### Persistence

- Key: `ww.draftProfile` (or similar, namespaced).
- Revisit `/onboard` should restore the last profile and allow edit.
- Invalid / outdated JSON: drop and restart quiz (Zod failure).

### Rank preview

After review, show a compact top-10 from `/rank` so the user sees the quiz matter. Full draft UX is M4. If `/rank` fails, show an error; do not navigate away.

## Acceptance checks

- Completing the quiz writes a Zod-valid `DraftProfile` to `localStorage`.
- 8-cat preset omits `tov` from `enabledCats`.
- Punt chips produce `stances[c] = 'punt'`; `/rank` response composites ignore that cat (weight 0).
- Refresh on `/onboard` restores the profile.
- Skip intensity and skip swipe still produce a valid profile.
- “Start” on `/` reaches `/onboard` without a client router.
- `/onboard` HTML shell is Astro; interactivity is a React island (view source / network: island hydrates, rest of marketing pages stay static).

## Suggested build order

1. Export Zod schema from `app/core`; consume in web and api.
2. Zustand persist + empty quiz shell (stepper).
3. Steps 1–4 (league, type, preset, stances).
4. Review + POST `/rank` + top-10 list.
5. Optional intensity + one swipe pair.
6. Navigate to `/draft` stub.
