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

## Project Overview

Recce Web is a static web app rewrite of the Recce Android mapping/reconnaissance utility.
It is built with Vite (no framework) and outputs a fully static `dist/` folder suitable for
any HTTP server.

**Key constraints:**

- Output must be a static site — no server-side rendering, no backend
- Must work on mobile browsers and desktop browsers (adaptive/responsive UI)
- Offline-first via a PWA service worker
- No jQuery; use modern vanilla DOM APIs

---

## Architecture

### Stack

| Concern     | Choice                    | Reason                                         |
| ----------- | ------------------------- | ---------------------------------------------- |
| Build       | Vite                      | Fast HMR, static `dist/` output, good CI story |
| Map         | MapLibre GL JS            | Already integrated; vector tiles; free         |
| Map tiles   | OpenFreeMap               | No API key needed                              |
| Database    | Dexie (IndexedDB)         | Already integrated; typed, promise-based       |
| Coordinates | proj4js + custom parsers  | Already integrated; handles all 6 systems      |
| Compression | pako (zlib)               | Share-code compression                         |
| Icons       | Material Symbols (CDN)    | Already in use                                 |
| Font        | Geist Mono (Google Fonts) | Already in use                                 |

### File Layout

```
recce-web/
├── src/
│   ├── index.html          # App shell
│   ├── main.js             # Entry point; wires modules together
│   ├── style.css           # Global styles + CSS variables
│   ├── db/
│   │   └── db.js           # Dexie schema & migrations
│   ├── coords/
│   │   ├── index.js        # CoordinateTransformer (unified API)
│   │   ├── wgs84.js
│   │   ├── utm.js
│   │   ├── mgrs.js
│   │   ├── bng.js
│   │   ├── qth.js
│   │   └── kertau.js
│   ├── map/
│   │   ├── map.js          # MapLibre setup, crosshair, coord display
│   │   ├── markers.js      # Pin marker rendering
│   │   └── tracks.js       # Track (polyline/polygon) rendering
│   ├── ui/
│   │   ├── nav.js          # Bottom nav + Toolbox modal
│   │   ├── saved.js        # Saved screen (pins & tracks list)
│   │   ├── pin-editor.js   # Pin create/edit sheet
│   │   ├── track-editor.js # Track create/edit sheet
│   │   ├── pin-info.js     # Pin detail modal
│   │   ├── track-info.js   # Track detail modal
│   │   ├── gps.js          # GPS + compass Toolbox panel
│   │   ├── ruler.js        # Ruler Toolbox panel
│   │   ├── settings.js     # Settings panel
│   │   └── onboarding.js   # First-launch onboarding flow
│   └── share/
│       └── share.js        # Share-code encode/decode
├── public/
│   ├── manifest.json       # PWA manifest
│   └── sw.js               # Service worker
├── AGENTS.md
├── README.md
└── package.json
```

### State Model

All app state lives in memory (JS objects) and is persisted to IndexedDB via Dexie.
Preferences are stored in `localStorage`. There is no reactive framework; DOM is updated
imperatively by the module that owns the relevant section of the UI.

**Pin:**

```js
{
  (id, // auto-increment integer
    createdAt, // ms timestamp
    name, // string, max 20 chars
    lat, // WGS84 decimal degrees
    lng, // WGS84 decimal degrees
    color, // 'red' | 'orange' | 'green' | 'azure' | 'violet'
    group, // string (empty string = ungrouped)
    description); // string
}
```

**Track** (replaces "Chain" from the Android app — an ordered sequence of geographic nodes):

```js
{
  (id,
    createdAt,
    name, // string, max 20 chars
    nodes, // Array<{ lat, lng, name? }>  — name marks a named waypoint/checkpoint
    isCyclical, // boolean — false = open path, true = closed area/polygon
    color, // 'red' | 'orange' | 'green' | 'azure' | 'violet'
    group, // string
    description); // string
}
```

**Preferences** (`localStorage` key `recce_prefs`):

```js
{
  (coordinateSystem, // 'WGS84' | 'UTM' | 'MGRS' | 'BNG' | 'QTH' | 'KERTAU'
    angleUnit, // 'degrees' | 'mils'
    lengthUnit, // 'metric' | 'imperial' | 'nautical'
    theme, // 'light' | 'dark' | 'system'
    onboardingDone); // boolean
}
```

