---
date: 2026-11-06
approved: true
shipped: false
---

# Yahoo weekly league comparison

Current checkpoint: local review corrections and regression validation are complete, with **189 passing tests** (117 core, 52 client, 20 API), all workspace TypeScript checks, and a production Pages build. Delivery is authorized as a feature-branch commit and draft PR. **Not ready with named blockers:** real Yahoo weekly values, hosted permissions, rendered browser acceptance, Docker/SQL runtime validation, One Win compatibility, and deployed proxy/limiter behavior remain unverified. Earlier checkpoints below retain their dated evidence; this paragraph and the final correction record govern current status.

## Goal and accepted behavior

Connect Yahoo, choose a current-season basketball league and started matchup week, then compare every team's actual credited category results. This is an independent `/league` workspace; it does not require onboarding or alter the draft board or Team Lab.

- One row per league team, canonical enabled-category columns, source values, competition ranks (`1, 2, 2, 4`), and weaker/stronger shading.
- Higher is better except turnovers. Rank with source precision; format only for display. Missing values are unranked; valid zero remains zero.
- Highlight user-owned teams. Initially sort by team name; category headings toggle best/worst order with stable name/key ties.
- Default to the current matchup week, mark it in progress, show fetch time, and allow manual refresh. Failed refresh retains prior results with a warning.
- Support category leagues with any nonempty subset of the standard nine categories. Points leagues and unsupported scoring categories receive explicit messages.
- Use a pinned team column and horizontally scrollable categories on phones; sorting remains keyboard accessible and cell meaning never depends on color alone.

## Boundaries and architecture

- Client stays on GitHub Pages; Fastify stays on Cloud Run and owns Yahoo OAuth and requests.
- A server-only `@supabase/supabase-js` client selects the existing `draft_duck` schema in the user's Supabase project. No app accounts or Supabase Auth flow.
- Temporary OAuth attempts expire after ten minutes. Encrypted Yahoo access tokens expire at the earlier of one hour or provider expiry. Visitor refresh tokens are discarded.
- Browser app credentials stay in memory; only their hashes are stored. Callback HTML contains no credentials. Polling claims are atomic and do not depend on cross-site cookies or an opener relationship.
- Every private request validates session expiry and league access. Database tables/functions are backend-only. Credentials and OAuth query strings are excluded from request logs.
- Reusable boundaries separate OAuth/session persistence, Yahoo transport/normalization, and pure comparison helpers.
- No roster/settings imports, player mapping, persistent visitor connections, automatic data polling, scheduled player-stat ingestion, hypothetical matchup matrices, or Yahoo writes.
- No changes to ranker formulas, player identities, saved draft profiles, or saved rosters.

## Execution record

- Authorized by the user's implementation request after the approved thin-slice plan.
- Baseline: clean local `main` at `b345808`; implementation branch `feat/yahoo-league-comparison` created at the user's request.
- Supabase setup: user reports `draft_duck` created and exposed through the Data API. Live permissions and session migrations are not yet verified.
- Initial local configuration check: required Yahoo/Supabase server values absent. User is configuring them locally; secrets must never be pasted into notes or conversation.
- Workflow: `/Users/marcus/.codex/skills/sol-luna-workflow/SKILL.md`; one bounded `luna_executor_high` requested through direct controls as `gpt-6-luna`, effort `high`. No custom role loading or effective-setting verification is claimed. The current lead settings are preserved and unverified; no orchestrator or nested delegation is authorized.
- Review: one combined lead technical review covers behavior, architecture, purpose comments, and concrete risk/evidence. Bounded corrections do not restart the general review; after two failed corrections for one blocker, stop the approach and escalate with evidence.
- Browser restriction: do not use Chrome. Live desktop/phone and OAuth demonstrations require permitted browser access; source or fixture checks cannot substitute for them.
- Delivery: no commit, merge, production migration, or deployment authorized in this execution.

### Backend checkpoint

