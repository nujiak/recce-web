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

---

## UI Library Migration: Kobalte

### Motivation

The app has no shared UI primitives. Every dialog, bottom sheet, select, toast, accordion, and button is hand-rolled inline per feature, producing visual and behavioural inconsistencies. Adopting **Kobalte** (`@kobalte/core`) provides robust, accessible, fully unstyled foundations for all interactive components. All existing CSS custom property tokens, fonts, and icons are preserved — only the structural HTML and JS wiring changes.

### Libraries

| Library         | Purpose                                                                              | Docs                |
| --------------- | ------------------------------------------------------------------------------------ | ------------------- |
| `@kobalte/core` | Button, Dialog, Popover, Select, TextField, Toast, Accordion, ToggleGroup, Separator | https://kobalte.dev |

Install with:

```bash
npm install @kobalte/core
```

### Design Principles for the Migration

- **Never introduce new visual tokens.** Use the existing CSS vars (`--color-bg`, `--color-accent`, `--color-border`, etc.) on every Kobalte element.
- **Build shared primitives first**, then replace feature components one by one.
- **Shared primitives live in `src/components/ui/`** — one file per primitive type.
- **Feature components import only from `src/components/ui/`**, never directly from `@kobalte/core`.
- All primitives must work in both light and dark themes.

---

### Phase 1 — Install & Shared Primitive Layer

**Goal:** Install the library and create the shared `src/components/ui/` building blocks that all feature components will use. No feature components are changed yet.

#### 1.1 Install packages

```bash
npm install @kobalte/core
```

Run `npm run build` to confirm no import errors before proceeding.

#### 1.2 Create `src/components/ui/Dialog.tsx`

Wrap `@kobalte/core/dialog` `Dialog` into a single reusable component with:

- Props: `open`, `onOpenChange`, `title`, `children`, `preventClose?: boolean`
- Renders a `Dialog.Portal` containing `Dialog.Overlay` (fixed, full-screen, semi-transparent using `--color-overlay`) and `Dialog.Content`
- On **mobile** (`@media (max-width: 767px)`): content is a bottom sheet — `position: fixed; bottom: 0; left: 0; right: 0; border-radius: 16px 16px 0 0; padding: 1.25rem 1rem; max-height: 85dvh; overflow-y: auto` — with a drag-handle bar (`4px × 36px`, `--color-border`, `border-radius: 2px`) above the title
- On **desktop** (`@media (min-width: 768px)`): content is a centered card — `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); border-radius: 12px; padding: 1.5rem; min-width: 360px; max-width: 480px`
- Both layouts: `--color-bg` background, `--color-border` border, `z-index: 100`
- `Dialog.Title` uses `--color-text`, `font-weight: 600`; includes a `Dialog.CloseButton` (Material Symbol `close` icon) top-right, hidden when `preventClose` is true
- When `preventClose` is true: pass `onPointerDownOutside={e => e.preventDefault()}` and `onEscapeKeyDown={e => e.preventDefault()}` to `Dialog.Content`
- This single `Dialog` component replaces both the old `Dialog.tsx`, `Drawer.tsx`, and `Sheet.tsx` — feature components use it directly

#### 1.3 Create `src/components/ui/Select.tsx`

Wrap `@kobalte/core/select` `Select` with:

- Props: `value`, `onChange`, `options: Array<{ value: string; label: string }>`, `placeholder?`, `label?`
- Optional `Select.Label` rendered above the trigger when `label` is provided; style: `--color-text-secondary`, `font-size: 0.75rem`, `margin-bottom: 0.25rem`
- Trigger button: full-width, `--color-bg-secondary` background, `--color-border` border, `--color-text` text, `border-radius: 8px`, `padding: 0.5rem 0.75rem`; trailing chevron (Material Symbol `expand_more`) that rotates when open via `data-expanded`
- `Select.Portal` → `Select.Content` → `Select.Listbox`: `--color-bg` background, `--color-border` border, `border-radius: 8px`, `box-shadow: 0 4px 16px rgba(0,0,0,0.2)`, `z-index: 200`
- `Select.Item`: `--color-text` text, hover uses `--color-bg-secondary`; `Select.ItemIndicator` shows `check` icon in `--color-accent` when selected
- Replaces all 8 native `<select>` elements in `OnboardingFlow.tsx` and `SettingsPanel.tsx`

#### 1.4 Create `src/components/ui/Toast.tsx`

Wrap `@kobalte/core/toast` replacing the hand-rolled `src/components/Toast.tsx`:

- Keep the same API surface: `showToast(message, type)` where `type` is `'success' | 'error' | 'info'`
- Export a `<ToastRegion />` component to mount once in `App.tsx`
- Pill style: `--color-bg-secondary` background, `--color-border` border, `border-radius: 999px`, `padding: 0.5rem 1rem`, `--color-text` text
- Per-type left accent: `--color-accent` (info/success), `--color-danger` (error)
- Auto-dismiss after 3 s; max 3 visible at once; stacks from bottom-center

#### 1.5 Create `src/components/ui/Accordion.tsx`

Wrap `@kobalte/core/accordion` `Accordion` with:

- Props: `items: Array<{ value: string; trigger: JSX.Element; content: JSX.Element }>`, `defaultValue?`, `multiple?: boolean`
- Trigger row: full-width `Accordion.ItemTrigger` button, `--color-text`, chevron icon (Material Symbol `expand_more`) rotates 180° on open via `data-expanded` CSS selector, `0.15s ease` transition
- Content: `Accordion.ItemContent` with CSS grid `grid-template-rows` trick (`0fr` → `1fr`) for smooth expand/collapse, `0.2s ease` — matches the existing pattern in `DesktopToolsBar.tsx`
- Replaces the hand-rolled accordion in `DesktopToolsBar.tsx`

#### 1.6 Create `src/components/ui/ToggleGroup.tsx`

Wrap `@kobalte/core/toggle-group` `ToggleGroup` (single-select) with:

- Props: `value`, `onChange`, `options: Array<{ value: string; label: string | JSX.Element }>`
- Renders a pill-shaped segmented control: `border-radius: 8px` container, `border-radius: 6px` items, `padding: 0.25rem`, `--color-bg-secondary` background
- Active item (`data-pressed`): `--color-accent` background, white text; inactive: transparent, `--color-text-secondary`
- Replaces the Path/Area toggle in `TrackEditor.tsx` and the sort chips in `SavedScreen.tsx`

#### 1.7 Create `src/components/ui/TextField.tsx`

Wrap `@kobalte/core/text-field` `TextField` with:

- Props: `label?`, `value`, `onChange`, `placeholder?`, `multiline?` (renders `TextField.TextArea` if true), `maxLength?`, `type?`
- `TextField.Label`: `--color-text-secondary`, `font-size: 0.75rem`, `margin-bottom: 0.25rem`
- `TextField.Input` / `TextField.TextArea`: full-width, `--color-bg-secondary` background, `--color-border` border, `--color-text` text, `border-radius: 8px`, `padding: 0.5rem 0.75rem`; focus ring via `outline: 2px solid var(--color-accent)` on `[data-focus-visible]`
- Uses Kobalte's controlled `value` + `onChange` API (string-based)
- Replaces all hand-rolled `<input>` and `<textarea>` elements in `PinEditor.tsx`, `TrackEditor.tsx`, `SavedScreen.tsx`, `PlotControls.tsx`, `CompassButton.tsx`

#### 1.8 Create `src/components/ui/Button.tsx`

Wrap `@kobalte/core/button` `Button` with:

- Props: `variant: 'primary' | 'ghost' | 'danger' | 'icon'`, `size?: 'sm' | 'md'`, `onClick`, `disabled?`, `type?`, `aria-label?`, `children`
- `primary`: `--color-accent` background, white text, `border-radius: 8px`, `padding: 0.5rem 1rem`
- `ghost`: transparent background, `--color-text` text, `--color-border` border
- `danger`: `--color-danger` background, white text
- `icon`: square, no border, `--color-text` icon color; use for single-icon action buttons (close, copy, edit) — replaces the many ad-hoc icon buttons throughout the app
- `sm`: reduced padding and font-size
- `data-disabled` provided by Kobalte; style `opacity: 0.4; pointer-events: none` on that attribute
- Replaces all ad-hoc `<button>` elements throughout all feature components

#### 1.9 Create `src/components/ui/Popover.tsx`

Wrap `@kobalte/core/popover` `Popover` with:

- Props: `open`, `onOpenChange`, `trigger: JSX.Element`, `children`, `placement?: Placement`
- Renders `Popover.Trigger` (as slot, wrapping the passed `trigger`), then `Popover.Portal` → `Popover.Content`
- Content card: `--color-bg` background, `--color-border` border, `border-radius: 10px`, `padding: 0.75rem`, `box-shadow: 0 4px 16px rgba(0,0,0,0.2)`, `z-index: 50`
- Replaces the hand-rolled floating popover in `CompassButton.tsx` (bearing input panel) and `PlotControls.tsx` (Go To coordinate input panel)

---

### Phase 2 — Replace Feature Components

Replace feature components one at a time. After each replacement, run `npx tsc --noEmit` and verify visually in both mobile and desktop viewports using Chrome MCP tools.

#### 2.1 `PinEditor.tsx`

- Replace hand-rolled bottom sheet / dialog with `<Dialog>` from `src/components/ui/Dialog.tsx`
- Replace name, group, description inputs with `<TextField>`
- Replace save/delete buttons with `<Button variant="primary">` / `<Button variant="danger">`
- Replace close button with `<Button variant="icon">`
- `ColorPicker.tsx` is unchanged (bespoke enough to keep as-is)
- Remove all inline `position: fixed` overlay, focus-trap, and `useEscapeToClose` logic — Kobalte handles this

#### 2.2 `PinInfo.tsx`

- Replace hand-rolled bottom sheet with `<Dialog>` (bottom sheet on mobile, centered on desktop via responsive CSS in the primitive)
- Replace action buttons (Go To, Edit, Open in Maps) with `<Button variant="ghost">`
- Coordinate row copy buttons: replace with `<Button variant="icon" size="sm">`
- Replace close button with `<Button variant="icon">`
- Remove `useEscapeToClose` hook

