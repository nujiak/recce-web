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

## Pending Implementation: UI Improvements (2026-03-03)

The following improvements are queued for implementation. Execute in phase order.

### Phase 1: Desktop Accordion Resize (Priority: High)

**Goal:** Make desktop Tools accordion more usable by resizing and repositioning.

**Current Behaviour:**

- Accordion expands below the tool buttons in the Saved panel
- Fixed max-height of 300px
- No resizing capability

**Target Behaviour:**

- Accordion opens **above** the tool buttons (like a bottom navigation bar)
- Tool buttons remain pinned at bottom; clicking toggles panel open/close
- Initial height: 50% of the Saved panel
- Draggable resize handle at top of accordion allows dynamic height adjustment
- Accordion state persists during session (not across reloads)

**Files to Modify:**

| File             | Changes                                                                                                                                  |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `src/index.html` | Move `#desktop-tools-accordion` above `#desktop-tools-bar`                                                                               |
| `src/style.css`  | Update `.desktop-tools-accordion` positioning (above bar), add resize handle styles, remove `max-height`, use flexbox for height control |
| `src/ui/nav.js`  | Add resize handle drag logic (pointer events), track accordion height in module state                                                    |

**Implementation Notes:**

1. **HTML Structure Change** (`src/index.html`):
   - Move `#desktop-tools-accordion` to appear before `#desktop-tools-bar` in DOM
   - Add resize handle element as first child of accordion:
     ```html
     <div id="desktop-tools-accordion" class="desktop-tools-accordion">
       <div class="accordion-resize-handle" aria-label="Resize panel"></div>
     </div>
     ```

2. **CSS Changes** (`src/style.css`):
   - Update `.desktop-tools-accordion`:
     ```css
     .desktop-tools-accordion {
       display: none;
       flex: 0 0 auto;
       overflow-y: auto;
       border-top: 1px solid var(--color-border-subtle);
       background: var(--color-bg-secondary);
       order: 1; /* Above the buttons */
     }
     .desktop-tools-accordion.open {
       display: block;
     }
     ```
   - Add resize handle styles:
     ```css
     .accordion-resize-handle {
       height: 4px;
       background: var(--color-border-subtle);
       cursor: ns-resize;
       width: 100%;
       flex-shrink: 0;
     }
     .accordion-resize-handle:hover {
       background: var(--color-accent);
     }
     ```
   - Ensure `#saved-surface` uses flexbox column direction

3. **JS Logic** (`src/ui/nav.js`):
   - Add module state: `let accordionHeight = null;`
   - In `toggleDesktopTool()`:
     - On open: set initial height to 50% of parent if not set
     - Apply height as inline style
   - Add resize handle setup:

     ```js
     function setupAccordionResize() {
       const handle = document.querySelector('.accordion-resize-handle');
       const accordion = document.getElementById('desktop-tools-accordion');
       if (!handle || !accordion) return;

       let isDragging = false;
       let startY = 0;
       let startHeight = 0;

       handle.addEventListener('pointerdown', (e) => {
         isDragging = true;
         startY = e.clientY;
         startHeight = accordion.offsetHeight;
         handle.setPointerCapture(e.pointerId);
       });

       handle.addEventListener('pointermove', (e) => {
         if (!isDragging) return;
         const delta = startY - e.clientY; // Negative = drag down = smaller
         const newHeight = Math.max(
           100,
           Math.min(startHeight + delta, accordion.parentElement.offsetHeight * 0.8)
         );
         accordion.style.height = `${newHeight}px`;
         accordionHeight = newHeight;
       });

       handle.addEventListener('pointerup', (e) => {
         isDragging = false;
         handle.releasePointerCapture(e.pointerId);
       });
     }
     ```

**Testing:**

- Verify accordion opens above buttons on desktop (>=768px)
- Verify drag handle resizes accordion smoothly
- Verify mobile UI unaffected (accordion hidden, modal still works)
- Verify clamping: cannot resize below 100px or above 80% of parent

---

### Phase 2: Compass Visual Improvements (Priority: High)

**Goal:** Improve compass readability and fix needle animation.

#### 2a. Increase Needle Size

**Current:** Needle is 24×72px fixed size (defined in `.compass-needle` CSS).
**Target:** Needle should be 80% of compass dial diameter, maintaining aspect ratio.

**Files to Modify:**

| File            | Changes                                                 |
| --------------- | ------------------------------------------------------- |
| `src/style.css` | Update `.compass-needle` dimensions to percentage-based |

