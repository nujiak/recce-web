# Frontend Overhaul — Design Specification

> **Scope:** Visual styles only. Do not change component logic, state, routing, or data structures.

---

## 1. Design Intent

The UI adopts a **tactical HUD / military intel display** aesthetic — think radar operators' consoles, hardened field terminals, and heads-up overlays. Key principles:

- Near-black field with phosphor-green primary text — high contrast, zero eye fatigue in low-light ops
- Flat, panel-based layout with hard edges and no decorative rounding — zero tolerance for softness
- Colour used as a **data channel**, not decoration — each hue carries a fixed tactical meaning
- All text uppercase and monospace; information must be **scannable at a glance**
- Maximum information density — every pixel earns its place
- HUD dressing (corner brackets, rule dividers, status bars) reinforces the hardened-terminal feel
- Snap transitions (50–100 ms, no easing curves) — instant-cut discipline; no spring or ease animations
- Map tiles are left unstyled; the intel aesthetic lives entirely in the UI chrome

---

## 2. Typography

| Property       | Value                                                                             |
| -------------- | --------------------------------------------------------------------------------- |
| Font family    | `'Share Tech Mono', monospace`                                                    |
| Import         | `https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap`           |
| Weight         | 400 (only weight available)                                                       |
| Letter-spacing | `0.06em` on all labels and values                                                 |
| Case           | **ALL UPPERCASE** everywhere — labels, headings, buttons, placeholders, body text |
| Minimum sizes  | Labels: `11px` · Values: `13px` · Body/inputs: `14px`                             |

Replace `'Geist Mono'` with `'Share Tech Mono'` everywhere — update `--font-mono` token in `src/styles/theme.css` and the `<link>` in `src/index.html`.

---

## 3. Colour Tokens

All tokens live in `src/styles/theme.css`. Retain existing CSS variable names. Replace all values.

### 3.1 NIGHT theme (`data-theme="dark"`, default)

```css
[data-theme='dark'] {
  --color-bg: #000000; /* true black — CRT off-state */
  --color-bg-secondary: #0a0a0a; /* panel fill */
  --color-bg-tertiary: #111111; /* input / inset fill */
  --color-text: #00ff41; /* phosphor green — primary readout */
  --color-text-secondary: #00c032; /* dimmed phosphor — labels */
  --color-text-muted: #006b1c; /* very dim — separators, placeholders */
  --color-border: #00ff41; /* full-brightness border */
  --color-border-subtle: #004d13; /* low-intensity structural line */
  --color-accent: #00ff41; /* same as text — accent = phosphor */
  --color-accent-bg: rgba(0, 255, 65, 0.08);
  --color-accent-border: rgba(0, 255, 65, 0.45);
  --color-danger: #ff2020; /* hostile red */
  --color-overlay: rgba(0, 0, 0, 0.88);
}
```

### 3.2 DAY theme (`data-theme="light"`)

The DAY theme uses a paper-map palette — aged cream stock with dark olive ink and amber accent. The intel structure (grids, uppercase, mono) is preserved; only luminosity inverts.

```css
[data-theme='light'] {
  --color-bg: #f0ead6; /* aged field-paper cream */
  --color-bg-secondary: #e8e0c8;
  --color-bg-tertiary: #ddd5b8;
  --color-text: #1a1a0a; /* dark olive ink */
  --color-text-secondary: #3a3820;
  --color-text-muted: #706b4a;
  --color-border: #4a4628; /* dark olive border */
  --color-border-subtle: #a09870;
  --color-accent: #8b6000; /* dark amber ink */
  --color-accent-bg: rgba(139, 96, 0, 0.1);
  --color-accent-border: rgba(139, 96, 0, 0.4);
  --color-danger: #b01010;
  --color-overlay: rgba(0, 0, 0, 0.6);
}
```

### 3.3 Entity / data colours (both themes)

These map to NATO-inspired tactical signal meanings. CSS variable names are unchanged.

```css
--color-red: #ff2020; /* HOSTILE   */
--color-orange: #ff8c00; /* UNKNOWN   */
--color-green: #00ff41; /* FRIENDLY  — matches NIGHT phosphor */
--color-azure: #00bfff; /* NEUTRAL   */
--color-violet: #bf5fff; /* SPECIAL   */
```