### Navigation Model

| Surface           | Mobile                                     | Desktop                                       |
| ----------------- | ------------------------------------------ | --------------------------------------------- |
| **Map** (default) | Full screen                                | Left pane (flexible width)                    |
| **Saved**         | Full screen, tab-switched                  | Right pane (fixed width, scrollable)          |
| **Tools**         | Third bottom-nav tab → modal grid launcher | Icon row pinned below Saved panel (accordion) |

Map/Saved/Tools toggle is a three-item bottom tab bar on mobile. On desktop the two content
panes (Map + Saved) sit side-by-side via CSS Grid; a Tools icon row is pinned below the
Saved panel and expands an accordion panel inline — no modal is used on desktop.

**Mobile Tools modal — two-view pattern:**

1. **Grid view** (default when tab is tapped): 3 large icon cards — GPS/Compass, Ruler,
   Settings. Tapping a card slides in the tool view.
2. **Tool view**: replaces the grid with the selected panel; a `←` back button in the
   modal header returns to the grid. The modal-level close button dismisses entirely.

**Desktop Tools accordion:**

- Three icon buttons pinned at the bottom of the Saved panel column.
- Clicking an icon expands its panel below the icons; clicking the same icon (or another)
  collapses/switches. State tracked as `activeDesktopTool: string | null` in `nav.js`.

---

## Feature Specifications

### Map Screen

| Element                             | Behaviour                                                                                                                                               |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Full-screen MapLibre map            | Default view on launch                                                                                                                                  |
| Crosshair                           | Fixed centre reticle; SVG with white fill and dark gray outline for visibility on all map backgrounds; coordinate display updates on every `move` event |
| Coordinate display                  | Shows crosshair position in the active coordinate system; tap/click to copy to clipboard                                                                |
| Live measurement overlay            | Distance and bearing from current GPS location to crosshair (shown when GPS is active)                                                                  |
| Compass button                      | Shows current bearing; click resets map rotation to north                                                                                               |
| Location button                     | Centres map on current GPS position; long-press also resets rotation                                                                                    |
| Add Pin button (`add_location_alt`) | Opens pin editor pre-filled with crosshair coordinates; lives in `.coord-actions` toolbar                                                               |
| Go To button (`near_me`)            | Opens coordinate input → flies map to entered position; lives in `.coord-actions` toolbar                                                               |
| Start Track button                  | Starts track plotting mode; lives in `.coord-actions` toolbar; disabled while plotting is active                                                        |

**Track plotting mode** (active while building a track):

- Tapping the plot node button appends the current crosshair position as a node
- Long-pressing the node button appends the node and prompts for a checkpoint name
- A dashed ghost line extends from the last committed node to the live crosshair position, previewing the next segment
- The committed track preview line uses the track's own colour; the ghost line uses the same colour at reduced opacity (0.4)
- Undo button removes the last node
- Save button opens the track editor; Cancel discards the session

**Map interactions:**

- Click a pin marker → opens Pin Info modal
- Click a track polyline/polygon → opens Track Info modal

### Pin System

**Colours and their semantic intent:**

| Value    | Colour | Intent                 |
| -------- | ------ | ---------------------- |
| `red`    | Red    | Default / attention    |
| `orange` | Orange | Warning / intermediate |
| `green`  | Green  | Safe / completed       |
| `azure`  | Azure  | Water / special        |
| `violet` | Violet | Unique / marked        |

**Pin Editor** (bottom sheet on mobile, centred dialog on desktop):

- Name — required, max 20 chars
- Coordinates — single input field, parsed in the active coordinate system
- Colour — 5-option colour picker
- Group — free text; autocomplete from existing group names; empty = ungrouped
- Description — multiline free text
- Actions: Save (create or update), Delete (edit mode only)

**Pin Info modal:**

- Header: name + colour theming
- Group tag
- Description
- All six coordinate representations shown simultaneously
- Actions: Open in Maps (launches `geo:` URI or Google Maps URL), Map (fly to + close dialog), Edit (opens editor)

### Track System

A **Track** is an ordered list of `{ lat, lng, name? }` nodes rendered on the map.

- `isCyclical = false` → open **Path** (polyline A→B→C)
- `isCyclical = true` → closed **Area** (filled polygon A→B→C→A)