- Temporary connection/storage, weekly Yahoo reads, normalization, shared comparison helpers, and a cleanup command are implemented in the working tree. The client slice is in progress.
- The start endpoint requires a form POST with the attempt proof from the configured client origin; a public attempt URL alone cannot bind another browser's account. State/cookie consumption and connection claims are atomic database operations.
- Normalization rejects unexpected weekly coverage, duplicate/out-of-league team keys, and team-count mismatches rather than presenting a partial collection as the full league.
- Executor-reported checks: `npm run typecheck -w @draft-duck/api`, `npx tsc --noEmit -p app/core/tsconfig.json`, API Vitest (8 tests), and targeted core comparison Vitest (3 tests) pass. These are fixture checks, not live database/Yahoo evidence. Combined lead review has not started.
- A first test pass exposed a missing start-proof check and a fake-store expiry mismatch; the proof path was corrected and the fake now mirrors the SQL expiry check. No unresolved repeated product correction blocker was reported.
- Migration: `supabase/migrations/202611060001_yahoo_comparison_sessions.sql`. Cleanup: `npm run cleanup:yahoo -w @draft-duck/api`.
- A configuration-presence check exposed no values; all required server values remain absent. Live migration execution, grants/RLS, atomic SQL behavior, and basketball payload compatibility remain pending.

### Combined review and bounded correction

- Client source is implemented. Executor-reported checks before combined review: client TypeScript, 46 client tests (including static table markup), API TypeScript/9 tests, core TypeScript/3 comparison tests, and production client build passed. This evidence predates the corrections below.
- One combined lead technical review identified blocking integration gaps: recursive parsing lost sibling fields in a nested-resource fixture; weekly parameters were attached to an `out` expansion rather than the statistics resource; discovery included historical seasons; standard category/display metadata needed normalization; failure callbacks passed an empty string to a timestamp RPC; and completed attempts could be claimed after the ten-minute deadline.
- The lead reproduced the nested-resource loss locally: valid team identity fragments and sibling weekly stats produced placeholder team names, no ownership, and null values. This was a fixture reproduction, not live Yahoo evidence.
- The same bounded correction batch covers server cache/input/error boundaries, missing-value heat scaling, next-action sorting labels, opaque pinned cells, wrapping navigation, and purpose comments/formatting.
- Targeted confirmation and final workspace integration are pending while that correction batch is implemented. The combined general review will not be restarted; any further checks focus on the named findings or invalidated coverage.
- The pre-correction build reports the known shared-chunk size and Node filesystem externalization/unused SSR import warnings. No browser inspection or hosted mutation was performed.

## Acceptance and evidence

- [x] API fixture tests cover OAuth replay/binding, concurrent one-time claims, expiry/disconnect, league access, unsupported formats, malformed responses, and upstream errors. Actual database atomicity remains a separate live criterion below.
- [x] Comparison tests cover supported subsets, precision, ties, turnover direction, zeros/missing values, and stable sorting.
- [x] Workspace tests, all workspace TypeScript checks, Pages build, formatting, and diff checks pass. Subsequent comment/formatter-only changes do not alter behavior.
- [ ] Docker image build verified; local Docker daemon is not running.
- [ ] Backend-only schema grants/RLS and atomic claim behavior verified against the configured database.
- [ ] Real basketball payload and one selected week's values verified against Yahoo.
- [ ] Desktop/phone, keyboard, scrolling, connection cancellation, and reconnection demonstrated without Chrome.
- [ ] User accepts the result.
- [ ] Deployment revision and behavior verified separately.

### Final local verification

