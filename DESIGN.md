# Design Specification

> **Scope:** Visual styles only. Do not change component logic, state, routing, or data structures.
>
> **Status:** This document reflects the current implemented design as of v1.0.4. All sections describe what is live in `src/` — treat them as ground truth, not aspirational targets.

---

## 1. Design Intent

The UI adopts a **tactical HUD / military intel display** aesthetic — think radar operators' consoles, hardened field terminals, and heads-up overlays. Key principles:

- **CRT phosphor-green** primary text on a **deep green-tinted near-black** field — the backgrounds carry a faint phosphor wash so panels layer like a lit tube rather than dead void
- Flat, panel-based layout with hard edges, **0px border-radius everywhere** — zero tolerance for softness
- Colour used as a **data channel**, not decoration — full-brightness `#00ff41` is reserved exclusively for **active, selected, and interactive** states; structural lines use dim forest-green
- All text **uppercase and monospace**; information must be **scannable at a glance**
- Maximum information density — every pixel earns its place
- HUD dressing (corner brackets, rule dividers) reinforces the hardened-terminal feel
- **Snap transitions (75ms linear only)** — no easing curves, no spring, no slide animations
- Map tiles are left unstyled; the intel aesthetic lives entirely in the UI chrome

---

## 2. Typography

| Property        | Value                                                                              |
| --------------- | ---------------------------------------------------------------------------------- |
| Font family     | `'IBM Plex Mono', monospace`                                                       |
| Import          | `https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap` |
| Weights in use  | `400` (labels, body) · `500` (data values, names, titles)                          |
| Global tracking | `letter-spacing: 0.02em` on `:root`                                                |
| Case            | **ALL UPPERCASE** everywhere — labels, headings, buttons, placeholders             |

IBM Plex Mono was chosen for its angular, mechanically precise letterforms and IBM/government-computing heritage — it reads as instrument output, not retro gaming.

### 2.1 Three-tier emphasis system

Every surface applies the same hierarchy. Never invert it.

| Tier                | Role                                                    | Size      | Weight | Colour                   |
| ------------------- | ------------------------------------------------------- | --------- | ------ | ------------------------ |
| **Data value**      | The thing being read — coordinates, names, measurements | `14–16px` | `500`  | `--color-text`           |
| **Context label**   | What names or describes the data                        | `10–12px` | `400`  | `--color-text-secondary` |
| **Metadata / hint** | Group tags, descriptions, calibration hints             | `10–11px` | `400`  | `--color-text-muted`     |

Examples applied:

- **PinCard**: name 14px/500, coordinate 12px/secondary, group 10px/muted
- **PinInfo**: system label (WGS84, UTM…) 10px/muted above, coordinate value 14px/500
- **SettingsPanel**: setting name 12px/secondary left, current value 14px/500 right
- **GpsPanel**: data labels (AZIMUTH, PITCH, ROLL) 10px/muted; values 16px/500
- **PlotControls**: system label 10px/muted; coordinate 15px/500
- **Dialog title**: 15px/500

### 2.2 Letter-spacing by context

| Context                      | `letter-spacing`        |
| ---------------------------- | ----------------------- |
| Body / data values           | `0.02em` (root default) |
| Buttons (action labels)      | `0.08em`                |
| Field labels / panel headers | `0.08–0.10em`           |
| Nav tab labels               | `0.10em`                |

---

## 3. Colour Tokens

All tokens live in `src/styles/theme.css` under `@theme { }` (dark defaults) and `[data-theme='light'] { }` (DAY overrides).

### 3.1 NIGHT theme (default — `data-theme="dark"`)

Backgrounds carry a faint phosphor-green CRT wash. Full-brightness `#00ff41` is the accent colour only — **not** used for structural borders.

```css
/* Backgrounds — three levels of CRT-green depth */
--color-bg: #020e05; /* base canvas */
--color-bg-secondary: #071a0b; /* panel fill */
--color-bg-tertiary: #0c2114; /* input / inset fill */

/* Text — phosphor hierarchy */
--color-text: #00ff41; /* primary phosphor — data values */
--color-text-secondary: #00c032; /* ~75% phosphor — labels */
--color-text-muted: #2d6e42; /* ~35% — placeholders, hints */

/* Borders — dim forest-green; bright accent reserved for active/selected */
--color-border: #1e5c30; /* structural panel/card edges */
--color-border-subtle: #133d1e; /* dividers, input default borders */

/* Accent — full phosphor, interactive/active states only */
--color-accent: #00ff41;
--color-accent-bg: rgba(0, 255, 65, 0.1);
--color-accent-border: rgba(0, 255, 65, 0.4);

--color-danger: #ff2020; /* hostile red */
--color-overlay: rgba(0, 8, 2, 0.9); /* green-tinted modal scrim */
```

