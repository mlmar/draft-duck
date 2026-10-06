---
name: Draft Duck
description: A light, precise Analysis Desk for fantasy basketball category decisions.
colors:
    background: '#f4f6f9'
    foreground: '#172331'
    card: '#ffffff'
    primary: '#2455d6'
    primary-foreground: '#ffffff'
    secondary: '#eaf0ff'
    secondary-foreground: '#2046a3'
    muted: '#edf0f5'
    muted-foreground: '#526176'
    destructive: '#af3548'
    border: '#dce2ea'
    input: '#c4cdd9'
    heat-good: '#d8eee5'
    heat-bad: '#f4dfe3'
    strength-good: '#227a5b'
    strength-bad: '#af4351'
typography:
    display:
        fontFamily: 'Public Sans Variable, ui-sans-serif, system-ui, sans-serif'
        fontSize: '3.75rem'
        fontWeight: 600
        lineHeight: 1.08
        letterSpacing: '-0.03em'
    headline:
        fontFamily: 'Public Sans Variable, ui-sans-serif, system-ui, sans-serif'
        fontSize: '1.875rem'
        fontWeight: 600
        lineHeight: 1.2
        letterSpacing: '-0.025em'
    title:
        fontFamily: 'Public Sans Variable, ui-sans-serif, system-ui, sans-serif'
        fontSize: '1.125rem'
        fontWeight: 600
        lineHeight: '1.75rem'
    body:
        fontFamily: 'Public Sans Variable, ui-sans-serif, system-ui, sans-serif'
        fontSize: '1rem'
        fontWeight: 400
        lineHeight: 1.625
    label:
        fontFamily: 'Public Sans Variable, ui-sans-serif, system-ui, sans-serif'
        fontSize: '0.875rem'
        fontWeight: 400
        lineHeight: '1.25rem'
rounded:
    sm: '4.8px'
    md: '6.4px'
    lg: '8px'
    xl: '11.2px'
spacing:
    1: '4px'
    2: '8px'
    3: '12px'
    4: '16px'
    5: '20px'
    6: '24px'
    8: '32px'
    12: '48px'
    16: '64px'
components:
    button-primary:
        backgroundColor: '{colors.primary}'
        textColor: '{colors.primary-foreground}'
        rounded: '{rounded.lg}'
        height: '44px'
        padding: '0 16px'
    button-outline:
        backgroundColor: '{colors.background}'
        textColor: '{colors.foreground}'
        rounded: '{rounded.lg}'
        height: '44px'
        padding: '0 16px'
    button-secondary:
        backgroundColor: '{colors.secondary}'
        textColor: '{colors.secondary-foreground}'
        rounded: '{rounded.lg}'
        height: '44px'
        padding: '0 16px'
    button-ghost:
        backgroundColor: 'transparent'
        textColor: '{colors.foreground}'
        rounded: '{rounded.lg}'
        height: '44px'
        padding: '0 16px'
    input:
        backgroundColor: 'transparent'
        textColor: '{colors.foreground}'
        rounded: '{rounded.lg}'
        height: '44px'
        padding: '8px 12px'
    navigation:
        textColor: '{colors.muted-foreground}'
        height: '44px'
    stance:
        backgroundColor: '{colors.primary}'
        textColor: '{colors.primary-foreground}'
        rounded: '{rounded.md}'
        height: '44px'
    card:
        backgroundColor: '{colors.card}'
        textColor: '{colors.foreground}'
        rounded: '{rounded.xl}'
        padding: '16px'
    player-row:
        backgroundColor: '{colors.card}'
        textColor: '{colors.foreground}'
        padding: '12px'
    weight-chart:
        backgroundColor: '{colors.muted}'
        textColor: '{colors.muted-foreground}'
        rounded: '{rounded.sm}'
---

# Design System: Draft Duck

## Overview

**Creative North Star: "Analysis Desk"**

A light, precise workspace where category priorities and player evidence are easy to read. Cool off-white ground, white surfaces, graphite text, and cobalt actions give dense information a calm hierarchy. Duck personality comes through occasional familiar copy and the lowercase text wordmark, while statistical labels remain literal.

The interface uses Public Sans throughout, restrained corners, borders, and tonal changes. Controls stay readable and touchable as the composition becomes compact on phones. The implemented system is light-only; it uses Lucide icons and no generated logos or illustrations.

