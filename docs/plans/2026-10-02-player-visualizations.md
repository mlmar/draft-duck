---
date: 2026-10-02
approved: true
shipped: false
---

# Player visualizations roadmap

## Goals

Let a drafter inspect player strengths and understand how saved priorities affect their score. Make the six named builds visually comparable using miniature weight charts.

## Requirements

- Behavior: show a vertical strength chart with positive bars rising above zero and negative bars falling below it, followed by textual explanations below the whole chart.
- Entry: open player details from names in draft-board full/simple views only.
- Specification: behavior and implementation defaults in v5 were accepted by the user on 2026-10-02.
- Phase order: execute 1 → 2.1 → 2.2 → 2.3 → parent 2 integration review.
- Completion gates: require actual human acceptance of each current artifact before advancing.
- Review provenance: distinguish specification approval, implementation authorization, and implementation acceptance.
- Code readability: all logical blocks of code must be commented for human readability

## Constraints

- Stack: use existing TypeScript, React/CSS, WeightChart, and Vaul components.
- Dependencies: do not add a charting package.
- Persistence: do not add saved-profile fields.
- Process: do not install global rules, hooks, or automations.
- Scope: do not deploy or add onboarding player drawers.
- Local changes: preserve the pre-existing package-lock.json modification.
- Current state: Phase 2.1 is accepted; Phase 2.2 feedback fixes are implemented and await re-review.

## Tests

- Arithmetic: use existing Vitest suites for contribution sums and data-mode preservation.
- Presentation: test meaningful chart-helper edge cases when introduced.
- Manual checks: inspect drawers, accessibility, responsive layouts, and all six build previews.
- Integration: run workspace tests, client TypeScript checking, and the production build.
- Evidence: claim only checks that were actually run.

## Phase overview

| ID  | Reviewable outcome                   | Status          | Depends on                                           |
| --- | ------------------------------------ | --------------- | ---------------------------------------------------- |
| 1   | Roadmap specification                | Complete        | User accepted v5 on 2026-10-02                       |
| 2.1 | Authoritative category contributions | Complete        | User accepted PR #19 phase 2.1 on 2026-10-02         |
| 2.2 | Player detail drawer                 | Awaiting review | 2.1 accepted                                         |
| 2.3 | Mini build charts                    | Draft           | 2.2 complete                                         |
| 2   | Integrated feature review            | Draft           | All children complete; parent acceptance is separate |

## Handoff