**Calculations:**

- Path: total distance = sum of Haversine distances between consecutive nodes
- Area: perimeter (same as path, plus closing segment) + enclosed area via the
  spherical excess formula or the shoelace formula on projected coordinates

**Named checkpoints:** nodes where `name` is non-empty. Displayed as small labelled
markers on the map and listed in the Track Info modal.

**Track Editor** (same sheet pattern as Pin Editor):

- Name — required, max 20 chars
- Type — Path / Area toggle (`isCyclical`)
- Colour
- Group
- Description
- Actions: Save, Delete (edit mode only)

**Track Info modal:**

- Header: name + colour theming
- Type icon (path vs area)
- Total distance (path) or perimeter + area (area), in user's preferred length unit
- Checkpoint list (named nodes only)
- Group tag, description
- Actions: Map (fit bounds + close), Edit

### Saved Screen

**List cards** display: name, colour indicator, group tag, coordinates in active system.
Track cards additionally show: Path/Area icon, total distance, node count.

**Sort options:** Name A–Z, Name Z–A, Time newest, Time oldest, Group.

**Multi-select mode** (entered via long-press on any card, ~300 ms):

- The long-pressed item is immediately selected as the first item.
- Tapping additional cards selects/deselects them without a full re-render (DOM-only toggle).
- Deselecting the last selected item exits multi-select automatically.
- A "Hold an item to select" hint is shown in the list header.
- Actions: bulk delete, share as a code, or add to Ruler.

**Search:** real-time filter by name or group.

### GPS & Compass Panel (Toolbox)

**Location card:**

- Current position in active coordinate system
- GPS accuracy in metres
- Altitude in metres (or feet when `lengthUnit = 'imperial'`)
- "Copy" button copies coordinates to clipboard

Implementation: `navigator.geolocation.watchPosition` with `enableHighAccuracy: true`.

**Compass card:**

- Azimuth (0–360° or 0–6400 NATO mils depending on `angleUnit`)
- Pitch (forward/backward tilt in degrees)
- Roll (side tilt in degrees)
- Animated needle via CSS `transform: rotate()`

Implementation: `DeviceOrientationEvent` (`webkitCompassHeading` on iOS;
`alpha` on Android with `absolute: true`). Show calibration hint when
`DeviceOrientationEvent.absolute` is `false` or unavailable.

### Ruler Panel (Toolbox)

- Ordered list of measurement points (label + lat/lng)
- Each consecutive pair of points shows: distance (preferred unit) and bearing
  (preferred angle unit), colour-coded by the source pin or track
- Cumulative total distance at the bottom
- Clear All button
- Points held in memory only; reset on page reload
- Populated via "Add to Ruler" in Saved multi-select (pins added individually;
  track nodes added as a contiguous sub-list)

### Settings Panel (Toolbox)

| Setting           | Options                            |
| ----------------- | ---------------------------------- |
| Coordinate system | WGS84, UTM, MGRS, BNG, QTH, Kertau |
| Angle unit        | Degrees, NATO Mils                 |
| Length unit       | Metric, Imperial, Nautical         |
| Theme             | Light, Dark, System                |

Changes apply immediately. Persisted to `localStorage` under key `recce_prefs`.

### Onboarding Flow

Three-step full-screen modal shown on first launch (`onboardingDone` absent or `false`).
Dark theme enforced regardless of system preference during the flow.

1. **Welcome** — app name and brief description
2. **Preferences** — coordinate system, angle unit, length unit, theme selectors
3. **Done** — confirmation; writes `onboardingDone: true`; dismisses to Map screen

### Share Code Format

Codes must survive copy-paste through messaging apps (WhatsApp, Telegram, SMS):

- Alphabet `0-9A-Za-z` only — no `+`, `/`, `=`, or whitespace
- Version prefix `R1` enables future format changes without breaking old clients

**Encoding:**

1. Build `{ pins: [...], tracks: [...] }` with only essential fields
   (omit `id`; keep `createdAt` as the deduplication key)
2. `JSON.stringify` → `pako.deflate` (raw deflate, no zlib header)
3. Encode resulting bytes as Base62 (big-endian, alphabet `0-9A-Za-z`)
4. Prepend `R1`

**Decoding:**