### 3.4 Contrast requirements (WCAG 2.1 AA)

| Pair                                         | Min ratio |
| -------------------------------------------- | --------- |
| `--color-text` on `--color-bg`               | ≥ 4.5 : 1 |
| `--color-text` on `--color-bg-secondary`     | ≥ 4.5 : 1 |
| `--color-accent` on `--color-bg-secondary`   | ≥ 3 : 1   |
| Entity colours used as icon/chip fills on bg | ≥ 3 : 1   |

Verify with a contrast checker after implementation. Adjust lightness only if a pair fails.

---

## 4. Shape, Borders & HUD Dressing

| Property      | Value                                  |
| ------------- | -------------------------------------- |
| Border radius | **0px everywhere** — no exceptions     |
| Panel border  | `1px solid var(--color-border)`        |
| Dividers      | `1px solid var(--color-border-subtle)` |

### 4.1 Corner-bracket mark (active / selected / HUD panel state)

Full four-corner bracket dressing. Applied via `::before` + `::after` on the target; no extra DOM nodes.

```
┌──                    ──┐
│                        │
│                        │
└──                    ──┘
```

Specification:

- Arm length: `10px`
- Thickness: `1px`
- Colour: `var(--color-accent)`
- Gap between corner arms and panel edge: `0px` (flush)

```css
.hud-bracketed {
  position: relative;
}
.hud-bracketed::before,
.hud-bracketed::after {
  content: '';
  position: absolute;
  width: 10px;
  height: 10px;
  border-color: var(--color-accent);
  border-style: solid;
  pointer-events: none;
}
.hud-bracketed::before {
  top: 0;
  left: 0;
  border-width: 1px 0 0 1px; /* top-left */
}
.hud-bracketed::after {
  bottom: 0;
  right: 0;
  border-width: 0 1px 1px 0; /* bottom-right */
}
```

For the remaining two corners, use a sibling pseudo-element pattern on a wrapper, or duplicate via a utility class `.hud-bracketed-full` that uses `box-shadow` insets:

```css
/* All four corners via outline trick — use where DOM depth allows */
.hud-bracketed-full {
  outline: 1px solid transparent;
  box-shadow:
    -10px -10px 0 -9px var(--color-accent),
    /* top-left */ 10px -10px 0 -9px var(--color-accent),
    /* top-right */ -10px 10px 0 -9px var(--color-accent),
    /* bottom-left */ 10px 10px 0 -9px var(--color-accent); /* bottom-right */
}
```

Apply `hud-bracketed` (2-corner) to: active nav tab, selected card row.  
Apply `hud-bracketed-full` (4-corner) to: active dialog, focused panel, selected toggle item.

### 4.2 Panel header rule

Every panel header carries a left accent stripe:

```css
.panel-header {
  border-left: 3px solid var(--color-accent);
  padding-left: 9px; /* 12px total with the 3px border */
}
```

### 4.3 Scanline texture (optional overlay)

For maximum terminal immersion, a scanline overlay can be applied to the root via a repeating gradient. Toggle with a class on `<html>`:

```css
html.scanlines::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent 2px,
    rgba(0, 0, 0, 0.08) 2px,
    rgba(0, 0, 0, 0.08) 4px
  );
}
```

This is opt-in; do not enable by default.

---

## 5. Touch Targets

Every interactive element must meet **48 × 48px** minimum hit area on both mobile and desktop. Enforce with `min-width`/`min-height` or padding — visual size may be smaller. Affected elements:

- All `<button>` and icon buttons
- Nav tabs (bottom nav + desktop sidebar)
- List/card rows (add `min-height: 48px`)
- Select trigger and options
- Toggle group items
- Accordion triggers
- Close icons in dialogs

---

## 6. Component Specifications

### 6.1 Panel / Card

```
╔═════════════════════════════╗
║ ▌ SECTION HEADER            ║  ← 11px uppercase, accent left-stripe, 6px 12px padding, 1px border-bottom
╠═════════════════════════════╣
║  content area               ║  ← --color-bg-secondary background
╚═════════════════════════════╝
```

