# MagXStudio UI Style Guide

Last updated: 2026-02-24  
Status: Living document (must be updated when new UI patterns are added)

## 1. Purpose

This guide defines the current UI system used in MagXStudio across:

- Site Design
- Slides
- Pages
- Visuals
- Shared UI primitives

Use this as the single source of truth for styling new UI objects. Reuse an existing pattern first. If no pattern fits, create a new one and add it to this file in the same PR.

## 2. Foundations

### 2.1 Tokens (source of truth)

Defined in `app/globals.css` and mapped in `tailwind.config.ts`.

- `--color-bg: #141414`
- `--color-surface: #141414`
- `--color-text: #eceff3`
- `--color-muted: #afb5be`
- `--color-accent: #68f0d1`
- `--color-primary: #68f0d1`
- `--color-secondary: #9aa6bd`
- `--color-border: #1e1e1e`
- `--radius-sm: 8px`
- `--radius-md: 14px`
- `--radius-lg: 24px`
- `--shadow-soft: 0 8px 28px rgba(0, 0, 0, 0.2)`
- `--shadow-card: 0 20px 56px rgba(0, 0, 0, 0.35)`

### 2.2 Working palette in current UI

The app currently uses these additional hex values repeatedly in workspace UIs:

- Dark shells: `#0b0b0b`, `#0f1012`, `#0f1114`, `#101216`, `#121214`, `#17181b`
- Input lines: `#5c626f` (default), `#8a92a0` (focus), `#8f96a3` (placeholder)
- Action circles: `#1f232d` (secondary), `#eef1f5` (primary), `#d8dde5` (disabled), `#f7f8fa` (hover), `#111111` text on light button
- Accent red slash state: `#ef4444`

When building new components, prefer tokenized Tailwind aliases (`bg`, `text`, `border`, `primary`, etc.). If you must add a new hardcoded color, register it in this guide.

### 2.3 Typography

Current type scale in active UI:

- Display greeting: `text-[24px] leading-tight`
- Body controls: `text-sm` and `text-xs`
- Meta labels: `text-[11px]`, `text-[10px]`
- Panel labels (Text Engine): `text-[13px]`, panel title `text-[15px]`

Default weight usage:

- Labels/navigation: medium to semibold
- Metadata/supporting text: normal with opacity

## 3. Layout System

### 3.1 App shell

- Root container: `min-h-screen bg-[#141414] text-white`
- Top navigation bar:
  - Container: `sticky top-0 z-30 bg-[#141414]/98 backdrop-blur-sm`
  - Divider: `border-b border-black/45 py-2`
  - Tab grid: `grid grid-cols-4 items-center gap-2`

### 3.2 Workspace top action bar (shared pattern)

Used in Site Design, Slides, Pages, Visuals:

- Bar: `flex h-11 w-full items-center justify-end border-b border-black/70 bg-[#0b0b0b] px-5 md:px-7`
- Icon button group gap: `gap-4`

### 3.3 Main content spacing

- Workspace body wrapper: `px-5 pb-6 pt-5 md:px-7`
- Empty-state center region: `min-h-[calc(100vh-180px)]`
- Canvas regions generally target `min-h-[80vh]`

## 4. Component Patterns (Canonical Recipes)

Each pattern below is approved for reuse as-is.

### PAT-INPUT-UNDERLINE

Single-line text input (title/url fields).

Class recipe:

```txt
w-full border-0 border-b border-[#5c626f] bg-transparent px-0 py-2
text-sm text-white/92 placeholder:text-[#8f96a3]
focus-visible:outline-none focus-visible:border-[#8a92a0]
```

### PAT-TEXTAREA-UNDERLINE

Multi-line prompt input.

Base class recipe:

```txt
w-full resize-y border-0 border-b border-[#5c626f] bg-transparent px-0 py-2
text-sm text-white/92 placeholder:text-[#8f96a3]
focus-visible:outline-none focus-visible:border-[#8a92a0]
```

Common extension: `min-h-[60px]` or `min-h-[120px]` + `leading-5`.

### PAT-SELECT-UNDERLINE

Dropdown aligned to input styling.

Class recipe:

```txt
w-full border-0 border-b border-[#5c626f] bg-transparent px-0 py-2
text-sm text-white/92 focus-visible:outline-none focus-visible:border-[#8a92a0]
```

Option style: `bg-[#141414] text-white`

### PAT-BTN-ICON-TOPBAR

Top bar icon buttons (Undo/Redo/Preview/Export/etc.).

Class recipe:

```txt
inline-flex h-5 w-5 items-center justify-center text-white/75 transition
hover:text-white disabled:opacity-35
```