1. Strip `R1` prefix; Base62 decode → byte array
2. `pako.inflate` → JSON string → `JSON.parse`
3. Merge into DB; skip any item whose `createdAt` already exists

**Size estimate:** 5 pins ≈ 150–200 characters; 20 pins ≈ 400–600 characters.

---

## Coordinate Systems

All internal storage uses WGS84 (lat/lng). Conversion happens at display time and on
user input. All six systems share a unified API in `src/coords/index.js`:

```js
// Convert WGS84 → display string in the given system
CoordinateTransformer.toDisplay(lat, lng, system); // → string | null

// Parse a user-input string in the given system → { lat, lng } or null
CoordinateTransformer.parse(input, system); // → { lat, lng } | null

// Get display strings for all systems at once (for Pin Info modal)
CoordinateTransformer.allSystems(lat, lng); // → Map<system, string>
```

---

### WGS84

**Display format:** `1.35210° N 103.81980° E`

**Input — two accepted formats:**

```
Format 1 (cardinal suffix):   "1.3521° N 103.8198° E"   or  "1.3521 N 103.8198 E"
Format 2 (signed decimal):    "1.3521 103.8198"          or  "-1.3521 -103.8198"
```

**Regex patterns:**

```
// Format 1
/^\s*([0-9.,]+)\s*°?\s*([NSns])\s*([0-9.,]+)\s*°?\s*([EWew])\s*$/

// Format 2
/^\s*([-+0-9.,]+)\s*°?\s+([-+0-9.,]+)\s*°?\s*$/
```

**Valid range:** lat −90 to +90, lng −180 to +180.

---

### UTM (Universal Transverse Mercator)

**Display format:** `48N 0361234 0149234` (zone + band + 7-digit easting + 7-digit northing)

**Input regex:** `/^(\d{1,2})([NSns])(\d{1,14})$/` (spaces stripped before matching)

**Input examples:** `48N361234149234` · `48N 361234 149234` · `48n 361234 149234`

**Zone calculation:** `zone = floor((lng + 180) / 6) + 1` (1–60)

**Band:** `lat >= 0` → `N`; `lat < 0` → `S`

**EPSG codes:** Northern `zone + 32600`; Southern `zone + 32700`

**Projection constants:**

```
k0 = 0.9996
False easting        = 500 000 m
False northing North = 0 m
False northing South = 10 000 000 m
```

**WGS84 ellipsoid constants used throughout UTM/MGRS:**

```
a  = 6 378 137.0 m          (semi-major axis)
f  = 1 / 298.257223563      (flattening)
b  = a × (1 − f)            (semi-minor axis)
e² = 2f − f²                (first eccentricity squared)
```

**WGS84 → UTM (Transverse Mercator forward):**

```
latRad = lat × π/180
lngRad = lng × π/180
cm     = centralMeridian × π/180   // centralMeridian = (zone−1)×6 − 180 + 3

N = a / sqrt(1 − e²·sin²(latRad))
T = tan²(latRad)
C = (e²/(1−e²)) · cos²(latRad)
A = (lngRad − cm) · cos(latRad)
M = a · (latRad − e²/2·sin(2·latRad)
         + e⁴/24·sin(4·latRad)·(3−4(1−e²))·...  // standard meridional arc

easting  = k0·N·(A + (1−T+C)·A³/6 + (5−18T+T²+72C−58e²)·A⁵/120) + 500000
northing = k0·(M + N·tan(latRad)·(A²/2 + (5−T+9C+4C²)·A⁴/24
                                        + (61−58T+T²+600C−330e²)·A⁶/720))
// Add 10 000 000 to northing for southern band
```

**UTM → WGS84 (reverse):**

```
// Remove false offsets
x = easting − 500000
y = northing  (subtract 10 000 000 first for southern band)

M  = y / k0
mu = M / (a · (1 − e²/4 − e⁴/64 − e⁶/256))

e1 = (1 − √(1−e²)) / (1 + √(1−e²))

// Footpoint latitude series
φ1 = mu
   + (3e1/2 − 27e1³/32)          · sin(2·mu)
   + (21e1²/16 − 55e1⁴/32)       · sin(4·mu)
   + (151e1³/96)                  · sin(6·mu)
   + (1097e1⁴/512)                · sin(8·mu)

N1 = a / √(1 − e²·sin²(φ1))
T1 = tan²(φ1)
C1 = (e²/(1−e²)) · cos²(φ1)
D  = x / (N1 · k0)

// Final latitude
lat = φ1 − (N1·tan(φ1)/k0) · (
        D²/2
      − (5 + 3T1 + 10C1 − 4C1² − 9e²) · D⁴/24
      + (61 + 90T1 + 298C1 + 45T1² − 252e² − 3C1²) · D⁶/720
      )

// Longitude
lng = centralMeridian + (
        D
      − (1 + 2T1 + C1) · D³/6
      + (5 − 2C1 + 28T1 − 3C1² + 8e² + 24T1²) · D⁵/120
      ) / cos(φ1)
```