**Key Characteristics:**

- Light surfaces with clear graphite text and selective cobalt emphasis.
- Compact data presentation with readable controls and optional numerical detail.
- Plain statistical language, labelled charts, and visible keyboard focus.
- Responsive composition that keeps the current decision accessible.

## Colors

The palette combines cool paper neutrals with a confident cobalt action color and restrained green/rose statistical signals. Frontmatter contains the normative values; CSS aliases for brand, accent, popover, ring, and chart colors reuse this palette.

### Primary

- **Action Cobalt** (`primary`): primary actions, selected choices, progress, category weights, active navigation, and focus.
- **Cobalt Wash / Deep Cobalt** (`secondary`, `secondary-foreground`): secondary and selected presentation controls, with a lighter background than primary actions.

### Secondary

- **Strength Green / Strength Rose** (`strength-good`, `strength-bad`): signed player strength bars. Pair them with numerical signs and labels.
- **Green Heat / Rose Heat** (`heat-good`, `heat-bad`): table strength fills, mixed with transparency in proportion to score intensity.
- **Error Rose** (`destructive`): errors, invalid fields, and destructive actions; it is separate from statistical rose.

### Neutral

- **Cool Ground** (`background`): page background and quiet controls.
- **White Surface** (`card`, `primary-foreground`): cards, sheets, and reversed primary text.
- **Graphite** (`foreground`): headings, body, numerical controls.
- **Slate** (`muted-foreground`): explanatory copy and metadata.
- **Quiet Fill / Hairline / Field Stroke** (`muted`, `border`, `input`): chart tracks, group bands, dividers, and field boundaries.

**The Evidence Color Rule.** Color reinforces the stated value or state; signs, labels, and selection semantics carry the meaning independently.

## Typography

**Display Font / Body Font:** Public Sans Variable, with UI sans-serif and system sans-serif fallbacks. There is no separate display or monospace face.

Headings are direct and compact; regular-weight prose and quieter metadata support scanning. Controls use sentence case, medium weight, and body-sized text. Tabular numerals align ranks and statistics.

- **Display:** the home headline uses the frontmatter desktop role; below the medium breakpoint it is smaller (2.25rem), retaining its tight tracking and line height.
- **Headline:** baseline page titles start at the frontmatter role and grow at medium width (2.25rem). Board and quiz titles intentionally use the smaller pair (1.5rem / 1.875rem).
- **Title:** panel titles use the frontmatter role; section headings commonly use a larger pair (1.25rem / 1.5rem).
- **Body:** paragraphs use the relaxed body role. Buttons and fields use the same size with a more compact line height (1.5) and medium button weight (500).
- **Label:** metadata, chart labels, and table values use the label role. Small text supports the decision; it does not replace primary control labels.

## Layout

Use a four-pixel spacing rhythm with common gaps and insets drawn from the frontmatter scale. Page gutters grow from compact phone space (16px) to wider space at medium width (32px). Reading shells cap at 48rem, focused/home shells at 72rem, and the shared wide shell at 88rem. Keep flex and grid children able to shrink.

The medium breakpoint (768px) changes board presentation and drawer direction. The large breakpoint (1024px) changes quiz composition. Described choice rows begin wrapping horizontally at the small breakpoint (640px). Do not equate every desktop adaptation with one shared cutoff.

The board's build header and search share a sticky block at the safe-area top. Phones use compact player rows and a **Board view** bottom sheet for presentation controls; the full statistics table remains available there. Desktop shows the table toolbar inline. The table pans horizontally in its own container while the page scrolls vertically: rank pins at the left, and name joins it from medium width. Column headings travel with the page.

Quiz category weights stay expanded at every step, including **Closest build**. Walkthrough charts precede answers at every size: compact vertical bars and stacked answers on phones, taller vertical bars and side-by-side answers at large width. Editable priorities use horizontal rows below large width and vertical bars above it. The quiz action footer is fixed with reserved content space and safe-area padding.

These are observed responsive patterns; page persuasion strategy and first-viewport copy remain in `.impeccable/direction.md`.

## Elevation & Depth

Depth comes from white surfaces on cool ground, hairline borders, subdued fills, and a translucent foreground drawer overlay. Resting surfaces do not use decorative drop shadows. The shared card uses a thin foreground ring; focus uses a cobalt ring (3px at 50% opacity), while ordinary links receive an offset outline (2px). Slider thumbs use small structural rings and a stronger keyboard-focus ring. Player-name table buttons use an inset outline to remain visible inside clipped cells.

