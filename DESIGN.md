# Frontend Overhaul — Design Specification

> **Scope:** Visual styles only. Do not change component logic, state, routing, or data structures.

---

## 1. Design Intent

The UI adopts a **Multi-Function Display (MFD)** aesthetic modelled on military C2 and cockpit instrumentation. Key principles:

- Flat, panel-based layout with hard edges and no decorative rounding
- Colour used as a **data channel**, not decoration — each hue maps to a tactical meaning
- All text uppercase and monospace; information is **scannable at a glance**
- Dense but uncluttered; every pixel earns its place
- Touch-optimised for field use on both mobile and desktop

---

## 2. Typography

| Property       | Value                                                                   |
| -------------- | ----------------------------------------------------------------------- |
| Font family    | `'Share Tech Mono', monospace`                                          |
| Import         | `https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap` |
| Weight         | 400 (only weight available)                                             |
| Letter-spacing | `0.04em` on all labels and values                                       |
| Case           | **ALL UPPERCASE** on labels, headings, button text, placeholders        |
| Minimum sizes  | Labels: `11px` · Values: `13px` · Body/inputs: `14px`                   |

Replace `'Geist Mono'` with `'Share Tech Mono'` everywhere — update `--font-mono` token in `src/styles/theme.css` and the `<link>` in `src/index.html`.

---

## 3. Colour Tokens

All tokens live in `src/styles/theme.css`. Retain existing CSS variable names. Replace all values.

### 3.1 NIGHT theme (`data-theme="dark"`, default)

```css
[data-theme='dark'] {
  --color-bg: oklch(0.07 0 0); /* near-black */
  --color-bg-secondary: oklch(0.11 0 0);
  --color-bg-tertiary: oklch(0.15 0 0);
  --color-text: oklch(0.9 0 0); /* off-white */
  --color-text-secondary: oklch(0.62 0 0);
  --color-text-muted: oklch(0.42 0 0);
  --color-border: oklch(0.26 0 0);
  --color-border-subtle: oklch(0.18 0 0);
  --color-accent: oklch(0.76 0.16 75); /* amber */
  --color-accent-bg: oklch(0.76 0.16 75 / 12%);
  --color-accent-border: oklch(0.76 0.16 75 / 45%);
  --color-danger: oklch(0.6 0.22 25); /* red */
  --color-overlay: oklch(0 0 0 / 85%);
}
```

### 3.2 DAY theme (`data-theme="light"`)

```css
[data-theme='light'] {
  --color-bg: oklch(0.94 0.015 90); /* olive-cream paper */
  --color-bg-secondary: oklch(0.9 0.013 90);
  --color-bg-tertiary: oklch(0.86 0.012 90);
  --color-text: oklch(0.15 0.02 90); /* dark olive-ink */
  --color-text-secondary: oklch(0.38 0.015 90);
  --color-text-muted: oklch(0.52 0.01 90);
  --color-border: oklch(0.68 0.015 90);
  --color-border-subtle: oklch(0.78 0.01 90);
  --color-accent: oklch(0.52 0.18 75); /* amber darkened for AA contrast */
  --color-accent-bg: oklch(0.52 0.18 75 / 12%);
  --color-accent-border: oklch(0.52 0.18 75 / 40%);
  --color-danger: oklch(0.48 0.22 25);
  --color-overlay: oklch(0 0 0 / 55%);
}
```

### 3.3 Entity / data colours (both themes)

These map to NATO-inspired tactical signal meanings. CSS variable names are unchanged (no DB migration needed).