**Valid range:** lat −80° to +84°.

---

### MGRS (Military Grid Reference System)

Derived from UTM. Adds a latitude band letter and a 100 km grid-square designator.

**Display format:** `48PWW 12345 67890`

- `48` = UTM zone, `P` = MGRS latitude band, `WW` = 100 km square (column + row letters)
- `12345` / `67890` = easting / northing within the 100 km square (5 digits = 1 m precision)

**Input regex:** `/^(\d{1,2})(\w{3})(\d{1,12})$/` (spaces stripped, uppercased)

**Precision levels:**

| Digit pairs   | Precision |
| ------------- | --------- |
| 1 (2 digits)  | 10 km     |
| 2 (4 digits)  | 1 km      |
| 3 (6 digits)  | 100 m     |
| 4 (8 digits)  | 10 m      |
| 5 (10 digits) | 1 m       |

**Latitude band letters** (C–X, skipping I and O):

| Latitude   | Band | Latitude | Band |
| ---------- | ---- | -------- | ---- |
| −80 to −72 | C    | 0 to 8   | N    |
| −72 to −64 | D    | 8 to 16  | P    |
| −64 to −56 | E    | 16 to 24 | Q    |
| −56 to −48 | F    | 24 to 32 | R    |
| −48 to −40 | G    | 32 to 40 | S    |
| −40 to −32 | H    | 40 to 48 | T    |
| −32 to −24 | J    | 48 to 56 | U    |
| −24 to −16 | K    | 56 to 64 | V    |
| −16 to −8  | L    | 64 to 72 | W    |
| −8 to 0    | M    | 72 to 84 | X    |

`index = min(floor((lat + 80) / 8), 19)`; band = `'CDEFGHJKLMNPQRSTUVWX'[index]`

**100 km column letters** (by `zone % 3`):

```
zone % 3 === 1: A B C D E F G H
zone % 3 === 2: J K L M N P Q R
zone % 3 === 0: S T U V W X Y Z
```

`columnIndex = floor(easting / 100000) − 1` (0-based into the array above)

**100 km row letters** (by `zone % 2`, repeating every 2 000 000 m northing):

```
zone % 2 === 1: A B C D E F G H J K L M N P Q R S T U V
zone % 2 === 0: F G H J K L M N P Q R S T U V A B C D E
```

`rowIndex = floor((northing % 2000000) / 100000)`

**Y-band disambiguation** (when converting MGRS → UTM, multiple northing offsets are
possible; try each and accept the one whose derived MGRS band matches):

```js
const Y_BANDS = {
  C: [1, 0],
  D: [1, 0],
  E: [1],
  F: [2, 1],
  G: [2],
  H: [3, 2],
  J: [3],
  K: [4, 3],
  L: [4],
  M: [4, 4],
  N: [0],
  P: [0],
  Q: [0, 1],
  R: [1],
  S: [1, 2],
  T: [2],
  U: [2, 3],
  V: [3],
  W: [3, 4],
  X: [3, 4],
};
// utmNorthing = 2000000 × yBand + preliminaryNorthing
```

**Valid range:** lat −80° to +84°.

---

### BNG (British National Grid)

**EPSG:** 27700

**Proj4 string:**

```
+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000
+ellps=airy +towgs84=446.448,-125.157,542.06,0.1502,0.247,0.8421,-20.4894
+units=m +no_defs
```

Use `proj4(wgs84, bngProj, [lng, lat])` and its inverse. Do not implement the
Transverse Mercator manually for BNG.

**Display format:** `TQ 12345 67890`

- Two letters = 500 km major square + 100 km minor square
- 5-digit easting + 5-digit northing within the 100 km square