- Status: **Not ready with named blockers for live acceptance.** Repository implementation and local technical checks are complete; live database/Yahoo and rendered browser criteria lack evidence. Docker validation is also pending. The feature remains disabled by default.
- Branch: `feat/yahoo-league-comparison`, based on `b345808`, with uncommitted implementation changes. Nothing was staged, committed, pushed, merged, migrated on the hosted project, or deployed.
- Review: one combined lead review completed, followed by one bounded correction batch and targeted confirmation. New regression fixtures exercise nested Yahoo resource tuples rather than relying only on flattened objects. The first correction check exposed an always-true callback-error condition and TypeScript/test-fixture issues; those were corrected and scoped checks passed. No repeated unresolved blocker remains.
- Dependencies: lead restored unrelated toolchain upgrades, regenerated the lockfile with `--prefer-dedupe`, and completed `HUSKY=0 npm ci`. Existing root Vite 6.4.3, client Vite 7.3.6, rolldown 1.2.9, and Vitest 5.0.2 remain pinned by the lockfile.
- Lead-run `npm test`: **117 core + 46 client + 13 API = 176 tests pass**. Client tests include static table markup; they do not demonstrate browser interaction.
- Lead-run `npx tsc --noEmit -p app/core/tsconfig.json`, the equivalent API check, and the equivalent client check all pass.
- Lead-run real CSV/Fastify injection smoke: `/health`, disabled `/yahoo/status`, `/players`, and neutral `/rank` pass. All 452 loaded players receive unique sequential ranks and finite composites. No server port or live Yahoo connection was used.
- Lead-run reproduction of the original nested-resource failure now passes: team names, ownership flags, values, weekly coverage, and team count are retained.
- Lead-run `PUBLIC_BASE_PATH=/draft-duck/ PUBLIC_API_URL=https://example-run.app npm run build -w @draft-duck/client` passes after allowing its temporary prerender server outside the sandbox. It prerenders five public pages and copies `_shell.html` to `404.html`. The first sandboxed attempt could not start that server; it was an environment failure, not a product correction.
- Generated-output checks pass for matching SPA shell/404, the `/draft-duck/league` navigation link, the league chunk, and absence of server-only configuration identifiers/provider API host in client JavaScript.
- Existing build warnings remain: approximately 504 kB shared chunk, Node filesystem browser externalization, and unused SSR imports. No unrelated bundling changes were introduced.
- Formatting/diff checks pass. A markup-test formatter correction and purpose comments were the only changes after behavior checks.
- Docker availability was checked once with the permitted socket access; the daemon was stopped. No unchanged Docker build retries were performed.
- Live credentials were absent at the last presence check; the user is configuring them locally. The schema/exposed-schema setup is user-reported, not live-verified by this execution. The session migration and its grants/RLS/RPC behavior remain unapplied/unverified here.
- Browser access: no Chrome use; no permitted rendered desktop/phone or real OAuth interaction was demonstrated. Browser and live account criteria remain pending.
- Resume: configure the server variables, apply the reviewed migration through an authorized hosted change, verify grants/RLS and a real weekly payload, then demonstrate the interaction/layout using permitted browser access. Start Docker to run the pending image check. Reuse executor `/root/luna_executor_high` for bounded corrections; do not restart the completed general review or repeat unaffected checks without new evidence.

### Local HTTPS follow-up

Current port correction: the user subsequently selected port **3300** for local HTTPS. The command, ignored local environment, README, and setup guide now use `https://localhost:3300` and callback `https://localhost:3300/yahoo/oauth/callback`. The earlier 3443 references below preserve the initial verification history.