- Background: `var(--color-bg-secondary)`
- Border: `1px solid var(--color-border)`
- Radius: `0px`
- Header: `font-size: 11px`, `letter-spacing: 0.10em`, uppercase, `color: var(--color-text-secondary)`, `padding: 6px 12px`, `border-bottom: 1px solid var(--color-border)`, left accent stripe (§4.2)
- **Selected state:** background → `var(--color-accent-bg)`, border → `1px solid var(--color-accent-border)`, add 2-corner bracket (§4.1)

### 6.2 Button

| Variant   | Background            | Text colour         | Border                          |
| --------- | --------------------- | ------------------- | ------------------------------- |
| `primary` | `var(--color-accent)` | `#000000`           | none                            |
| `ghost`   | transparent           | `var(--color-text)` | `1px solid var(--color-border)` |
| `danger`  | `var(--color-danger)` | `#ffffff`           | none                            |
| `icon`    | transparent           | `var(--color-text)` | none                            |

All buttons:

- Radius: `0px`
- Text: uppercase, `font-size: 13px`, `letter-spacing: 0.08em`
- Min size: `48 × 48px` (use padding to reach this on small buttons)
- Focus ring: `outline: 1px solid var(--color-accent); outline-offset: 3px`
- Hover (`ghost`/`icon`): background → `var(--color-accent-bg)`, text → `var(--color-accent)`, transition `width 75ms steps(1)` (snap, no easing)
- Active/pressed: `opacity: 0.75`
- Disabled: `opacity: 0.3; pointer-events: none`
- **No box-shadow anywhere**

### 6.3 Dialog / Bottom Sheet

```
╔══════════════════════════════╗
║ ▌ DIALOG TITLE          [✕] ║  ← header: 1px border-bottom, padding 12px 16px, accent stripe
╠══════════════════════════════╣
║                              ║
║  content                     ║
║                              ║
╚══════════════════════════════╝
```

- Radius: `0px` everywhere — including mobile bottom sheet top corners
- Overlay: `background: var(--color-overlay)`
- Header: uppercase title (`font-size: 14px`, `letter-spacing: 0.08em`), accent left stripe (§4.2), close icon button (48×48px, `aria-label="Close"`)
- Desktop: centred, `max-width: 480px`, `background: var(--color-bg-secondary)`, `border: 1px solid var(--color-border)`, 4-corner brackets (§4.1 `.hud-bracketed-full`)
- Mobile (bottom sheet): full width, `max-height: 85dvh`, anchored to bottom, `background: var(--color-bg-secondary)`, `border-top: 1px solid var(--color-border)`
- Open/close animation: `75ms` linear opacity fade — no slide or scale

### 6.4 Input / Textarea

- Background: `var(--color-bg-tertiary)`
- Border: `1px solid var(--color-border-subtle)`
- Radius: `0px`
- Text: `var(--color-text)`, `font-size: 14px`, `letter-spacing: 0.04em`
- Placeholder: `var(--color-text-muted)`, uppercase
- Label: `font-size: 11px`, `letter-spacing: 0.10em`, uppercase, `color: var(--color-text-secondary)`, `margin-bottom: 4px`
- Focus: `border-color: var(--color-accent)` + left accent stripe `border-left: 2px solid var(--color-accent)` (no box-shadow)
- Disabled: `opacity: 0.3`

### 6.5 Select

- Trigger: same as input (§6.4), chevron icon right-aligned, `color: var(--color-text-muted)`
- Dropdown listbox: `background: var(--color-bg-tertiary)`, `border: 1px solid var(--color-border)`, `0px radius`
- Option: `min-height: 48px`, `padding: 0 12px`, uppercase text
- Selected option: `background: var(--color-accent-bg)`, left border `3px solid var(--color-accent)`
- Focused option: `background: var(--color-accent-bg)`

### 6.6 Toggle Group

- Container: `background: var(--color-bg-tertiary)`, `border: 1px solid var(--color-border)`, `0px radius`
- Item: `min-height: 48px`, uppercase `font-size: 12px`, `letter-spacing: 0.08em`, `color: var(--color-text-secondary)`
- Active item: `background: var(--color-accent-bg)`, `color: var(--color-accent)`, 4-corner brackets (§4.1 `.hud-bracketed-full`), `border: 1px solid var(--color-accent-border)`