Icon size: `h-4 w-4`.

### PAT-BTN-ICON-RAIL

Left rail tool buttons (Slides/Pages tools).

Inactive:

```txt
inline-flex h-7 w-7 items-center justify-center text-white/55 transition hover:text-white/92
```

Active text color: `text-white`.

### PAT-BTN-CIRCLE-ACTION

Round CTA and upload buttons used in prompt + visuals.

Secondary (upload):

```txt
inline-flex h-12 w-12 items-center justify-center rounded-full text-[#d4d9e2]
transition hover:bg-[#262b36]
```

with background `#1f232d`.

Primary (generate/send):

```txt
inline-flex h-12 w-12 items-center justify-center rounded-full text-[#111111]
transition hover:bg-[#f7f8fa] disabled:text-[#5a606d] disabled:opacity-100
```

with background `#eef1f5` (enabled), `#d8dde5` (disabled).

### PAT-MODE-TOGGLE-TEXT

Text-only segmented switch (`Text to Image | Image to Image`).

Active: `text-white`  
Inactive: `text-white/50 hover:text-white/80`  
Divider: `text-white/30`

### PAT-CARD-NEUTRAL

`Card` primitive is intentionally neutral:

```txt
rounded-none border-0 bg-transparent shadow-none backdrop-blur-0
```

All visual styling comes from the parent via `className`.

### PAT-MODAL-OVERLAY

Fullscreen modal overlay:

```txt
fixed inset-0 z-50 grid place-items-center bg-black/70 p-4
```

Modal panel variants:

- Compact confirm: `w-full max-w-[560px] bg-[#17181b] p-5`
- Prompt modal: `w-full max-w-[980px] bg-[#121214] p-4 md:p-5`

### PAT-PREVIEW-WINDOW-BG

Rule for any new browser window opened for preview (`window.open`):

- The preview window `html` and `body` background must match app background color.
- Required background: `#141414` (same as `--color-bg`).
- Do not use alternate dark backgrounds (for example `#111`) for preview window shells.

Canonical baseline style for preview popouts:

```txt
html, body { margin: 0; padding: 0; background: #141414; }
```

If a preview needs a centered white frame/canvas, only the frame may be white; the surrounding window background must remain `#141414`.

### PAT-PANEL-SIDEBAR-DARK

Right/side panels used for thumbnails and metadata rails in Slides/Pages.

Canonical container recipes:

- `min-h-[80vh] space-y-2 bg-[#101216] p-4`
- `space-y-2 p-4` (lighter variant when shell is provided by parent layout)

Expected content structure:

- Vertical list: `ul.space-y-2`
- Item container: `cursor-pointer p-2 transition`
- Active item state: `bg-white/10`
- Secondary text: `text-[10px] text-white/55`

### PAT-PANEL-FLYOUT-SHAPE

Micro flyout panel used by Shapes tool in Slides/Pages.

Canonical flyout shell:

```txt
absolute left-9 top-1/2 z-30 w-12 -translate-y-1/2 rounded-xl
border border-white/10 bg-[#0f1116]/95 p-1
shadow-[0_14px_32px_rgba(0,0,0,0.48)] backdrop-blur
```

Flyout content:

- Stack: `flex flex-col items-center gap-1`
- Item button: `inline-flex h-8 w-8 items-center justify-center rounded-md text-white/70 transition hover:bg-white/10 hover:text-white`

### PAT-PANEL-FLOATING-CHARACTER

Character panel (Text Engine) in Slides/Pages.  
Legacy alias: `PAT-TEXT-ENGINE-PANEL`.

Canonical shell:

```txt
absolute z-20 w-[332px] max-w-[calc(100%-2rem)] overflow-hidden rounded-2xl
border border-black/70
bg-[radial-gradient(circle_at_top_left,#2f3136_0%,#1d1f23_45%,#17181b_100%)]
text-white/92 shadow-[0_28px_70px_rgba(0,0,0,0.58)]
```

Panel header:

- Drag bar: `flex cursor-grab items-center justify-start border-b border-white/10 px-3 py-2 active:cursor-grabbing`
- Close button: `inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/25 text-white/70 transition hover:bg-black/40 hover:text-white`
- Title chip: `rounded-md bg-white/12 px-3 py-1 text-[15px] font-semibold leading-none tracking-tight`

Panel section stripe:

- `border-y border-white/10 bg-black/20 px-3 py-2`
- Header text: `text-[13px] font-semibold`

Panel control surfaces:

- Readout/input blocks: `h-9 rounded-md bg-white/14` (or `bg-white/10`)
- Select text: `text-[13px] text-white/92`
- Chevron icon color: `text-white/70`
- Option menu style: `bg-[#23262c] text-white`

Panel icon toggle buttons:

- Base:
  - `inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-black/30 text-white/85 transition hover:bg-black/50`
- Active:
  - `border-indigo-300/70 bg-indigo-500/30 text-white`
- Disabled:
  - `disabled:cursor-not-allowed disabled:text-white/45`

Panel behavior rules:

- Must be draggable and clamped to workspace bounds.
- Must remain above canvas (`z-20` minimum).
- Should preserve last position while workspace remains mounted.
- Must use icon-only controls with both `aria-label` and `title`.

### PAT-PANEL-FLOATING-SHAPES

Floating Shapes panel in Slides/Pages.

- Reuses the same shell, header, section stripes, control surfaces, and drag behavior as `PAT-PANEL-FLOATING-CHARACTER`.
- Title chip text must be `Shapes`.
- Positioning and close interaction follow the same rules as Character panel.
- Current implementation parity note: until Shape controls are finalized, the panel may reuse Character control scaffolding.

### PAT-CANVAS-FRAME

Preview stage in Slides/Pages:

- Outer: `relative h-[78vh] w-full overflow-hidden bg-[#0f1012]`
- Grid background overlay:
  - `absolute inset-0`
  - `bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)]`
  - `bg-[size:28px_28px]`
- Centered stage wrapper: `absolute inset-0 grid place-items-center p-8`

### PAT-THUMBNAIL-LIST-ITEM

Used for page/slide side lists.

- Item: `cursor-pointer p-2 transition` + active `bg-white/10`
- Thumbnail iframe: `h-20 w-full border-0 bg-white pointer-events-none`
- Delete chip: `absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center bg-black/55 text-white/85 transition hover:bg-black/80 hover:text-white`

## 5. Iconography Rules

- Icon library: `lucide-react`
- Top bar icons: `h-4 w-4`
- Tool rail icons: `h-4 w-4`
- Circular CTA icons: `h-[22px] w-[22px]` to `h-[25px] w-[25px]`
- Always provide both `aria-label` and `title` on icon-only buttons.

## 6. Interaction + State Rules

- Hover states should adjust contrast, not layout.
- Disabled controls must stay visible and use opacity/text treatment (no `display:none` for disabled action affordances).
- Focus behavior:
  - Inputs/selects use explicit `focus-visible:outline-none` and border-color shift.
  - Icon buttons rely on color transitions.
- Destructive actions:
  - Use icon-only delete in thumbnail context.
  - Keep destructive action visually secondary unless in explicit danger context.

## 7. Accessibility Baseline

- Every icon-only button must include:
  - `aria-label`
  - `title`
- Hidden file inputs must be triggered by accessible buttons.
- Maintain text contrast similar to existing patterns (white at reduced opacities over dark backgrounds).

## 8. Pattern Registry (Current)

Approved pattern IDs in this project:

- `PAT-INPUT-UNDERLINE`
- `PAT-TEXTAREA-UNDERLINE`
- `PAT-SELECT-UNDERLINE`
- `PAT-BTN-ICON-TOPBAR`
- `PAT-BTN-ICON-RAIL`
- `PAT-BTN-CIRCLE-ACTION`
- `PAT-MODE-TOGGLE-TEXT`
- `PAT-CARD-NEUTRAL`
- `PAT-MODAL-OVERLAY`
- `PAT-PREVIEW-WINDOW-BG`
- `PAT-PANEL-SIDEBAR-DARK`
- `PAT-PANEL-FLYOUT-SHAPE`
- `PAT-PANEL-FLOATING-CHARACTER`
- `PAT-PANEL-FLOATING-SHAPES`
- `PAT-CANVAS-FRAME`
- `PAT-THUMBNAIL-LIST-ITEM`
- `PAT-TEXT-ENGINE-PANEL` (legacy alias of `PAT-PANEL-FLOATING-CHARACTER`)

## 9. Rule for New UI Objects

When adding any new UI object:

1. Reuse an existing pattern ID from this guide.
2. If no pattern fits, define a new pattern with:
   - Name + pattern ID
   - Purpose
   - Canonical class recipe
   - States (default/hover/focus/active/disabled)
   - Accessibility notes
3. Add the new pattern to Section 8 in the same PR.
4. If new colors/radii/shadows are introduced, add them to token definitions (`app/globals.css` + `tailwind.config.ts`) before using them.

This is mandatory for consistency across Slides, Pages, Site Design, and Visuals.
