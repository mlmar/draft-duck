---
name: summarize-latest-changes
description: >-
  Writes a dated change note under docs/changes summarizing recent git and
  conversation work. Use when the user asks to summarize latest changes, write
  a change note, document the work, or capture intent and next steps after
  implementation.
---

# Summarize latest changes

Gather context, then write one markdown file. Summary, not a diff dump. Do not commit unless asked. Do not add the note to `docs/README.md` unless asked.

## Gather

1. `git status`, staged and unstaged `git diff`, and untracked files.
2. If the tree is clean, diff this branch against `main` (or the last few commits).
3. Conversation intent that git cannot show.
4. Skip secrets (`.env`, credentials).

## Output path

`docs/changes/YYYY-MM-DD-keyword.md`

- Create `docs/changes/` if it does not exist.
- Date: local `YYYY-MM-DD` from the session date or `date +%Y-%m-%d`.
- Keyword: 1-3 kebab-case words for the feature, not a generic word like `changes`. Example: `docs/changes/2026-09-16-onboarding-quiz.md`.
- Same date + same keyword: update that file in place.

## Style

Match existing `docs/` tone. Conversational, concise, no em dashes. Keep each section short. No extra top-level sections. No file dump. No commit SHAs. No second decisions section (that belongs in Tradeoffs).

## Required sections

Use this order and these headings. Omit **Reference docs** only if none apply.

```markdown
# {Short title from the keyword}

## Intent of the changes

Why this work exists.

## What did not change

Untouched or out-of-scope surfaces so the next session does not re-litigate them.

## Tradeoffs

Approach chosen vs the alternatives that were on the table.

## High-level overview of the current implementation

How it works now, not a walkthrough of the diff.

## Surfaces touched

Tiny map of pages, islands, stores, APIs, or core types. Names, not a file list.

## User-visible vs contract

UI behavior vs schema, API, or persistence (`localStorage` keys, payload shape). Call out breaking restore or clients.

## Known gaps

True of the current tree: stubs, bugs, "works if the API is up." Not the same as next steps.

## How to verify

3-5 checks a human can run (happy path, restore, error/empty if relevant).

## Next steps

Simple planned work. Distinct from known gaps.

## Reference docs

Existing docs that actually apply.
```
