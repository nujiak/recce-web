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

## Migration Plan: SolidJS + TypeScript + Tailwind v4

### Overview

**Strategy:** Full rewrite per phase. The app remains fully functional at the end of each
phase. No parallel codebase. Each phase ends with Chrome MCP verification tests.

**Target stack:**

| Concern   | Choice                    | Reason                                                |
| --------- | ------------------------- | ----------------------------------------------------- |
| Build     | Vite                      | Unchanged; already integrated                         |
| Framework | SolidJS                   | Fine-grained reactivity; no VDOM overhead             |
| Language  | TypeScript (strict)       | Type safety across all modules                        |
| Styling   | Tailwind CSS v4           | CSS-var-native; maps cleanly to existing oklch tokens |
| Database  | Dexie (typed Table API)   | `Table<Pin, number>` / `Table<Track, number>`         |
| Map       | MapLibre GL JS            | Unchanged; wrapped in a SolidJS component             |
| PWA       | vite-plugin-pwa           | Unchanged; reconfigured for new build                 |
| State     | SolidJS signals + context | Replaces window.dispatchEvent event bus               |

**Key decisions:**

- `index.html` becomes a minimal shell (`<div id="root">`); all markup moves to JSX
- Global state (prefs, GPS, UI nav) is managed via SolidJS `createContext` + `createStore`
- The custom event bus (`window.dispatchEvent` / `window.addEventListener`) is replaced
  entirely by reactive signals and context
- Dexie uses the typed `Table<T, K>` API with declared `Pin` and `Track` interfaces
- MapLibre is mounted inside a SolidJS `<MapView>` component via `onMount` / `onCleanup`
- Tailwind v4 `@theme` block inherits the existing oklch design tokens

---

### Phase 1 — Tooling & Scaffold

**Goal:** Replace the Vite + vanilla JS configuration with Vite + SolidJS + TypeScript +
Tailwind v4. The app shell renders a placeholder with correct theming. All build tooling
works. The old JS source is kept intact but not loaded.

**Tasks:**

1. Install `solid-js`, `vite-plugin-solid`, `typescript`, `tailwindcss` (v4),
   `@tailwindcss/vite`.
2. Create `tsconfig.json` with `strict: true`, `module: "ESNext"`, `jsx: "preserve"`,
   `jsxImportSource: "solid-js"`.
3. Update `vite.config.js` → `vite.config.ts`: add `solidPlugin()`, `tailwindcss()`
   plugin, keep `vite-plugin-pwa`.
4. Create `src/index.tsx` (new entry point): mounts `<App />` into `#root`.
5. Create `src/App.tsx`: renders a placeholder; applies dark/light theme from
   `localStorage`.
6. Replace `src/index.html` with a minimal shell containing only `<div id="root">`.
7. Map existing CSS custom properties (oklch colour tokens, spacing, z-index layers) into
   a Tailwind v4 `@theme` block in `src/styles/theme.css`.
8. Confirm `npm run build` and `npm run dev` succeed with zero errors.

**Chrome MCP tests:**

- **T1.1** Navigate to `http://localhost:5173`. Assert page title is "Recce".
- **T1.2** Assert `<div id="root">` exists and contains SolidJS-rendered content.
- **T1.3** Set `localStorage.recce_prefs = '{"theme":"light"}'`, reload. Assert
  `<html data-theme="light">`.
- **T1.4** Run `npm run build`. Assert `dist/` contains `index.html`, at least one `.js`
  chunk and one `.css` chunk.
- **T1.5** Assert no console errors on page load.

---

### Phase 2 — Data, Types & Pure Logic Layer

**Goal:** Port all non-DOM modules to TypeScript with full type safety. No UI changes;
the SolidJS shell from Phase 1 still renders the placeholder. All logic is importable
and type-checked.

**New file: `src/types.ts`**