```css
--color-red: oklch(0.6 0.22 25); /* HOSTILE */
--color-orange: oklch(0.74 0.17 65); /* UNKNOWN */
--color-green: oklch(0.62 0.18 151); /* FRIENDLY */
--color-azure: oklch(0.63 0.16 230); /* NEUTRAL */
--color-violet: oklch(0.63 0.2 310); /* SPECIAL */
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

## 4. Shape & Borders

| Property      | Value                                  |
| ------------- | -------------------------------------- |
| Border radius | **0px everywhere** — no exceptions     |
| Panel border  | `1px solid var(--color-border)`        |
| Dividers      | `1px solid var(--color-border-subtle)` |

### 4.1 Bracket corner mark (active / selected state)

Applied via CSS `::before` + `::after` on the selected element. No extra DOM nodes.

```
┌─     ─┐
│       │
└─     ─┘
```

Specification:

- Arm length: `8px`
- Thickness: `1px`
- Colour: `var(--color-accent)`
- Implemented as two pseudo-elements, each drawing two perpendicular lines using `border` shorthand:

```css
.selected::before,
.selected::after {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  border-color: var(--color-accent);
  border-style: solid;
}
.selected::before {
  top: 0;
  left: 0;
  border-width: 1px 0 0 1px; /* top-left corner */
}
.selected::after {
  bottom: 0;
  right: 0;
  border-width: 0 1px 1px 0; /* bottom-right corner */
}
```

Add `position: relative` to the parent. Apply this pattern to: active nav tab, selected card, active toggle group item.

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
┌─────────────────────────────┐
│ SECTION HEADER              │  ← 11px uppercase, --color-text-secondary, 6px 12px padding, 1px border-bottom
├─────────────────────────────┤
│ content area                │  ← --color-bg-secondary background
└─────────────────────────────┘
```

- Background: `var(--color-bg-secondary)`
- Border: `1px solid var(--color-border)`
- Radius: `0px`
- Header: `font-size: 11px`, `letter-spacing: 0.08em`, uppercase, `color: var(--color-text-secondary)`, `padding: 6px 12px`, `border-bottom: 1px solid var(--color-border)`
- **Selected state:** background → `var(--color-accent-bg)`, border → `1px solid var(--color-accent-border)`, add bracket marks (§4.1)

### 6.2 Button

| Variant   | Background            | Text colour         | Border                          |
| --------- | --------------------- | ------------------- | ------------------------------- |
| `primary` | `var(--color-accent)` | `oklch(0.07 0 0)`   | none                            |
| `ghost`   | transparent           | `var(--color-text)` | `1px solid var(--color-border)` |
| `danger`  | `var(--color-danger)` | `oklch(0.95 0 0)`   | none                            |
| `icon`    | transparent           | `var(--color-text)` | none                            |

All buttons:

- Radius: `0px`
- Text: uppercase, `font-size: 13px`, `letter-spacing: 0.04em`
- Min size: `48 × 48px` (use padding to reach this on small buttons)
- Focus ring: `outline: 2px solid var(--color-accent); outline-offset: 2px`
- Hover (`ghost`/`icon`): background → `var(--color-accent-bg)`, text → `var(--color-accent)`
- Disabled: `opacity: 0.4; pointer-events: none`

### 6.3 Dialog / Bottom Sheet

```
┌──────────────────────────────┐
│ DIALOG TITLE            [✕]  │  ← header: 1px border-bottom, padding 12px 16px
├──────────────────────────────┤
│                              │
│  content                     │
│                              │
└──────────────────────────────┘
```

- Radius: `0px` everywhere — including mobile bottom sheet top corners
- Overlay: `background: var(--color-overlay)`
- Header: uppercase title (`font-size: 14px`), close icon button (48×48px, `aria-label="Close"`)
- Desktop: centred, `max-width: 480px`, `background: var(--color-bg-secondary)`, `border: 1px solid var(--color-border)`
- Mobile (bottom sheet): full width, `max-height: 85dvh`, anchored to bottom, `background: var(--color-bg-secondary)`, `border-top: 1px solid var(--color-border)`

### 6.4 Input / Textarea

- Background: `var(--color-bg-tertiary)`
- Border: `1px solid var(--color-border)`
- Radius: `0px`
- Text: `var(--color-text)`, `font-size: 14px`
- Placeholder: `var(--color-text-muted)`, uppercase
- Label: `font-size: 11px`, uppercase, `color: var(--color-text-secondary)`, `margin-bottom: 4px`
- Focus: `border-color: var(--color-accent)` (no box-shadow)
- Disabled: `opacity: 0.4`

