# Recce Web

A mapping and reconnaissance utility for the browser — a feature-complete rewrite of the
Recce Android app in plain HTML, JavaScript, and CSS, built with Vite and deployed as a
fully static site.

**Live features:** map with crosshair, pin saving, coordinate display in Kertau 1948 / WGS84.

---

## Running locally

```bash
npm install
npm run dev       # dev server with HMR at http://localhost:5173
npm run build     # production build → dist/
npx serve dist    # or: python3 -m http.server --directory dist
```

---

## Implementation Plan

The app is built incrementally in self-contained phases. Each phase is independently
shippable — `main` always holds a working app.

The full technical reference (data models, coordinate system specs, feature
behaviours) lives in `AGENTS.md`. This document describes *what to build* in each phase
and the acceptance criteria.

---

### Phase 0 — Foundation (current state → Vite)

**Goal:** Migrate the existing prototype to Vite and establish the structural foundation.
No new user-visible features.

**Tasks:**

- Initialise a Vite project; move `src/index.html`, `src/style.css` into the Vite layout
- Remove jQuery; replace all `$()` calls with vanilla `document.querySelector` / event
  listeners
- Split monolithic `script.js` into ES modules:
  - `src/db/db.js` — Dexie initialisation, schema version 1 (`pins` table only)
  - `src/coords/index.js` — stub `CoordinateTransformer` wrapping existing Kertau logic
  - `src/map/map.js` — MapLibre setup, crosshair, `move`-event coordinate display
  - `src/main.js` — entry point; imports and calls each module's `init()`
- Replace all hardcoded `oklch`/hex colour literals in `style.css` with CSS custom
  properties defined in `:root`; add a `data-theme="dark"` default on `<html>`
- Add stub `public/manifest.json` and `public/sw.js` (no caching yet)
- Update `.gitignore` to exclude `node_modules/`, `dist/`

**Exit criteria:** `npm run build` produces a working `dist/`; existing pin add/delete/list
still works; no jQuery in the bundle.

---

### Phase 1 — Navigation Shell

**Goal:** Establish the full navigation model so every subsequent feature has a surface to live on.

**Surfaces:**

| Surface | Mobile | Desktop |
|---------|--------|---------|
| **Map** | Full screen, default tab | Left pane (flexible width) |
| **Saved** | Full screen, second tab | Right pane (fixed width, scrollable) |
| **Toolbox** | FAB → modal overlay | FAB → modal overlay |

**Tasks:**

- `src/ui/nav.js`:
  - Bottom tab bar with two tabs: Map and Saved; active tab highlighted
  - Toolbox FAB (persistent, always visible over the map); opens a full-screen modal
    containing labelled placeholder panels for GPS, Ruler, and Settings
  - On desktop (`min-width: 768px`): Map and Saved rendered side-by-side via CSS Grid;
    Toolbox FAB remains
- Move the existing crosshair + coordinate display into the Map surface
- Saved surface: empty-state message only (no list yet)
- All layout via CSS Grid / Flexbox; no JS-driven layout switching

**Exit criteria:** All three surfaces are reachable and render correctly at 375 px (mobile)
and 1280 px (desktop) viewport widths.

---

### Phase 2 — Coordinate Systems & Settings

**Goal:** Full six-system coordinate support used everywhere in the app, with a working
Settings panel.

**Coordinate systems to implement** (full specs in `AGENTS.md`):

| File | System | Display example | Notes |
|------|--------|-----------------|-------|
| `wgs84.js` | WGS84 | `1.35210° N 103.81980° E` | Two input formats; signed or cardinal |
| `utm.js` | UTM | `48N 0361234 0149234` | Manual TM projection; zones 1–60 |
| `mgrs.js` | MGRS | `48PWW 12345 67890` | Derived from UTM; Y-band disambiguation |
| `bng.js` | BNG | `TQ 12345 67890` | proj4js EPSG:27700; GB only |
| `qth.js` | QTH | `OK21ab12` | Maidenhead; algorithmic; 2/4/6/8 chars |
| `kertau.js` | Kertau 1948 | `804670 149234` | proj4js custom proj; MY/SG only |

**Tasks:**

- Implement each parser/formatter module. Each must export:
  - `format(lat, lng) → string | null` — WGS84 in, display string out; `null` if out of range
  - `parse(input) → { lat, lng } | null` — display string in, WGS84 out
