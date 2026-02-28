# Recce Web

A mapping and reconnaissance utility for the browser — a feature-complete rewrite of the
Recce Android app in plain HTML, JavaScript, and CSS, built with Vite and deployed as a
fully static site.

**Current state:** Phases 0–9 complete. Map, crosshair, all six coordinate systems, settings,
onboarding, pin system, track system, share codes, GPS & compass, and ruler are all working.
Phases 10–11 (PWA & Polish) remain.

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
behaviours) lives in `AGENTS.md`. This document describes _what to build_ in each phase
and the acceptance criteria.

---

### Phase 0 — Foundation ✅ DONE

Vite migration, jQuery removal, ES module split, CSS custom properties, stub PWA files.

---

### Phase 1 — Navigation Shell ✅ DONE

Bottom tab bar (Map / Saved), Toolbox FAB + modal overlay, desktop side-by-side layout via
CSS Grid.

---

### Phase 2 — Coordinate Systems & Settings ✅ DONE

All six coordinate systems implemented (`wgs84.js`, `utm.js`, `mgrs.js`, `bng.js`,
`qth.js`, `kertau.js`) with `CoordinateTransformer` unified API. Settings panel (inside
Toolbox) with coordinate system, angle unit, length unit, theme, map type selectors.

---

### Phase 3 — Onboarding ✅ DONE

Three-step full-screen modal on first launch. Dark theme enforced during flow. Preferences
written to `localStorage` key `recce_prefs`.

---

### Phase 4 — Pin System 🔴 NEEDS HTML + WIRING

**Goal:** Full pin lifecycle — create, view, edit, delete — with map markers and the Saved list.

**Status:** All JS modules exist and are correct (`pin-editor.js`, `pin-info.js`,
`markers.js`, `saved.js` with pin rendering). However, `index.html` contains **none** of
the required UI elements for these modules — the JS will silently no-op because all
`getElementById` calls return `null`. The old `<dialog id="add-point">` is a stale
leftover from the pre-Vite MVP and must be removed.

**What still needs to be done:**

1. **`src/index.html`** — add all missing HTML:
   - Pin editor bottom sheet: `id="pin-editor"`, `id="pin-editor-backdrop"`, fields for
     `pin-editor-title`, `pin-editor-name`, `pin-editor-coord`, `pin-editor-coord-label`,
     `pin-editor-colors`, `pin-editor-group` (with `list="pin-editor-groups"`),
     `pin-editor-groups` datalist, `pin-editor-description`, buttons for `pin-editor-close`,
     `pin-editor-save`, `pin-editor-delete`
   - Pin info modal: `id="pin-info"`, `id="pin-info-backdrop"`, elements for `pin-info-name`,
     `pin-info-group`, `pin-info-description`, `pin-info-coord-list`, buttons for
     `pin-info-close`, `pin-info-map`, `pin-info-edit`, `pin-info-open-maps`
   - Remove the stale `<dialog id="add-point">` block
   - Saved screen toolbar: `id="saved-toolbar"` (with `id="saved-sort-btn"`,
     `id="saved-search"`, `id="saved-multiselect-btn"`), `id="saved-multi-toolbar"` (with
     `id="saved-delete-btn"`, `id="saved-share-btn"`, `id="saved-ruler-btn"`,
     `id="saved-cancel-btn"`)
   - Go To dialog: `id="goto-dialog"`, `id="goto-backdrop"`, `id="goto-input"`,
     `id="goto-submit"`, `id="goto-close"`
   - Go To button on the map surface: `id="goto-btn"`
   - FAB on map surface for "Add pin" (currently a button inside `coord-container` with
     `id="add-button"` — wire it or replace with the main FAB pattern)

2. **`src/ui/pin-info.js`** — add "Open in Maps" handler (currently the button is
   referenced but no handler wired; use `geo:<lat>,<lng>` URI with Google Maps fallback)