### 6.5 Select

- Trigger: same as input (§6.4), chevron icon right-aligned, `color: var(--color-text-muted)`
- Dropdown listbox: `background: var(--color-bg-tertiary)`, `border: 1px solid var(--color-border)`, `0px radius`
- Option: `min-height: 48px`, `padding: 0 12px`, uppercase text
- Selected option: `background: var(--color-accent-bg)`, left border `3px solid var(--color-accent)`
- Focused option: `background: var(--color-accent-bg)`

### 6.6 Toggle Group

- Container: `background: var(--color-bg-tertiary)`, `border: 1px solid var(--color-border)`, `0px radius`
- Item: `min-height: 48px`, uppercase `font-size: 12px`, `color: var(--color-text-secondary)`
- Active item: `background: var(--color-accent-bg)`, `color: var(--color-accent)`, bracket marks (§4.1), `border: 1px solid var(--color-accent-border)`

### 6.7 Accordion

- Trigger: `min-height: 48px`, `padding: 0 12px`, uppercase `font-size: 12px`, `border-bottom: 1px solid var(--color-border-subtle)`
- Expanded trigger: `color: var(--color-accent)`
- Chevron: 18px, rotates `180deg` when expanded, transition `0.15s ease`
- Content: `background: var(--color-bg)`, `padding: 12px`

### 6.8 Popover

- Background: `var(--color-bg-secondary)`
- Border: `1px solid var(--color-border)`
- Radius: `0px`
- Shadow: `0 4px 16px oklch(0 0 0 / 40%)`

### 6.9 Toast

- Radius: `0px`
- Left border: `3px solid var(--color-accent)` (info/success) or `3px solid var(--color-danger)` (error)
- Background: `var(--color-bg-secondary)`
- Border: `1px solid var(--color-border)`
- Message text: uppercase, `font-size: 13px`
- Position: anchored `72px` above bottom of viewport (above bottom nav)
- Max 3 visible; slide-up enter, slide-down exit, `0.15s ease`

### 6.10 Bottom Nav (mobile)

```
┌──────────┬──────────┬──────────┐
│  [icon]  │  [icon]  │  [icon]  │
│   MAP    │   SAVED  │   TOOLS  │  ← 10px uppercase labels
└──────────┴──────────┴──────────┘
```

- Background: `var(--color-bg-secondary)`
- Top border: `1px solid var(--color-border)`
- Each tab: `min-height: 56px`, `min-width: 48px`, flex column, icon `24px`
- Inactive: `color: var(--color-text-secondary)`
- Active: `color: var(--color-accent)` + bracket mark above icon (§4.1)
- Labels: `font-size: 10px`, uppercase, `letter-spacing: 0.06em`

### 6.11 Desktop Sidebar Nav

- Right border: `1px solid var(--color-border)`
- Same tab rules as bottom nav, oriented vertically

---

## 7. Readout Panel Layout

Used in: GpsPanel, RulerPanel, PinInfo coordinate list, any live-data display.

```
┌─────────────────────────────────┐
│ PANEL TITLE                     │
├─────────────────────────────────┤
│ LAT        :  1.35210° N        │
│ LNG        :  103.81980° E      │
│ ALT        :  45 M              │
│ ACCURACY   :  ±8 M             │
└─────────────────────────────────┘
```

CSS grid layout:

```css
.readout-grid {
  display: grid;
  grid-template-columns: 100px 12px 1fr; /* label | colon | value */
  row-gap: 0;
}
.readout-label {
  font-size: 11px;
  color: var(--color-text-secondary);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  line-height: 28px;
}
.readout-sep {
  font-size: 11px;
  color: var(--color-text-muted);
  line-height: 28px;
  text-align: center;
}
.readout-value {
  font-size: 13px;
  color: var(--color-text);
  line-height: 28px;
  text-align: right;
}
```

- Row `min-height: 28px` (scannable, non-interactive rows still meet visual density standard)
- Separator is a literal `:` character, not a border