- `src/coords/index.js` — `CoordinateTransformer`:
  ```js
  toDisplay(lat, lng, system)  // → string | null
  parse(input, system)         // → { lat, lng } | null
  allSystems(lat, lng)         // → Map<system, string>
  ```
- Wire the map crosshair coordinate display to the active `coordinateSystem` preference;
  re-render on every `move` event
- `src/ui/settings.js` — Settings panel (inside the Toolbox modal):
  - Coordinate system selector (6 options)
  - Angle unit: Degrees / NATO Mils
  - Length unit: Metric / Imperial / Nautical
  - Theme: Light / Dark / System
  - Map type: Normal / Satellite / Hybrid (switches MapLibre tile source)
- Read/write preferences via `localStorage` key `recce_prefs`; apply all preferences on
  page load before anything renders

**Exit criteria:** Switching coordinate system in Settings immediately updates the crosshair
display; all six `format` → `parse` round-trips return the original lat/lng within floating-point
tolerance; BNG returns `null` outside Great Britain; Kertau returns `null` outside Malaysia/Singapore.

---

### Phase 3 — Onboarding

**Goal:** First-launch setup so users configure preferences before encountering the app.

**Tasks:**

- `src/ui/onboarding.js` — three-step full-screen modal:
  1. **Welcome** — app name and one-line description
  2. **Preferences** — same controls as the Settings panel (coordinate system, angle unit,
     length unit, theme); writes choices to `recce_prefs` on every change so they are
     immediately applied if the user skips forward
  3. **Done** — "You're ready" confirmation screen; button sets `onboardingDone: true`
     and closes the modal
- Enforce `data-theme="dark"` on `<html>` for the duration of onboarding, regardless of
  the theme preference chosen; restore the chosen theme on completion
- On every page load: if `recce_prefs.onboardingDone` is absent or `false`, show the
  onboarding modal before anything else

**Exit criteria:** Fresh-session (no `recce_prefs`) shows onboarding; completing it lands
on the Map screen with the chosen preferences active; returning users skip directly to the map.

---

### Phase 4 — Pin System

**Goal:** Full pin lifecycle — create, view, edit, delete — with map markers and the Saved list.

**Data model** (see `AGENTS.md` for full schema):
```js
{ id, createdAt, name, lat, lng, color, group, description }
```
Colors: `red`, `orange`, `green`, `azure`, `violet`.

**Tasks:**

- Migrate Dexie schema to version 2: rename `points` table → `pins`; add `color`,
  `group`, `description` columns; keep `createdAt` as deduplication key
- `src/map/markers.js`:
  - On DB load, render a colour-coded MapLibre marker for every pin
  - Clicking a marker opens the Pin Info modal for that pin
  - Markers update when a pin is created, edited, or deleted
- `src/ui/pin-editor.js` — bottom sheet (mobile) / centred dialog (desktop):
  - Fields: Name (required, max 20 chars), Coordinates (single field, parsed via
    `CoordinateTransformer.parse` in the active system), Colour picker (5 swatches),
    Group (text input with datalist autocomplete from existing group names),
    Description (multiline `<textarea>`)
  - **Create mode**: pre-filled with the crosshair's current coordinates; Save writes to DB
  - **Edit mode**: pre-filled with the pin's data; Save updates; Delete removes from DB and map
- `src/ui/pin-info.js` — modal dialog:
  - Header styled with the pin's colour
  - Group tag (hidden if empty)
  - Description (hidden if empty)
  - Coordinates section: one row per system using `CoordinateTransformer.allSystems()`;
    systems that return `null` (out of range) are omitted
  - Actions: **Open in Maps** (`geo:<lat>,<lng>` URI, falls back to
    `https://www.google.com/maps?q=<lat>,<lng>`), **Map** (fly to pin + close dialog),
    **Edit** (opens pin editor in edit mode)
- Map surface: Main FAB (➕) opens pin editor pre-filled with the current crosshair
  position
- Map surface: **Go To** button — opens a small input dialog; the user types a coordinate
  in any supported format; on submit `CoordinateTransformer.parse` resolves it and the
  map flies to that position
- `src/ui/saved.js` — render a card per pin in the Saved surface:
  - Colour indicator dot, name, group tag (if set), coordinates in active system
  - Tapping a card opens the Pin Info modal