### 6.7 Accordion

- Trigger: `min-height: 48px`, `padding: 0 12px`, uppercase `font-size: 12px`, `letter-spacing: 0.08em`, `border-bottom: 1px solid var(--color-border-subtle)`
- Expanded trigger: `color: var(--color-accent)`, left accent stripe (§4.2)
- Chevron: 18px, snaps `180deg` at `75ms linear` (no ease) when expanded
- Content: `background: var(--color-bg)`, `padding: 12px`

### 6.8 Popover

- Background: `var(--color-bg-secondary)`
- Border: `1px solid var(--color-border)`
- Radius: `0px`
- Shadow: none — flat display discipline
- 4-corner bracket dressing (§4.1 `.hud-bracketed-full`)

### 6.9 Toast

- Radius: `0px`
- Left border: `3px solid var(--color-accent)` (info/success) or `3px solid var(--color-danger)` (error)
- Background: `var(--color-bg-secondary)`
- Border: `1px solid var(--color-border)`
- Message text: uppercase, `font-size: 13px`, `letter-spacing: 0.06em`
- Position: anchored `72px` above bottom of viewport (above bottom nav)
- Max 3 visible; appear/disappear at `75ms linear` opacity — no slide

### 6.10 Bottom Nav (mobile)

```
╔══════════╦══════════╦══════════╗
║  [icon]  ║  [icon]  ║  [icon]  ║
║   MAP    ║   SAVED  ║   TOOLS  ║  ← 10px uppercase labels
╚══════════╩══════════╩══════════╝
```

- Background: `var(--color-bg-secondary)`
- Top border: `1px solid var(--color-border)`
- Each tab: `min-height: 56px`, `min-width: 48px`, flex column, icon `24px`
- Inactive: `color: var(--color-text-muted)`
- Active: `color: var(--color-accent)` + 2-corner bracket above icon (§4.1 `.hud-bracketed`)
- Labels: `font-size: 10px`, uppercase, `letter-spacing: 0.10em`

### 6.11 Desktop Sidebar Nav

- Right border: `1px solid var(--color-border)`
- Same tab rules as bottom nav, oriented vertically
- Active tab gets a full-width left accent stripe `border-left: 3px solid var(--color-accent)`

---

## 7. Readout Panel Layout

Used in: GpsPanel, RulerPanel, PinInfo coordinate list, any live-data display. This is the core intel-display component.

```
╔════════════════════════════════════╗
║ ▌ GRID REF / POSITION              ║
╠════════════════════════════════════╣
║  LAT      :  1.35210° N            ║
║  LNG      :  103.81980° E          ║
║  ALT      :  45 M                  ║
║  ACCURACY :  ±8 M                  ║
╚════════════════════════════════════╝
```

CSS grid layout:

```css
.readout-grid {
  display: grid;
  grid-template-columns: 96px 14px 1fr; /* label | colon | value */
  row-gap: 0;
}
.readout-label {
  font-size: 11px;
  color: var(--color-text-secondary);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  line-height: 26px;
}
.readout-sep {
  font-size: 11px;
  color: var(--color-text-muted);
  line-height: 26px;
  text-align: center;
}
.readout-value {
  font-size: 13px;
  color: var(--color-text);
  letter-spacing: 0.04em;
  line-height: 26px;
  text-align: right;
}
```

- Row `min-height: 26px`
- Separator is a literal `:` character — not a border
- Alternate rows may use `background: var(--color-bg-tertiary)` at `0.4` opacity for dense multi-row panels (banding)

---

## 8. Status Bar / HUD Header (optional persistent element)

A 24px-tall bar pinned to the top of the viewport, dark background, containing app name left-aligned and a live UTC clock right-aligned. No interaction; display only.

```
╔══════════════════════════════════════════════════════╗
║  RECCE                              UTC 14:32:07Z   ║
╚══════════════════════════════════════════════════════╝
```

```css
.hud-statusbar {
  height: 24px;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  font-size: 10px;
  letter-spacing: 0.12em;
  color: var(--color-text-muted);
  text-transform: uppercase;
}
```

---

## 9. Accessibility Checklist

All items must pass before a PR is merged.