**The Quiet Surface Rule.** Separate information with borders, spacing, and tonal fills; reserve stronger rings for interactive focus.

## Shapes

The base corner is restrained (8px). Small chart bars, segmented controls, and larger card/sheet surfaces use the derived radius scale in frontmatter. Shared cards and bottom sheets use the extra-large derivative, rather than making every surface exactly the base radius. Player rows join edge to edge without individual rounded corners. Rounded slider tracks and circular thumbs are functional exceptions.

Lucide icons use simple stroked SVGs, usually at compact control size (16px), with accessible text or control labels. Keep the wordmark as **draft duck**, without punctuation or an illustrated logo. Native select chevrons sit inside the right edge (12px), with enough right padding (40px) to keep text clear; forced-colors mode restores native select appearance.

## Components

### Buttons

Primary cobalt buttons have white text; outline buttons use a field-like border and quiet ground; secondary buttons use the cobalt wash; ghost buttons reveal a muted fill on hover. Shared buttons default to a comfortable target (44px), with established smaller and larger variants. Hover changes fill, keyboard focus adds the ring, and ordinary activation moves down slightly (1px); popup triggers avoid that movement. Disabled controls reduce opacity and prevent interaction. Destructive and link variants already exist; preserve their distinct semantics.

### Chips

Choice controls reuse button treatments. Priority segments read **Punt → Neutral → Need**. Selected Punt is muted; selected Neutral or Need is cobalt. A custom numeric weight leaves the three segments unselected and adds a Custom label. Badge primitives use the smaller derived corner and compact height (28px), rather than a pill silhouette.

### Cards / Containers

Shared cards use white fill, the larger derived radius, a thin ring, and regular insets (16px; 12px for small cards). Task panels often use a border with larger padding (20–32px). Avoid adding lift as a default. Dividers and muted group bands organize repeated information.

### Inputs / Fields

Fields share body-sized text, the base radius, input stroke, and comfortable height (44px). Search adds white fill. Placeholder text stays slate; focus changes the border and adds the cobalt ring. Invalid states use error rose; disabled inputs receive a subdued fill and reduced opacity. Numerical editing remains available in the separate weights drawer and existing settings controls.

### Navigation

The white header carries a lowercase text wordmark and quiet navigation links with touchable height (44px). Active links use cobalt and medium weight; hover uses graphite. The focused quiz header keeps a home exit and a small context label. Footer links remain quiet and wrap as needed.

### Data and overlays

Compact phone rows show rank, player name, team/position, concise fit evidence, and a Lucide drawer cue. The full table uses tabular numerals, restrained row fills, score heat, and horizontally pinned identity columns. Player explanations pair signed strengths and exact values with explicit **No attempts** / **Unavailable** states and weighted contribution text.

Settings, numerical weights, and player explanations use white Vaul drawers: a bottom sheet on phones and a right-side panel from medium width (28rem, capped at 90vw). **Board view** is a content-height bottom sheet. Preserve labelled dialogs and dismissal focus behavior. Existing settings still expose separate priority and numerical controls; the proposed consolidation in `docs/plans/settings-ux.md` is not implemented.

Weight/progress changes use an ease-out transition (300ms), disabled for reduced motion. Table state colors use short transitions (150ms); loading pulse is motion-safe. Player-detail drawer motion explicitly honors reduced motion. Do not infer a universal animation treatment from these local patterns.

## Do's and Don'ts

### Do:

- **Do** use the light palette, Public Sans, and restrained radius scale for new shared UI.
- **Do** preserve visible focus, labelled charts, numerical signs, and explicit missing-data states.
- **Do** keep primary controls body-sized and touchable while making data rows compact.
- **Do** preserve access to full statistics and numerical priorities across screen sizes.
- **Do** keep page-specific compositions in the direction brief and record implemented reusable behavior here.

### Don't:

- **Don't** replace the text wordmark with a generated logo or add decorative raster assets.
- **Don't** use color alone to communicate strength, selection, or errors.
- **Don't** hide always-expanded quiz weights behind a disclosure.
- **Don't** describe a settings proposal as shipped or conflate raw-stat display with ranking basis.
- **Don't** add decorative drop shadows to resting surfaces.