#### 2.3 `TrackEditor.tsx`

- Replace hand-rolled bottom sheet / dialog with `<Dialog>`
- Replace name, group, description inputs with `<TextField>`
- Replace Path/Area segmented toggle with `<ToggleGroup>`
- Replace save/delete/cancel buttons with `<Button>`
- Replace close button with `<Button variant="icon">`
- Remove inline focus-trap and `useEscapeToClose` logic

#### 2.4 `TrackInfo.tsx`

- Replace hand-rolled bottom sheet with `<Dialog>`
- Replace action buttons with `<Button variant="ghost">`
- Replace close button with `<Button variant="icon">`
- Remove `useEscapeToClose` hook

#### 2.5 `OnboardingFlow.tsx`

- Replace the full-screen modal wrapper with `<Dialog preventClose>` (blocks map until `onboardingDone`; `preventClose` suppresses Escape and outside-click dismissal)
- Replace all 4 native `<select>` elements with `<Select>`
- Replace Back/Next buttons with `<Button>`
- Keep step-dot progress indicator as-is (bespoke)

#### 2.6 `SettingsPanel.tsx`

- Replace all 4 native `<select>` elements with `<Select>`
- No sheet wrapping needed (it renders inside the sidebar/accordion already)

#### 2.7 `DesktopToolsBar.tsx`

- Replace hand-rolled accordion with `<Accordion>` from `src/components/ui/Accordion.tsx`
- The four sections (Saved, GPS, Ruler, Settings) become accordion items

#### 2.8 `SavedScreen.tsx`

- Replace sort chip row with `<ToggleGroup>`
- Replace search `<input>` with `<TextField>`
- Bulk action buttons: replace with `<Button>`
- Share code import `<input>` and submit button: replace with `<TextField>` + `<Button>`
- Long-press / multi-select logic is unchanged

#### 2.9 `PlotControls.tsx`

- Replace "Go To" floating coordinate panel with `<Popover>` from `src/components/ui/Popover.tsx`; anchor to the Go To toggle button
- Replace coordinate input with `<TextField>` inside the popover content
- Replace confirm/cancel/undo/discard buttons with `<Button>`
- The floating toolbar positioning logic is unchanged

#### 2.10 `CompassButton.tsx`

- Replace hand-rolled floating bearing-input panel with `<Popover>` anchored to the compass button
- Replace bearing `<input>` with `<TextField>` inside the popover content
- Replace confirm/close buttons with `<Button>`

#### 2.11 `App.tsx` — swap Toast

- Remove import of old `src/components/Toast.tsx`
- Mount `<ToastRegion />` from `src/components/ui/Toast.tsx`
- Update all `showToast()` call sites to the new API if the signature changed

#### 2.12 `ToolboxModal.tsx` and `nav/BottomNav.tsx`

- Replace ad-hoc tool card and nav buttons with `<Button variant="ghost">`
- The full-screen overlay and grid layout are structural/nav concerns — keep as-is

#### 2.13 `GpsPanel.tsx` and `RulerPanel.tsx`

- Replace the `role="button"` div in `GpsPanel.tsx` with `<Button variant="ghost">` for proper accessibility
- Replace the "Enable Compass" button in `GpsPanel.tsx` and the "Clear All" button in `RulerPanel.tsx` with `<Button>`

---

### Phase 3 — Cleanup

- Delete the old `src/components/Toast.tsx` once `App.tsx` is migrated
- Delete `src/components/ui/Drawer.tsx` and `src/components/ui/Sheet.tsx` if they exist (superseded by the responsive `Dialog`)
- Run `npx tsc --noEmit` — must pass with zero errors
- Run `npm run build` — must succeed
- Search for any remaining raw `<button>`, `<input>`, `<textarea>`, `<select>` outside of `src/components/ui/` and the headless map components; replace stragglers
- Do a final visual pass in Chrome MCP: mobile (375 × 812) and desktop (1280 × 800) across all screens and interactions

---

### Acceptance Criteria

- [ ] `npm run build` passes with no errors or warnings
- [ ] `npx tsc --noEmit` passes with zero type errors
- [ ] All 8 `<select>` elements replaced with `<Select>` primitive
- [ ] All 4 bottom-sheet/dialog pairs use `<Dialog>` (responsive via CSS)
- [ ] Toast region mounted once via Kobalte; old `Toast.tsx` deleted
- [ ] DesktopToolsBar accordion uses `<Accordion>` primitive
- [ ] Path/Area toggle and sort chips use `<ToggleGroup>` primitive
- [ ] CompassButton and PlotControls floating panels use `<Popover>` primitive
- [ ] `role="button"` div in `GpsPanel.tsx` replaced with `<Button>`
- [ ] No raw `<button>` / `<input>` / `<textarea>` / `<select>` outside `src/components/ui/` (excluding map/headless components)
- [ ] Visual parity confirmed via Chrome MCP screenshots in both viewports
- [ ] No new CSS tokens introduced; all primitives use existing `--color-*` vars
- [ ] No `corvu` dependency; only `@kobalte/core`