**Exit criteria:** Full pin CRUD persists across reloads; pins appear on the map and in
the Saved list; the Pin Info modal shows all valid coordinate representations; Go To
accepts all six coordinate formats.

---

### Phase 5 — Saved Screen (Sort, Filter, Multi-select)

**Goal:** Transform the Saved screen into a proper management surface.

**Tasks:**

- **Sort** — toolbar control cycling through: Name A–Z, Name Z–A, Time newest, Time oldest,
  Group (alphabetical group headers inserted between cards)
- **Search** — text input that filters cards in real time by name or group (case-insensitive
  substring match)
- **Multi-select mode** — entered by long-pressing a card (or a dedicated toggle);
  cards show checkboxes; a contextual toolbar appears with:
  - **Delete** — removes all selected items from DB and map; exits multi-select
  - **Share** — stub (shows "coming soon"); will be wired in Phase 7
  - **Add to Ruler** — stub (shows "coming soon"); will be wired in Phase 9
- **Empty state** — shown when no items exist or no items match the current search

**Exit criteria:** Sort, search, and bulk-delete all work on a list of ≥10 mixed pins.

---

### Phase 6 — Track System

**Goal:** Multi-point paths and areas on the map (called "Chains" in the original Android app,
renamed to **Tracks** in recce-web).

**Data model** (see `AGENTS.md` for full schema):
```js
{ id, createdAt, name, nodes: [{ lat, lng, name? }], isCyclical, color, group, description }
```
- `isCyclical = false` → open **Path** (polyline)
- `isCyclical = true` → closed **Area** (filled polygon)

**Calculations:**
- **Path total distance:** sum of Haversine distances between consecutive nodes
- **Area perimeter:** same formula including the closing node→first-node segment
- **Area enclosed area:** shoelace formula on the node coordinates (spherical approximation
  acceptable for the areas likely to be plotted)

**Tasks:**

- Migrate Dexie schema to version 3: add `tracks` table
- **Track plotting mode** on the Map surface:
  - A secondary "plot" FAB appears when the user taps a dedicated "start track" button
  - Each tap of the plot FAB appends `{ lat, lng }` from the current crosshair as a new node;
    a live polyline preview updates on the map
  - Long-pressing the plot FAB appends the node and immediately prompts for an optional
    checkpoint name (short text input in a small popover or inline sheet)
  - An **Undo** button removes the last added node
  - A **Save** button opens the track editor pre-filled with the plotted nodes; on save,
    the track is written to DB
  - A **Cancel** button discards the session with a confirmation prompt
- `src/map/tracks.js`:
  - Render each track as a MapLibre `line` layer (path) or `fill` + `line` layer (area),
    colour-coded to the track's `color`
  - Named checkpoint nodes rendered as small labelled markers
  - Clicking a polyline / polygon opens the Track Info modal
  - Layers update when tracks are added, edited, or deleted
- `src/ui/track-editor.js` — same sheet pattern as pin editor:
  - Name (required, max 20 chars), Type toggle (Path / Area), Colour picker, Group, Description
  - Save / Delete actions
- `src/ui/track-info.js` — modal dialog:
  - Header styled with the track's colour + type icon (path vs area)
  - Total distance (path) or perimeter and area (area), formatted in the user's `lengthUnit`
  - Checkpoint list (only nodes where `name` is non-empty)
  - Group tag, description
  - Actions: **Map** (fit map to track bounds + close), **Edit** (opens editor)
- Saved screen: track cards display type icon, total distance, node count alongside the
  standard name / colour / group fields

**Exit criteria:** A 5-node path and a 4-node area can each be plotted, saved, displayed
on the map, and edited; distance/area calculations are correct; named checkpoints appear
on the map and in the Track Info modal.

---

### Phase 7 — Share Codes

**Goal:** Compact codes that survive copy-paste through WhatsApp, Telegram, or SMS.

**Format:** `R1<Base62>`
- Base62 alphabet: `0-9A-Za-z` (62 characters, no `+`, `/`, `=`, or spaces)
- Version prefix `R1` — allows future format changes without breaking old decoders
- Payload: `{ pins: [...], tracks: [...] }` with `id` omitted; `createdAt` is the
  deduplication key on import
