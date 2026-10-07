# Settings UX consolidation

Status: implemented using the recommended category row editor. Build settings and Edit weights share CategoryPriorityEditor; Apply and Cancel preserve local edits.

## Problem

Build settings show nine Punt / Neutral / Need controls, followed by nine weight sliders. Both edit the same priorities, but their separation makes them look independent. The board also offers a second Edit weights drawer containing only sliders.

The current core behavior matters: Punt resolves to 0, Need to 1.5, and Neutral usually to 1. Some neutral categories receive a 1.25 complement boost when another category is punted. Changing a slider can change that category to Custom. A Custom value of 0 is not automatically the Punt stance; choosing a preset explicitly is what restores that stance. Preserve these behaviors and existing saved profiles.

## Recommended: one category row, with fine-tuning on demand

Each category has one row containing its name, its resolved weight, and Punt → Neutral → Need choices. A Fine-tune action expands that same row and replaces its preset choices with a slider and numeric value. Show Custom alongside the value, and provide Use presets to return to the simple choices. Do not render two full editors simultaneously.

Keep the resolved value visible in either state. If a neutral category is boosted to 1.25 by a punt, show a short explanation beside that value. Applying a preset should immediately update affected rows in the draft preview. Sliders should keep the current core rules rather than automatically snapping saved custom values into new stances.

Use the same CategoryPriorityEditor in Build settings and the Edit weights entry point. Separate League, Categories, and Ranking basis from priority editing. Keep presentation filters in Board view. Preserve Apply / Cancel and make edits local until Apply.

This serves first-time users with three meaningful choices while keeping precise control available without duplicating the entire category list. Its main cost is an extra click for managers who want to fine-tune many categories.

## Alternative: slider only, with meaningful stops

Use one slider per category, with labelled Punt / Neutral / Need stops and the resolved numeric value. Preset actions act on that slider rather than appearing as a second editor.

This is the most compact model for frequent numerical editing. Its risk is that punting has a distinct semantic effect on other categories, while Custom 0 currently remains Custom. The interaction must preserve that distinction or explicitly propose a core behavior change before implementation. It is also harder to scan and operate on phones than three large choices.

## Alternative: simple and precise modes

Offer Priorities and Fine-tune modes at the top of the category editor. Priorities shows only preset choices; Fine-tune shows only sliders. Both display resolved values and share the same draft state.

This is straightforward to implement and keeps bulk numerical editing fast. It still makes users switch views to understand how one control changed the other, so it addresses clutter more strongly than understanding.

## Implementation sequence

1. Implemented the recommended inline editor, retaining complement boosts and Custom semantics.
2. Build one shared editor around setCatStance and setCatTuner; retain the profile schema and core calculations.
3. Replace the separate priority and weight sections in ProfileSettings, and reuse that editor in WeightsDrawer.
4. Verify preset → value, custom slider → Custom, complement boosts across rows, saved Custom values, disabled categories, and Apply / Cancel. Test keyboard navigation and narrow phone layouts.
5. Inspect the entire settings flow on desktop and phone, including restoring the named build after explicit preset choices and reopening the saved profile.

Success: each category has one visible editing surface, users can tell exactly which weight their choice produces, and precise edits never silently change the underlying stance rules.