- The user created trusted local certificates and requested implementation of local HTTPS testing. The lead handled this small bootstrap/configuration change directly under the workflow; no model settings or delegation changed.
- `npm run dev:api:https` serves the same Fastify app at `https://localhost:3443`, loading the certificate and key from `~/.config/draft-duck/certs` by default. Both certificate paths can be overridden together. Certificate material remains outside the repository and was never printed.
- The HTTPS loader is opt-in and rejects production mode. Default API startup remains HTTP, including Cloud Run's existing TLS termination arrangement.
- Only public local URL settings were updated in the ignored `.env`: client API origin, Yahoo callback, and client origin. User-provided server credentials and their existing enabled flag were preserved.
- Lead-run trusted TLS smoke passes with the user's certificate and public mkcert CA, certificate validation enabled, and a real HTTPS `/health` request. Default HTTP behavior, the production guard, and paired-path validation also pass.
- The actual `npm run dev:api:https` startup command succeeds with the user's configuration and listens on loopback port 3443. Its health endpoint is healthy, Yahoo is enabled, and the existing local frontend serves the HTTPS API URL.
- The configured Supabase server client successfully called `yahoo_get_session` with a nonexistent bearer hash and received null. This was a read-only function check; it establishes connectivity/function availability, not schema permission coverage, migration freshness, or the complete session lifecycle. No hosted rows were created or modified.
- API tests (13), API TypeScript, formatting, and diff checks pass for this follow-up. Client/core behavior is unchanged; the prior broader checks remain applicable.
- Remaining: Yahoo acceptance of the exact localhost callback registration, real browser consent and weekly-stat comparison, permission/atomicity verification against the hosted database, and the previously pending Docker/deployment checks. No Chrome or other browser UI was used.

### HTTPS port 3300 verification

- The confirmed Draft Duck HTTP watch process on 3300 and the initial HTTPS process on 3443 were stopped before switching modes. The HTTPS API is now running on loopback port 3300.
- A real HTTPS `/health` request on 3300 passes with certificate validation enabled against the public mkcert CA. The existing frontend serves the updated `https://localhost:3300` API URL.
- Formatting and diff checks pass. No application logic, credentials, certificates, or hosted resources were changed by this port update. Yahoo's registered callback must use the new port before real consent testing.

### HTTPS development default

- The user selected HTTPS as the API development default. `npm run dev:api` now enables local HTTPS on port 3300; `dev:api:https` remains an alias. `npm run dev:api:http` explicitly selects HTTP for development. Production `start` retains HTTP behind Cloud Run TLS termination.
- The example environment, both frontend API URL defaults, README, and active setup/deployment instructions now use HTTPS for the local API. The frontend itself remains at `http://localhost:3000`.
- The standard development command was restarted and verified with a real certificate-validated HTTPS `/health` request on port 3300. All 46 client tests and client TypeScript pass; formatting and diff checks pass. No application logic, certificates, credentials, or hosted resources changed in this follow-up.

### Local Yahoo connection confirmed by the user

- Yahoo rejected the configured `https://localhost:3300/yahoo/oauth/callback` with `invalid_request: invalid redirect uri`. A credential-redacted authorization preflight confirmed the provider error before consent.
- The user reported that the Yahoo app's saved callback was `https://localhost:3000/yahoo/oauth/callback`, which differed from the API callback on port 3300.
- After updating the Yahoo registration, the user confirmed that the connection works. This establishes user-reported success of the local connection and acceptance of the localhost callback; it does not establish weekly table accuracy, full browser/accessibility coverage, database permission coverage, final product acceptance, or deployment.
- No application code or credentials changed during this diagnosis. The configured API callback remains `https://localhost:3300/yahoo/oauth/callback`.

### Fantasy access denial after successful OAuth

- A read-only diagnostic found a claimed session with approximately 57 minutes remaining and a decryptable access token. Yahoo's NBA game metadata endpoint returned HTTP 403, “This application is not authorized to perform this action.” OAuth succeeded; Fantasy API access remains blocked by Yahoo.
- Corrected the transport and API mapping to preserve upstream 403 as `forbidden`. The existing client displays the access error and retains its session rather than showing expiry and clearing it. Genuine upstream 401 and local session expiry remain unauthorized.
- Added regression coverage for both upstream 401 and 403 with a valid encrypted application session. All 15 API tests and API TypeScript pass. No credentials or hosted resources changed. Live league/table verification remains pending Fantasy Sports Read permission and access provisioning for the configured Client ID.

### Review corrections and focused validation