**Input regex:** `/^([JHONST])([A-HJ-Z])(\d{1,12})$/` (spaces stripped, uppercased)

**Major letters** (500 km squares, valid set: H J N O S T):

```
      0 km    500 km   1000 km  (Easting)
0 km    S        N        H
500 km  T        O        J
```

Easting offsets from major letter: `T, O, J → +500 000 m`; `S, N, H → +0 m`

Northing offsets from major letter: `H, J → +1 000 000 m`; `N, O → +500 000 m`; `S, T → +0 m`

**Minor letters** (100 km squares within the 500 km major square):

```
     0    100   200   300   400  (km easting within 500 km major)
400  A     B     C     D     E
300  F     G     H     J     K
200  L     M     N     O     P
100  Q     R     S     T     U
  0  V     W     X     Y     Z
(km northing within 500 km major)
```

Easting offsets from minor letter:
`A/F/L/Q/V = 0`; `B/G/M/R/W = +100 000 m`; `C/H/N/S/X = +200 000 m`;
`D/J/O/T/Y = +300 000 m`; `E/K/P/U/Z = +400 000 m`

Northing offsets from minor letter:
`A–E = +400 000 m`; `F–K = +300 000 m`; `L–P = +200 000 m`;
`Q–U = +100 000 m`; `V–Z = +0 m`

**Valid range:** easting 0–700 000 m, northing 0–1 250 000 m (Great Britain mainland).

---

### QTH (Maidenhead Locator)

**Display format:** `OK21ab12` (8 characters = ~500 m precision)

**Input regex:** `/^[A-Ra-r]{2}([0-9]{2}([A-Xa-x]{2}([0-9]{2})?)?)?$/`
(accepts 2, 4, 6, or 8 characters)

**Precision:**

| Length  | Precision                      |
| ------- | ------------------------------ |
| 2 chars | ±10° lat, ±20° lng (~1 200 km) |
| 4 chars | ±1° lat, ±2° lng (~120 km)     |
| 6 chars | ±2.5′ lat, ±5′ lng (~5 km)     |
| 8 chars | ±15″ lat, ±30″ lng (~500 m)    |

**WGS84 → QTH algorithm:**

```js
let lng = coord.lng + 180; // shift to 0–360
let lat = coord.lat + 90; // shift to 0–180

// Field (20° × 10°)  — uppercase letters A–R
field[0] = charFromIndex(floor(lng / 20));
field[1] = charFromIndex(floor(lat / 10));
lng %= 20;
lat %= 10;

// Square (2° × 1°) — digits 0–9
square[0] = floor(lng / 2);
square[1] = floor(lat);
lng %= 2;
lat %= 1;

// Subsquare (1/12° × 1/24°) — lowercase letters a–x
subsquare[0] = lowercaseFromIndex(floor(lng * 12));
subsquare[1] = lowercaseFromIndex(floor(lat * 24));
lng %= 1 / 12;
lat %= 1 / 24;

// Extended square (1/120° × 1/240°) — digits 0–9
extended[0] = floor(lng * 120);
extended[1] = floor(lat * 240);
```

**QTH → WGS84:** reverse the above, summing contributions from each level present.
Use the centre of each cell (add half the cell size) for the most accurate point.

**Valid range:** global (all latitudes and longitudes).

---

### Kertau 1948 (SVY21)

Covers Peninsular Malaysia and Singapore.

**Proj4 string:**

```
+proj=omerc +lat_0=4 +lonc=102.25 +alpha=323.0257905 +k=0.99984
+x_0=804670.24 +y_0=0 +no_uoff +gamma=323.1301023611111
+a=6377295.664 +b=6356094.667915204 +units=m +no_defs +towgs84=-11,851,5
```

Use `proj4(wgs84, kertauProj, [lng, lat])` and its inverse.

**Display format:** `804670 149234` (easting space northing, integer metres)

**Input:** two integers separated by space, comma, or semicolon.

**Valid geographic bounds:**

- Latitude 1.12° N to 6.72° N
- Longitude 99.59° E to 104.60° E

Return `null` for coordinates outside these bounds.

---

## CSS Conventions

- Use CSS custom properties for all colours and spacing; defined in `:root`
- Dark/light theme toggled by `data-theme` attribute on `<html>`; never hardcode hex/oklch colours
- Mobile-first breakpoints: base styles for narrow viewports; `@media (min-width: 768px)` for desktop
- BEM-style class names: `.pin-card`, `.pin-card__name`, `.pin-card--selected`