| Criterion   | Requirement                                                                                                |
| ----------- | ---------------------------------------------------------------------------------------------------------- |
| WCAG 1.4.3  | Text contrast ≥ 4.5 : 1 in both themes                                                                     |
| WCAG 1.4.11 | UI component contrast ≥ 3 : 1                                                                              |
| WCAG 1.4.1  | Colour is never the sole differentiator — pair entity colour chips with a text label                       |
| WCAG 2.4.7  | All interactive elements have a visible focus ring: `1px solid var(--color-accent)`, `outline-offset: 3px` |
| WCAG 2.5.5  | All touch targets ≥ 48 × 48px                                                                              |
| WCAG 4.1.2  | All icon-only buttons have `aria-label`                                                                    |
| WCAG 4.1.2  | Kobalte components retain correct `role`, `aria-expanded`, `aria-selected` after restyling                 |
| Navigation  | Visible text labels on all nav items — do not remove labels to save space                                  |
| Night mode  | Verify `#00FF41` on `#000000` passes at ≥ 4.5 : 1 (it does; ~8.9 : 1)                                      |

---

## 10. Implementation Scope

Work file-by-file in this order. Each file is **styles only** — no logic changes.

| #   | File(s)                                        | Changes                                                                   |
| --- | ---------------------------------------------- | ------------------------------------------------------------------------- |
| 1   | `src/index.html`                               | Replace font `<link>` with Share Tech Mono; optionally add HUD status bar |
| 2   | `src/styles/theme.css`                         | Replace all colour token values (§3); update `--font-mono`                |
| 3   | `src/components/ui/Button.tsx`                 | Apply §6.2                                                                |
| 4   | `src/components/ui/Dialog.tsx`                 | Apply §6.3; add 4-corner bracket on desktop dialog                        |
| 5   | `src/components/ui/TextField.tsx`              | Apply §6.4                                                                |
| 6   | `src/components/ui/Select.tsx`                 | Apply §6.5                                                                |
| 7   | `src/components/ui/ToggleGroup.tsx`            | Apply §6.6                                                                |
| 8   | `src/components/ui/Accordion.tsx`              | Apply §6.7                                                                |
| 9   | `src/components/ui/Popover.tsx`                | Apply §6.8; add 4-corner brackets                                         |
| 10  | `src/components/ui/Toast.tsx`                  | Apply §6.9                                                                |
| 11  | `src/components/nav/BottomNav.tsx`             | Apply §6.10; 2-corner bracket on active tab                               |
| 12  | `src/components/nav/DesktopToolsBar.tsx`       | Apply §6.11; left accent stripe on active tab                             |
| 13  | `src/components/saved/PinCard.tsx`             | Panel pattern §6.1; 2-corner bracket on selected                          |
| 14  | `src/components/saved/TrackCard.tsx`           | Panel pattern §6.1; 2-corner bracket on selected                          |
| 15  | `src/components/tools/GpsPanel.tsx`            | Readout grid §7; panel header stripe §4.2                                 |
| 16  | `src/components/tools/RulerPanel.tsx`          | Readout grid §7; panel header stripe §4.2                                 |
| 17  | `src/components/settings/SettingsPanel.tsx`    | Panel pattern §6.1                                                        |
| 18  | `src/components/onboarding/OnboardingFlow.tsx` | Dialog pattern §6.3; 4-corner brackets                                    |
| 19  | `src/components/map/CompassButton.tsx`         | Icon button §6.2; 48px target                                             |
| 20  | `src/components/map/LocationButton.tsx`        | Icon button §6.2; 48px target                                             |
| 21  | `src/components/map/PlotControls.tsx`          | Panel §6.1; button §6.2                                                   |
| 22  | `src/components/map/MapStyleToggle.tsx`        | Panel §6.1; 48px targets                                                  |
| 23  | `src/components/pin/PinEditor.tsx`             | Dialog §6.3; input §6.4                                                   |
| 24  | `src/components/pin/PinInfo.tsx`               | Dialog §6.3; readout grid §7                                              |
| 25  | `src/components/track/TrackEditor.tsx`         | Dialog §6.3; input §6.4                                                   |
| 26  | `src/components/track/TrackInfo.tsx`           | Dialog §6.3; readout grid §7                                              |