3. **`src/map/map.js`** — add:
   - "Go To" button listener: on click, open the goto dialog; on submit, call
     `CoordinateTransformer.parse(input, prefs.coordinateSystem)` and `map.flyTo()`
   - Wire the `add-button` FAB to dispatch `openPinEditor` with the current crosshair
     lat/lng (this event is already handled in `main.js`)

4. **`src/style.css`** — add styles for pin editor sheet, pin info modal, saved toolbar,
   goto dialog, colour swatches, group tags

**Data model:** schema v1 already has the correct `pins` table (no migration needed).

**Exit criteria:** Full pin CRUD persists across reloads; pins appear on map and in the
Saved list; Pin Info modal shows all valid coordinate representations; "Open in Maps" works;
Go To accepts all six coordinate formats.

---

### Phase 5 — Saved Screen (Sort, Filter, Multi-select) 🔴 NEEDS HTML + TRACK SUPPORT

**Goal:** Transform the Saved screen into a proper management surface for both pins and tracks.

**Status:** `saved.js` has complete sort/search/multi-select logic for pins, but it
references HTML elements that do not exist yet (same gap as Phase 4). Tracks are not
included in the list at all.

**What still needs to be done:**

1. **`src/index.html`** — add the Saved screen toolbar HTML (same items listed in Phase 4
   task 1 above; phases 4 and 5 share the same HTML gap)

2. **`src/ui/saved.js`** — extend to include tracks:
   - Import `getAllTracks` from `db.js`
   - Fetch both `pins` and `tracks` in `render()`; merge into a single sorted/filtered list
   - Track cards must show: colour indicator, name, group tag, type icon (path/area),
     total distance (formatted with `formatDistance`), node count
   - Tapping a track card dispatches `trackCardClicked` (wire in `main.js` to open
     `track-info.js`)
   - Long-press on any card enters multi-select mode (currently only tap-toggle is wired)
   - Bulk delete must handle both `db.pins.delete` and `db.tracks.delete`

3. **`main.js`** — wire `trackCardClicked` event to open Track Info modal (analogous to
   the existing `pinCardClicked` handler)

**Exit criteria:** Sort, search, and bulk-delete all work on a list of ≥10 mixed pins and
tracks.

---

### Phase 6 — Track System 🔴 NEEDS DB MIGRATION + HTML + WIRING

**Goal:** Multi-point paths and areas on the map (called "Chains" in the original Android
app, renamed to **Tracks** in recce-web).

**Status:** Not started. All files need to be created from scratch:

- `db.js` is schema **version 1** with only a `pins` table — no `tracks` table and no
  `getAllTracks` / `addTrack` / `updateTrack` / `deleteTrack` / `getAllGroups` exports
- `index.html` has no track editor, track info, or track plotting UI elements
- `main.js` does not import or initialise any track module
- `map.js` has no track rendering, `flyToTrack` handler, or plotting mode

**What still needs to be done:**

1. **`src/db/db.js`** — migrate to schema v2 (bump version 1 → 2; add
   `tracks: '++id, createdAt, name, isCyclical, color, group'`); add and export:
   `getAllTracks()`, `addTrack()`, `updateTrack()`, `deleteTrack()`, `getAllGroups()`
   (combines unique groups from both `pins` and `tracks`)

2. **`src/index.html`** — add:
   - Track editor bottom sheet (same pattern as pin editor): `id="track-editor"`,
     `id="track-editor-backdrop"`, fields for `track-editor-title`, `track-editor-name`,
     `track-editor-type` (checkbox/toggle for Path/Area), `track-editor-colors`,
     `track-editor-group` (with `list="track-editor-groups"`), `track-editor-groups`
     datalist, `track-editor-description`, `track-editor-node-count`, buttons for
     `track-editor-close`, `track-editor-save`, `track-editor-delete`
   - Track info modal: `id="track-info"`, `id="track-info-backdrop"`, elements for
     `track-info-header`, `track-info-name`, `track-info-type-icon`, `track-info-type-label`,
     `track-info-stats`, `track-info-checkpoints`, `track-info-group`, `track-info-description`,
     buttons for `track-info-close`, `track-info-map`, `track-info-edit`
   - Track plotting controls on the map surface (visible only during active plotting):
     `id="track-plot-bar"` container (hidden by default) containing:
     - `id="plot-node-btn"` — tap to append crosshair as node (long-press for named checkpoint)
     - `id="plot-undo-btn"` — remove last node
     - `id="plot-save-btn"` — open track editor with plotted nodes
     - `id="plot-cancel-btn"` — discard with confirmation
   - `id="start-track-btn"` on the map surface to enter plotting mode
   - Checkpoint name popover/sheet: `id="checkpoint-name-dialog"` with a text input and
     confirm/cancel buttons