---

## Coding Conventions

- ES modules (`import`/`export`); no CommonJS
- Prefer `const`; use `let` only when reassignment is necessary
- DOM queries cached at module initialisation; never query the DOM in a hot loop
- Async DB operations always `await`ed; never fire-and-forget
- Functions named in `camelCase`; CSS classes and HTML ids in `kebab-case`
- Each UI module exports an `init()` function called from `main.js`

---

## CI / Build

```bash
npm install
npm run build   # outputs dist/
npm run dev     # local dev server with HMR
```

```bash
npx serve dist
# or
python3 -m http.server --directory dist
```

---

## Improvement Plan

The following improvements are to be implemented in phases. Each phase groups related changes to minimize context switching and allow incremental testing.

---

### Phase 1: UI Stability (Layout Shift Fixes)

**Goal:** Prevent dynamic value changes from causing layout shifts in coordinate displays and measurement overlays.

#### 1.1 Fixed-Width Dynamic Value Containers

**Files to modify:**

- `src/utils/geo.js`
- `src/ui/gps.js`
- `src/style.css`

**Changes:**

1. **`src/utils/geo.js` - Update formatting functions for fixed decimal places:**

   `formatDistance()`:
   - Metric: Integer for metres (< 1000m), 2 dp for km
   - Imperial: Integer for feet (< 5280ft), 2 dp for miles
   - Nautical: Always 2 dp
   - Max output length: ~12 chars (`40075.00 km`)

   `formatBearing()`:
   - Degrees: `360.0°` (1 decimal place)
   - Mils: `6400 mils` (0 decimal places)
   - Max output length: ~9 chars

2. **`src/ui/gps.js` - Update compass pitch/roll formatting:**
   - Pitch: `${pitch.toFixed(1)}°` (1 decimal, range -180.0 to 180.0)
   - Roll: `${roll.toFixed(1)}°` (1 decimal, range -90.0 to 90.0)

3. **`src/style.css` - Add fixed-width containers:**

   | Selector                | Min-Width | Notes                                 |
   | ----------------------- | --------- | ------------------------------------- |
   | `#target-coord-display` | `25ch`    | WGS84 max: `90.00000° S 180.00000° W` |
   | `#gps-coord-value`      | `25ch`    | Same as above                         |
   | `#gps-overlay-distance` | `12ch`    | Max: `40075.00 km`                    |
   | `#gps-overlay-bearing`  | `10ch`    | Max: `6400 mils`                      |
   | `#compass-azimuth`      | `10ch`    | Max: `6400 mils`                      |
   | `#compass-pitch`        | `8ch`     | Max: `-180.0°`                        |
   | `#compass-roll`         | `7ch`     | Max: `-90.0°`                         |
   | `#gps-accuracy`         | `20ch`    | Max: `Accuracy: ±9999 m`              |
   | `#gps-altitude`         | `20ch`    | Max: `Altitude: 99999 ft`             |

   All value containers use:

   ```css
   text-align: right;
   font-variant-numeric: tabular-nums;
   ```

#### 1.2 Increase Crosshair Outline Thickness

**File to modify:** `public/crosshair.svg`

**Change:** Widen the dark gray outline path (`#404040`) coordinates to extend ~2px beyond the white cross fill (vs current ~1px). Maintain existing cross shape and color.

---

### Phase 2: UX Feedback Improvements

**Goal:** Provide clearer feedback for user actions.

#### 2.1 Show Toast on Sort Change

**File to modify:** `src/ui/saved.js`

**Change:** In `cycleSort()`, after updating `sortBy`, call `showToast()` with `'info'` type:

| Sort Mode | Toast Message           |
| --------- | ----------------------- |
| `newest`  | `Sorting by Newest`     |
| `oldest`  | `Sorting by Oldest`     |
| `name-az` | `Sorting by Name (A-Z)` |
| `name-za` | `Sorting by Name (Z-A)` |
| `group`   | `Sorting by Group`      |

#### 2.2 Auto-Open Ruler After Adding from Saved

**Files to modify:**

- `src/ui/nav.js`
- `src/ui/saved.js`

**Changes:**