- Encoding pipeline: `JSON.stringify` → `pako.deflate` (raw deflate) → Base62 encode → prepend `R1`
- Decoding pipeline: strip `R1` → Base62 decode → `pako.inflate` → `JSON.parse`
- Typical sizes: 5 pins ≈ 150–200 chars; 20 pins ≈ 400–600 chars

**Tasks:**

- Add `pako` as a production dependency (`npm install pako`)
- `src/share/share.js`:
  - `encode(pins, tracks) → string`
  - `decode(code) → { pins, tracks } | null` — returns `null` on any parse/decompress error
- Wire **Share** action in Saved multi-select (Phase 5 stub):
  - Call `encode` with selected items
  - Write the resulting code to the clipboard via `navigator.clipboard.writeText`;
    fall back to programmatic `<textarea>` select + `document.execCommand('copy')`
  - Show a brief confirmation toast
- Add **Import** entry point in the Saved screen (e.g., a secondary FAB action):
  - Opens a dialog with a `<textarea>` for pasting a share code
  - On submit: call `decode`; show a preview ("3 pins, 1 track found"); on confirm,
    write items to DB (skip any whose `createdAt` already exists)

**Exit criteria:** A code generated on one browser can be pasted and decoded on another
with no data loss; codes containing only pins, only tracks, and a mixture all round-trip
correctly; an invalid paste shows a clear error.

---

### Phase 8 — GPS & Compass Panel

**Goal:** Real-time location and device orientation data in the Toolbox.

**Tasks:**

- `src/ui/gps.js` — GPS panel (replaces the Toolbox GPS placeholder from Phase 1):

  **Location card:**
  - Current position via `navigator.geolocation.watchPosition({ enableHighAccuracy: true })`
  - Display position in the active coordinate system (re-runs `CoordinateTransformer.toDisplay`
    on each fix)
  - GPS accuracy in metres
  - Altitude in metres; convert to feet when `lengthUnit = 'imperial'`
  - "Copy" button: copies the formatted coordinate string to the clipboard
  - Permission-denied state: show a friendly message explaining how to re-enable location
    in the browser

  **Compass card:**
  - Azimuth: `webkitCompassHeading` on iOS; `DeviceOrientationEvent.alpha` (degrees from
    north, requires `absolute: true`) on Android
  - Convert azimuth to NATO mils (multiply by 6400/360) when `angleUnit = 'mils'`
  - Pitch and Roll values in degrees (from `beta` and `gamma` respectively)
  - Animated needle via CSS `transform: rotate(<azimuth>deg)`;
    respect `prefers-reduced-motion` (disable animation, just update value)
  - Calibration hint: shown when `DeviceOrientationEvent.absolute` is `false` or the
    event is unavailable entirely

- Map surface: when GPS is active, show a live overlay displaying the distance and bearing
  from the current GPS position to the crosshair centre (update on every map `move` event
  and every GPS fix)

**Exit criteria:** On a real mobile device the location card shows live coordinates and
accuracy; the compass needle rotates as the device rotates; the map overlay shows a
plausible distance and bearing; the panel degrades gracefully in a desktop browser with no
sensors.

---

### Phase 9 — Ruler

**Goal:** Measure distances and bearings along an ordered sequence of points.

**Tasks:**

- `src/ui/ruler.js` — Ruler panel (replaces the Toolbox Ruler placeholder):
  - Maintains an in-memory ordered array of `{ label, lat, lng, color }` points
  - Renders a list of **segment rows**: for each consecutive pair of points, show:
    - The point labels
    - Distance in the user's `lengthUnit` (Haversine)
    - Bearing in the user's `angleUnit` (initial bearing, degrees or NATO mils)
    - A colour swatch matching the source pin/track colour
  - Cumulative total distance below the list
  - **Clear All** button empties the point array and re-renders
  - State is memory-only; not persisted; resets on page reload

