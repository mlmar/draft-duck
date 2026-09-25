# Deploy the draft helper

Public loop is GitHub Pages for the client and Cloud Run for Fastify. Yahoo, auth, live NBA fetch, and AI stay the later live-season half.

```text
https://mlmar.github.io/draft-duck/  →  POST {Cloud Run}/rank
```

## Local vs production

| Variable            | Local                   | Production                              |
| ------------------- | ----------------------- | --------------------------------------- |
| `PUBLIC_BASE_PATH`  | `/`                     | `/draft-duck/` (Pages project path)     |
| `PUBLIC_API_URL`    | `http://localhost:3300` | Cloud Run origin, no trailing slash     |
| `CLIENT_ORIGIN`     | `http://localhost:3000` | `https://mlmar.github.io`               |
| `API_PORT` / `PORT` | `API_PORT=3300`         | Cloud Run injects `PORT` (usually 8080) |
| `HOST`              | `127.0.0.1` (default)   | image sets `HOST=0.0.0.0`               |
| `CSV_PATH`          | default `app/data/` CSV | same path inside the image              |

Local: `npm run dev:api` and `npm run dev:client` from the repo root. `.env` can copy [`.env.example`](../.env.example).

## Do not regress

These locks are why the first public deploy works. Do not loosen them to "make CI nicer."

| Lock                                                                                                                                                 | Why                                                                                                                                                           |
| ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Local API binds `127.0.0.1` unless `HOST` is set. The Dockerfile sets `HOST=0.0.0.0`.                                                                | Cloud Run needs all interfaces. `npm run dev:api` must not sit on the LAN.                                                                                    |
| `404.html` is copied only from `dist/client/_shell.html` into that same folder.                                                                      | `deploy-client` publishes `app/client/dist/client`. A hit in `dist/` or `.output/` would exit 0 and Pages would still 404 `/draft`.                           |
| Production `PUBLIC_API_URL` is `https://`, no trailing slash, not loopback, origin only.                                                             | The client concatenates `${API_URL}/rank`. Localhost or a slash ships a dead board. Checked by `assert-public-api-url.mjs`.                                   |
| Vite `base` has a trailing slash. Router `basepath` does not (`undefined` for `/`).                                                                  | `base-path.test.ts`. A missing leading slash is prefixed so the base is never relative.                                                                       |
| Deploy workflows trigger on `push` to `main` plus `workflow_dispatch`. Not `pull_request` closed.                                                    | Closed-PR runs get a read-only GHA cache. `cache-to: type=gha` can fail the job before Cloud Run updates.                                                     |
| PRs run [verify-deploy.yml](../.github/workflows/verify-deploy.yml) (`npm test`, Pages client build, `404.html` present, Docker build with no push). | Deploy jobs only run after merge. A broken image or missing shell must fail the PR.                                                                           |
| Cloud Run `--max-instances=3`, `--memory=512Mi`, `--timeout=60`.                                                                                     | `--allow-unauthenticated` stays. CORS is not access control. Max instances is the cost cap. Bump memory to `1Gi` only if boot OOM or the startup probe fails. |
| Image `npm ci` uses `--ignore-scripts`, drops `node_modules/vite`, then `node node_modules/esbuild/install.js`. `HUSKY=0`.                           | Full lockfile still sees client Vite. Its esbuild 0.25 fights tsx's 0.28. `npm rebuild esbuild` walks both and dies. Do not switch back to rebuild.           |

`npm test` runs core goldens **and** the client path/URL tests. Keep both.

## GitHub Actions

```text
PR to main          → verify-deploy (build only)
push to main        → deploy-api and deploy-client
workflow_dispatch   → same deploy jobs
```

A closed-unmerged PR does nothing. A push to `main` deploys. First client deploy still needs `PUBLIC_API_URL` set after Cloud Run exists. If that variable is missing, the client job fails on purpose. Set it, then dispatch **Deploy client** (or push again).

| Workflow                                                                        | What it does                                                                                     |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [`.github/workflows/verify-deploy.yml`](../.github/workflows/verify-deploy.yml) | PR gate: tests, Pages client build, assert `404.html`, Docker build no push                      |
| [`.github/workflows/deploy-api.yml`](../.github/workflows/deploy-api.yml)       | Docker build, push `draft-duck-api:$GITHUB_SHA` to Artifact Registry, `deploy-cloudrun` that SHA |
| [`.github/workflows/deploy-client.yml`](../.github/workflows/deploy-client.yml) | Check `PUBLIC_API_URL`, `vite build` with Pages base, copy shell to `404.html`, peaceiris        |