1. **`src/ui/nav.js` - Export new helper functions:**

   ```js
   export function openToolPanel(name) {
     // Opens toolbox modal and shows specific tool panel (mobile)
   }

   export function openDesktopTool(name) {
     // Expands specific desktop accordion (desktop)
   }
   ```

2. **`src/ui/saved.js` - In `handleAddToRuler()`:**
   - Detect viewport: `window.matchMedia('(min-width: 768px)').matches`
   - Mobile: Exit multi-select, switch to tools tab, show ruler panel
   - Desktop: Exit multi-select, expand ruler accordion

---

### Phase 3: Desktop Bug Fixes

**Goal:** Fix non-functional panels and buttons on desktop.

#### 3.1 Fix Settings/GPS/Ruler Panels Not Working on Desktop

**File to modify:** `src/ui/nav.js`

**Change:** Modify `toggleDesktopTool()` to **move** panels instead of cloning. Event listeners remain attached to original elements.

```js
function returnPanelToToolbox(panel) {
  const toolboxContent = document.querySelector('.toolbox-content');
  if (toolboxContent && panel) {
    toolboxContent.appendChild(panel);
  }
}

function toggleDesktopTool(tool) {
  const accordion = document.getElementById('desktop-tools-accordion');
  const panel = document.getElementById(`${tool}-panel`);

  if (activeDesktopTool === tool) {
    // Close: return panel to toolbox
    activeDesktopTool = null;
    returnPanelToToolbox(panel);
    accordion.classList.remove('open');
    // Update button states...
  } else {
    // Open: return previous panel, then move new panel
    if (activeDesktopTool) {
      const prevPanel = document.getElementById(`${activeDesktopTool}-panel`);
      returnPanelToToolbox(prevPanel);
    }
    activeDesktopTool = tool;
    accordion.innerHTML = '';
    accordion.appendChild(panel); // Move, not clone
    panel.style.display = 'block';
    accordion.classList.add('open');
    // Update button states...
  }
}
```

#### 3.2 Fix Track Edit Button Not Working

**File to modify:** `src/ui/track-info.js`

**Change:** In `handleEdit()`, call `onEditCallback` before `closeInfo()`:

```js
function handleEdit() {
  if (!currentTrack) return;

  const trackToEdit = currentTrack;
  const callback = onEditCallback;

  if (callback) {
    callback(trackToEdit); // Call before closeInfo() clears it
  }

  closeInfo();
}
```

---

### Phase 4: Modal Consistency

**Goal:** Ensure consistent modal appearance and fix visual bugs.

#### 4.1 Remove Color Class from Track Modal Header

**File to modify:** `src/ui/track-info.js`

**Change:** In `open()` function, remove `color-${track.color}` and `track-header` from header class:

**Before:**

```js
headerEl.className = `info-modal-header track-header color-${track.color || 'red'}`;
```

**After:**

```js
headerEl.className = 'info-modal-header';
```

This fixes:

- Unintended colored background on header
- Header scaling up 10% on hover (from `.color-{color}:hover { transform: scale(1.1) }`)

---

### Implementation Order

1. **Phase 1** (UI Stability) - Independent, foundational fixes
2. **Phase 3** (Desktop Bug Fixes) - Unblocks desktop testing
3. **Phase 2** (UX Feedback) - Enhancements that benefit from Phase 3 fixes
4. **Phase 4** (Modal Consistency) - Polish, independent of other phases

---

### Testing Checklist

After each phase, verify:

- [ ] **Phase 1:**
  - [ ] Target coord display doesn't shift when panning map
  - [ ] GPS overlay distance/bearing don't shift when values update
  - [ ] Compass values don't shift when device moves
  - [ ] GPS panel coordinate display is stable
  - [ ] Crosshair is clearly visible on light and dark map backgrounds

- [ ] **Phase 2:**
  - [ ] Sort button shows toast with current sort mode
  - [ ] Adding to ruler from saved opens ruler panel (mobile and desktop)

- [ ] **Phase 3:**
  - [ ] Settings dropdowns work on desktop and persist
  - [ ] GPS panel interactions work on desktop
  - [ ] Ruler clear button works on desktop
  - [ ] Track edit button opens editor correctly

- [ ] **Phase 4:**
  - [ ] Track info modal header matches pin info modal (no color, no hover effect)