3. **`src/map/tracks.js`** — create new file:
   - `init(mapInstance)` — add GeoJSON sources and line/fill/checkpoint layers to the map;
     attach click handlers on track layers that dispatch `trackClicked`
   - `loadTracks()` — fetch all tracks from DB and call `renderTracks()`
   - `renderTracks()` — rebuild GeoJSON features from in-memory track array and push to
     MapLibre sources; paths → `LineString`, areas → `Polygon` + fill layer
   - `addTrack(track)` / `updateTrack(track)` / `removeTrack(trackId)` — mutate in-memory
     array and call `renderTracks()`
   - `updateTempTrack(nodes, isCyclical, color)` — update a separate dashed preview source
     during plotting mode
   - `clearTempTrack()` — clear the preview source
   - `getTrackBounds(track)` → `[[minLng, minLat], [maxLng, maxLat]]`

4. **`src/utils/geo.js`** — create new file with shared geometry helpers:
   - `haversineDistance(lat1, lng1, lat2, lng2) → metres`
   - `calculateTotalDistance(nodes, isCyclical) → metres`
   - `calculateArea(nodes) → square metres` (spherical excess / shoelace approximation)
   - `calculateBearing(lat1, lng1, lat2, lng2) → degrees`
   - `formatDistance(metres, lengthUnit) → string`
   - `formatArea(sqMetres, lengthUnit) → string`
   - `formatBearing(degrees, angleUnit) → string`

5. **`src/ui/track-editor.js`** — create new file (same sheet pattern as `pin-editor.js`):
   - `init()` — wire close/save/delete button events
   - `openCreate(nodes, onSave)` — open sheet pre-filled with node count; name/type/colour/group/desc fields
   - `openEdit(track, onSave)` — open sheet with track data; show delete button

6. **`src/ui/track-info.js`** — create new file:
   - `init()` — wire close/map/edit button events
   - `open(track, onEdit)` — populate header colour, name, type icon, stats (distance or
     perimeter + area from `utils/geo.js`), checkpoint list, group, description

7. **`src/map/map.js`** — add:
   - Import and initialise `tracks.js` inside `map.on('load', ...)`
   - Handle `flyToTrack` event: `map.fitBounds(getTrackBounds(track), { padding: 50 })`
   - Export `addTrack`, `updateTrack`, `removeTrack` (delegating to `tracks.js`) for `main.js`
   - Implement track plotting mode state machine:
     - `start-track-btn` click → show `track-plot-bar`, enter plotting mode
     - `plot-node-btn` click → append `{ lat, lng }` to session nodes; call `updateTempTrack`
     - `plot-node-btn` long-press (>500 ms) → append node, show checkpoint name dialog; on
       confirm, store node with `name`
     - `plot-undo-btn` click → pop last node; call `updateTempTrack`
     - `plot-save-btn` click → call `clearTempTrack`, open track editor with session nodes
     - `plot-cancel-btn` click → confirm discard; call `clearTempTrack`, hide `track-plot-bar`