**Implementation:**

Update CSS in `src/style.css` (around line 1858):

```css
.compass-needle {
  position: relative;
  width: 80%;
  aspect-ratio: 1 / 3;
  transition: transform 0.15s ease-out;
}

.compass-needle-north {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 33.33%;
  height: 50%;
  background: var(--color-danger);
  clip-path: polygon(50% 0%, 100% 100%, 0% 100%);
}

.compass-needle-north-label {
  position: absolute;
  top: 25%;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.7rem;
  font-weight: 700;
  color: #fff;
  z-index: 1;
  pointer-events: none;
}

.compass-needle-south {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 33.33%;
  height: 50%;
  background: var(--color-text-muted);
  clip-path: polygon(0% 0%, 100% 0%, 50% 100%);
}
```

#### 2b. Add Compass Gradations

**Current:** Plain dial with no markings.
**Target:**

- Cardinal labels: N, E, S, W (bold, prominent)
- Intermediate labels: NE, SE, SW, NW (smaller)
- Minor tick marks every 15° (24 marks total, including cardinal/intermediate positions)
- Appearance identical for degrees and NATO mils (angle unit only affects azimuth display number)

**Files to Modify:**

| File            | Changes                                                   |
| --------------- | --------------------------------------------------------- |
| `src/ui/gps.js` | Add gradation elements in compass HTML template           |
| `src/style.css` | Style gradations (positioned absolutely around dial edge) |

**Implementation:**

1. **HTML Template Update** (`src/ui/gps.js`, inside the compass HTML):

Generate gradations programmatically in the template string:

```js
function generateCompassGradations() {
  const cardinal = ['N', 'E', 'S', 'W'];
  const intermediate = ['NE', 'SE', 'SW', 'NW'];
  let html = '';

  // Cardinal directions (0, 90, 180, 270)
  cardinal.forEach((label, i) => {
    const deg = i * 90;
    html += `<div class="compass-mark compass-mark--cardinal" style="--deg: ${deg}deg">${label}</div>`;
  });

  // Intermediate directions (45, 135, 225, 315)
  intermediate.forEach((label, i) => {
    const deg = 45 + i * 90;
    html += `<div class="compass-mark compass-mark--intermediate" style="--deg: ${deg}deg">${label}</div>`;
  });

  // Minor tick marks every 15° (skip 0, 45, 90, etc. which already have labels)
  for (let deg = 0; deg < 360; deg += 15) {
    if (deg % 45 === 0) continue; // Skip positions with labels
    html += `<div class="compass-mark compass-mark--tick" style="--deg: ${deg}deg"></div>`;
  }

  return html;
}
```

Update the compass-dial HTML:

```html
<div class="compass-dial">
  <div class="compass-gradations">${generateCompassGradations()}</div>
  <div id="compass-needle" class="compass-needle">
    <!-- needle content -->
  </div>
</div>
```

2. **CSS Styles** (`src/style.css`):

```css
.compass-dial {
  width: 100%;
  max-width: 200px;
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--color-bg-tertiary);
  border: 2px solid var(--color-border);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.compass-gradations {
  position: absolute;
  inset: 0;
}

.compass-mark {
  position: absolute;
  top: 4px;
  left: 50%;
  transform: rotate(var(--deg)) translateY(0);
  transform-origin: center calc(50% - 4px);
  font-size: 0.65rem;
  font-weight: 600;
  text-align: center;
  width: 20px;
  margin-left: -10px;
}

.compass-mark--cardinal {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text);
}

.compass-mark--intermediate {
  font-size: 0.6rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.compass-mark--tick {
  width: 2px;
  height: 6px;
  background: var(--color-border);
  margin-left: -1px;
  border-radius: 1px;
}
```

#### 2c. Fix Needle Shortest-Path Animation

**Current Behaviour:**

- `updateNeedleRotation()` calculates delta but then snaps back to normalized range after 150ms
- Crossing 0° causes needle to spin the long way (e.g., 359° → 2° goes backward through ~357°)

**Target Behaviour:**

- Needle always takes shortest path
- Accumulate rotation unboundedly (359° → 362°, 5° → -5°)
- Azimuth display remains 0-360

**Files to Modify:**

| File            | Changes                                                                            |
| --------------- | ---------------------------------------------------------------------------------- |
| `src/ui/gps.js` | Update `updateNeedleRotation()` to accumulate unbounded rotation, remove snap-back |

