# Deploy review follow-up

Implemented on this branch. The locks that keep this from regressing are [deploy.md](../deploy.md) (Do not regress), `.github/workflows/verify-deploy.yml`, and the client path/URL tests. `npm test` must keep running both workspaces.

Address the review on [PR #11](https://github.com/mlmar/draft-duck/pull/11) before the first public deploy. Pages + Cloud Run stay the hosts. Ranker, `POST /rank`, quiz order, and board chrome stay put.

No app behavior change except listen bind, URL checks, and the 404 copy path. Yahoo, auth, live NBA, and AI stay later.

## Why

The merge-triggered API job can fail on GitHub cache write before it ever reaches Cloud Run. The client job can publish without `404.html`. Local `dev:api` now binds every interface. Those are the holes that block a first good deploy.

## What stays

- Client on GitHub Pages at `/draft-duck/`. API in Cloud Run. SHA tag, not `:latest`, is what `deploy-cloudrun` points at.
- WIF, Artifact Registry, and the `github-deployer` SA stay console work.
- Artifact Registry cleanup (30 days + keep-last-5) stays a later follow-up. Do not add an Action that deletes images on every deploy.
- `--allow-unauthenticated` stays. The browser needs `POST /rank`. CORS stays one origin (`https://mlmar.github.io`).
- `tsx` as a production dependency stays for this pass. A compiled JS image is a later shrink, not this review.

## Comments and the work

| #11 comment                                     | Change                                                                                                                                                                                                                                           |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `deploy-api.yml` cache on `pull_request` closed | Deploy API on `push` to `main` plus `workflow_dispatch`. Drop the closed-PR trigger. `cache-to: type=gha` is writable on `push`.                                                                                                                 |
| No verify until after merge                     | New `verify-deploy.yml` on `pull_request` to `main` (opened / synchronize). Docker build, no push. Client production build with a dummy `https://` API URL and `PUBLIC_BASE_PATH=/draft-duck/`. Assert `app/client/dist/client/404.html` exists. |
| Cloud Run unbounded                             | On `deploy-cloudrun`, set `--max-instances=3`, `--memory=512Mi`, `--timeout=60`. If the first boot OOM or the startup probe fails, bump memory to `1Gi` in the same flags. Keep the `/health` probe on 8080.                                     |
| `copy-spa-404.mjs` three roots                  | Look only at `dist/client/_shell.html`. Copy to `dist/client/404.html`. Any other path fails the build.                                                                                                                                          |
| `PUBLIC_API_URL` non-empty only                 | In `deploy-client`, require `https://`, no trailing slash, host is not `localhost` / `127.0.0.1`.                                                                                                                                                |
| `HOST=0.0.0.0` by default                       | Default `HOST` to `127.0.0.1`. Dockerfile sets `ENV HOST=0.0.0.0`. Cloud Run keeps working. Local `npm run dev:api` is loopback again.                                                                                                           |
| `base-path.ts` untested                         | Vitest next to the helper (or a tiny file under `app/client` that `npm test` can reach). Cases: unset, `/`, `/draft-duck`, `/draft-duck/`. Vite gets a trailing slash. Router gets no trailing slash, or `undefined` for `/`.                    |
| Dockerfile root user                            | Optional. Only if the listen default moves. `ENV HOST=0.0.0.0` is required. `USER` is nice-to-have, not a merge gate.                                                                                                                            |

## Suggested order

1. **Listen bind + Dockerfile `HOST`.** Small, local-safe, unblocks image correctness.
2. **`copy-spa-404.mjs` publish-dir only.** Then you can trust the verify job.
3. **`base-path` tests + `PUBLIC_API_URL` checks.** Same client-path theme.
4. **`verify-deploy.yml`.** Prove docker build and `404.html` on the PR.
5. **Retarget `deploy-api` / `deploy-client` to `push` + dispatch.** Same `if` is no longer needed for `merged == true`. A closed-unmerged PR already does nothing on `push`.
6. **Cloud Run flags.** `max-instances`, memory, timeout.

Do not land 5 without 4. The new `push` trigger deploys whatever hits `main`. The verify job is the gate.

## Workflow shape after

```text
PR to main          → verify-deploy (build only)
merge / push main   → deploy-api, then humans set PUBLIC_API_URL once
                    → deploy-client
workflow_dispatch   → same deploy jobs
```

First-time console work is unchanged: WIF, Artifact Registry, Pages source = `build/client`. See [deploy.md](../deploy.md).

`deploy-client` still requires `PUBLIC_API_URL` after Cloud Run exists. First client deploy is still dispatch (or a second push after the variable is set).

## User-visible vs contract

- **UI:** None if Pages already has `404.html`. Cold-open `/draft-duck/draft` keeps working. Rank error copy stays the production sentence.
- **Local:** API listens on `127.0.0.1` again unless `HOST` is set.
- **Contract:** `POST /rank` unchanged. `PUBLIC_BASE_PATH` / `PUBLIC_API_URL` still bake-time.

## How to verify

1. `npm run dev:api` binds `127.0.0.1:3300`. `curl` from the same machine still ranks. A phone on the LAN does not.
2. `PUBLIC_BASE_PATH=/draft-duck/ PUBLIC_API_URL=https://example-run.app npm run build -w @draft-duck/client`. `app/client/dist/client/404.html` exists and matches `_shell.html`.
3. `viteBase` / `routerBasepath` tests pass. `npm run test` still passes in core.
4. On the PR, verify-deploy is green: docker build succeeds, client assert passes.
5. After merge (or dispatch): Cloud Run revision for `draft-duck-api:$GITHUB_SHA`. `GET {origin}/health` is ok. Console shows max instances 3.
6. Client deploy. Open `/draft-duck/`, finish the quiz, rank. Cold-open `/draft-duck/draft` hydrates.

## Out of scope

- Artifact Registry cleanup policies.
- Compiling the API to JS (drop `tsx` from the image).
- Custom domain, second CORS origin.
- Rate limits or Cloud Armor. Max instances is the cost cap for this pass.
- Auth, Yahoo, live NBA, AI.

## Reference docs

- [deploy.md](../deploy.md)
- [2026-09-25-deploy.md](../changes/2026-09-25-deploy.md)
- [PR #11](https://github.com/mlmar/draft-duck/pull/11)