Deploy the API first. Copy the Cloud Run URL into the `PUBLIC_API_URL` repo variable. Then dispatch the client workflow. First time after `build/client` exists: repo Settings → Pages → Deploy from a branch → `build/client` / `/`.

### Repository variables

[Settings → Secrets and variables → Actions → Variables](https://github.com/mlmar/draft-duck/settings/variables/actions). Not secrets. Not a GitHub Environment.

| Name                  | Example                                                                                  |
| --------------------- | ---------------------------------------------------------------------------------------- |
| `GCP_PROJECT_ID`      | your project id string                                                                   |
| `GCP_REGION`          | same region as the Artifact Registry repo                                                |
| `GCP_AR_REPOSITORY`   | Docker repo id                                                                           |
| `CLOUD_RUN_SERVICE`   | `draft-duck-api`                                                                         |
| `WIF_PROVIDER`        | `projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github/providers/github` |
| `WIF_SERVICE_ACCOUNT` | `github-deployer@PROJECT_ID.iam.gserviceaccount.com`                                     |
| `PUBLIC_API_URL`      | set after the first Cloud Run URL exists                                                 |

`WIF_PROVIDER` is the **provider** resource name. No `iam.googleapis.com/` prefix. The pool path alone is not enough. `PUBLIC_API_URL` must pass [assert-public-api-url.mjs](../app/client/scripts/assert-public-api-url.mjs).

## GCP setup (one-time)

You do not create the Cloud Run service in the console. The first API workflow creates it.

1. Billing on the project. Enable `run`, `artifactregistry`, `iam`, `iamcredentials`, `sts`.
2. Artifact Registry Docker repo in the Cloud Run region.
3. Service account `github-deployer` with Artifact Registry Writer, Cloud Run Admin, and Service Account User on the default Compute Engine SA.
4. Workload Identity Federation pool `github`, OIDC provider `github`:
    - Issuer: `https://token.actions.githubusercontent.com`
    - Map `google.subject` → `assertion.sub`, `attribute.repository` → `assertion.repository`, `attribute.repository_owner` → `assertion.repository_owner`
    - Condition: `assertion.repository == "mlmar/draft-duck"`
5. Grant access on the pool: SA `github-deployer`, attribute `repository` = `mlmar/draft-duck`. Dismiss the credential-config download.
6. Set the GitHub variables above.

Walkthrough: [google-github-actions/auth](https://github.com/google-github-actions/auth#workload-identity-federation-through-a-service-account).

## How to verify

1. `npm run dev:api` binds `127.0.0.1:3300`. Quiz still lands on `/draft` at localhost.
2. `npm test` passes core and the client path/URL cases.
3. `PUBLIC_BASE_PATH=/draft-duck/ PUBLIC_API_URL=https://example-run.app npm run build -w @draft-duck/client`. `app/client/dist/client/404.html` exists.
4. On the PR, **Verify deploy** is green.
5. After merge (or dispatch): Cloud Run revision for `draft-duck-api:$GITHUB_SHA`. `GET {origin}/health` is ok. Console shows max instances 3.
6. Set `PUBLIC_API_URL`. Dispatch **Deploy client**. Open `https://mlmar.github.io/draft-duck/`. Finish the quiz. Cold-open `/draft-duck/draft` hydrates.

## Follow-up: prune images

Not in this deploy. After a few SHA tags exist, add **both** Artifact Registry cleanup policies (keep-only does nothing):

- Delete versions older than 30 days, any tag state.
- Keep the most recent 5 of `draft-duck-api`.

Console: Artifact Registry → repo → Cleanup policies. Or `gcloud artifacts repositories set-cleanup-policies`. Keep wins when both match. Live Cloud Run revisions already imported their digest. Deleting a registry copy only blocks redeploying that digest.

Manual:

```bash
gcloud artifacts docker images list REGION-docker.pkg.dev/PROJECT/REPO/draft-duck-api
gcloud artifacts docker images delete IMAGE@sha256:... --delete-tags
```

Do not add a GitHub Action that deletes images on every deploy.
