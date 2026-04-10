# AGENTS.md — Recce Web

## Core Rules

- IMPORTANT: Never commit without explicit permission
- IMPORTANT: Never commit directly on main/master; create a branch first
- IMPORTANT: Never force push to main/master
- IMPORTANT: Never commit secrets, credentials, or .env files
- Explain why, not what (commits, PRs, comments)
- Prefer existing files and patterns over new ones

## LLM Behaviour

- Reply succinctly; minimise verbosity and file reads
- Use @file references; run single tests, not full suites
- Course-correct early to avoid context pollution

## Git Practices

- Short commit messages; break into atomic commits
- Run lint/typecheck before committing; stage only relevant files
- Branch naming: `type/description` (e.g. `feature/track-creation`, `fix/coord-display`)
- Verify author before amending; never amend pushed commits

## Versioning & Changelog

The project uses `semantic-release` to automate versioning and GitHub Releases on every push to `main`. **All commit messages must follow [Conventional Commits](https://www.conventionalcommits.org/).**

### Commit Message Format

```
type(scope): description

[optional body]
```

### Types and Version Impact

| Type       | Version bump | Example                                        |
| ---------- | ------------ | ---------------------------------------------- |
| `feat`     | **minor**    | `feat: add PWA install step to onboarding`     |
| `fix`      | **patch**    | `fix: reduce location marker appearance delay` |
| `perf`     | **patch**    | `perf: debounce map redraw on track edit`      |
| `refactor` | none         | `refactor: migrate UI to Kobalte`              |
| `docs`     | none         | `docs: update AGENTS.md with versioning rules` |
| `style`    | none         | `style: align tailwind classes in PinEditor`   |
| `test`     | none         | `test: add coordinate conversion edge cases`   |
| `chore`    | none         | `chore: bump devDependencies`                  |
| `ci`       | none         | `ci: add lint step to release workflow`        |

### Breaking Changes

Add `BREAKING CHANGE:` (or `BREAKING CHANGE <scope>:`) in the commit body or footer to trigger a **major** version bump:

```
feat: drop support for legacy share-code format

BREAKING CHANGE: share codes from versions <0.3.0 will no longer parse
```

### Scope (optional)

Use a parenthesised scope after the type to indicate the area affected:

```
feat(map): add hybrid satellite basemap toggle
fix(gps): attach listeners after iOS compass permission grant
```

### Rules

- Use **imperative mood**, lowercase, no trailing period: `add feature` not `Added feature` or `adds feature.`
- Keep the subject line under **72 characters**
- One logical change per commit; do not mix `feat` and `fix` in the same commit
- Commits with `chore` / `refactor` / `docs` / `style` / `test` / `ci` alone will **not** trigger a release
- The `chore(release):` commits created by `semantic-release` include `[skip ci]` and must not be edited

## Pull Requests

- Explain context/motivation; describe solution approach
- Use section names: Summary, Changes, Motivation, Testing

---

## Architecture

### Stack

| Concern       | Choice                    | Reason                                         |
| ------------- | ------------------------- | ---------------------------------------------- |
| Framework     | SolidJS + TypeScript      | Fine-grained reactivity; strict types          |
| Styling       | Tailwind CSS v4           | CSS-var-native theming; no class bloat         |
| Build         | Vite + vite-plugin-pwa    | Fast HMR, static `dist/` output, good CI story |
| Map           | MapLibre GL JS            | Vector tiles; free                             |
| Map utilities | @turf/circle              | Drawing GPS accuracy polygons                  |
| Map tiles     | OpenFreeMap               | No API key needed                              |
| Database      | Dexie (IndexedDB)         | Typed, promise-based                           |
| Coordinates   | proj4js + utm-latlng      | Handles all 6 coordinate systems               |
| Compression   | pako (zlib)               | Share-code compression                         |
| Icons         | Material Symbols (CDN)    | Standardized SVG icons                         |
| Font          | Geist Mono (Google Fonts) | Monospace; good for coordinate display         |

### File Layout

```
recce-web/
├── src/
│   ├── index.html          # App shell
│   ├── index.tsx           # Entry point
│   ├── App.tsx             # Root component and layout wiring
│   ├── styles/             # Global styles + Tailwind entry point
│   ├── db/                 # Dexie schema & migrations
│   ├── coords/             # Coordinate system parsers & formatters
│   ├── context/            # SolidJS contexts (Prefs, UI)
│   ├── stores/             # SolidJS stores
│   ├── utils/              # Generic utility functions
│   ├── components/         # SolidJS Components
│   │   ├── layout/         # Application shell and modals
│   │   ├── map/            # MapLibre wrapper, controls, markers, tracks
│   │   ├── nav/            # Bottom nav, toolbox modal
│   │   ├── pin/            # Pin editor, pin info
│   │   ├── track/          # Track editor, track info
│   │   ├── saved/          # Saved screen
│   │   ├── tools/          # GPS, Ruler tools
│   │   ├── settings/       # Settings panel
│   │   └── onboarding/     # First-launch flow
│   └── share/              # Share-code encode/decode
├── public/                 # PWA manifest, service worker, icons
├── AGENTS.md               # LLM instructions
├── README.md               # Project overview
└── package.json
```

### State Model

App state is reactive and managed using SolidJS signals, contexts, and stores. Data is persisted to IndexedDB via Dexie. Preferences are stored in `localStorage` via a SolidJS Context.

**Pin:**

```ts
{
  id: number; // auto-increment integer
  createdAt: number; // ms timestamp
  name: string; // max 20 chars
  lat: number; // WGS84 decimal degrees
  lng: number; // WGS84 decimal degrees
  color: PinColor; // 'red' | 'orange' | 'green' | 'azure' | 'violet'
  group: string; // empty string = ungrouped
  description: string;
}
```

**Track:**

```ts
{
  id: number;
  createdAt: number;
  name: string;
  nodes: TrackNode[];   // Array<{ lat, lng, name? }>
  isCyclical: boolean;  // false = open path, true = closed area/polygon
  color: PinColor;
  group: string;
  description: string;
}
```

**Preferences** (`localStorage` key `recce_prefs`):

```ts
{
  coordinateSystem: CoordSystem;
  angleUnit: AngleUnit;
  lengthUnit: LengthUnit;
  theme: Theme;
  onboardingDone: boolean;
}
```

### Navigation Model

| Surface           | Mobile                                     | Desktop                                       |
| ----------------- | ------------------------------------------ | --------------------------------------------- |
| **Map** (default) | Full screen                                | Left pane (flexible width)                    |
| **Saved**         | Full screen, tab-switched                  | Right pane (fixed width, scrollable)          |
| **Tools**         | Third bottom-nav tab → modal grid launcher | Icon row pinned below Saved panel (accordion) |

---

## Feature Specifications

### Screens & Flows (Quick Context)

- **Onboarding:** First launch 3-step modal sets coordinate system, units, theme; blocks map until completed; sets `onboardingDone`.
- **Map (default):** Full-screen on mobile, left pane on desktop. Crosshair shows centre; tapping/long-press can create a pin; GPS overlays accuracy circle and live readouts; compass/location controls live here.
- **Pin Editor/Info:** Editor is a bottom sheet on mobile, dialog on desktop; Info modal lists all coordinate systems with actions (copy/open in Maps).
- **Track Editor:** Plot mode from map; taps add nodes, ghost line previews next segment; undo/save in editor; `isCyclical` toggles path vs area.
- **Saved:** Unified list of pins/tracks; search + sort; long-press enters multi-select for bulk actions (delete/share/add to ruler).
- **Tools:** Mobile uses modal grid launcher; desktop shows tool icons below Saved with accordion panels.
- **Ruler:** Consumes selected pins/tracks from Saved; shows multi-point distance/bearing; resets on reload.
- **Settings:** Updates `recce_prefs` and applies immediately (coord system, units, theme).
- **Share:** Share-code encodes pins/tracks; decode opens in Saved for review/import.

### Map Screen

- Full-screen MapLibre map as the default view.
- Crosshair component showing centre position; live measurement overlay when GPS active.
- Compass and Location controls.
- Track plotting mode: Allows plotting a path node by node, ghost lines show next segment. Tapping appends nodes. Undo and save options available.

### Pin System

- Pin Editor (bottom sheet on mobile, dialog on desktop).
- Pin Info modal shows all 6 coordinate systems and actions like "Open in Maps".
- 5 preset colors (red, orange, green, azure, violet) with semantic intent.

### Track System

- Ordered list of `{ lat, lng, name? }` nodes. `isCyclical=false` means path, `true` means closed area.
- Distance calculations use Haversine (path) or spherical excess/shoelace (area).
- Track Info modal to view stats (distance, area, checkpoints).

### Saved Screen

- Unified list of Pin and Track cards, searchable and sortable.
- Multi-select mode via long-press (bulk delete, share, add to ruler).

### GPS & Compass Panel

- Uses `navigator.geolocation` and `DeviceOrientationEvent` to show live pos, accuracy, altitude, azimuth, pitch, and roll.

### Ruler Panel

- Measures multi-point distances and bearings. Points populated via Saved screen multi-select. Resets on page reload.

### Settings Panel

- Updates system preferences (coord system, units, theme). Changes apply immediately.

### Onboarding Flow

- Three-step modal on first launch to configure preferences before showing map.

### Share Code Format

- Base62 encoded, zlib compressed JSON of essential fields (omitting `id`). Format starts with `R1`.

---

## Coordinate Systems

All internal storage uses WGS84. Conversion occurs on display/input via `src/coords/index.ts`.

- **WGS84:** Format `1.35210° N 103.81980° E` or `-1.3521 -103.8198`.
- **UTM:** Format `48N 0361234 0149234`. Uses EPSG 326xx/327xx.
- **MGRS:** Format `48PWW 12345 67890`. Derived from UTM.
- **BNG:** Format `TQ 12345 67890`. Uses proj4 with Airy ellipsoid.
- **QTH:** Format `OK21ab12`. Maidenhead locator up to 8 characters.
- **Kertau 1948:** Format `804670 149234`. SVY21 format for Malaysia & Singapore.

---

## CSS & Styling Conventions

- Styled using Tailwind CSS v4.
- CSS Custom properties still used for core theme colors where dynamic logic applies (`--color-bg`, `--color-primary`).
- Dark/light mode handled via `data-theme` on `<html lang="en">` (light, dark, system).
- Mobile-first approach.

---

## Frontend Overhaul — Design Specification

> **Scope:** Visual styles only. Do not change component logic, state, routing, or data structures.

---

### 1. Design Intent

The UI adopts a **Multi-Function Display (MFD)** aesthetic modelled on military C2 and cockpit instrumentation. Key principles:

- Flat, panel-based layout with hard edges and no decorative rounding
- Colour used as a **data channel**, not decoration — each hue maps to a tactical meaning
- All text uppercase and monospace; information is **scannable at a glance**
- Dense but uncluttered; every pixel earns its place
- Touch-optimised for field use on both mobile and desktop

---

### 2. Typography

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

### 3. Colour Tokens

All tokens live in `src/styles/theme.css`. Retain existing CSS variable names. Replace all values.

#### 3.1 NIGHT theme (`data-theme="dark"`, default)

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

#### 3.2 DAY theme (`data-theme="light"`)

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

#### 3.3 Entity / data colours (both themes)

These map to NATO-inspired tactical signal meanings. CSS variable names are unchanged (no DB migration needed).

```css
--color-red: oklch(0.6 0.22 25); /* HOSTILE */
--color-orange: oklch(0.74 0.17 65); /* UNKNOWN */
--color-green: oklch(0.62 0.18 151); /* FRIENDLY */
--color-azure: oklch(0.63 0.16 230); /* NEUTRAL */
--color-violet: oklch(0.63 0.2 310); /* SPECIAL */
```

#### 3.4 Contrast requirements (WCAG 2.1 AA)

| Pair                                         | Min ratio |
| -------------------------------------------- | --------- |
| `--color-text` on `--color-bg`               | ≥ 4.5 : 1 |
| `--color-text` on `--color-bg-secondary`     | ≥ 4.5 : 1 |
| `--color-accent` on `--color-bg-secondary`   | ≥ 3 : 1   |
| Entity colours used as icon/chip fills on bg | ≥ 3 : 1   |

Verify with a contrast checker after implementation. Adjust lightness only if a pair fails.

---

### 4. Shape & Borders

| Property      | Value                                  |
| ------------- | -------------------------------------- |
| Border radius | **0px everywhere** — no exceptions     |
| Panel border  | `1px solid var(--color-border)`        |
| Dividers      | `1px solid var(--color-border-subtle)` |

#### 4.1 Bracket corner mark (active / selected state)

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

### 5. Touch Targets

Every interactive element must meet **48 × 48px** minimum hit area on both mobile and desktop. Enforce with `min-width`/`min-height` or padding — visual size may be smaller. Affected elements:

- All `<button>` and icon buttons
- Nav tabs (bottom nav + desktop sidebar)
- List/card rows (add `min-height: 48px`)
- Select trigger and options
- Toggle group items
- Accordion triggers
- Close icons in dialogs

---

### 6. Component Specifications

#### 6.1 Panel / Card

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

#### 6.2 Button

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

#### 6.3 Dialog / Bottom Sheet

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

#### 6.4 Input / Textarea

- Background: `var(--color-bg-tertiary)`
- Border: `1px solid var(--color-border)`
- Radius: `0px`
- Text: `var(--color-text)`, `font-size: 14px`
- Placeholder: `var(--color-text-muted)`, uppercase
- Label: `font-size: 11px`, uppercase, `color: var(--color-text-secondary)`, `margin-bottom: 4px`
- Focus: `border-color: var(--color-accent)` (no box-shadow)
- Disabled: `opacity: 0.4`

#### 6.5 Select

- Trigger: same as input (§6.4), chevron icon right-aligned, `color: var(--color-text-muted)`
- Dropdown listbox: `background: var(--color-bg-tertiary)`, `border: 1px solid var(--color-border)`, `0px radius`
- Option: `min-height: 48px`, `padding: 0 12px`, uppercase text
- Selected option: `background: var(--color-accent-bg)`, left border `3px solid var(--color-accent)`
- Focused option: `background: var(--color-accent-bg)`

#### 6.6 Toggle Group

- Container: `background: var(--color-bg-tertiary)`, `border: 1px solid var(--color-border)`, `0px radius`
- Item: `min-height: 48px`, uppercase `font-size: 12px`, `color: var(--color-text-secondary)`
- Active item: `background: var(--color-accent-bg)`, `color: var(--color-accent)`, bracket marks (§4.1), `border: 1px solid var(--color-accent-border)`

#### 6.7 Accordion

- Trigger: `min-height: 48px`, `padding: 0 12px`, uppercase `font-size: 12px`, `border-bottom: 1px solid var(--color-border-subtle)`
- Expanded trigger: `color: var(--color-accent)`
- Chevron: 18px, rotates `180deg` when expanded, transition `0.15s ease`
- Content: `background: var(--color-bg)`, `padding: 12px`

#### 6.8 Popover

- Background: `var(--color-bg-secondary)`
- Border: `1px solid var(--color-border)`
- Radius: `0px`
- Shadow: `0 4px 16px oklch(0 0 0 / 40%)`

#### 6.9 Toast

- Radius: `0px`
- Left border: `3px solid var(--color-accent)` (info/success) or `3px solid var(--color-danger)` (error)
- Background: `var(--color-bg-secondary)`
- Border: `1px solid var(--color-border)`
- Message text: uppercase, `font-size: 13px`
- Position: anchored `72px` above bottom of viewport (above bottom nav)
- Max 3 visible; slide-up enter, slide-down exit, `0.15s ease`

#### 6.10 Bottom Nav (mobile)

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

#### 6.11 Desktop Sidebar Nav

- Right border: `1px solid var(--color-border)`
- Same tab rules as bottom nav, oriented vertically

---

### 7. Readout Panel Layout

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

### 8. Accessibility Checklist

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

### 9. Implementation Scope

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

---

## Coding Conventions

- SolidJS components (`.tsx`).
- Reactivity using `createSignal`, `createEffect`, `createMemo`, and Contexts (`usePrefs`, `useUI`).
- No imperative DOM modifications outside of isolated integrations (like MapLibre wrapper).
- Type checking strictly enforced via TypeScript (`tsc --noEmit`).

---

## CI / Build

```bash
npm install
npm run dev     # local dev server with HMR
npm run build   # outputs dist/
npx serve dist  # test production build
```

---

## Chrome MCP Testing

All UI-related changes and integration tests must be verified using Chrome MCP tools.

**Prerequisites:**

- Start the dev server: `npm run dev`
- Ensure the app is accessible at `http://localhost:5173`

**Testing Requirements:**

- Test all UI changes in both mobile and desktop viewports
- For changes targeting one viewport, test the other viewport for regression
- Use `chrome-devtools_take_snapshot` to verify element presence and structure
- Use `chrome-devtools_take_screenshot` for visual verification
- Use `chrome-devtools_evaluate_script` for runtime state checks

**Viewport Testing:**

- Mobile: width < 768px (default viewport)
- Desktop: width >= 768px (use `chrome-devtools_resize_page` or `chrome-devtools_emulate`)

---

## SVG Icon Resources

Custom SVG icons are located in `public/icons/`. Most general icons have been replaced by Material Symbols (`https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined`).
