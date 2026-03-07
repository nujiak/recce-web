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

### Implementation Plan for Missing Features

The following SVG resources exist but features are not yet implemented:

#### GPS Location Marker (`gps-location.svg`)

- **Status:** Pending implementation
- **Location:** Map user position indicator
- **Implementation:** Use in `GpsTracker.tsx` and as MapLibre marker when GPS is active
- **Design:** White outer circle with green inner circle

#### Track Type Icons (`track-route.svg`, `track-area.svg`)

- **Status:** Pending implementation
- **Location:** Track info badges, track cards, track editor
- **Implementation:** Replace text-based "Path"/"Area" labels in `TrackInfo.tsx`, `TrackCard.tsx`, `TrackEditor.tsx`.

#### Onboarding Icons (`onboarding-start.svg`, `onboarding-end.svg`)

- **Status:** Pending implementation
- **Location:** Onboarding flow welcome/completion screens

#### Checkpoint Marker (`map_checkpoint.svg`)

- **Status:** Not copied (feature not implemented)
- **Implementation:** When track checkpoint feature is added, display as MapLibre marker

---

## Satellite Map Layer (Planned)

A hybrid satellite layer with road/label overlays, using ESRI World Imagery (no API key required).

### Overview

| Setting          | Value                              |
| ---------------- | ---------------------------------- |
| Default style    | Satellite                          |
| View on switch   | Preserve center/zoom               |
| Satellite source | ESRI World Imagery                 |
| Labels overlay   | Filtered OpenFreeMap liberty style |

### Data Sources

- **Satellite raster:** `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`
- **Vector labels:** OpenFreeMap liberty style (`https://tiles.openfreemap.org/styles/liberty`)

### Preferences Schema

Add to `Preferences` type:

```ts
mapStyle: 'standard' | 'satellite';
```

Default: `'satellite'`. Persisted in localStorage via `recce_prefs`.

### Implementation Files

| File                                 | Action | Description                             |
| ------------------------------------ | ------ | --------------------------------------- |
| `src/types/index.ts`                 | Modify | Add `mapStyle` to Preferences type      |
| `src/context/PrefsContext.tsx`       | Modify | Add `mapStyle: 'satellite'` to defaults |
| `src/utils/mapStyles.ts`             | Create | Style fetching & filtering logic        |
| `src/components/map/MapView.tsx`     | Modify | Dynamic style switching                 |
| `src/components/map/LayerButton.tsx` | Create | Toggle button UI                        |

### Layer Filtering Logic

When creating hybrid style, filter liberty style layers:

**Keep (overlay on satellite):**

- Roads: `road_*`, `bridge_*`, `tunnel_*`, `highway-*`, `road_shield_*`
- Labels: `label_*`, `poi_*`, `water_name_*`, `waterway_line_label`
- Boundaries: `boundary_*`
- Airports: `airport`

**Remove (replaced by satellite):**

- `background`, `park*`, `landuse*`, `landcover*`
- `water` (fill layer), `building*`, `aeroway*`
- `natural_earth`

### Style Switching

Preserve map state when switching:

```ts
const center = map.getCenter();
const zoom = map.getZoom();
const bearing = map.getBearing();

map.setStyle(newStyle);

map.once('style.load', () => {
  map.jumpTo({ center, zoom, bearing });
});
```

### Attribution

ESRI attribution (auto-added by MapLibre):

```
Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community
```

### UI Component

`LayerButton.tsx` - Toggle button positioned near compass/location controls.

- Icon: `satellite_alt` (satellite) / `map` (standard) from Material Symbols
- Position: `absolute` bottom-left or near other map controls
- On click: Toggle `mapStyle` preference