- Wire **Add to Ruler** in Saved multi-select (Phase 5 stub):
  - Selected pins are each appended as a single point (using the pin's colour)
  - Selected tracks append their nodes as a contiguous sub-list (using the track's colour);
    only the first and last node are labelled by name; intermediate nodes use a generic label

**Exit criteria:** Selecting two pins and adding them to the Ruler shows one segment row
with correct Haversine distance and correct initial bearing; selecting three pins shows two
rows and a correct cumulative total; Clear All empties the list.

---

### Phase 10 — PWA & Offline

**Goal:** The app is installable and usable without internet access.

**Tasks:**

- `public/manifest.json`:
  - `name`: "Recce", `short_name`: "Recce"
  - `icons`: 192 × 192 px and 512 × 512 px PNG
  - `display`: `"standalone"`, `start_url`: `"/"`, appropriate `theme_color` and
    `background_color`
- `public/sw.js` — service worker:
  - **Cache-first** for the app shell (HTML, JS, CSS, fonts, icons): cache on install,
    serve from cache, update in background
  - **Network-first with cache fallback** for map tile requests: attempt network; on
    failure serve the cached tile if available (prevents blank map offline)
  - Use a versioned cache name so old caches are purged on update
- Register the service worker in `src/main.js`
- Add a discrete install prompt: listen for `BeforeInstallPromptEvent`; show a small
  banner or button offering "Add to Home Screen"; dismiss permanently if declined
- Use `vite-plugin-pwa` (or equivalent) to generate the precache manifest automatically
  from the Vite build output

**Exit criteria:** Lighthouse PWA audit passes; after one online visit the app loads fully
offline; previously visited map tile areas render offline; IndexedDB data (pins, tracks)
is accessible offline.

---

### Phase 11 — Polish & Accessibility

**Goal:** Production-quality UI, full keyboard support, and WCAG 2.1 AA compliance.

**Tasks:**

- **Keyboard navigation:** focus traps inside all modals and bottom sheets; `Escape` closes
  any overlay; logical tab order throughout
- **ARIA:** `role`, `aria-label`, `aria-live` on all interactive elements and dynamic regions
  (coordinate display, ruler totals, GPS readouts)
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` disables map fly-to
  animations and the compass needle CSS transition
- **Touch targets:** all interactive elements ≥ 44 × 44 px
- **Swipe to dismiss:** bottom sheets dismiss on downward swipe; implement via
  `pointerdown`/`pointermove`/`pointerup` events
- **Map controls:** ensure the compass reset button and map-type toggle are visible and
  usable directly on the Map surface (not buried in the Toolbox)
- **CSS audit:** verify every colour value references a CSS custom property; remove any
  hardcoded remnants
- **Lighthouse targets:** Performance ≥ 90, Accessibility 100, Best Practices 100

---

## Feature Parity Checklist

| Feature | Phase | Status |
|---------|-------|--------|
| Map with crosshair + coordinate display | 0 / 2 | done |
| Six coordinate systems (WGS84, UTM, MGRS, BNG, QTH, Kertau) | 2 | done |
| Settings (coord system, units, theme, map type) | 2 | done |
| Onboarding flow | 3 | done |
| Pin creation / editing / deletion | 4 | partial |
| Pin colour + group + description | 4 | — |
| Pin info modal (all coord representations) | 4 | — |
| "Open in Maps" from pin info | 4 | — |
| "Go To" coordinate navigation | 4 | — |
| Saved list (sort, filter, multi-select, bulk delete) | 5 | — |
| Track (path & area) plotting on map | 6 | — |
| Track creation / editing / deletion | 6 | — |
| Named checkpoints within tracks | 6 | — |
| Track info modal (distance / perimeter / area) | 6 | — |
| Share codes (export + import, Base62 + zlib) | 7 | — |
| GPS panel (position, accuracy, altitude) | 8 | — |
| Compass panel (azimuth, pitch, roll) | 8 | — |
| Live distance/bearing overlay on map | 8 | — |
| Ruler (multi-point distance + bearing) | 9 | — |
| Add to Ruler from Saved | 9 | — |
| PWA (installable, offline-capable) | 10 | stub |
| Dark / light / system theme | 2 / 11 | done |
| Responsive layout (mobile + desktop) | 1 | done |
| Keyboard navigation + ARIA | 11 | — |

---

## Tech Stack

| Concern | Choice |
|---------|--------|
| Build | Vite |
| Map | MapLibre GL JS + OpenFreeMap tiles |
| Database | Dexie (IndexedDB) |
| Coordinates | proj4js + custom parsers (see `AGENTS.md`) |
| Compression | pako (zlib / deflate) |
| Share encoding | Base62 (custom, no deps) |
| Icons | Material Symbols (CDN) |
| Font | Geist Mono (Google Fonts) |