- The user authorized the correction plan after the follow-up review, preserving all `feat/yahoo-league-comparison` work based on `b345808`. The user subsequently authorized committing all work, pushing the feature branch, and creating a draft PR with the final description. Deployment, hosted application/database changes, authenticated Yahoo requests, secret inspection, and Chrome remain excluded. Existing development servers remain untouched.
- The user selected heat based on relative position among distinct finite values. Ties share a shade, missing/all-tied categories remain neutral, and lower turnovers remain better. Displayed competition ranks are unchanged.
- Corrections distinguish malformed membership responses from genuine empty membership and reconcile successful comparison metadata into league/week selectors without replacing an intentional historical-week selection.
- Focused coverage includes mounted client lifecycle tests using per-file DOM setup, API discovery/limiter regressions, and an isolated PostgreSQL migration harness. The harness uses a disposable Docker container without published ports or hosted configuration. A missing Docker daemon is a failed/unavailable check, not passing SQL evidence.
- Public-source investigation confirmed Yahoo's One Win category semantics, but did not establish its API identifier or payload compatibility. Keep the `head`/`roto` allowlist until authoritative evidence supports extending it. This remains an acceptance gap rather than assumed support.
- The socket-peer limiter's shared-proxy behavior and resistance to caller-supplied forwarding headers are covered by local injection checks. Exact deployed Cloud Run address behavior is unverified; no unrestricted proxy trust or speculative ingress configuration is added. Independent visitor limits remain a rollout criterion.
- Workflow: `/Users/marcus/.codex/skills/sol-luna-workflow/SKILL.md`. One executor is requested through direct controls as `gpt-6-luna`, effort `high`, without custom-role loading or nested delegation. Effective runtime model/effort and lead settings are unverified. The lead retains shared documentation/CI ownership and one combined acceptance review of this correction delivery, followed only by bounded corrections and targeted confirmation. The earlier review remains baseline context.
- Live Fantasy reads remain blocked by the reported 403. Pending provisioning is a possible explanation, not a confirmed diagnosis. Successful user-reported OAuth does not establish league/table acceptance.
- Lead-run integration: `npm test` passed 117 core, 52 client, and 19 API tests before the final discovery fixture correction. The lead then reran the affected API suite (20 passing tests) and API TypeScript; all three workspace TypeScript checks pass, including the new SQL harness through the API project. Client/core code was unchanged by that final correction, leaving 189 currently passing tests in total.
- Targeted lead confirmation reproduced the original tied-worst input (`10, 9, 9, 9, 9`): ranks remain `1, 2, 2, 2, 2`, while every lowest-value team now has rose heat. A canonical user `guid`/games tuple and game metadata/leagues sibling tuple also resolves correctly. The first validator correction exposed a resource-versus-collection boundary mistake; the second correction used canonical numeric-indexed fixtures and passed targeted confirmation. No unresolved correction blocker remains in that path.
- Lead-run port-free Fastify/CSV smoke passed `/health`, disabled `/yahoo/status`, `/players`, and neutral `/rank`: all 452 players have finite composites and unique sequential ranks. No listener was opened by this smoke.
- The production build with `PUBLIC_BASE_PATH=/draft-duck/` and a placeholder HTTPS API origin passed. Its initial sandbox attempt could not open the prerender preview server; the permitted retry succeeded using TanStack's OS-assigned port, without touching ports 3000/3300. Generated output confirms league navigation/chunk, configured API origin, and identical SPA shell/404 fallback. Existing shared-chunk, filesystem externalization, and unused SSR import warnings remain.
- SQL runtime evidence is unavailable: the executor's harness invocation failed on Docker socket access, and the lead's escalated read-only `docker info` confirmed the daemon is unavailable. Docker Desktop was not started, no unchanged SQL retry was attempted, and Docker image validation remains pending. The SQL command is wired into verification CI, but CI execution is not claimed as evidence here.
- The executor ran focused client/API checks; the lead reused them as context and performed one combined correction acceptance review with bounded confirmation after fixes. Missing runtime/live/rendered evidence remains blocking for full feature acceptance; local implementation completion does not establish rollout readiness.
