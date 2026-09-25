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
| `HOST`              | `0.0.0.0` (default)     | same                                    |
| `CSV_PATH`          | default `app/data/` CSV | same path inside the image              |

Local: `npm run dev:api` and `npm run dev:client` from the repo root. `.env` can copy [`.env.example`](../.env.example).

## GitHub Actions

Two workflows, same triggers: **manual Run workflow** or a **PR merged into `main`**. A closed-unmerged PR does nothing. A direct push to `main` does nothing unless you dispatch.

| Workflow                                                                        | What it does                                                                                     |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [`.github/workflows/deploy-api.yml`](../.github/workflows/deploy-api.yml)       | Docker build, push `draft-duck-api:$GITHUB_SHA` to Artifact Registry, `deploy-cloudrun` that SHA |
| [`.github/workflows/deploy-client.yml`](../.github/workflows/deploy-client.yml) | `vite build` with Pages base, copy `_shell.html` → `404.html`, peaceiris to `build/client`       |

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

`WIF_PROVIDER` is the **provider** resource name. No `iam.googleapis.com/` prefix. The pool path alone is not enough.

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

1. Dispatch **Deploy API**. Cloud Run shows a revision for `draft-duck-api:$GITHUB_SHA`. `GET {origin}/health` returns `{ "ok": true }`.
2. Set `PUBLIC_API_URL`. Dispatch **Deploy client**. `build/client` updates. Open `https://mlmar.github.io/draft-duck/`.
3. Finish the quiz. `/draft` ranks against Cloud Run.
4. Cold-open `/draft-duck/draft`. GitHub serves `404.html` (the SPA shell) and the router hydrates.
5. Local still works at `/` with `PUBLIC_API_URL=http://localhost:3300`.

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