8. **`src/main.js`** — add:
   - Imports for `track-editor.js` (`initTrackEditor`, `openTrackCreate`, `openTrackEdit`)
     and `track-info.js` (`initTrackInfo`, `openTrackInfo`)
   - Call `initTrackEditor()` and `initTrackInfo()` in `DOMContentLoaded`
   - Handle `trackClicked` event → open Track Info modal
   - Handle `trackCardClicked` event → open Track Info modal
   - Handle `openTrackEditor` event (dispatched by `map.js` after plotting) → open track
     editor in create mode with the plotted nodes
   - On track save/edit/delete: call `addTrack`/`updateTrack`/`removeTrack` from `map.js`
     and `refreshSaved()`

9. **`src/style.css`** — add styles for track editor sheet, track info modal, track plot
   bar, checkpoint name dialog, track cards in Saved

**Exit criteria:** A 5-node path and a 4-node area can each be plotted, saved, displayed
on the map, and edited; distance/area calculations are correct; named checkpoints appear
on the map and in Track Info; track cards appear in the Saved list.

---

### Phase 7 — Share Codes ✅ DONE

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

- `pako` is already installed as a production dependency
- `src/share/share.js` does not exist yet — create it with:
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

### Phase 8 — GPS & Compass Panel ✅ DONE

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

### Phase 9 — Ruler ✅ DONE

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

| Feature                                                     | Phase  | Status                                     |
| ----------------------------------------------------------- | ------ | ------------------------------------------ |
| Map with crosshair + coordinate display                     | 0 / 2  | ✅ done                                    |
| Six coordinate systems (WGS84, UTM, MGRS, BNG, QTH, Kertau) | 2      | ✅ done                                    |
| Settings (coord system, units, theme, map type)             | 2      | ✅ done                                    |
| Onboarding flow                                             | 3      | ✅ done                                    |
| Pin creation / editing / deletion                           | 4      | ✅ done                                    |
| Pin colour + group + description                            | 4      | ✅ done                                    |
| Pin info modal (all coord representations)                  | 4      | ✅ done                                    |
| "Open in Maps" from pin info                                | 4      | ✅ done                                    |
| "Go To" coordinate navigation                               | 4      | ✅ done                                    |
| Saved list pins (sort, filter, multi-select, bulk delete)   | 5      | ✅ done                                    |
| Saved list tracks                                           | 5      | ✅ done                                    |
| Track DB schema (version 2)                                 | 6      | ✅ done                                    |
| Track (path & area) plotting on map                         | 6      | ✅ done                                    |
| Track creation / editing / deletion                         | 6      | ✅ done                                    |
| Named checkpoints within tracks                             | 6      | ✅ done                                    |
| Track info modal (distance / perimeter / area)              | 6      | ✅ done                                    |
| Share codes (export + import, Base62 + zlib)                | 7      | ✅ done                                    |
| GPS panel (position, accuracy, altitude)                    | 8      | ✅ done                                    |
| Compass panel (azimuth, pitch, roll)                        | 8      | ✅ done                                    |
| Live distance/bearing overlay on map                        | 8      | ✅ done                                    |
| Ruler (multi-point distance + bearing)                      | 9      | ✅ done                                    |
| Add to Ruler from Saved                                     | 9      | ✅ done                                    |
| PWA (installable, offline-capable)                          | 10     | 🟡 stub only (`vite-plugin-pwa` installed) |
| Dark / light / system theme                                 | 2 / 11 | ✅ done                                    |
| Responsive layout (mobile + desktop)                        | 1      | ✅ done                                    |
| Keyboard navigation + ARIA                                  | 11     | 🔴 not started                             |

---

## Tech Stack

| Concern        | Choice                                     |
| -------------- | ------------------------------------------ |
| Build          | Vite                                       |
| Map            | MapLibre GL JS + OpenFreeMap tiles         |
| Database       | Dexie (IndexedDB)                          |
| Coordinates    | proj4js + custom parsers (see `AGENTS.md`) |
| Compression    | pako (zlib / deflate)                      |
| Share encoding | Base62 (custom, no deps)                   |
| Icons          | Material Symbols (CDN)                     |
| Font           | Geist Mono (Google Fonts)                  |
