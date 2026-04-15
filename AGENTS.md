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
| `refactor` | **patch**    | `refactor: migrate UI to Kobalte`              |
| `docs`     | none         | `docs: update AGENTS.md with versioning rules` |
| `style`    | **patch**    | `style: align tailwind classes in PinEditor`   |
| `test`     | none         | `test: add coordinate conversion edge cases`   |
| `chore`    | **patch**    | `chore: bump devDependencies`                  |
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
- Commits with `docs` / `test` / `ci` alone will **not** trigger a release
- The `chore(release):` commits created by `semantic-release` include `[skip ci]` and must not be edited

## Pull Requests

- Explain context/motivation; describe solution approach
- Use section names: Summary, Changes, Motivation, Testing

---

## Architecture

### Stack

| Concern       | Choice                         | Reason                                         |
| ------------- | ------------------------------ | ---------------------------------------------- |
| Framework     | SolidJS + TypeScript           | Fine-grained reactivity; strict types          |
| Styling       | Tailwind CSS v4                | CSS-var-native theming; no class bloat         |
| Build         | Vite + vite-plugin-pwa         | Fast HMR, static `dist/` output, good CI story |
| Map           | MapLibre GL JS                 | Vector tiles; free                             |
| Map utilities | @turf/circle                   | Drawing GPS accuracy polygons                  |
| Map tiles     | OpenFreeMap                    | No API key needed                              |
| Database      | Dexie (IndexedDB)              | Typed, promise-based                           |
| Coordinates   | proj4js + utm-latlng           | Handles all 6 coordinate systems               |
| Compression   | pako (zlib)                    | Share-code compression                         |
| Icons         | Material Symbols (CDN)         | Standardized SVG icons                         |
| Font          | Share Tech Mono (Google Fonts) | Monospace MFD aesthetic for coordinate display |

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

### Back Navigation (mobile)

> **IMPORTANT:** This section MUST be kept up to date whenever the back navigation implementation or overlay priority order changes.

The app intercepts the Android back gesture / browser back button using a **History API sentinel** in `src/App.tsx` (`AppInner`). There is no router; a single dummy history entry `{ backNav: true }` is pushed onto the stack whenever any interceptable overlay is open, so the OS back action pops the sentinel rather than leaving the app.

**How it works:**

The sentinel lifecycle is fully encapsulated in `src/utils/backNav.ts` via `createBackNav(layers, options)`:

- `layers` — a reactive accessor returning a priority-ordered array of `{ isOpen: () => boolean, close: () => void }` entries. The first truthy entry is the one closed on back press.
- A `createEffect` inside `createBackNav` pushes the sentinel whenever any layer is open and removes it when all are closed (programmatic-close path).
- A `popstate` listener (registered in `onMount`) fires when the user presses back. It calls `close()` on the topmost open layer, then re-pushes the sentinel if further layers remain.
- `canClose` option (passed as `() => prefs.onboardingDone`) blocks dismissal during onboarding — the sentinel is re-pushed immediately without closing anything.
- `ignoreNextPopstate` flag suppresses the listener for the one `history.back()` call made internally to remove a stale sentinel.
- On mount, `history.replaceState(null, '')` neutralises any stale sentinel left by a previous session.

**Overlay priority order** (highest = closed first):

| Priority | Overlay                                 | Signal in UIContext                      | Closer                        |
| -------- | --------------------------------------- | ---------------------------------------- | ----------------------------- |
| 1        | Choose Marker dialog (inside PinEditor) | `markerPickerOpen`                       | `setMarkerPickerOpen(false)`  |
| 2        | PinInfo dialog                          | `viewingPin`                             | `setViewingPin(null)`         |
| 3        | PinEditor dialog                        | `editingPin`                             | `setEditingPin(null)`         |
| 4        | TrackInfo dialog                        | `viewingTrack`                           | `setViewingTrack(null)`       |
| 5        | TrackEditor dialog                      | `editingTrack`                           | `setEditingTrack(null)`       |
| 6        | iOS compass permission dialog           | `compassDialogOpen` (local in AppInner)  | `setCompassDialogOpen(false)` |
| 7        | Firefox PWA install dialog              | `firefoxDialogOpen` (local in AppInner)  | `setFirefoxDialogOpen(false)` |
| 8        | Tools panel (mobile)                    | `activeTool !== null` while on tools tab | `setActiveTool(null)` → grid  |
| 9        | Tools grid / Saved screen (mobile)      | `activeNav === 'tools'` or `'saved'`     | `setActiveNav('map')`         |

Desktop is unaffected — `isMobile()` (`window.innerWidth < DESKTOP_BREAKPOINT`) guards the tab-level entries.

**Adding a new interceptable overlay:**

1. If the controlling signal is local to a child component, lift it into `UIContext` (follow the `markerPickerOpen` pattern).
2. Add a `{ isOpen: () => boolean, close: () => void }` entry to the `layers` array in the `createBackNav()` call in `AppInner`, at the correct priority position (lower index = closed first).
3. If the signal must reset when a parent overlay closes, add `setYourSignal(false/null)` to the parent's cleanup path (e.g. in the existing `else` branch of its `createEffect`).

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

## Design Specification

See [DESIGN.md](./DESIGN.md) for the full frontend overhaul design specification (typography, colour tokens, component specs, accessibility checklist, and implementation scope).

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

## Implementation Plans

All feature implementation plans live in [PLANS.md](./PLANS.md). Before starting any planned feature, read the relevant plan in full. When a plan is completed, mark it `Status: Done` in PLANS.md — do not delete it.

---

## SVG Icon Resources

Custom SVG icons are located in `public/icons/`. Most general icons have been replaced by Material Symbols (`https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined`).