### 3.2 DAY theme (`data-theme="light"`)

Paper-map palette — aged cream stock with dark olive ink and amber accent. Intel structure (grids, uppercase, mono) is preserved; only luminosity inverts.

```css
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
```

### 3.3 Entity / data colours (both themes)

NATO-inspired tactical signal meanings. Never change these variable names.

```css
--color-red: #ff2020; /* HOSTILE  */
--color-orange: #ff8c00; /* UNKNOWN  */
--color-green: #00ff41; /* FRIENDLY — matches NIGHT phosphor */
--color-azure: #00bfff; /* NEUTRAL  */
--color-violet: #bf5fff; /* SPECIAL  */
```

### 3.4 Contrast requirements (WCAG 2.1 AA)

| Pair                                         | Min ratio |
| -------------------------------------------- | --------- |
| `--color-text` on `--color-bg`               | ≥ 4.5 : 1 |
| `--color-text` on `--color-bg-secondary`     | ≥ 4.5 : 1 |
| `--color-accent` on `--color-bg-secondary`   | ≥ 3 : 1   |
| Entity colours used as icon/chip fills on bg | ≥ 3 : 1   |

`#00ff41` on `#020e05` exceeds 8 : 1. Verify with a contrast checker if tokens change.

---

## 4. Shape, Borders & HUD Dressing

| Property      | Value                                  |
| ------------- | -------------------------------------- |
| Border radius | **0px everywhere** — no exceptions     |
| Panel border  | `1px solid var(--color-border)`        |
| Dividers      | `1px solid var(--color-border-subtle)` |

### 4.1 Corner-bracket marks

**2-corner** (`.hud-bracketed` / `.bracket-selected`) — top-left + bottom-right. Applied to: active nav tab, selected card row.

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
  border-width: 1px 0 0 1px;
}
.hud-bracketed::after {
  bottom: 0;
  right: 0;
  border-width: 0 1px 1px 0;
}
```

**4-corner** (`.hud-bracketed-full`) — all corners via `box-shadow`. Applied to: active desktop dialog, focused panel, selected toggle item, popovers.

```css
.hud-bracketed-full {
  outline: 1px solid transparent;
  box-shadow:
    -10px -10px 0 -9px var(--color-accent),
    10px -10px 0 -9px var(--color-accent),
    -10px 10px 0 -9px var(--color-accent),
    10px 10px 0 -9px var(--color-accent);
}
```

### 4.2 Panel header accent stripe

Every panel section header carries a 3px left-border accent stripe via `.panel-header`:

```css
.panel-header {
  border-left: 3px solid var(--color-accent);
  padding-left: 9px; /* 12px total with the 3px border */
}
```

Applied to: `GpsPanel` section headers, `RulerPanel` header, `SettingsPanel` group headers.

### 4.3 Scanline texture (opt-in)

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

Not enabled by default. Add class `scanlines` to `<html>` to activate.

---

## 5. Touch Targets

Every interactive element: **48 × 48px** minimum hit area. Enforce with `min-width`/`min-height` or padding — visual size may be smaller.

---

## 6. Component Specifications

### 6.1 Panel / Card

```
╔═════════════════════════════╗
║ ▌ SECTION HEADER            ║  ← .panel-header, 11px/400/secondary, 6px padding, border-bottom
╠═════════════════════════════╣
║  content area               ║  ← --color-bg-secondary background
╚═════════════════════════════╝
```

- Background: `var(--color-bg-secondary)`
- Border: `1px solid var(--color-border)`
- Radius: `0px`
- Header: `font-size: 11px`, `letter-spacing: 0.10em`, uppercase, `color: var(--color-text-secondary)`, `padding: 6px 12px 6px 9px`, `border-bottom: 1px solid var(--color-border)`, `.panel-header` left stripe (§4.2)
- **Selected state:** background → `var(--color-accent-bg)`, border → `1px solid var(--color-accent-border)`, add `.hud-bracketed` (§4.1)

### 6.2 List Item / Card Row (PinCard, TrackCard)

Three-tier layout within each row:

```
[color chip]  ITEM NAME (14px/500/text)        [icon btn]
              coordinate or stats (12px/400/secondary)
              group tag (10px/400/muted)