---

## 8. Accessibility Checklist

All items must pass before a PR is merged.

| Criterion   | Requirement                                                                                                |
| ----------- | ---------------------------------------------------------------------------------------------------------- |
| WCAG 1.4.3  | Text contrast ≥ 4.5 : 1 in both themes                                                                     |
| WCAG 1.4.11 | UI component contrast ≥ 3 : 1                                                                              |
| WCAG 1.4.1  | Colour is never the sole differentiator — pair entity colour chips with a text label                       |
| WCAG 2.4.7  | All interactive elements have a visible focus ring: `2px solid var(--color-accent)`, `outline-offset: 2px` |
| WCAG 2.5.5  | All touch targets ≥ 48 × 48px                                                                              |
| WCAG 4.1.2  | All icon-only buttons have `aria-label`                                                                    |
| WCAG 4.1.2  | Kobalte components retain correct `role`, `aria-expanded`, `aria-selected` after restyling                 |
| Navigation  | Visible text labels on all nav items — do not remove labels to save space                                  |

---

## 9. Implementation Scope

Work file-by-file in this order. Each file is **styles only** — no logic changes.

| #   | File(s)                                        | Changes                                                    |
| --- | ---------------------------------------------- | ---------------------------------------------------------- |
| 1   | `src/index.html`                               | Replace Geist Mono `<link>` with Share Tech Mono           |
| 2   | `src/styles/theme.css`                         | Replace all colour token values (§3); update `--font-mono` |
| 3   | `src/components/ui/Button.tsx`                 | Apply §6.2                                                 |
| 4   | `src/components/ui/Dialog.tsx`                 | Apply §6.3                                                 |
| 5   | `src/components/ui/TextField.tsx`              | Apply §6.4                                                 |
| 6   | `src/components/ui/Select.tsx`                 | Apply §6.5                                                 |
| 7   | `src/components/ui/ToggleGroup.tsx`            | Apply §6.6                                                 |
| 8   | `src/components/ui/Accordion.tsx`              | Apply §6.7                                                 |
| 9   | `src/components/ui/Popover.tsx`                | Apply §6.8                                                 |
| 10  | `src/components/ui/Toast.tsx`                  | Apply §6.9                                                 |
| 11  | `src/components/nav/BottomNav.tsx`             | Apply §6.10; bracket active state                          |
| 12  | `src/components/nav/DesktopToolsBar.tsx`       | Apply §6.11; bracket active state                          |
| 13  | `src/components/saved/PinCard.tsx`             | Panel pattern §6.1; bracket on selected                    |
| 14  | `src/components/saved/TrackCard.tsx`           | Panel pattern §6.1; bracket on selected                    |
| 15  | `src/components/tools/GpsPanel.tsx`            | Readout grid §7                                            |
| 16  | `src/components/tools/RulerPanel.tsx`          | Readout grid §7                                            |
| 17  | `src/components/settings/SettingsPanel.tsx`    | Panel pattern §6.1                                         |
| 18  | `src/components/onboarding/OnboardingFlow.tsx` | Dialog pattern §6.3                                        |
| 19  | `src/components/map/CompassButton.tsx`         | Icon button §6.2; 48px target                              |
| 20  | `src/components/map/LocationButton.tsx`        | Icon button §6.2; 48px target                              |
| 21  | `src/components/map/PlotControls.tsx`          | Panel §6.1; button §6.2                                    |
| 22  | `src/components/map/MapStyleToggle.tsx`        | Panel §6.1; 48px targets                                   |
| 23  | `src/components/pin/PinEditor.tsx`             | Dialog §6.3; input §6.4                                    |
| 24  | `src/components/pin/PinInfo.tsx`               | Dialog §6.3; readout grid §7                               |
| 25  | `src/components/track/TrackEditor.tsx`         | Dialog §6.3; input §6.4                                    |
| 26  | `src/components/track/TrackInfo.tsx`           | Dialog §6.3; readout grid §7                               |