```ts
export type PinColor = 'red' | 'orange' | 'green' | 'azure' | 'violet';
export type CoordinateSystem = 'WGS84' | 'UTM' | 'MGRS' | 'BNG' | 'QTH' | 'KERTAU';
export type AngleUnit = 'degrees' | 'mils';
export type LengthUnit = 'metric' | 'imperial' | 'nautical';
export type Theme = 'light' | 'dark' | 'system';

export interface TrackNode {
  lat: number;
  lng: number;
  name?: string;
}
export interface Pin {
  id?: number;
  createdAt: number;
  name: string;
  lat: number;
  lng: number;
  color: PinColor;
  group: string;
  description: string;
}
export interface Track {
  id?: number;
  createdAt: number;
  name: string;
  nodes: TrackNode[];
  isCyclical: boolean;
  color: PinColor;
  group: string;
  description: string;
}
export interface Prefs {
  coordinateSystem: CoordinateSystem;
  angleUnit: AngleUnit;
  lengthUnit: LengthUnit;
  theme: Theme;
  onboardingDone: boolean;
}
```

**Modules to port (old → new):**

| Old                  | New                      | Notes                                                     |
| -------------------- | ------------------------ | --------------------------------------------------------- |
| `db/db.js`           | `src/db/db.ts`           | Dexie typed `Table<Pin, number>` / `Table<Track, number>` |
| `coords/index.js`    | `src/coords/index.ts`    | `CoordinateSystem` enum, `CoordinateTransformer` class    |
| `coords/wgs84.js`    | `src/coords/wgs84.ts`    | —                                                         |
| `coords/utm.js`      | `src/coords/utm.ts`      | —                                                         |
| `coords/mgrs.js`     | `src/coords/mgrs.ts`     | Remove inline UTM duplicate; import from `utm.ts`         |
| `coords/bng.js`      | `src/coords/bng.ts`      | —                                                         |
| `coords/qth.js`      | `src/coords/qth.ts`      | —                                                         |
| `coords/kertau.js`   | `src/coords/kertau.ts`   | —                                                         |
| `utils/geo.js`       | `src/utils/geo.ts`       | Consolidates duplicate `haversine` from `saved.js`        |
| `utils/clipboard.js` | `src/utils/clipboard.ts` | —                                                         |
| `utils/toast.js`     | `src/utils/toast.ts`     | Kept imperative; wrapped reactively in Phase 4            |
| `utils/swipe.js`     | `src/utils/swipe.ts`     | —                                                         |
| `share/share.js`     | `src/share/share.ts`     | Typed `encode(pins, tracks)` / `decode(code)`             |

**Chrome MCP tests:**

- **T2.1** Evaluate `(await import('/src/db/db.ts')).getAllPins()`. Assert resolves to an
  array without errors.
- **T2.2** Evaluate
  `(await import('/src/coords/index.ts')).CoordinateTransformer.toDisplay(1.3521, 103.8198, 'WGS84')`.
  Assert returns `"1.35210° N 103.81980° E"`.
- **T2.3** Evaluate
  `(await import('/src/coords/index.ts')).CoordinateTransformer.parse("48N 361234 149234", "UTM")`.
  Assert returns an object with numeric `lat` and `lng`.
- **T2.4** Evaluate
  `(await import('/src/share/share.ts')).encode([], [])`. Assert returns a string starting
  with `"R1"`.
- **T2.5** Run `npx tsc --noEmit`. Assert zero type errors.

---

### Phase 3 — Global State & Settings

**Goal:** Introduce the SolidJS reactive state layer. Wire preferences, theme, and GPS
state into context providers. Replace ad-hoc `localStorage` reads with a typed reactive
store. The app shows a functional Settings panel and correct theme switching. All other UI
remains the placeholder from Phase 1.

**Tasks:**

1. Create `src/stores/prefs.ts`: `createStore<Prefs>` with `localStorage` sync via
   `createEffect`.
2. Create `src/stores/gps.ts`: `createSignal` for `GeolocationCoordinates | null` and
   `DeviceOrientationEvent` data.