```

- `min-height: 48px`, `padding: 12px 16px`
- Color chip: `12×12px`, `border-radius: 0px` (square)
- Name: `font-size: 14px`, `font-weight: 500`, uppercase
- Secondary line: `font-size: 12px`, `color: var(--color-text-secondary)`
- Metadata line: `font-size: 10px`, `color: var(--color-text-muted)`, uppercase, `letter-spacing: 0.06em`
- **Selected:** `background: var(--color-accent-bg)`, `border: 1px solid var(--color-accent-border)`, `.hud-bracketed`

### 6.3 Button

| Variant   | Background            | Text                | Border                          |
| --------- | --------------------- | ------------------- | ------------------------------- |
| `primary` | `var(--color-accent)` | `#000000`           | none                            |
| `ghost`   | transparent           | `var(--color-text)` | `1px solid var(--color-border)` |
| `danger`  | `var(--color-danger)` | `#ffffff`           | none                            |
| `icon`    | transparent           | `var(--color-text)` | none                            |

All buttons:

- Radius: `0px`, min size: `48 × 48px`
- Text: uppercase, `font-size: 13px`, `letter-spacing: 0.08em`
- Focus ring: `outline: 1px solid var(--color-accent); outline-offset: 3px`
- Hover (`ghost`/`icon`): `background: var(--color-accent-bg)`, `color: var(--color-accent)`, `75ms linear`
- Active/pressed: `opacity: 0.75`
- Disabled: `opacity: 0.3; pointer-events: none`
- **No box-shadow anywhere**

### 6.4 Dialog / Bottom Sheet

```
╔══════════════════════════════╗
║ ▌ DIALOG TITLE          [✕] ║  ← .panel-header stripe, 15px/500, border-bottom
╠══════════════════════════════╣
║  content                     ║  ← padding: 1.25rem 1rem 1.5rem
╚══════════════════════════════╝
```

- Radius: `0px` everywhere — including mobile bottom sheet top corners
- Overlay: `background: var(--color-overlay)`
- Title: `font-size: 15px`, `font-weight: 500`, uppercase, `letter-spacing: 0.06em`, `.panel-header` left stripe, `border-bottom: 1px solid var(--color-border)`
- Close button: 48×48px, `aria-label="Close"`, top-right absolute
- **Desktop:** centred, `max-width: 480px`, `background: var(--color-bg-secondary)`, `border: 1px solid var(--color-border)`, `.hud-bracketed-full` 4-corner brackets, no box-shadow
- **Mobile (bottom sheet):** full width, `max-height: 85dvh`, `border-top: 1px solid var(--color-border)`
- Animation: `75ms linear` opacity fade — no slide, no scale

### 6.5 Input / Textarea

- Background: `var(--color-bg-tertiary)`
- Border: `1px solid var(--color-border-subtle)` (default), `var(--color-accent)` + `border-left: 2px solid var(--color-accent)` on focus
- Radius: `0px`
- Text: `var(--color-text)`, `font-size: 14px`, `letter-spacing: 0.02em`
- Placeholder: `var(--color-text-muted)`, uppercase
- Label: `font-size: 11px`, `letter-spacing: 0.10em`, uppercase, `color: var(--color-text-secondary)`, `margin-bottom: 4px`
- Disabled: `opacity: 0.3`

### 6.6 Select

- Trigger: same as input (§6.5); chevron `color: var(--color-text-muted)`; `75ms linear` chevron rotation; focus/expanded adds accent left-border
- Dropdown: `background: var(--color-bg-tertiary)`, `border: 1px solid var(--color-border)`, `0px radius`, no box-shadow, `75ms linear` fade
- Option: `min-height: 48px`, `padding: 0 12px`, uppercase, `letter-spacing: 0.04em`
- Selected: `background: var(--color-accent-bg)`, `border-left: 3px solid var(--color-accent)`

### 6.7 Toggle Group