- Next leaf: 2.2 re-review.
- Status: Phase 2.1 accepted; Phase 2.2 feedback fixes and self-review are complete.
- Accepted phases: 1; user accepted roadmap v5 with “approved” on 2026-10-02.
- Reviewed revision: roadmap v5, working-tree document and existing index edits dated 2026-10-02.
- Revision scope: v5 adds signed vertical bars; v4 added tables, v3 labelled lists, and v2 below-chart explanations.
- Next action: review the Phase 2.2 feedback revision in [PR #19](https://github.com/mlmar/draft-duck/pull/19); wait for explicit acceptance before starting 2.3.
- Authorization: user explicitly requested implementation and a new PR on 2026-10-02.
- Evidence: Phase 2.1 test, type-check, and diff-review results are recorded below.
- Accepted: Phase 2.1 implementation and readability in PR #19 on 2026-10-02.
- Outstanding work: user acceptance of Phase 2.2, then Phase 2.3 and parent integration review.
- Resume rule: compare this checkpoint with actual code and evidence before continuing.
- Record policy: retain the filename and append actual decisions; never infer acceptance from silence.
- Parent index: [Draft Duck roadmap](../README.md).
- Local index: [Implementation plans and roadmaps](README.md).

## Phase 1 — Reviewable specification

- ID: 1.
- Status: complete.
- Depends on: none.
- Parent: none.
- Children: none.

### High level summary

This document translates the preceding player-drawer and build-chart proposal into sequential implementation leaves and review gates. Runtime behavior is still the existing app.

### Goal

Provide a decision-complete handoff whose scope, math, interactions, evidence requirements, compatibility, and human review process can be accepted explicitly.

### Requirements

- [x] R1: Carry forward the selected signed vertical strength chart with textual information below it and draft-board-only entry points; identify other details as proposed defaults.
- [x] R2: Specify leaf dependencies, observable acceptance criteria, validation, recovery, and per-phase readability checks.
- [x] R3: Save a dated feature roadmap under docs/plans and link it from the existing top-level roadmap and local plans index.
- [x] R4: Record current implementation truth and pending decisions without claiming implementation, test success, shipping, or human acceptance.

### Constraints

- C1: Documentation only; do not implement runtime code in this phase.
- C2: Keep existing milestones, shipping status, and unrelated local changes intact.
- C3: Do not create a commit merely to label a review.
- C4: Do not invent a tests-first rule; none was found in the inspected repository instructions or roadmap documents.

### Self review

- Status: passed for v5 on 2026-10-02; user acceptance is recorded below.
- Reviewed revision: roadmap v5 and existing index edits; working-tree artifact dated 2026-10-02, not a commit.
- History v1: documentation self review passed on 2026-10-02 for structure, links, provenance, and diff boundaries.
- History v2: self review passed on 2026-10-02 for section order, links, chart/text separation, stance-independent fills, and pending acceptance.
- History v3: labelled-list and R/C-mapping checks passed on 2026-10-02; human acceptance remained pending.
- Evidence — board: [DraftBoard](../../app/client/src/components/draft/draft-board.tsx) uses PlayerTable in both views and retains previous query data.
- Evidence — cards: [BuildCardFace](../../app/client/src/components/onboard/build-card-face.tsx) currently renders text only.
- Evidence — math: [Ranker](../../app/core/src/ranker.ts) computes weighted terms; [Types](../../app/core/src/types.ts) exposes no contribution map.
- Evidence — discovery: existing drawers, tuners, percentage math, and mode annotations were inspected while preparing the specification.
- Runtime checks: not run; this pass changes documentation only.
- Code readability: not applicable to this documentation leaf.
- Evidence — v3 checks: read-only Python validation and git diff --check passed on 2026-10-02 in this chat. The longest document line was 263 characters; manual review found no dense prose outside short summaries/goals.
- Evidence — v4 checks: read-only validation passed for table syntax, complete R/C mappings, local links, review fields, and unchanged requirements/constraints against v3. git diff --check and the installed skill validator passed.
- Evidence — skill resources: SKILL.md, roadmap-template.md, and example.md match their reviewed staged versions. No runtime files changed.
- History v4: table structure, complete review mappings, provenance, and unchanged behavior checks passed on 2026-10-02.
- Evidence — v5 checks: read-only validation passed for signed direction/zero geometry, punt interpretation, unchanged data/build phases, section/table structure, local links, and pending human-review gates. git diff --check passed; no runtime checks were run.
- Findings: None found in the completed v5 documentation self review.

| ID  | Check                                                      | Actual result | Evidence                                                   |
| --- | ---------------------------------------------------------- | ------------- | ---------------------------------------------------------- |
| R1  | Preserve selected chart and entry behavior.                | Passed        | V5 signed-chart and punt-semantics checks; user request.   |
| R2  | Validate sections, IDs, review mappings, and handoffs.     | Passed        | V5 structure/table checks and manual handoff inspection.   |
| R3  | Validate original filename and index links.                | Passed        | [Top-level index](../README.md); [plans index](README.md). |
| R4  | Check approval metadata and review provenance.             | Passed        | Metadata/history assertions; prior records retained.       |
| C1  | Verify the feature phase remains documentation-only.       | Passed        | Current working-tree status; no runtime edits.             |
| C2  | Preserve milestones and unrelated local edits.             | Passed        | Unchanged status and git diff --check.                     |
| C3  | Label the working-tree artifact without creating a commit. | Passed        | Roadmap v5 label; no commit created.                       |
| C4  | Preserve repository findings without inventing test rules. | Passed        | Discovery record retained; unrelated phases unchanged.     |

### Human review

| Field               | Record                                                                          |
| ------------------- | ------------------------------------------------------------------------------- |
| Status              | Accepted                                                                        |
| Result and evidence | roadmap v5, index links, and documentation checks in Self review.               |
| Reviewer            | user.                                                                           |
| Review date         | 2026-10-02                                                                      |
| Reviewed revision   | Roadmap v5; working-tree document and existing index links.                     |
| Decision            | Accepted; source: the user replied “approved” after the v5 chart revision.      |
| Requested changes   | Prior changes incorporated in v5; no new change request accompanied acceptance. |
| Code readability    | not applicable; this phase is documentation only.                               |

- History — preferences: user selected strengths plus context and board-only entry; this was not full specification acceptance.
- History — 2026-10-02 chart correction: user requested simple horizontal bars with information below; v2 incorporated it.
- History — list-style request: user requested the latest roadmap-process document style; v3 incorporated it.
- History — table request: user requested Markdown tables in the skill and this document; v4 incorporated it.
- History — vertical chart: user requested bars extending up/down and visible negatives on 2026-10-02; v5 incorporates it.
- History — acceptance: user replied “approved” on 2026-10-02, accepting the v5 specification.
- Authorization: code implementation and deployment are not accepted implementation artifacts; 2.1 implementation authorization remains pending.

### Documented misses, deviations

- History v1/v2: prior documentation checks found no unresolved structure, link, or approval-state misses.
- M1: chart proposal had overly dense inline context.
    - Impact: the player chart was more complex than the requested stance-chart style.
    - Cause: proposed presentation defaults included centered bars and inline contribution context.
    - Resolution: v2 uses left-filled horizontal tracks and explanatory text below the whole chart.
    - Approval: user explicitly requested this presentation change on 2026-10-02; full specification acceptance remains pending.
- M2: roadmap formatting no longer matched the skill's latest readability guidance.
    - Impact: bundled prose made requirements, checks, and handoff decisions harder to scan.
    - Cause: the document was written before the latest bullet/label guidance.
    - Resolution: v3 restructures content into labelled lists without changing agreed behavior or phase IDs.
    - Approval: user explicitly requested this list-style update in the preceding turn.
- M3: repeated review fields now benefit from Markdown tables.
    - Impact: phase order, results, and review records become easier to compare.
    - Cause: the user requested tables as an additional readability tool.
    - Resolution: v4 adds phase-overview and self/human review tables; detailed criteria remain lists.
    - Approval: user explicitly requested both the skill update and this document update in the current turn.
- M4: short positive-length bars did not make negative strengths visible directly.
    - Impact: weakness could be confused with a small positive score.
    - Cause: the prior left-filled mapping shifted negative z-scores into positive bar lengths.
    - Resolution: v5 renders raw signed strengths upward/downward from zero; textual weighted contributions remain below.
    - Approval: user explicitly requested a vertical chart with negative values on 2026-10-02.
- Current assessment: None found in the completed v5 signed-chart, provenance, section/table, and link checks.
- Implementation deviations: not assessed; implementation has not begun.

### Validation plan and acceptance evidence

- Structure: verify the five phases retain the seven mandatory sections in order.
- Review mapping: verify each requirement and constraint ID has its own self-review entry.
- Readability: check compact table cells, labelled metadata, and short bullets for detailed criteria.
- Links: verify all relative links resolve and both indexes reference this document.
- Provenance: retain v1/v2/v3/v4 review history and record the user's v5 signed-chart decision.
- Approval state: approved is true following actual user acceptance; shipped remains false and later implementation reviews remain pending.
- Diff: run git diff --check and inspect status for unrelated changes.
- Executed evidence: prior v1/v2/v3/v4 history and passed v5 checks are recorded in Self review.

### Decisions, assumptions, and questions

- D1 — Board entry: user chose player-name entry in draft-board full/simple views; source: recorded preference answer in this chat.
- D2 — Chart history: user previously requested horizontal stance-style bars and textual information below; this orientation is superseded by D5.
- D3 — Document style: user requested labelled lists in the preceding turn; owner: user.
- D4 — Tables: user requested selective Markdown tables in the skill and roadmap in this turn; owner: user.
- D5 — Signed chart: user requested vertical bars rising/falling from zero, including negative values; source: explicit request on 2026-10-02.
- A1 — Scale: shared −3 to +3 z-score axis centered on zero; accepted through the user's v5 approval on 2026-10-02.
- A2 — Details: signed contribution text below the chart, existing responsive drawers, server terms, and six build previews; accepted through v5 approval.
- Specification decision: accepted v5 on 2026-10-02; owner: user; source: “approved” in this chat.
- Authorization: implementation was explicitly requested by the user on 2026-10-02.
- Material product questions: none; v5 behavior and defaults are accepted.

### Compatibility, recovery, and rollout

- Compatibility: no runtime interface changes in this documentation leaf.
- Migration: none; no persisted data changes.
- Rollback/recovery: remove the roadmap and its index additions while retaining unrelated edits.
- Rollout: none; later leaves define runtime recovery independently.

### Handoff checkpoint

- Active phase: 2.2.
- Status: active; Phase 2.1 complete and Phase 2.2 awaits human review.
- Reviewed revision: Phase 2.1 implementation accepted at PR #19 revision `45c1b60` on 2026-10-02.
- Evidence: user explicitly approved Phase 2.1 after reviewing [PR #19](https://github.com/mlmar/draft-duck/pull/19); tests, type check, and readability review are recorded below.
- Outstanding work: implement and review 2.2, then 2.3 and parent integration.
- Pending decision: user acceptance of Phase 2.2 after implementation and validation.
- Next action: implement the player detail drawer on the same branch and PR.
- Parent update: phases 1 and 2.1 are complete; phase 2 is active with 2.2 underway.

## Phase 2 — Integrated player and build visualizations

- ID: 2.
- Status: active; child 2.1 accepted and child 2.2 feedback revision awaits re-review.
- Depends on: 1 accepted and explicit implementation authorization (both satisfied).
- Parent: none.
- Children: 2.1, 2.2, 2.3 in order.

### High level summary

Combine authoritative contribution data, a player drawer, and build-card previews into the existing draft workflow. This parent summarizes integration; leaf specifications below own the detailed outcomes.

### Goal

Deliver coherent visual explanations across build selection and player inspection without changing ranking behavior or adding a second charting system.

### Requirements

- [ ] R1: Children 2.1, 2.2, and 2.3 pass their individual gates before parent completion; 2.1 is accepted.
- [ ] R2: End-to-end, choosing a named build yields matching card/onboarding weights, and a player drawer shows matching saved priorities and authoritative score contributions.
- [ ] R3: Workspace tests, client TypeScript checking, production build, desktop/phone demonstrations, and parent integration review pass on the same final artifact revision.
- [ ] R4: all logical blocks of code must be commented for human readability

### Constraints

- C1: Do not add player comparisons, live draft sessions, market ADP, roster impact, or onboarding player overlays.
- C2: Preserve ranking semantics, home prerendering, and saved-profile behavior.
- C3: Preserve table filters, scrolling, and existing user edits.
- C4: Child acceptance does not imply parent acceptance; material integration repairs invalidate affected acceptance until reviewed again.

### Self review

- Status: pending.
- Reviewed revision: pending.
- Evidence: no implementation or executed checks yet.
- Findings: not assessed.
- Readability gate: passing behavior tests does not replace comment inspection.

| ID  | Check                                                                                                                      | Actual result | Evidence                                       |
| --- | -------------------------------------------------------------------------------------------------------------------------- | ------------- | ---------------------------------------------- |
| R1  | Check actual acceptance records for all three children.                                                                    | Not run       | Children remain incomplete or awaiting review. |
| R2  | Demonstrate named-build selection, matching onboarding weights, and player explanations using saved priorities.            | Not run       | Pending                                        |
| R3  | Run workspace tests, client TypeScript checking, production build, and phone/desktop demonstrations on the final revision. | Not run       | Pending                                        |
| R4  | Inspect comment coverage and explanatory quality across every changed logical block in the integrated diff.                | Not run       | Pending                                        |
| C1  | Inspect the integrated diff for excluded features.                                                                         | Not run       | Pending                                        |
| C2  | Verify ranking regression results, home prerendering, and legacy saved profiles.                                           | Not run       | Pending                                        |
| C3  | Demonstrate table filtering and scroll preservation; inspect unrelated local edits.                                        | Not run       | Pending                                        |
| C4  | Check parent acceptance separately and invalidate any acceptance affected by material repairs.                             | Not run       | Pending                                        |

### Human review

| Field               | Record                                                                 |
| ------------------- | ---------------------------------------------------------------------- |
| Status              | pending.                                                               |
| Result and evidence | concrete implementation diff and actual validation artifacts; pending. |
| Reviewer            | user.                                                                  |
| Review date         | pending.                                                               |
| Reviewed revision   | pending human review.                                                  |
| Decision            | pending; prior plan approval does not imply acceptance of future code. |
| Requested changes   | not assessed.                                                          |
| Code readability    | human assessment of comments and understandable code is pending.       |

- Parent gate: explicit integrated acceptance is required after every child passes.

### Documented misses, deviations

- Assessment: Not assessed; implementation and review have not begun.
- Finding record: document each discovered miss separately.
    - Impact: identify affected behavior or requirement.
    - Cause: record why the gap occurred.
    - Resolution: repair within this phase before acceptance.
    - Approval: obtain an explicit human decision for any scope change.
- Deferral rule: deferred requirements need an accepted scope change linked to a future phase.

### Validation plan and acceptance evidence

- Workspace tests: run npm test; expect all suites to pass.
- Client types: run npm exec -w @draft-duck/client -- tsc --noEmit; expect no type errors.
- Production build: run npm run build -w @draft-duck/client; expect build and prerendering to pass.
- Integration: demonstrate named-build selection into matching onboarding weights and drawer context.
- Responsive UI: demonstrate full/simple views at phone and desktop widths.
- Acceptance: all child reviews and the separate parent review must accept the current revision.
- Evidence: record actual outputs, screenshots or demonstration references, and reviewed artifact revision.

### Decisions, assumptions, and questions

- Acceptance owner: user reviews integrated behavior and code readability.
- Evidence owner: implementer collects actual checks and artifact references.
- Assumptions: phase 1 must accept the proposed defaults before implementation.
- Material questions: none after specification acceptance unless implementation evidence contradicts it.

### Compatibility, recovery, and rollout

- Compatibility: preserve saved profiles and support older API responses via 2.2.
- Migration: none; no stored-profile fields are added.
- Rollback/recovery: revert client UI independently; older-response handling also permits API rollback.
- Rollout: when separately authorized, release the API before the client.
- Shipping: deployment is outside this execution scope; mark shipped only with actual shipping evidence.

### Handoff checkpoint

- Active phase: 2.
- Status: active; child 2.2 is in progress.
- Reviewed revision: pending.
- Evidence: pending implementation and validation.
- Outstanding work: implementation, checks, and required acceptance.
- Pending decision: user acceptance of this phase after concrete review.
- Next action: complete 2.2 and 2.3, then perform a separate parent integration review.
- Integration step: after all children pass, perform parent checks and request parent acceptance.
- Shipping: parent acceptance does not authorize deployment.

## Phase 2.1 — Authoritative category contributions

- ID: 2.1.
- Status: complete.
- Depends on: 1 accepted and implementation authorized (satisfied).
- Parent: 2.
- Children: none.

### High level summary

Expose the exact weighted terms already used to compute each player's score as an additive rank-response field.

### Goal

Give the UI an authoritative explanation that stays correct with operator overrides and every supported stats view.

### Requirements

- [x] R1: Add optional contributions: Partial<Record<CatKey, number>> to RankedPlayer.
    - Coverage: Production rank() populates every enabled category and omits disabled ones.
- [x] R2: Compute each term in the existing scoring loop as operator weight × profileWeight(profile, cat) × category z-score; accumulate composite using those same terms and ordering.
    - Legacy precedence: Preserve the current resolveTuner behavior, including legacy intensity precedence; do not change scoring to match a stance label.
- [x] R3: Contribution sums equal composite within floating-point tolerance for neutral, need, complement, custom, zero-weight, and custom-operator cases.
    - Zero weights: Zero effective weights contribute zero.
    - Punts: Standard punt profiles resolve to zero as today.
- [x] R4: Preserve contributions through rankWithDataModeSignals, suggestion annotation, and the existing /rank response.
    - Ranking invariants: Rank, fitRank, consensusRank, and selected-mode z-scores retain their behavior.
- [x] R5: Preserve actual percentage contributions when raw FG%/FT% is null; do not replace the ranker's standardized zero-attempt impact with a fabricated zero contribution.
- [x] R6: all logical blocks of code must be commented for human readability

### Constraints

- C1: Keep this leaf data-only; do not implement the drawer or build cards.
- C2: Do not add endpoints, profile schema fields, dependencies, or scoring rules.
- C3: Keep old fixtures compatible by making the new contribution field optional.
- C4: Do not deploy runtime changes in this leaf.

### Self review

- Status: pending.
- Reviewed revision: Phase 2.1 working-tree diff on `codex/player-visualizations`, based on `origin/main` `79d38b5`.
- Evidence: implementation and validation below.
- Findings: None found in the completed checks and review.
- Readability gate: passing behavior tests does not replace comment inspection.

| ID  | Check                                                                                               | Actual result | Evidence                                                                                                                                                              |
| --- | --------------------------------------------------------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Inspect type and response keys; verify enabled-only contributions.                                  | Passed        | `app/core/src/types.ts`, `ranker.ts`; enabled and disabled category assertions in `ranker.test.ts`.                                                                   |
| R2  | Inspect the scoring loop and compare terms with the existing formula and intensity precedence.      | Passed        | Contribution uses the existing operator/profile/z term inside the loop; consensus and ranking code unchanged.                                                         |
| R3  | Run sum-equality cases for operator overrides, complements, custom values, punts, and zero weights. | Passed        | `npm test`: core 12 files / 93 tests passed; contribution matrix checks each term and composite sum.                                                                  |
| R4  | Verify propagation through selected data modes, annotation, and /rank; compare rank regressions.    | Passed        | `rank-modes.test.ts` checks selected-mode signal annotation; `/rank` returns the ranked players directly in `app/api/src/index.ts`; all existing ranker tests passed. |
| R5  | Test null FG%/FT% without replacing the actual standardized contribution.                           | Passed        | `ranker.test.ts` confirms nonzero standardized z and matching contribution for both no-attempt percentages.                                                           |
| R6  | Inspect comments on changed data definitions, scoring blocks, branches, and tests.                  | Passed        | Manual diff review: added type, data definition, scoring operations, helper, and test blocks have intent comments.                                                    |
| C1  | Inspect the diff for drawer or build-card changes.                                                  | Passed        | Only core types, ranker, tests, roadmap/indexes, and requested lockfile are changed; no drawer/build-card code.                                                       |
| C2  | Inspect endpoints, schemas, dependencies, and scoring rules for incidental changes.                 | Passed        | Endpoint/schema/package manifests and ranking rules are unchanged; no dependency added.                                                                               |
| C3  | Verify old fixtures still compile with no contribution field.                                       | Passed        | Field is optional; client TypeScript check passed and existing fixtures remained unchanged.                                                                           |
| C4  | Verify no deployment action was taken.                                                              | Passed        | No deployment command or runtime release performed.                                                                                                                   |

### Human review

| Field               | Record                                                                                                     |
| ------------------- | ---------------------------------------------------------------------------------------------------------- |
| Status              | Accepted.                                                                                                  |
| Result and evidence | Phase 2.1 implementation and validation evidence in [PR #19](https://github.com/mlmar/draft-duck/pull/19). |
| Reviewer            | user.                                                                                                      |
| Review date         | 2026-10-02.                                                                                                |
| Reviewed revision   | PR #19, branch `codex/player-visualizations`, current revision `45c1b60`.                                  |
| Decision            | Accepted; user replied “Approved, move on” after Phase 2.1 review.                                         |
| Requested changes   | None.                                                                                                      |
| Code readability    | Accepted with the Phase 2.1 implementation.                                                                |

### Documented misses, deviations

- Assessment: None found in self review or human review.
- Finding record: document each discovered miss separately.
    - Impact: identify affected behavior or requirement.
    - Cause: record why the gap occurred.
    - Resolution: repair within this phase before acceptance.
    - Approval: obtain an explicit human decision for any scope change.
- Deferral rule: deferred requirements need an accepted scope change linked to a future phase.

### Validation plan and acceptance evidence

- Category keys: passed; all enabled terms are present and disabled terms are omitted.
- Arithmetic: passed; contribution sums equal composite within floating-point tolerance across the covered profiles.
- Weights: passed for operator overrides, complements, custom intensity, punts, and zero weights.
- Percentage gaps: passed; raw null FG%/FT% retains the ranker's nonzero standardized term.
- Propagation: passed through selected data mode and signal annotation; `/rank` returns the ranked list unchanged.
- Suites: `npm test` passed — core 12 files/93 tests and client 4 files/21 tests.
- Types: `npm exec -w @draft-duck/client -- tsc --noEmit` passed.
- Diff: `git diff --check` passed.
- Readability: manual review passed for comments on every changed logical code block.
- Lockfile: retained the user-requested existing `package-lock.json` metadata diff; package manifests and dependency set are unchanged.
- Evidence: reviewed Phase 2.1 diff on `codex/player-visualizations`, based on `origin/main` `79d38b5`; PR review remains pending.

### Decisions, assumptions, and questions

- A1 — Server terms: return authoritative contributions instead of duplicating operator math in the client; owner: user for specification acceptance.
- A2 — Optional field: retain old-fixture and rollout compatibility; owner: implementer for execution.
- Arithmetic owner: implementer preserves the exact current formula.
- Material questions: none after phase 1 acceptance.

### Compatibility, recovery, and rollout

- Compatibility: existing consumers ignore the additive response field; old fixtures may omit it.
- Migration: none; no database or localStorage changes.
- Rollback/recovery: revert this leaf's type/ranker/tests changes and rerun affected suites.
- Rollout: release the API before the UI only if later shipping is explicitly authorized.
- Deployment: none in this leaf.

### Handoff checkpoint

- Active phase: 2.1.
- Status: complete; accepted by the user on 2026-10-02.
- Reviewed revision: Phase 2.1 implementation commit `7c3c5cf` on `codex/player-visualizations`, based on `origin/main` `79d38b5`; [PR #19](https://github.com/mlmar/draft-duck/pull/19).
- Evidence: tests, type checking, diff inspection, and comment review are recorded in Self review.
- Outstanding work: Phase 2.2 and later phases; none remain within this leaf.
- Authorization: received from the user's explicit implementation request on 2026-10-02.
- Human review: accepted by the user on 2026-10-02 at PR #19 revision `45c1b60`.
- Next action: implement and validate the player drawer on this same branch and PR.
- Gate: advance only after requirements, constraints, self review, human acceptance, misses, and readability all pass.
- Parent update: phase 2.1 is accepted; Phase 2.2 is active.

## Phase 2.2 — Player detail drawer

- ID: 2.2.
- Status: awaiting-human-review.
- Depends on: 2.1 complete (accepted).
- Parent: 2.
- Children: none.

### High level summary

Open a read-only player drawer from names in both draft-board views. Show a signed vertical strength chart, with fit explanations below it.

### Goal

Make a player's strengths, weaknesses, and fit for saved priorities understandable without scanning the complete table or fetching another response.

### Requirements

- [x] R1: Add an optional player-selection callback and trigger-disabled flag to PlayerTable.
    - State owner: DraftBoard owns selection and the shared drawer.
    - Trigger: Player names become buttons only when a callback is supplied; use actual button semantics, keyboard activation, and a visible focus state without making the entire row clickable.
- [x] R2: Use the existing Vaul primitives for the responsive drawer.
    - Placement: show a right drawer at widths ≥768px and a bottom drawer below.
    - Labels: include a labelled title and close button.
    - Dismissal: support Escape and backdrop dismissal.
    - Focus: trap focus while open.
    - Scroll: lock body scrolling while open.
    - Restoration: return focus to the name trigger, or a board control if that trigger disappeared.
    - Requests: Opening details makes no additional network request.
- [x] R3: Header shows name, team, position, board rank, and data mode (legacy default per-game).
    - Categories: Place enabled category labels on the x-axis in CAT_KEYS order, excluding disabled categories.
    - Text placement: Keep raw stats, signed contributions, and the compact total below the whole chart; keep signed z-scores in chart labels and its accessible description.
- [x] R4: Render vertical bars from a central zero baseline labelled Avg (0), using the stance chart's ink/paper styling and rounded bar treatment.
    - Direction: Positive player.z values rise above zero; negative values fall below zero. Zero produces no bar height rather than a minimum-size fill.
    - Scale: Use a fixed symmetric y-axis from −3 to +3 z-score units, labelled Standardized strength (z-score), with signed ticks at −3, −1.5, 0, +1.5, and +3.
    - Height: Clamp z to ±3 for geometry; each bar uses abs(clamped z) / 3 of its half of the plot, anchored at the zero baseline.
    - Meaning: Above zero means strength and below zero means weakness relative to the ranked player pool.
    - Consistency: Keep the same scale for all players; preserve turnover inversion so fewer turnovers produce better scores.
    - Clipping: Mark clipped bars at their endpoint and announce exact signed z values and clipping in the accessible chart description.
    - Phone layout: Keep equal-width category columns with readable abbreviated labels; allow horizontal chart scrolling if 1.75rem minimum columns do not fit.
- [x] R5: Below the chart, show a concise Why this player? section with the compact total and category stat plus authoritative signed contribution.
    - Detail: Do not repeat chart z-scores, saved stances, or profile weights; keep category rows flush without extra vertical padding.
    - No attempts: Preserve this state for FG%/FT% with no attempts.
    - Stance independence: Bar direction and height depend only on player strength; saved stance never changes the geometry or color.
    - Punt interpretation: A punted category can still have a negative strength bar, while its textual contribution is zero when its effective weight is zero.
- [x] R6: Category contributions reflect authoritative server values, including zero when an effective punt weight excludes that category; signed contributions remain distinguishable by text and sign.
- [x] R7: The Why this player? summary stacks the largest strictly positive contribution and most negative contribution on separate rows when available; tie-break in CAT_KEYS order.
    - Missing directions: Omit absent positive/negative statements.
    - Total: Keep the compact total contribution and two-decimal signed values; omit the rounding disclaimer.
- [x] R8: FG%/FT% with null raw rates display No attempts instead of a bar, while preserving any actual contribution in the text section.
    - Explanations: Keep signed z-score details in the accessible chart description; omit the explanatory paragraph and repeated per-category z-score, stance, and weight details below it.
    - Missing values: Missing/nonfinite z displays Unavailable, never a fabricated value.
    - Accessibility: Accessible chart descriptions announce each category's strength and signed score despite the simple visual presentation.
- [x] R9: For older responses missing a complete finite contribution map, retain the strength chart and category stats but omit contribution amounts and summary; do not recompute authoritative values client-side.
    - Fallback copy: Show a short explanation below the chart that score breakdown is unavailable from this response.
- [x] R10: Close selection when the saved profile changes.
    - Stale data: Disable detail triggers whenever rankQuery.isPlaceholderData is true so old-profile rows cannot be explained using new priorities.
    - Board continuity: Preserve search, table selection, assistance groups, simple view, and scroll position on dismissal.
- [x] R11: all logical blocks of code must be commented for human readability

### Constraints

- C1: Player details belong on the draft board only; onboarding PickCard behavior stays intact.
- C2: Do not add weight editing, player comparison, or build-card changes to this leaf.
- C3: Do not add data fetches, persisted state, or charting dependencies.
- C4: Do not add stance overlays, contribution bars, or inline explanatory panels beside chart rows.
- C5: Reuse the stance chart's visual styling without changing its nonnegative tuner semantics; signed player bars are a separate presentation.
- C6: Keep contribution math authoritative from 2.1; provide textual equivalents of chart rows for accessibility.

### Self review

- Status: complete for the requested feedback revision; awaits human re-review.
- Reviewed revision: feedback fix follow-up commit `05b9e52` on `codex/player-visualizations`, based on feedback fix commit `f4342b9` and `origin/main` at `79d38b5`; see [PR #19](https://github.com/mlmar/draft-duck/pull/19).
- Evidence: fresh full workspace test run, client TypeScript check, production build, desktop/simple and phone screenshots, accessibility inspection, normal-motion close animation/focus restoration, source review, Prettier, and `git diff --check` recorded below.
- Findings: the drawer consumes the existing ranked response and authoritative `contributions`; malformed or older response maps suppress the complete score breakdown without hiding the chart.
- Readability gate: comments explain the new geometry/data types, chart, explanatory sections, selection/focus effects, fallback paths, and tests.

| ID  | Check                                                                                                         | Actual result | Evidence                                                                                                                                                                                                                     |
| --- | ------------------------------------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Demonstrate readable name-button entry in full/simple views, keyboard activation, and a visible focus state.  | Pass          | Full and simple board names appear as foreground text on existing row fills; computed trigger background is transparent; browser AX exposes buttons; keyboard activation and focus styling were previously verified.         |
| R2  | Verify responsive placement, close animation, content lifetime, focus restoration, and no additional request. | Pass          | Desktop right and 390px phone bottom drawers; close remains mounted during Vaul's 500ms exit, then clears and restores focus; Escape/backdrop tested. Reduced-motion code path is inspected but was not emulated in-browser. |
| R3  | Inspect header fields, enabled category order, and placement of all explanatory information below the chart.  | Pass          | AX tree shows team, position, rank, “Per game”, canonical categories, then “Why this player?” text.                                                                                                                          |
| R4  | Test signed bar direction, height, zero baseline, clipping, axis labels, and phone layout.                    | Pass          | Unit tests cover −3/−1.5/0/+1.5/+3 and clipping; desktop/phone screenshots show upward positives, downward TOV, zero baseline, signed ticks, and endpoint markers; center label is Avg (0).                                  |
| R5  | Inspect concise below-chart stats, spacing, and authoritative signed contributions.                           | Pass          | Browser AX shows category and raw stat paired with signed contribution; category rows have no vertical padding; explanatory paragraph and duplicate z/stance/weight lines are removed.                                       |
| R6  | Verify zero-weight/punt values remain authoritative and signed.                                               | Pass          | Contributions continue to come from server response; zero-weight categories display the server's signed zero. No client-side weight recomputation was introduced.                                                            |
| R7  | Test stacked positive/negative summaries, ties, missing directions, and total.                                | Pass          | Existing helper tests cover canonical tie order, absent directions, complete contribution map, and composite total; browser AX confirms separate boost/drag rows and compact total.                                          |
| R8  | Test no-attempt percentages, unavailable z, and accessible chart descriptions.                                | Pass          | Helper tests distinguish no-attempt from scored zero and unavailable z; AX chart description announces signed scores and clipping; chart labels remain present.                                                              |
| R9  | Test older-response fallback without fabricated client-side contributions.                                    | Pass          | Unit test rejects incomplete/nonfinite maps; source review confirms chart/stat rows render and unavailable copy appears while amounts and summary are omitted.                                                               |
| R10 | Demonstrate profile-change dismissal, placeholder-data disabling, preserved search, and scroll position.      | Pass          | Source inspection confirms profile-identity dismissal/focus fallback and `isPlaceholderData` disabling; controlled modal keeps the board mounted and its query/search state intact.                                          |
| R11 | Inspect comments on every changed component, helper, data definition, effect, branch, and test.               | Pass          | Reviewed changed selection, reduced-motion close, drawer animation, concise breakdown, and trigger-styling blocks; comments explain state transitions and intent.                                                            |
| C1  | Inspect onboarding review cards for unchanged player interactions.                                            | Pass          | Changes are limited to draft-board `PlayerTable` consumers; onboarding card code is untouched.                                                                                                                               |
| C2  | Inspect scope for weight editing, comparisons, and build-card changes.                                        | Pass          | No weight editor, comparison UI, or build-card implementation was added in this phase.                                                                                                                                       |
| C3  | Inspect network activity, persistence, and dependencies.                                                      | Pass          | Drawer receives props only; no fetch/storage code or dependencies were added.                                                                                                                                                |
| C4  | Inspect the UI for overlays, extra bar series, or inline explanatory panels.                                  | Pass          | Screenshot and component review show one signed strength series and all explanations below the chart.                                                                                                                        |
| C5  | Compare ink/paper styling and confirm existing nonnegative WeightChart semantics remain unchanged.            | Pass          | Uses the app’s foreground/card palette and rounded bars; `weight-chart.tsx` is untouched.                                                                                                                                    |
| C6  | Verify server-provided contributions and textual equivalents for all chart rows.                              | Pass          | UI reads `RankedPlayer.contributions` and `composite`; chart image description enumerates enabled categories with signed values.                                                                                             |
| C7  | Verify reduced-motion close behavior without changing the host preference.                                    | Partial       | Reduced-motion branch disables Vaul animation and clears on dismissal by inspection; this in-app browser did not expose media emulation, so dynamic reduced-motion behavior was not exercised.                               |

### Human review

| Field               | Record                                                                                                                                               |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status              | pending re-review after requested changes.                                                                                                           |
| Result and evidence | Feedback revision, browser checks, and fresh validation evidence in [PR #19](https://github.com/mlmar/draft-duck/pull/19).                           |
| Reviewer            | user.                                                                                                                                                |
| Review date         | 2026-10-02.                                                                                                                                          |
| Reviewed revision   | Phase 2.2 revision at PR #19 before the feedback fixes.                                                                                              |
| Decision            | Requested changes; user supplied feedback on the draft-board trigger, closing motion, and Why section.                                               |
| Requested changes   | Improve player-name contrast and closing motion; shorten explanation; stack boost/drag; remove rounding note; shorten Avg label and tighten spacing. |
| Code readability    | human assessment of comments and understandable code is pending.                                                                                     |

### Documented misses, deviations

- Assessment: User reported presentation issues on the prior Phase 2.2 revision; requested changes are implemented and await re-review. Self-review found no blocking findings; reduced-motion behavior remains dynamically unverified.
- Finding record: document each discovered miss separately.
    - Impact: identify affected behavior or requirement.
    - Cause: record why the gap occurred.
    - Resolution: repair within this phase before acceptance.
    - Approval: obtain an explicit human decision for any scope change.
- Deferral rule: deferred requirements need an accepted scope change linked to a future phase.
- M5: Feedback review found unreadable player-name buttons, missing drawer exit motion, and an overly verbose contribution explanation.
    - Impact: player entry and drawer dismissal were difficult to use, and repeated detail obscured the useful fit information.
    - Cause: global button styling overrode the name trigger's intended foreground colors; selected-player state was cleared before Vaul finished its exit transition; the first explanation draft repeated chart and profile details.
    - Resolution: use the shared ghost-button variant with explicit transparent/text styles; retain selection through Vaul's exit callback and restore focus afterward; show stacked boost/drag rows and compact stat/contribution rows, removing repeated explanations and the rounding disclaimer.
    - Approval: user explicitly requested and authorized these fixes on 2026-10-02; re-review is pending.
- M6: Follow-up review found excess whitespace in the Why section and requested a shorter zero-axis label.
    - Impact: fit details used more vertical space than needed and the center tick was unnecessarily long.
    - Cause: category rows had vertical padding and the center tick used the full “Average” label.
    - Resolution: remove vertical padding from category rows, tighten section/row gaps, and abbreviate the zero tick to “Avg (0)”.
    - Approval: user explicitly requested both adjustments on 2026-10-02; re-review is pending.

### Validation plan and acceptance evidence

- Signed geometry: test −3/−1.5/0/+1.5/+3 gives full-down/half-down/no-height/half-up/full-up bars from zero.
- Clipping: test scores beyond ±3 clamp bar height and show an endpoint marker while exact text remains available.
- Stance independence: identical player strengths yield identical signed bars under different stances; Phase 2.1 remains the source of authoritative zero-weight contributions.
- Categories: verify canonical ordering and omission of disabled cats.
- Text states: test ignored/custom weights, missing z, and no-attempt percentages.
- Summary: test largest boost/drag, ties, and omitted absent directions.
- Older responses: verify graceful omission of unavailable contribution details.
- Chart layout: visually check upward/downward vertical bars, readable signed ticks/category labels, and all explanatory text below the whole chart.
- Drawer entry: demonstrate full/simple triggers and no additional /rank request.
- Accessibility: check keyboard dismissal, focus restoration, signed chart descriptions, and body scroll lock.
- Reduced motion: inspect disabled Vaul panel/overlay motion and immediate close completion; dynamic media override was unavailable in the in-app browser.
- Stale results: change the profile and verify drawer dismissal and placeholder-trigger disabling.
- Edge layouts: check long names, 8-cat/custom cats, all-zero weights, and phone scrolling.
- Checks: fresh `npm test` passed (12 core files/93 tests; 5 client files/31 tests); `npx tsc --noEmit -p app/client/tsconfig.json` passed; `npm run build -w @draft-duck/client` passed and prerendered five pages; Prettier and `git diff --check` passed.
- Follow-up checks after the spacing and tick-label adjustments: client tests passed (5 files/31 tests), client TypeScript check passed, production build passed and prerendered five pages, Prettier and `git diff --check` passed.
- Readability: inspect comments on every changed logical block.
- Evidence: desktop right-side and 390px phone bottom-drawer screenshots are visible in this review turn; board names were inspected in full and simple views, including computed transparent background and foreground text color; close animation, content lifetime, Escape, and focus restoration were tested on desktop and phone. Reduced-motion rendering remains a source-inspection result only.

### Decisions, assumptions, and questions

- D1 — Entry: board-only player details; owner: user; source: preference answer in this chat.
- D2 — Presentation: vertical strength bars rising/falling from zero, including negatives, with text below; owner: user; source: explicit request on 2026-10-02.
- Superseded proposals: inline stance/contribution context and left-filled horizontal bars that encode weakness only through shorter length.
- A1 — Mapping: fixed scale and accessibility/presentation defaults were accepted with roadmap v5 on 2026-10-02.
- Implementation owner: implementer preserves scoring semantics and prevents stale explanations.
- Material questions: none after specification acceptance.

### Compatibility, recovery, and rollout

- Compatibility: older API responses remain usable through R9.
- Migration: none; no stored data changes.
- Rollback/recovery: revert this leaf's UI/helpers/tests while retaining 2.1.
- Rollout: verify deployed contribution data before a separately authorized client release.
- Deployment: none in this leaf.

### Handoff checkpoint

- Active phase: 2.2.
- Status: awaiting-human-review after requested changes.
- Reviewed revision: feedback fix follow-up commit `05b9e52` on `codex/player-visualizations`; see [PR #19](https://github.com/mlmar/draft-duck/pull/19).
- Evidence: 93 core and 31 client tests, client TypeScript check, production build, desktop/simple and phone browser checks, AX and interaction inspection, comment review, Prettier and diff checks. The spacing/label follow-up also passes client tests, type checking, and production build. Reduced-motion dynamic emulation is pending due to browser tooling limits.
- Outstanding work: human acceptance of this leaf before Phase 2.3 begins.
- Pending decision: user acceptance of this phase after concrete review.
- Next action: review the Phase 2.2 feedback revision in [PR #19](https://github.com/mlmar/draft-duck/pull/19); after acceptance, begin Phase 2.3 on the same branch and PR.
- Gate: advance only after requirements, constraints, self review, human acceptance, misses, and readability all pass.
- Parent update: Phase 2.1 is accepted; Phase 2.2 feedback revision awaits human acceptance; keep Phase 2.3 and parent integration in draft.

## Phase 2.3 — Mini charts on named build cards

- ID: 2.3.
- Status: draft.
- Depends on: 2.2 complete (review sequence).
- Parent: 2.
- Children: none.

### High level summary

Add a miniature weight chart beneath each named build's title and helper text using the shared BuildCardFace.

### Goal

Show the same category-priority shape at build selection that users later see in onboarding and on their board.

### Requirements

- [ ] R1: All six home build cards contain the existing WeightChart mini presentation, derived from tunersForArchetype and stancesForArchetype, including complement weights; no duplicated preset definitions.
- [ ] R2: Home previews show all nine categories; shared BuildCardFace respects enabledCats.
    - Labels and scale: Keep fixed category order, the existing 0–3 scale, muted punt treatment, and accessible descriptions naming categories and weights.
- [ ] R3: Keep the title and Need/Punt helper copy, consistent card heights and spacing, readable category labels, and the existing single link target with no nested interactive chart.
    - Other controls: Custom and Not sure retain their existing controls.
- [ ] R4: Home build selection still applies the same preset; every preview agrees with the resulting onboarding chart.
    - Prerendering: Home prerendering and phone/desktop layout continue to work.
- [ ] R5: all logical blocks of code must be commented for human readability

### Constraints

- C1: Use the existing WeightChart and tuner helpers; do not add another chart system or dependency.
- C2: Do not add API requests or write profile data during rendering.
- C3: Do not change drawer behavior, ranking data, build IDs, or archetype mappings.
- C4: Keep chart text accessible within the single build link; avoid overwhelming its accessible name with decorative repeated labels.

### Self review

- Status: pending.
- Reviewed revision: pending.
- Evidence: no implementation or executed checks yet.
- Findings: not assessed.
- Readability gate: passing behavior tests does not replace comment inspection.

| ID  | Check                                                                                                      | Actual result | Evidence |
| --- | ---------------------------------------------------------------------------------------------------------- | ------------- | -------- |
| R1  | Inspect helper usage and all six preview values, including complement weights.                             | Not run       | Pending  |
| R2  | Verify nine-cat home previews, restricted enabledCats, scale, category order, and accessible descriptions. | Not run       | Pending  |
| R3  | Inspect phone/desktop card consistency, helper copy, labels, and single-link semantics.                    | Not run       | Pending  |
| R4  | Demonstrate build selection into matching onboarding weights and run the production build.                 | Not run       | Pending  |
| R5  | Inspect accurate comments on each changed logical block.                                                   | Not run       | Pending  |
| C1  | Inspect imports and dependencies for duplicated chart/preset logic.                                        | Not run       | Pending  |
| C2  | Verify rendering creates no API request or profile write.                                                  | Not run       | Pending  |
| C3  | Inspect the diff for incidental drawer, ranking, or archetype changes.                                     | Not run       | Pending  |
| C4  | Inspect the link accessible name and keyboard behavior.                                                    | Not run       | Pending  |

### Human review

| Field               | Record                                                                 |
| ------------------- | ---------------------------------------------------------------------- |
| Status              | pending.                                                               |
| Result and evidence | concrete implementation diff and actual validation artifacts; pending. |
| Reviewer            | user.                                                                  |
| Review date         | pending.                                                               |
| Reviewed revision   | pending human review.                                                  |
| Decision            | pending; prior plan approval does not imply acceptance of future code. |
| Requested changes   | not assessed.                                                          |
| Code readability    | human assessment of comments and understandable code is pending.       |

### Documented misses, deviations

- Assessment: Not assessed; implementation and review have not begun.
- Finding record: document each discovered miss separately.
    - Impact: identify affected behavior or requirement.
    - Cause: record why the gap occurred.
    - Resolution: repair within this phase before acceptance.
    - Approval: obtain an explicit human decision for any scope change.
- Deferral rule: deferred requirements need an accepted scope change linked to a future phase.

### Validation plan and acceptance evidence

- Build coverage: inspect all six charts and a restricted enabledCats case.
- Preset math: confirm complement and punt values match existing helpers.
- Navigation: demonstrate build links lead to matching onboarding weights.
- Layouts: inspect readable labels and consistent cards on phone and desktop.
- Checks: run npm test, client TypeScript checking, and production client build.
- Test scope: prefer existing preset tests and visual inspection over tests duplicating simple JSX.
- Readability: inspect comments on every changed logical block.
- Evidence: record actual screenshots/results and the reviewed artifact revision.

### Decisions, assumptions, and questions

- A1 — Chart variant: reuse the existing vertical mini chart within BuildCardFace; specification acceptance pending.
- Acceptance owner: user reviews the preview behavior and code readability.
- Implementation owner: implementer ensures layout consistency and collects evidence.
- Material questions: none after phase 1 acceptance.

### Compatibility, recovery, and rollout

- Compatibility: client-only presentation change; existing build-selection behavior remains.
- Migration: none; no stored data changes.
- Rollback/recovery: revert this leaf's card/layout changes while retaining accepted drawer/data work.
- Rollout: ship only with separate authorization after parent integration acceptance.
- Hosting: no configuration changes are needed.

### Handoff checkpoint

- Active phase: 2.3.
- Status: draft.
- Reviewed revision: pending.
- Evidence: pending implementation and validation.
- Outstanding work: implementation, checks, and required acceptance.
- Pending decision: user acceptance of this phase after concrete review.
- Next action: after 2.2 acceptance, implement build-card charts and collect actual validation evidence.
- Gate: advance only after requirements, constraints, self review, human acceptance, misses, and readability all pass.
- Parent update: refresh phase 2 and the global handoff in the same pass as acceptance records.
- Following step: perform parent 2 integration checks and request separate parent acceptance.
