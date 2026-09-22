# Onboarding quiz

## Intent of the changes

Close M3. A first-time user can finish a short CAT quiz on `/onboard`, persist a Zod-valid `DraftProfile`, see that the quiz changes a top-10 board, and reach a `/draft` stub. Ranking math stays in `app/core`. The quiz is built so later sessions can change step order and chrome without rewriting each screen.

## What did not change

- Ranker formulas, operator JSON meaning, and `POST /rank` request/response shape.
- Home page, Astro static output, and Fastify as the ranking HTTP surface.
- No accounts, no draft pick tracking, no Yahoo fields on `DraftProfile`.
- `/draft` is a stub only. Redirect-if-no-profile and top 3-5 cards are M4.

## Tradeoffs

- **One island, step list as data.** Flow lives in `STEPS`. Reorder or drop a screen by editing that array. A nested wizard or a new Astro route per question would make copy and order harder to change.
- **Plain chrome, one chip primitive.** `QuizShell` owns title, progress, Back / Continue / Skip. League size, draft type, presets, and Need / Neutral / Punt share `ChoiceRow`. Skipped extra shadcn kits (radio, toggle, slider) so restyle later hits two files, not seven steps.
- **`client:only="react"` instead of `client:load`.** The island does not SSR, so persist/localStorage does not fight hydration. Marketing pages stay static. The quiz shows a short "Loading quiz…" fallback until JS mounts.
- **Same `@draft-duck/core` barrel for client and API.** A separate browser entry was rejected. Operator weights now import the JSON file. `CsvProvider.load()` dynamically imports `node:fs` and `csv-parse` so evaluating the barrel in the browser does not pull Node fs. `load()` is still Node-only.

## High-level overview of the current implementation

`/` still links to `/onboard` with a real `<a>`. `/onboard` is an Astro shell plus one React island.

The island keeps an in-progress `QuizDraft` in React state. `QuizShell` renders the current `STEPS` entry. Most steps only call `onChange`. Intensity skip/continue flips `includeIntensity`. Archetype cards nudge enabled non-punt stances (stocks => STL/BLK need, points => PTS need). Review is the only step that parses with `draftProfileSchema`, writes the store, and `POST`s `/rank`.

On finish, the profile is written to `localStorage` as raw `DraftProfile` JSON under `dd.draftProfile`. Revisit `/onboard` hydrates that into the form from step 1. Invalid JSON is dropped and the quiz restarts from defaults (12 teams, 13 rounds, snake, 9-cat, all Neutral). Skip intensity omits `intensity` from the payload. Rank failure stays on review.

`/draft` is a static stub with a link back to the quiz.

## Surfaces touched

- Pages: `/onboard` island, `/draft` stub.
- Island: `OnboardQuiz`, `QuizShell`, `ChoiceRow`, `STEPS` plus seven step modules.
- Client store: Zustand persist `dd.draftProfile`.
- Client fetch: `PUBLIC_API_URL` + TanStack Query mutation to `POST /rank`.
- Core: `CAT_LABELS`, JSON operator weights, lazy fs in `CsvProvider.load()`.

## User-visible vs contract

- **UI:** 7 screens (league, draft type, CAT preset, stances, optional intensity, optional stocks/points, review + top 10). Continue to draft is an `<a href="/draft">`.
- **Contract:** `DraftProfile` and `POST /rank` are unchanged. Persistence key is `dd.draftProfile` (the profile object, not Zustand's wrapper). 8-cat omits `tov` from `enabledCats`. Punt is `stances[c] = 'punt'`.
- **Restore:** Refresh on `/onboard` prefills the last valid profile. Garbage in that key is deleted.

## Known gaps

- Rank preview needs `npm run dev:api` and CORS/`PUBLIC_API_URL` aligned. Failure shows an error and does not leave `/onboard`.
- `/draft` does not read the profile or track picks.
- In-progress answers are not saved until Rank my board succeeds at parsing. Refresh mid-quiz restores the last completed profile, or defaults if none.
- Intensity uses a native range input. Fine, not polished.
- Rank-error path was not exercised by mocking `fetch` in the browser session. The UI branch exists.

## How to verify

1. From `/`, Start goes to `/onboard` (no client router). Complete required steps, skip intensity and the archetype pair, Rank my board. Confirm a top 10 and `localStorage.dd.draftProfile` is Zod-valid JSON.
2. Choose 8-cat. Confirm `enabledCats` has no `tov`. Punt FG%. Confirm `stances.fgPct` is `"punt"` and intensity skip omits `intensity`.
3. Refresh `/onboard`. League size and stances restore. Edit and re-rank.
4. Put invalid JSON in `dd.draftProfile`, refresh. Quiz restarts at defaults and the key is gone.
5. Stop the API, Rank my board. Error stays on review. With API up, Continue to draft opens the stub.

## Next steps

M4 draft assistant: session store, `POST /draft/recommendations`, mark taken / my pick, redirect to `/onboard` when there is no profile.

## Reference docs

- [M3-onboarding.md](../M3-onboarding.md)
- [00-product-and-stack.md](../00-product-and-stack.md)
- [README.md](../README.md) (M3 marked Done)
