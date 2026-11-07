# Implementation plans and roadmaps

## Filename convention

Non-milestone plans use `YYYY-MM-DD-topic.md`, with a lowercase kebab-case topic. The date records creation and stays fixed across later revisions. For existing plans, use the first-add date in the repository history. Keep milestone plan names such as `M4-draft-assistant.md` and index names such as `README.md` unchanged.

## Active roadmaps

- [Yahoo weekly league comparison](2026-11-06-yahoo-league-comparison.md): implemented on the local feature branch, disabled by default. Current regression results and review corrections are recorded in the plan. Local OAuth has user-reported success; Fantasy reads remain blocked by Yahoo 403. Weekly-value accuracy, hosted permissions, rendered browser acceptance, Docker, final user acceptance, and deployment remain unverified.

- [Team lab](2026-10-06-team-lab.md): responsive roster and candidate workspace, average/total category chart, and reversible row/bulk swap previews are implemented on `main` as of `996e875`. Final user acceptance and deployment have not been verified in this review.

- [Player visualizations](2026-10-02-player-visualizations.md): authoritative contributions, the horizontal player drawer, and compact charts for all six named builds are implemented on `main` at `b345808`. Previous automated/generated-output evidence is recorded in the plan; browser validation and Phase 2.2, Phase 2.3, and parent acceptance remain pending. Deployment is unverified.

## Historical implementation plans

These plans record choices and proposed steps from earlier phases. Some work has since shipped or changed. Use the [roadmap](../README.md), current milestone status, and [experiment index](../experiments/ranking/README.md) to establish present behavior before following a plan.