- Container: `background: var(--color-bg-tertiary)`, `border: 1px solid var(--color-border)`, `0px radius`
- Item: `min-height: 48px`, uppercase `font-size: 12px`, `letter-spacing: 0.08em`, `color: var(--color-text-secondary)`, `75ms linear`
- Active item: `background: var(--color-accent-bg)`, `color: var(--color-accent)`, `border: 1px solid var(--color-accent-border)`, `.hud-bracketed-full` 4-corner brackets

### 6.8 Accordion

- Trigger: `min-height: 48px`, `padding: 0 12px`, uppercase `font-size: 12px`, `letter-spacing: 0.08em`, `border-bottom: 1px solid var(--color-border-subtle)`
- Expanded: `color: var(--color-accent)`, `.panel-header` left stripe (`border-left: 3px solid var(--color-accent); padding-left: 9px`)
- Chevron: `18px`, snaps `180deg` at `75ms linear` when expanded — no ease
- Content: `background: var(--color-bg)`, `padding: 12px`

### 6.9 Popover

- Background: `var(--color-bg-secondary)`, `border: 1px solid var(--color-border)`, `0px radius`
- No box-shadow — flat display discipline
- `.hud-bracketed-full` 4-corner bracket dressing
- `75ms linear` opacity fade

### 6.10 Toast

- `0px radius`, `background: var(--color-bg-secondary)`, `border: 1px solid var(--color-border)`
- Left border: `3px solid var(--color-accent)` (info/success) or `3px solid var(--color-danger)` (error)
- Text: uppercase, `font-size: 13px`, `letter-spacing: 0.06em`
- Position: `72px` above viewport bottom (above bottom nav), centred
- Max 3 visible; `75ms linear` opacity — no slide

### 6.11 Bottom Nav (mobile)

```
╔══════════╦══════════╦══════════╗
║  [icon]  ║  [icon]  ║  [icon]  ║
║   MAP    ║   SAVED  ║   TOOLS  ║  ← 10px/400 inactive, 10px/500 active
╚══════════╩══════════╩══════════╝
```

- Background: `var(--color-bg-secondary)`, `border-top: 1px solid var(--color-border)`
- Each tab: `min-height: 56px`, `min-width: 48px`, flex column, icon `24px`
- Inactive: `color: var(--color-text-muted)`, `font-weight: 400`
- Active: `color: var(--color-accent)`, `font-weight: 500`, `.hud-bracketed` 2-corner bracket
- Labels: `font-size: 10px`, uppercase, `letter-spacing: 0.10em`

### 6.12 Desktop Sidebar Nav

- Active tab: `border-left: 3px solid var(--color-accent)`, `background: var(--color-accent-bg)`, `color: var(--color-accent)`, `font-weight: 500`
- Inactive: `color: var(--color-text-muted)`, `font-weight: 400`
- Tab labels: `font-size: 10px`, `letter-spacing: 0.10em`, uppercase
- `75ms linear` transitions on colour and background

---

## 7. Readout Panel Layout

Used in `GpsPanel`, `RulerPanel`, `TrackInfo` — any live-data display. Label above, value below (or grid layout for dense rows).

### 7.1 Inline label-over-value (preferred for single values)

```
AZIMUTH          ← 10px/400/muted, uppercase, 0.08em tracking
045.2°           ← 16px/500/text, 0.02em tracking
```

### 7.2 Grid layout (readout-grid class — for tabular data)

```
╔════════════════════════════════════╗
║ ▌ SECTION HEADER                   ║
╠════════════════════════════════════╣
║  LABEL    :  VALUE                 ║
╚════════════════════════════════════╝
```

```css
.readout-grid {
  display: grid;
  grid-template-columns: 96px 14px 1fr; /* label | colon | value */
  row-gap: 0;
}
.readout-label {
  font-size: 11px;
  font-weight: 400;
  color: var(--color-text-secondary);
  letter-spacing: 0.08em;
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
  font-weight: 500;
  color: var(--color-text);
  letter-spacing: 0.03em;
  line-height: 26px;
  text-align: right;
}
```

### 7.3 Settings-style label–value row

Used in `SettingsPanel` and similar list rows. The **current value** is always the dominant element.

```
coordinate system  ← 12px/400/secondary, uppercase, 0.06em
WGS84              ← 14px/500/text, uppercase, right-aligned
```

---

## 8. Accessibility Checklist

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
| Night mode  | Verify `#00ff41` on `#020e05` passes ≥ 4.5 : 1 (it does; > 8 : 1)                                          |