**Implementation:**

Replace `updateNeedleRotation()` in `src/ui/gps.js`:

```js
function updateNeedleRotation(targetAzimuth) {
  // targetAzimuth is 0-360 from compass
  // currentNeedleRotation is unbounded (can be any value)

  // Calculate the difference
  let delta = targetAzimuth - (currentNeedleRotation % 360);

  // Normalize to shortest path (-180 to 180)
  // Using: ((delta + 180) % 360) - 180, but handle negative values
  while (delta > 180) delta -= 360;
  while (delta < -180) delta += 360;

  // Accumulate rotation (unbounded)
  currentNeedleRotation += delta;

  // Apply rotation (negative because needle rotates opposite to heading)
  if (compassNeedle) {
    compassNeedle.style.transform = `rotate(${-currentNeedleRotation}deg)`;
  }
}
```

Key changes from current implementation:

- **Remove** the setTimeout that snaps back to normalized range
- **Keep** `currentNeedleRotation` as unbounded float
- Azimuth display in `updateCompassDisplay()` already normalizes to 0-360 separately

---

### Phase 3: GPS Panel Layout (Priority: Medium)

**Goal:** Improve location panel readability and fix alignment issues.

#### 3a. Rearrange Location Card

**Current Layout (label-value grid):**

```
Coordinates: xxxxxx xxxxxx
Accuracy:    xxxx
Altitude:    xxxx
```

**Target Layout:**

```
            Coordinate
          xxxxxx xxxxxx
  ------------------------------
    Altitude         Accuracy
      xxxx             xxxx
```

- Coordinate centered on its own row
- Tap-to-copy (no button)
- Horizontal divider
- Altitude and Accuracy side-by-side below

**Files to Modify:**

| File            | Changes                            |
| --------------- | ---------------------------------- |
| `src/ui/gps.js` | Update location card HTML template |
| `src/style.css` | Add new layout classes             |

**Implementation:**

1. **HTML Template** (`src/ui/gps.js`, inside gpsPanel.innerHTML):

Replace the location card section:

```html
<!-- Location Card -->
<div class="gps-card">
  <div class="gps-card-header">
    <span class="gps-card-title">Location</span>
    <span id="gps-status" class="gps-status">Inactive</span>
  </div>
  <div class="gps-location-layout">
    <div class="gps-coord-row">
      <span id="gps-coord-value" class="gps-coord-value">--</span>
    </div>
    <div class="gps-divider"></div>
    <div class="gps-meta-row">
      <div class="gps-meta-item">
        <span class="gps-meta-label">Altitude</span>
        <span id="gps-altitude" class="gps-meta-value">--</span>
      </div>
      <div class="gps-meta-item">
        <span class="gps-meta-label">Accuracy</span>
        <span id="gps-accuracy" class="gps-meta-value">--</span>
      </div>
    </div>
  </div>
</div>
```

2. **CSS Styles** (`src/style.css`):

```css
.gps-location-layout {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.gps-coord-row {
  text-align: center;
  padding: var(--spacing-sm) 0;
}

.gps-coord-value {
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  word-break: break-all;
}

.gps-coord-value:active {
  opacity: 0.6;
}

.gps-divider {
  height: 1px;
  background: var(--color-border-subtle);
  margin: 0 var(--spacing-sm);
}

.gps-meta-row {
  display: flex;
  justify-content: space-around;
  gap: var(--spacing-md);
}

.gps-meta-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
}

.gps-meta-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-muted);
}

.gps-meta-value {
  font-size: 0.9rem;
  font-weight: 500;
}
```

3. **Update DOM References** (`src/ui/gps.js`):
   - Keep `coordValue`, `accuracyValue`, `altitudeValue` references
   - Move tap-to-copy handler to new `gps-coord-value` element

#### 3b. Fix Mobile Azimuth +90° Offset

**Current Behaviour:** Mobile compass azimuth is off by 90° in all orientations.
**Target Behaviour:** Add +90° offset to azimuth on mobile (all screen orientations).

**Files to Modify:**

| File            | Changes                                                          |
| --------------- | ---------------------------------------------------------------- |
| `src/ui/gps.js` | Add +90° offset after orientation transformation, before display |

**Implementation:**

In `updateCompassDisplay()` function, after the orientation transformation:

```js
function updateCompassDisplay() {
  const prefs = getPrefs();

  if (azimuth !== null && hasOrientation) {
    // Transform values based on screen orientation
    let transformed = transformOrientationValues(azimuth, pitch, roll);

    // Apply +90° offset on mobile devices
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      transformed.azimuth += 90;
    }

    // Normalize azimuth to 0-360
    let displayAzimuth = ((transformed.azimuth % 360) + 360) % 360;

    // Update needle with smooth rotation
    updateNeedleRotation(displayAzimuth);

    // Update azimuth display (already uses formatBearing which handles degrees/mils)
    if (azimuthValue) {
      azimuthValue.textContent = formatBearing(displayAzimuth, prefs.angleUnit);
    }
    // ... rest of function
  }
}
```

**Important Notes:**

- This offset affects **only** the compass azimuth display and needle rotation
- Does **NOT** affect the GPS overlay bearing (distance/bearing to crosshair in `map.js`)
- The offset applies to all screen orientations on mobile (portrait and landscape)

#### 3c. Fix Target Panel Alignment

**Current Behaviour:**

- Title "Target" aligned left
- Coordinate text aligned right
- Buttons inline with coordinate

**Target Behaviour:**

- Title right-aligned (matching coordinate)
- Buttons in separate container to the right
- Visual separation between coordinate section and buttons

**Files to Modify:**

| File             | Changes                         |
| ---------------- | ------------------------------- |
| `src/index.html` | Restructure `#target-coord-box` |
| `src/style.css`  | Update `.coord-box` layout      |

**Implementation:**

1. **HTML Structure** (`src/index.html`, around line 46):

```html
<div id="coord-container">
  <div id="target-coord-box" class="coord-box">
    <div class="coord-info">
      <h2>
        <span class="material-symbols-outlined">arrows_input</span>
        <span class="icon-title">Target</span>
      </h2>
      <p id="target-coord-display" class="coords" role="status" aria-live="polite"></p>
    </div>
    <div class="coord-actions">
      <button id="goto-btn" class="icon-btn" aria-label="Go to coordinates" title="Go To">
        <span class="material-symbols-outlined">near_me</span>
      </button>
      <button id="add-button" class="icon-btn" aria-label="Add pin">
        <span class="material-symbols-outlined">add_location_alt</span>
      </button>
      <button id="start-track-btn" class="icon-btn" aria-label="Start track plotting">
        <span class="material-symbols-outlined">show_chart</span>
      </button>
    </div>
  </div>
</div>
```

2. **CSS Styles** (`src/style.css`, update `.coord-box` around line 147):

```css
.coord-box {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-md);
}

.coord-info {
  flex: 1;
  text-align: right;
  min-width: 0;
}

.coord-info h2 {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.coords {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin: 2px 0 0 0;
}

.coord-actions {
  display: flex;
  gap: var(--spacing-xs);
  padding-left: var(--spacing-sm);
  border-left: 1px solid var(--color-border-subtle);
}
```

---

## Execution Order

| Phase | Description                 | Dependencies |
| ----- | --------------------------- | ------------ |
| 1     | Desktop accordion resize    | None         |
| 2     | Compass visual improvements | None         |
| 3     | GPS panel layout            | None         |

All phases are independent and can be executed in parallel if needed. Sequential execution preferred for cleaner commit history.

---

## Commit Strategy

Create branch: `feature/ui-improvements`

Atomic commits (one per logical change):

1. `feat(nav): reposition desktop accordion above toolbar with resize handle`
2. `feat(gps): enlarge compass needle to 80% of dial`
3. `feat(gps): add cardinal and intermediate gradations to compass dial`
4. `fix(gps): use shortest-path animation for compass needle`
5. `refactor(gps): rearrange location card with centered coordinate`
6. `fix(gps): add +90° azimuth offset on mobile devices`
7. `style(map): right-align target panel and separate action buttons`

---

## Testing Checklist

After all phases complete, verify:

- [ ] Desktop accordion opens above buttons, resizes with drag handle
- [ ] Mobile tools modal still works (accordion hidden on mobile)
- [ ] Compass needle is larger (80% of dial)
- [ ] Compass has N/E/S/W labels and intermediate marks
- [ ] Compass needle takes shortest path when crossing 0°
- [ ] Location card shows centered coordinate with Altitude/Accuracy below
- [ ] Mobile azimuth displays correctly in portrait and landscape
- [ ] Target panel title and coordinate are right-aligned
- [ ] Target panel buttons are visually separated
- [ ] No regressions on mobile or desktop layouts
