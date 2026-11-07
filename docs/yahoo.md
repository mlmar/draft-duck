# Yahoo weekly league comparison setup

The optional `/league` page connects Yahoo and displays actual credited team statistics for a selected basketball league and matchup week. The draft board and Team Lab retain their existing CSV data and local storage. There are no app accounts, roster imports, scheduled statistics, or Yahoo writes.

## Local configuration

Keep `YAHOO_ENABLED=false` until the database migration and server configuration are ready. Existing `/health`, `/players`, and `/rank` continue to work while Yahoo is disabled.

Copy the optional variables from [`.env.example`](../.env.example) into the root `.env`. Use a **server secret key**, never a browser publishable/anonymous key. Do not prefix credentials with `PUBLIC_` or `VITE_`, paste them into chat, or commit them.

- `SUPABASE_URL`: the existing project URL.
- `SUPABASE_SECRET_KEY`: the backend secret key with access to `draft_duck`.
- `YAHOO_CLIENT_ID` and `YAHOO_CLIENT_SECRET`: approved Fantasy Sports read credentials.
- `YAHOO_REDIRECT_URI`: the registered URL that reaches this API's `/yahoo/oauth/callback`, exactly matching protocol, host, port, and path.
- `YAHOO_TOKEN_ENCRYPTION_KEY`: a base64-encoded 32-byte random key. Generate locally with `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"`.

### Connected, but Fantasy Sports access is denied

Successful OAuth confirms sign-in and token exchange. Yahoo can still reject Fantasy Sports requests with HTTP 403: “This application is not authorized to perform this action.” The app keeps the session and displays an access denial instead of an expired-session message.