3. Create `src/context/PrefsContext.tsx`: `createContext` + `PrefsProvider` component
   exposing `[prefs, setPrefs]`.
4. Create `src/context/UIContext.tsx`: signals for `activeNav`, `activeModal`,
   `activeTool`, `isMultiSelect`.
5. Wire `PrefsProvider` and `UIProvider` at the `<App>` root.
6. Create `src/components/settings/SettingsPanel.tsx`: fully functional settings panel
   using `usePrefs()` context. Four controls: coordinate system, angle unit, length unit,
   theme.
7. Apply `data-theme` to `<html>` reactively via `createEffect` on `prefs.theme`.
8. Create `src/components/Toast.tsx`: reactive toast component driven by a signal
   (replaces imperative `toast.js`).

**Chrome MCP tests:**

- **T3.1** Open Settings. Change theme to Light. Assert `<html data-theme="light">`
  updates without reload.
- **T3.2** Change theme to Dark. Assert `<html data-theme="dark">` without reload.
- **T3.3** Change coordinate system to UTM. Reload. Assert coordinate system is still UTM
  (persisted in `localStorage`).
- **T3.4** Evaluate `JSON.parse(localStorage.getItem('recce_prefs'))`. Assert all 5 fields
  are present with correct types.
- **T3.5** Assert no console errors after each settings change.

---

### Phase 4 — Navigation Shell & Onboarding

**Goal:** Full navigation skeleton: bottom nav (mobile), two-pane layout (desktop),
toolbox modal (mobile) / accordion (desktop), and the onboarding flow. Panels are empty
placeholders. Layout, navigation transitions, and onboarding all work correctly at all
viewports.

**Tasks:**

1. Create `src/components/layout/AppShell.tsx`: CSS Grid root layout (`1fr 320px`
   desktop, single column mobile) using Tailwind v4 utilities from `theme.css` tokens.
2. Create `src/components/nav/BottomNav.tsx`: three-tab bar (Map, Saved, Tools). Tab
   state via `UIContext`.
3. Create `src/components/nav/DesktopToolsBar.tsx`: icon row + accordion expand/collapse,
   state in `UIContext`.
4. Create `src/components/nav/ToolboxModal.tsx`: mobile two-view modal (grid ↔ panel)
   with slide animation.
5. Create `src/components/onboarding/OnboardingFlow.tsx`: 3-step flow. Steps write prefs
   live via `PrefsContext`. Sets `onboardingDone: true` on finish.
6. Replace placeholder `<App>` body with the full shell. Conditionally render
   `<OnboardingFlow>` when `!prefs.onboardingDone`.
7. Add empty slot `<div>` targets for Map, Saved, and tool panels (filled in later phases).

**Chrome MCP tests:**

- **T4.1** (Mobile 375×812) Assert bottom nav with three tabs is visible.
- **T4.2** (Mobile) Tap "Saved" tab. Assert saved panel area is visible; map panel hidden.
- **T4.3** (Mobile) Tap "Tools" tab. Assert toolbox modal opens with GPS/Compass, Ruler,
  Settings grid cards.
- **T4.4** (Mobile) Tap "GPS/Compass" card. Assert tool view slides in with a back button.
- **T4.5** (Mobile) Tap the back arrow. Assert grid view returns.
- **T4.6** (Desktop 1280×800) Assert bottom nav is hidden; two-pane layout is visible.
- **T4.7** (Desktop) Click a Tools icon. Assert accordion panel expands below the icon row.
- **T4.8** Clear `localStorage`. Reload. Assert onboarding step 1 is shown.
- **T4.9** Complete all 3 onboarding steps. Assert onboarding dismisses and map shell is
  shown.
- **T4.10** Reload. Assert onboarding does not reappear.

---

### Phase 5 — Saved Screen

**Goal:** Fully functional Saved screen as a SolidJS component. Displays, sorts,
searches, multi-selects, shares, and imports pins and tracks from IndexedDB.