Check the application's **Fantasy Sports Read** permission and confirm Yahoo has provisioned Fantasy Sports API access for the exact Client ID configured on the server. Yahoo's [access application](https://sports.yahoo.com/developer/access/) and [application confirmation](https://sports.yahoo.com/developer/application-confirmation/) describe the approval and Client ID confirmation steps. Retry loading leagues while the temporary session remains valid, or connect again after expiry. Provisioning delay is a possible explanation for an access denial, not a confirmed diagnosis.

The user has reported successful local OAuth after correcting the registered callback. League discovery and weekly-value accuracy remain unverified because the subsequent Fantasy request returned 403.

### Scoring compatibility

The implementation currently accepts category formats identified by `head` and `roto`, with any nonempty subset of the standard nine categories. Points and unknown formats remain explicitly unsupported. Yahoo describes [Head-to-Head One Win](https://help.yahoo.com/kb/SLN6212.html) as category scoring with a different standings outcome, but its API scoring identifier and payload compatibility have not been established from authoritative evidence. Do not infer compatibility by adding an unverified identifier to the allowlist; verify a sanitized settings payload before extending support.

Displayed ranks use competition ties (`1, 2, 2, 4`). Heat colors use the relative position among distinct values, rather than competition rank or numerical distance: ties share a color, missing/all-tied results are neutral, and lower turnovers are better. Manual refresh updates available-week metadata while retaining the selected historical week.

### Local HTTPS without a tunnel

With trusted mkcert certificates at `~/.config/draft-duck/certs/localhost.pem` and `~/.config/draft-duck/certs/localhost-key.pem`, the API can serve HTTPS directly. Certificate files stay outside the repository. The optional `API_TLS_CERT_FILE` and `API_TLS_KEY_FILE` variables can override both paths together; absolute paths and `~/` paths are supported.

Configure the root `.env` for this mode:

```dotenv
PUBLIC_API_URL=https://localhost:3300
YAHOO_REDIRECT_URI=https://localhost:3300/yahoo/oauth/callback
CLIENT_ORIGIN=http://localhost:3000
```

Register that exact callback in the Yahoo app. Yahoo's [official sign-in example](https://developer.yahoo.com/sign-in-with-yahoo/) uses an HTTPS localhost callback. The user has confirmed successful consent with this callback after correcting its registered port; this does not establish Fantasy API access or weekly results.

Start the API and client in separate terminals:

```bash
npm run dev:api
```

```bash
npm run dev:client
```

The standard dev command enables HTTPS on port 3300 and loads certificates only for that process. The `npm run dev:api:https` alias remains available. For HTTP development, use `npm run dev:api:http` and set `PUBLIC_API_URL=http://localhost:3300`. Run one API mode at a time; stop the existing process before switching modes and restart the client after changing its API URL. Local certificate loading refuses production mode; Cloud Run continues to terminate TLS in front of the normal HTTP API through `npm start`.

Check `https://localhost:3300/health`, then open `http://localhost:3000/league`. Browser cookies are first-party on the HTTPS API callback origin; API fetches continue to use the in-memory app credential. No tunnel or public deployment is required for this local transport setup.

The API's Supabase client selects `draft_duck` explicitly. It uses no Supabase Auth user session and does not expose its key to the client. Add `draft_duck` to the Data API's exposed-schema list without replacing existing entries.

## Database migration

Review and apply [`202611060001_yahoo_comparison_sessions.sql`](../supabase/migrations/202611060001_yahoo_comparison_sessions.sql) using the project's normal privileged SQL migration process. Creating/exposing the schema alone does not create the session tables or functions. Migrations are not applied by API boot or by a client visit.

The migration must leave browser roles without schema/table/function access, enable RLS without browser policies, and restrict atomic connection functions to backend execution. Verify anonymous and authenticated access is denied against the actual project; fixture tests do not establish live permissions. Preserve unrelated schemas and project-wide exposed-schema settings.

These read-only SQL checks inspect permissions without selecting session contents. Expect no table or function permissions for `anon`/`authenticated`, backend permissions for `service_role`, and RLS enabled on both session tables:

```sql
select role_name,
       has_schema_privilege(role_name, 'draft_duck', 'USAGE') as schema_usage,
       has_table_privilege(role_name, 'draft_duck.yahoo_oauth_attempts', 'SELECT') as attempts_read,
       has_table_privilege(role_name, 'draft_duck.yahoo_sessions', 'SELECT') as sessions_read
from unnest(array['anon', 'authenticated', 'service_role']) as roles(role_name);

select c.relname, c.relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'draft_duck' and c.relkind = 'r';

select p.proname, roles.role_name,
       has_function_privilege(roles.role_name, p.oid, 'EXECUTE') as can_execute
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
cross join unnest(array['anon', 'authenticated', 'service_role']) as roles(role_name)
where n.nspname = 'draft_duck' and p.proname like 'yahoo_%'
order by p.proname, roles.role_name;
```

After configuration and migration, set `YAHOO_ENABLED=true`, start `npm run dev:api` and `npm run dev:client`, then open `/league`. No saved draft profile is needed. Run `npm test` for fixture-based checks before attempting a real connection.

### Local regression checks

`npm test` includes pure comparison, API fixture, static markup, and mounted client lifecycle checks. Mounted tests use a per-file DOM environment and mocked Yahoo requests; they do not open a browser or establish phone layout, real consent, or provider payload compatibility.

Run `npm run test:sql -w @draft-duck/api` for the actual migration's permission and lifecycle checks against a disposable PostgreSQL 17 Docker container. It uses synthetic data, publishes no ports, and does not load `.env` or connect to Supabase. Docker must already be available; the command fails when unavailable rather than reporting skipped checks as passed. Only its own container is removed. These local checks cannot establish the hosted project's grants, exposed-schema configuration, or migration freshness.

## Temporary connection lifecycle

Connect opens a popup or tab. The app starts authorization by POSTing its attempt proof from the configured client origin, so an attempt's public URL alone cannot authorize another browser's account. The original page polls with a secret held in memory and claims the completed connection once. OAuth callback pages contain no access tokens. Attempts expire after ten minutes. App sessions expire after one hour or earlier provider expiry, and reloading requires reconnection. Yahoo refresh tokens are discarded.

Supabase stores encrypted Yahoo access tokens and hashes of app credentials. The API checks expiry before serving data; scheduled cleanup is storage hygiene, not the authorization boundary. Disconnect invalidates the app session, but does not revoke the Yahoo application's permission in the user's Yahoo account settings.

## Production rollout and cleanup

Keep Yahoo disabled until migration, real API values, and permitted browser checks pass. Use Secret Manager bindings on the existing Cloud Run service for the Supabase secret, Yahoo client secret, and encryption key. Configure the project URL, client ID, callback URL, and `YAHOO_ENABLED` as server environment variables. The callback must use the API's HTTPS origin. Keep `CLIENT_ORIGIN` set to the exact client origin.

The deploy workflow explicitly merges existing environment variables and secret bindings. Do not replace them with a partial set or put secret values in GitHub variables. Preserve the existing loopback default locally and public Cloud Run deployment limits.

The Yahoo limiter currently uses the socket peer address, without trusting forwarded headers. A shared proxy address therefore shares a per-route budget; this is not yet validated for the deployed Cloud Run ingress path. Before rollout, establish that path's client-address contract and verify independent visitor limits plus spoofed-header resistance. Do not enable unrestricted proxy trust or treat a caller-supplied `X-Forwarded-For` value as authoritative. Google's [external load balancer documentation](https://docs.cloud.google.com/load-balancing/docs/https#x-forwarded-for_header) explains that incoming unverified values can precede appended addresses; it does not establish this service's exact proxy chain. Limits are also process-local, not a distributed abuse-control boundary.

Before enabling live OAuth, exclude callback request URLs from managed HTTP/access logs, including Cloud Run request logs and any development tunnel logs: the provider sends short-lived authorization codes in that URL. Application log redaction cannot redact logs generated by an upstream platform. Retain non-sensitive callback outcome/error metrics rather than full URLs.

Use `npm run cleanup:yahoo -w @draft-duck/api` in a separate Cloud Run Job built from the same image. Configure only `SUPABASE_URL` and `SUPABASE_SECRET_KEY`, a least-privilege runtime identity, one task, and no public HTTP endpoint. Schedule execution hourly with Cloud Scheduler authenticated to the Cloud Run Jobs API using a dedicated invoker service account. Do not run cleanup on the browser or change the public API into a publicly callable cleanup service. See [scheduled Cloud Run jobs](https://docs.cloud.google.com/run/docs/execute/jobs-on-schedule).

For an authorized rollout, configure `GCP_PROJECT_ID`, `GCP_REGION`, `YAHOO_API_IMAGE` (the verified SHA image), `YAHOO_CLEANUP_RUNTIME_SA`, `YAHOO_CLEANUP_INVOKER_SA`, `SUPABASE_URL`, and `SUPABASE_SECRET_NAME` (a Secret Manager name, not the secret value). Create the two dedicated service accounts first; grant the runtime account access only to the referenced secret. Then prepare the job and authenticated schedule:

```bash
gcloud run jobs deploy draft-duck-yahoo-cleanup \
  --project="$GCP_PROJECT_ID" --region="$GCP_REGION" \
  --image="$YAHOO_API_IMAGE" \
  --service-account="$YAHOO_CLEANUP_RUNTIME_SA" \
  --command=npm --args=run,cleanup:yahoo,-w,@draft-duck/api \
  --set-env-vars="SUPABASE_URL=$SUPABASE_URL" \
  --set-secrets="SUPABASE_SECRET_KEY=$SUPABASE_SECRET_NAME:latest" \
  --tasks=1 --parallelism=1 --max-retries=1 --task-timeout=300s --memory=512Mi

gcloud run jobs add-iam-policy-binding draft-duck-yahoo-cleanup \
  --project="$GCP_PROJECT_ID" --region="$GCP_REGION" \
  --member="serviceAccount:$YAHOO_CLEANUP_INVOKER_SA" --role=roles/run.invoker

gcloud scheduler jobs create http draft-duck-yahoo-cleanup-hourly \
  --project="$GCP_PROJECT_ID" --location="$GCP_REGION" \
  --schedule='0 * * * *' --time-zone=UTC --http-method=POST \
  --uri="https://run.googleapis.com/v2/projects/$GCP_PROJECT_ID/locations/$GCP_REGION/jobs/draft-duck-yahoo-cleanup:run" \
  --oauth-service-account-email="$YAHOO_CLEANUP_INVOKER_SA" \
  --headers='Content-Type=application/json' --message-body='{}'
```

These commands change hosted resources; they have not been run. For an existing scheduler, review its configuration before using the equivalent update command. Verify that a one-shot job exits successfully and that expired-record counts decrease before relying on the schedule; do not print session contents.

Hosted migrations, secret bindings, job/scheduler creation, merge, and deployment are separate rollout actions; none are performed by implementing the repository files.

## Acceptance checks

1. A real user can connect, choose an owned basketball league, and choose a started week.
2. Every team appears, owned teams are marked, and values match Yahoo's credited weekly results. Current-week data is labelled in progress.
3. Unsupported formats are explained. Missing statistics remain unranked; zero and ties are preserved; turnovers rank in the lower-is-better direction.
4. A denied login, expired attempt/session, duplicate claim, unauthorized league, and disconnect cannot expose a credential or another user's results.
5. Phone/desktop layout, keyboard sorting, horizontal scrolling, cancellation, refresh failure, and reconnection work using permitted browser access. Do not use Chrome.
6. Live database grants/RLS and atomic claim behavior are demonstrated, and the hourly cleanup job is verified when deployed.

Source/fixture and generated-output checks are useful but do not establish live OAuth, database permissions, rendered behavior, or deployment. Track exact outcomes and pending evidence in the [roadmap](plans/2026-11-06-yahoo-league-comparison.md).