**Tasks:**

1. Create `src/components/saved/SavedScreen.tsx`: reactive list via `createResource`
   over `getAllPins` + `getAllTracks`.
2. Create `src/components/saved/PinCard.tsx` and `TrackCard.tsx`: display name, colour
   chip, group, coordinate in active system, track stats.
3. Sort (5 modes) via `createSignal<SortMode>` derived with `createMemo`.
4. Real-time search via `createSignal<string>` filter on the memo.
5. Multi-select: long-press 300 ms pointer timer, `createSignal<Set<number>>`,
   deselect-to-exit.
6. Bulk delete, "Share as code" (`share.ts` `encode`), "Add to Ruler" bulk actions.
7. Import: decode share code → DB dedup insert → refetch resource.
8. Use `geo.ts` `haversineDistance`; remove the now-deleted inline duplicate from the
   old `saved.js`.

**Chrome MCP tests:**

- **T5.1** Navigate to Saved. Assert "No pins yet" empty state or a list of pin cards.
- **T5.2** Assert a pin card shows the pin name and coordinate in the active system.
- **T5.3** Change coordinate system to UTM in Settings. Navigate to Saved. Assert
  coordinates on cards update.
- **T5.4** Type "test" in the search input. Assert only cards whose name contains "test"
  are shown.
- **T5.5** Long-press a card for 300 ms. Assert multi-select mode is entered and the card
  is selected.
- **T5.6** Tap a second card. Assert it is also selected.
- **T5.7** With 2 cards selected, tap "Share". Assert a share code dialog shows a string
  starting with `R1`.
- **T5.8** Copy the code, delete all pins, import the code. Assert pins reappear.
- **T5.9** (Mobile) Assert Saved is visible on the Saved tab. (Desktop) Assert Saved panel
  is always visible in the right pane.

---

### Phase 6 — Pin & Track Editors + Info Modals

**Goal:** Fully functional pin editor, track editor, pin info modal, and track info modal
as SolidJS components. Create/edit/delete flows are wired end-to-end with the DB.

**Tasks:**

1. Create `src/components/pin/PinEditor.tsx`: bottom sheet (mobile), centred dialog
   (desktop). Name, coord input (parsed via `CoordinateTransformer.parse`), colour picker,
   group autocomplete, description. Calls `addPin` / `updatePin` / `deletePin`.
2. Create `src/components/pin/PinInfo.tsx`: modal showing all 6 coordinate systems, group,
   description. Actions: Open in Maps, Map (fly to), Edit.
3. Create `src/components/track/TrackEditor.tsx`: same sheet pattern. Name, Path/Area
   toggle, colour, group, description. Calls `addTrack` / `updateTrack` / `deleteTrack`.
4. Create `src/components/track/TrackInfo.tsx`: modal showing total distance / area +
   perimeter, checkpoint list, group, description.
5. Open/close state managed via `UIContext` signals (`activePinEditor`, `activeTrackEditor`,
   `activePinInfo`, `activeTrackInfo`) — no custom events.
6. Group autocomplete via `createResource` over `getAllGroups`.
7. Coordinate input validation: inline error message, no `alert()`.

**Chrome MCP tests:**

- **T6.1** From Saved, tap Edit on a pin. Assert pin editor opens with pre-filled values.
- **T6.2** Change pin name. Tap Save. Assert Saved list updates immediately without reload.
- **T6.3** Open pin editor create mode. Enter an invalid coordinate string. Assert an
  inline validation error appears (no browser alert).
- **T6.4** Create a new pin. Assert it appears in the Saved list.
- **T6.5** Open pin info modal. Assert all 6 coordinate system strings are shown
  simultaneously.
- **T6.6** Tap "Open in Maps". Assert a `geo:` URI or Google Maps URL is opened.
- **T6.7** Open track editor. Toggle between Path and Area. Assert the toggle reflects
  state.
- **T6.8** Open track info for a cyclical track. Assert "Area" is indicated and an area
  measurement is shown.
- **T6.9** Delete a pin from the editor. Assert it disappears from Saved without reload.
- **T6.10** (Mobile) Assert pin editor opens as a bottom sheet. (Desktop) Assert it opens
  as a centred dialog.

---

### Phase 7 — Map Component & Track Plotting

**Goal:** Full MapLibre integration as a SolidJS `<MapView>` component. Crosshair,
coordinate display, GPS overlay, pin markers, track rendering, and the track plotting
state machine all work reactively.

**Tasks:**

1. Create `src/components/map/MapView.tsx`: mount MapLibre via `onMount` into a `ref`
   div; `onCleanup` destroys the instance.
2. Create `src/components/map/Crosshair.tsx`: SVG crosshair + coordinate display
   (click-to-copy). Updates on `map.on('move')` via a signal.
3. Create `src/components/map/PinMarkers.tsx`: reactive to pins resource; adds/removes
   `maplibregl.Marker` instances on change via `createEffect`.
4. Create `src/components/map/TrackLayers.tsx`: reactive to tracks resource; manages 4
   GeoJSON sources/layers (committed tracks, checkpoints, temp plotting, ghost preview).
5. Create `src/components/map/PlotControls.tsx`: Add Pin, Go To, Start Track buttons.
   Track plotting state machine as `createStore<PlotState>`.
6. Ghost line updates driven by plot state + `map.on('move')`.
7. Pin marker clicks → `UIContext` to open `PinInfo`. Track layer clicks → open
   `TrackInfo`.
8. Create `src/components/map/CompassButton.tsx` and `LocationButton.tsx`.
9. Wire `GpsStore` into the live distance + bearing overlay.

**Chrome MCP tests:**

- **T7.1** Assert the MapLibre map renders and tiles load (no blank/grey map).
- **T7.2** Pan the map. Assert the crosshair coordinate display updates.
- **T7.3** Click the coordinate display. Assert coordinates are copied to clipboard
  (evaluate `navigator.clipboard.readText()`).
- **T7.4** Click a pin marker on the map. Assert the Pin Info modal opens for the correct
  pin.
- **T7.5** Click a track polyline. Assert the Track Info modal opens.
- **T7.6** Click "Start Track". Assert plot mode is entered (plot controls appear; Start
  Track button is disabled).
- **T7.7** In plot mode, click "Add Node". Assert a node is added and a track preview line
  appears.
- **T7.8** Click "Undo". Assert the last node is removed.
- **T7.9** Click "Save" in plot mode. Assert the track editor opens pre-filled with the
  plotted nodes.
- **T7.10** Click "Cancel" in plot mode. Assert no track is saved and plot mode exits.
- **T7.11** (Mobile) Assert the map fills the full screen on the Map tab.
- **T7.12** (Desktop) Assert the map fills the left pane; Saved panel is visible right.

---

### Phase 8 — GPS, Compass & Ruler Panels

**Goal:** Fully functional GPS/Compass and Ruler panels wired to real device APIs and
reactive stores.

**Tasks:**

1. Create `src/components/tools/GpsPanel.tsx`: uses `GpsStore`. Location card (position,
   accuracy, altitude, copy button). Compass card (azimuth, pitch, roll, animated needle).
   iOS permission flow. Calibration hint when orientation is not absolute.
2. Create `src/components/tools/CompassNeedle.tsx`: animated via `transform: rotate()`
   driven by `GpsStore` orientation signal.
3. Create `src/components/tools/RulerPanel.tsx`: ordered list from
   `createSignal<RulerPoint[]>`. Each consecutive pair shows distance + bearing.
   Cumulative total. Clear All button.
4. Wire "Add to Ruler" from Saved multi-select to a module-level `RulerStore` signal.
5. GPS panel starts `watchPosition` on `onMount` and stops on `onCleanup`.
6. Screen-orientation compensation matrix for compass on mobile.

**Chrome MCP tests:**

- **T8.1** Open GPS panel. Assert location card and compass card are rendered.
- **T8.2** Assert GPS card shows accuracy or a permission prompt (no silent failure).
- **T8.3** Open Ruler panel. Assert "No points yet" empty state or a list.
- **T8.4** In Saved, select two items, tap "Add to Ruler". Switch to Ruler. Assert two
  points appear with distance and bearing shown between them.
- **T8.5** Tap "Clear All". Assert the ruler list is empty.
- **T8.6** (Desktop) Open GPS panel via accordion. Assert it expands inline.
- **T8.7** (Mobile) Open GPS panel via toolbox modal. Assert tool view replaces grid.

---

### Phase 9 — Cleanup & Hardening

**Goal:** Remove all legacy `.js` files, eliminate all `any` types, pass lint and
typecheck cleanly, confirm the PWA works offline, and do a final accessibility pass.

**Tasks:**

1. Delete all `src/**/*.js` source files. Only `.ts` / `.tsx` remain.
2. Run `npx tsc --noEmit`. Fix any remaining `any` or implicit-type errors.
3. Run `npx eslint src`. Fix all warnings.
4. Audit Tailwind: replace remaining `style={{}}` with Tailwind utilities where
   appropriate; remove unused rules from `theme.css`.
5. Verify MapLibre CSS import and third-party style overrides are correctly scoped.
6. Confirm `vite-plugin-pwa` generates a valid service worker. Test offline mode.
7. Verify share code round-trips correctly end-to-end (encode → decode → data integrity).
8. Accessibility: focus traps on all modals/sheets; keyboard navigation; `aria-label` on
   icon-only buttons; `Escape` closes all overlays.

**Chrome MCP tests:**

- **T9.1** Run `npx tsc --noEmit`. Assert zero errors.
- **T9.2** Run `npm run build`. Assert zero errors and zero warnings.
- **T9.3** Serve `dist/` with `npx serve dist`. Navigate to `http://localhost:3000`.
  Assert full app loads.
- **T9.4** Set Network to Offline in DevTools. Reload. Assert the app loads from the
  service worker cache (no network error page).
- **T9.5** Assert `/manifest.json` is served and contains correct `name`, `icons`,
  `start_url`.
- **T9.6** Create 3 pins. Generate a share code. Open a new private window. Import the
  code. Assert the 3 pins appear.
- **T9.7** Assert no console errors on initial load, after navigating all tabs, and after
  creating a pin and a track.
- **T9.8** Tab through the pin editor form. Assert focus stays within the modal (focus
  trap) and moves in logical order.
- **T9.9** Press Escape on an open modal. Assert it closes.
- **T9.10** (Mobile 375×812) Full smoke test: launch → onboarding → create pin → view
  Saved → edit pin → open Map → add track → view track info.

---

### Phase Summary

| Phase | Focus            | Key deliverable                                     |
| ----- | ---------------- | --------------------------------------------------- |
| 1     | Tooling          | Vite + SolidJS + TS + Tailwind v4 scaffold          |
| 2     | Logic layer      | All pure TS modules, types, Dexie typed tables      |
| 3     | Global state     | PrefsContext, UIContext, theme switching            |
| 4     | Nav shell        | AppShell, BottomNav, ToolboxModal, Onboarding       |
| 5     | Saved screen     | Full list, sort, search, multi-select, share/import |
| 6     | Editors + Modals | PinEditor, TrackEditor, PinInfo, TrackInfo          |
| 7     | Map              | MapView, markers, tracks, plot state machine        |
| 8     | Tools panels     | GPS/Compass, Ruler                                  |
| 9     | Cleanup          | Zero TS errors, zero legacy JS, PWA offline, a11y   |

Each phase is independently verifiable via its Chrome MCP tests, and the app remains
fully functional at the end of every phase.
