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

| Element                             | Behaviour                                                                                                                                           |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Full-screen MapLibre map            | Default view on launch                                                                                                                              |
| Crosshair                           | Fixed centre reticle; coordinate display updates on every `move` event; uses `mix-blend-mode: difference` to self-invert against any map background |
| Coordinate display                  | Shows crosshair position in the active coordinate system; tap/click to copy to clipboard                                                            |
| Live measurement overlay            | Distance and bearing from current GPS location to crosshair (shown when GPS is active)                                                              |
| Compass button                      | Shows current bearing; click resets map rotation to north                                                                                           |
| Location button                     | Centres map on current GPS position; long-press also resets rotation                                                                                |
| Add Pin button (`add_location_alt`) | Opens pin editor pre-filled with crosshair coordinates; lives in `.coord-actions` toolbar                                                           |
| Go To button (`near_me`)            | Opens coordinate input → flies map to entered position; lives in `.coord-actions` toolbar                                                           |
| Start Track button                  | Starts track plotting mode; lives in `.coord-actions` toolbar; disabled while plotting is active                                                    |

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

## Pending Implementation Plan

The following changes have been designed and are ready for implementation. Each change is
broken into numbered phases with explicit dependencies. Implement one change at a time,
completing all its phases before moving to the next change. Each phase should leave the
codebase in a working state and be committed atomically.

---

### Change 1 — FAB Refactor & Navigation Restructure

**Goal:** Remove cluttered FABs; move controls into contextual toolbars and a dedicated
Tools tab/accordion. This cleans up the map surface and aligns with mobile navigation
conventions (bottom tab bar for top-level destinations).

#### Key facts (gathered from codebase)

- `#toolbox-fab` (`.fab`, `explore` icon) — opens `#toolbox-modal`; wired in `nav.js → setupToolbox()`
- `#start-track-btn` (`.fab.fab-secondary`, `show_chart` icon) — outside `#app`; toggled via `display` in `map.js → updateStartTrackButton()`
- `#add-button` (`.icon-btn`, `add_location_alt`) and `#goto-btn` (`.icon-btn`, `straighten`) — already inside `.coord-actions` in `#target-coord-box`
- Bottom nav has two tabs: `data-tab="map"` and `data-tab="saved"`, wired in `nav.js → setupTabs() → switchTab()`
- `#toolbox-modal` contains three `<section class="toolbox-panel">`: `#gps-panel`, `#ruler-panel`, `#settings-panel`
- Desktop breakpoint: `@media (min-width: 768px)`

#### Phase 1 — Go To icon

**Files:** `src/index.html`

- Replace the icon text inside `#goto-btn` from `straighten` to `near_me`.

#### Phase 2 — Move Start Track button into `.coord-actions`

**Files:** `src/index.html`, `src/map/map.js`, `src/style.css`

- Remove `#start-track-btn` from its current location (outside `#app`, after all modals).
- Add `<button id="start-track-btn" class="icon-btn">` with icon `show_chart` inside `.coord-actions`, after `#add-button`.
- In `map.js → updateStartTrackButton()`: replace `display` toggling with `disabled` attribute toggling.
- Remove `.fab-secondary` CSS if it becomes unused.

#### Phase 3 — Remove Toolbox FAB; add Tools tab to bottom nav

**Files:** `src/index.html`, `src/ui/nav.js`, `src/style.css`

- Remove `#toolbox-fab` element from HTML and all associated CSS.
- Add a third `<button class="nav-tab" data-tab="tools">` to `#bottom-nav` with icon `construction` and label "Tools".
- In `nav.js → switchTab()`: when `tab === 'tools'`, open the toolbox modal instead of swapping surfaces (Map/Saved surface state is preserved underneath).
- The Tools tab does not correspond to a surface div — it is purely a modal trigger.

#### Phase 4 — Toolbox modal: two-view pattern (grid → tool)

**Files:** `src/index.html`, `src/ui/nav.js`, `src/style.css`

- Restructure `#toolbox-modal` into two views within the same modal:
  1. **Grid view** (default): three large tappable cards — GPS/Compass (`explore`), Ruler (`straighten`), Settings (`settings`) — each with icon + label.
  2. **Tool view**: selected panel fills the modal body; a `←` back button in the header returns to grid view.
- The existing `#toolbox-close` button remains as the top-level dismiss (closes modal entirely from either view).
- Add a new back button (e.g. `#toolbox-back`, `arrow_back` icon) visible only in tool view.
- In `nav.js`, track `activeToolPanel: string | null` ('gps' | 'ruler' | 'settings' | null).
- `showToolGrid()`: hides panels, shows grid, hides back button.
- `showToolPanel(name)`: hides grid, shows the named `<section>`, shows back button, updates header title.
- The three `.toolbox-panel` sections remain in the DOM; visibility controlled by `display` or a `.active` class.
- On mobile only (via CSS): the grid is shown; on desktop the modal is never opened for tools (accordion used instead — Phase 5).

#### Phase 5 — Desktop: Tools accordion below Saved panel

**Files:** `src/index.html`, `src/ui/nav.js`, `src/style.css`

- Add a `<div id="desktop-tools-bar">` containing three icon buttons (`#dt-gps-btn`, `#dt-ruler-btn`, `#dt-settings-btn`) at the bottom of the Saved panel column in the desktop layout.
- Add a `<div id="desktop-tools-accordion">` below the icon bar; initially empty / hidden.
- Visible only at `@media (min-width: 768px)`.
- In `nav.js`, track `activeDesktopTool: string | null`.
- Each icon button click:
  - If `activeDesktopTool === name`: collapse (set to `null`, hide accordion).
  - Otherwise: set `activeDesktopTool = name`, render the correct panel into `#desktop-tools-accordion`, expand.
- The panel content rendered into the accordion is the same logical content as the toolbox panels (`#gps-panel`, `#ruler-panel`, `#settings-panel`); either move the sections into the accordion or clone/reference the same JS-rendered content.
- On desktop, clicking the Tools tab in the bottom nav (if visible) should be a no-op or hidden — the bottom nav itself is hidden at `@media (min-width: 768px)`.

**Dependency order:**

```
Phase 1 → independent
Phase 2 → independent
Phase 3 → must precede Phase 4
Phase 4 → must precede Phase 5
```

---

### Change 2 — Track Plotting Preview Improvements

**Goal:** Make the in-progress track visible on any map background by honouring the
track's own colour, and add a live ghost line from the last node to the crosshair so
the user can preview the next segment before committing it.

#### Key facts (gathered from codebase)

- `TEMP_TRACK_SOURCE = 'temp-track-source'`, `TEMP_TRACK_LAYER = 'temp-track-layer'` in `tracks.js`
- Current layer paint: `'line-color': '#ffffff'` (hardcoded white — ignores the `color` property already set on the feature)
- `updateTempTrack(nodes, isCyclical, color)` already sets `properties.color` via `colorMap` lookup — the layer just doesn't use it
- `colorMap` in `tracks.js` maps color names to hex values
- `addNode()` / `addNodeWithName()` / `undoNode()` in `map.js` all call `updateTempTrack`
- No `move` listener exists in `setupTrackPlotting()` — the ghost line does not exist yet
- Map center accessed via `map.getCenter()` — no cached variable

#### Phase 1 — Fix temp track colour

**Files:** `src/map/tracks.js`

- Change `TEMP_TRACK_LAYER` paint `'line-color'` from `'#ffffff'` to `['get', 'color']`.
- Increase `line-width` from `2` to `3`.
- Change `line-dasharray` from `[2, 2]` to `[4, 3]` for better visibility.

#### Phase 2 — Add ghost preview source and layer

**Files:** `src/map/tracks.js`

- Add constants `PREVIEW_SOURCE = 'preview-track-source'` and `PREVIEW_LAYER = 'preview-track-layer'`.
- In `init()`, register:
  - A GeoJSON source `PREVIEW_SOURCE` (empty `FeatureCollection`).
  - A line layer `PREVIEW_LAYER` using `['get', 'color']` for colour, `line-opacity: 0.4`, `line-width: 3`, same dasharray as the temp layer.
- Export two functions:
  - `updatePreviewLine(lastNode, cursorLatLng, color)` — sets `PREVIEW_SOURCE` to a 2-point `LineString` from `{ lat: lastNode.lat, lng: lastNode.lng }` to `{ lat: cursorLatLng.lat, lng: cursorLatLng.lng }`, with `properties.color` resolved via `colorMap`.
  - `clearPreviewLine()` — sets `PREVIEW_SOURCE` to an empty `FeatureCollection`.

#### Phase 3 — Wire ghost line to map move events

**Files:** `src/map/map.js`

- In `setupTrackPlotting()`, define a named handler:
  ```js
  function updatePreview() {
    if (!isPlottingMode || plotNodes.length === 0) return;
    tracksModule.updatePreviewLine(plotNodes[plotNodes.length - 1], map.getCenter(), plotColor);
  }
  ```
- In `startPlotting()`: call `map.on('move', updatePreview)`.
- In `exitPlottingMode()`: call `map.off('move', updatePreview)` and `tracksModule.clearPreviewLine()`.
- In `undoNode()`: if `plotNodes.length === 0` after pop, call `tracksModule.clearPreviewLine()`.

**Dependency order:**

```
Phase 1 → independent
Phase 2 → independent, must precede Phase 3
Phase 3 → depends on Phase 2
```

---

### Change 3 — Saved List Long-Press Multi-Select

**Goal:** Make multi-select feel native by replacing the toolbar button entry point with
a long-press gesture (standard on Android/iOS list interactions). Avoid DB round-trips
on every selection toggle to keep interactions instant.

#### Key facts (gathered from codebase)

- Multi-select state: `isMultiSelectMode: boolean`, `selectedIds: Set<string>` (keys like `"pin:42"`)
- Entry: `#saved-multiselect-btn` click → `toggleMultiSelect()` — **to be removed**
- Exit: `exitMultiSelect()` called by cancel button, post-delete, post-share, post-ruler
- Cards rendered via full `innerHTML` replacement in `render()`, which re-fetches from DB
- Card click handler re-calls `render()` on every toggle — causes DB round-trip per tap
- Checkboxes are visual-only; no independent event listeners
- `showToast` already imported in `saved.js`

#### Phase 1 — In-memory item cache

**Files:** `src/ui/saved.js`

- Add module-level `let cachedItems = []`.
- `render(forceRefetch = false)`: only re-fetches from DB when `forceRefetch === true` or `cachedItems` is empty. All other calls (enter/exit multi-select, selection toggles) rebuild HTML from `cachedItems`.
- Call `render(true)` in: `init()`, after delete, after a save/import that mutates data, on sort/search change.
- Call `render()` (no refetch) in: `exitMultiSelect()`, `enterMultiSelect()`.

#### Phase 2 — Remove multi-select toolbar button

**Files:** `src/index.html`, `src/ui/saved.js`, `src/style.css`

- Remove `#saved-multiselect-btn` from HTML and its `addEventListener` in `saved.js`.
- Remove `toggleMultiSelect()`.
- Add a static hint element in the saved screen header: `<p class="saved-hint">Hold an item to select</p>`, visible only when not in multi-select mode.
- Keep `exitMultiSelect()` unchanged.

#### Phase 3 — Long-press handler on cards

**Files:** `src/ui/saved.js`

- After each render, attach pointer event listeners to each card alongside the existing `click` listener.
- Long-press logic (300 ms threshold):
  - `pointerdown`: record `pointerId`, start position `(x, y)`, start a 300 ms `setTimeout`.
  - `pointermove`: if displacement > 8 px from start, cancel the timer (user is scrolling).
  - `pointerup` / `pointercancel`: cancel the timer.
  - On timer fire (300 ms elapsed without cancel):
    - Set `isMultiSelectMode = true`.
    - Add the card's key (`"pin:id"` or `"track:id"`) to `selectedIds`.
    - Call `render()` (reads from `cachedItems`, no DB fetch).
    - Call `navigator.vibrate?.(30)` for haptic feedback where supported.
  - Set a `longPressHandled` flag on `pointerup` if the long press fired, so the subsequent `click` event is ignored.

#### Phase 4 — DOM-only selection toggle

**Files:** `src/ui/saved.js`

- In the card `click` handler, when `isMultiSelectMode === true`:
  - Toggle the key in `selectedIds`.
  - Directly toggle `.selected` class on the card element (`card.classList.toggle('selected')`).
  - Directly set `card.querySelector('input[type="checkbox"]').checked`.
  - If `selectedIds.size === 0`: call `exitMultiSelect()` (re-renders from `cachedItems`).
  - Do **not** call `render()`.

**Dependency order:**

```
Phase 1 → must land first
Phase 2, 3 → depend on Phase 1; independent of each other
Phase 4 → depends on Phase 1 and Phase 3
```

---

### Change 4 — Crosshair Visibility via Blend Mode

**Goal:** Make the crosshair self-invert against any map background so it remains
legible on both light and dark tiles without theme-dependent colour logic.

#### Key facts (gathered from codebase)

- `#crosshair` in `src/index.html:36` — single `<div>`, no children, no JS interaction
- Arms rendered via `::before` (vertical) and `::after` (horizontal) pseudo-elements
- Current colour: `var(--color-text)` — theme-dependent, invisible on matching backgrounds
- `pointer-events: none` on the host element; `z-index: 1000`
- No JS touches the crosshair

#### Phase 1 — Apply `mix-blend-mode: difference`

**Files:** `src/style.css`

- On `#crosshair::before, #crosshair::after`:
  - Change `background` from `var(--color-text)` to `#ffffff`.
  - Add `mix-blend-mode: difference`.
- Result: crosshair appears dark on light backgrounds, light on dark backgrounds — universally legible.

#### Phase 2 — Fallback (if WebGL canvas clips blend mode)

**Files:** `src/style.css`

- If testing reveals `mix-blend-mode` is clipped by the MapLibre WebGL canvas compositing context:
  - Keep arms white.
  - Add `filter: drop-shadow(0 0 1.5px rgba(0,0,0,0.9)) drop-shadow(0 0 1.5px rgba(0,0,0,0.9))` on `#crosshair`.
  - Remove `mix-blend-mode` from the arms.
- This doubles the dark outline weight for reliable contrast without blend modes.

**Dependency order:**

```
Phase 1 → try first; Phase 2 replaces it only if blend mode fails during testing
```

---

### Change 5 — Tap-to-Copy Coordinates

**Goal:** Any rendered coordinate string (outside of editable inputs and list cards)
should be tappable to copy to clipboard, with a toast confirmation. This is consistent
with how mapping tools like Google Maps handle coordinate display.

#### Key facts (gathered from codebase)

- `showToast(message, type)` exported from `src/utils/toast.js`; already imported in `gps.js`, `saved.js`
- Coordinate display locations in scope:
  1. `#target-coord-display` — crosshair HUD (updated on every map `move`; `map.js`)
  2. `#gps-coord-value` — GPS panel (programmatically injected; `gps.js`); has existing copy button `#gps-copy-btn` that calls `handleCopyCoord()`
  3. `#pin-info-coord-list` rows (`.pin-info-coord-row` / `.pin-info-coord-value`) — all-systems list in Pin Info modal (`pin-info.js`)
- **Excluded** (by design): `#pin-editor-coord` (editable input), `.pin-card-coord` (part of card tap target)

#### Phase 1 — Crosshair HUD (`#target-coord-display`)

**Files:** `src/map/map.js`, `src/style.css`

- In `map.js`, after querying `#target-coord-display`, attach a `click` listener:
  ```js
  el.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(el.textContent.trim());
      showToast('Coordinates copied', 'success');
    } catch {
      showToast('Failed to copy', 'error');
    }
  });
  ```
- Import `showToast` from `../utils/toast.js`.
- In `style.css`, add `cursor: pointer` to `#target-coord-display` and an `:active` opacity dip (`opacity: 0.6`) for tap feedback.

#### Phase 2 — GPS panel coordinate (`#gps-coord-value`)

**Files:** `src/ui/gps.js`

- In the programmatically-built panel HTML (inside `init()`), add `class="coord-copyable"` to the `#gps-coord-value` element (or attach a listener directly after injection).
- After injecting the panel HTML, attach a `click` listener on `#gps-coord-value` that calls the existing `handleCopyCoord()`.
- Add `cursor: pointer` to `#gps-coord-value` inline style or via the CSS class.

#### Phase 3 — Pin Info all-systems rows

**Files:** `src/ui/pin-info.js`, `src/style.css`

- In `pin-info.js`, after the coord list rows are rendered into `#pin-info-coord-list`, query all `.pin-info-coord-row` elements and attach a `click` listener to each:
  ```js
  row.addEventListener('click', async () => {
    const value = row.querySelector('.pin-info-coord-value')?.textContent.trim();
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      showToast('Coordinates copied', 'success');
    } catch {
      showToast('Failed to copy', 'error');
    }
  });
  ```
- Import `showToast` from `../utils/toast.js`.
- In `style.css`, add `cursor: pointer` and `:hover` background tint + `:active` opacity dip on `.pin-info-coord-row`.

**Dependency order:**

```
All three phases are fully independent.
```

---

### Change 6 — Settings Changes Refresh All Live Values

**Goal:** Any preference change (coordinate system, angle unit, length unit, theme)
should immediately update every live-rendered value in the app. Currently `angleUnit`
and `lengthUnit` changes are silent — no `prefsChanged` event is dispatched, so the
compass azimuth, GPS overlay, and ruler show stale values until page reload.

#### Key facts (gathered from codebase)

- `settings.js` dispatches `prefsChanged` only for `coordinateSystem` (line 108–115); `angleUnit`, `lengthUnit`, and `theme` call `savePrefs()` but dispatch nothing
- `map.js` listens for `prefsChanged` but guards `e.detail.key === 'coordinateSystem'` only → `updateCoordDisplay()`
- `gps.js` listens for `prefsChanged` unconditionally → `updateDisplay()` but **not** `updateCompassDisplay()`
- `ruler.js` listens for `prefsChanged` unconditionally → `render()` ✓ (already correct)
- `saved.js` has **no** `prefsChanged` listener — stale if user changes system while Saved is open
- `map.js → updateGPSOverlay()` reads `lengthUnit` and `angleUnit` at call time but is only triggered by `gpsPositionUpdate` events, not by `prefsChanged`

#### Phase 1 — Dispatch `prefsChanged` for all settings

**Files:** `src/ui/settings.js`

- `angleUnit` change handler: add `window.dispatchEvent(new CustomEvent('prefsChanged', { detail: { key: 'angleUnit', value } }))` after `savePrefs()`.
- `lengthUnit` change handler: same, with `key: 'lengthUnit'`.
- `theme` change handler: same, with `key: 'theme'` (harmless; `applyPrefs()` already acts immediately).

#### Phase 2 — Wire GPS overlay to `prefsChanged`

**Files:** `src/map/map.js`

- In the existing `prefsChanged` listener (currently guards on `coordinateSystem` only):
  - Also call `updateGPSOverlay()` when `key === 'angleUnit'` or `key === 'lengthUnit'`.

#### Phase 3 — Wire compass display to `prefsChanged`

**Files:** `src/ui/gps.js`

- In the existing `prefsChanged` listener (currently calls `updateDisplay()` only):
  - Also call `updateCompassDisplay()` unconditionally — it is a no-op if no compass data has arrived yet.

#### Phase 4 — Wire Saved list to `prefsChanged`

**Files:** `src/ui/saved.js`

- Add `window.addEventListener('prefsChanged', () => render())`.
- After Change 3 Phase 1 is implemented, `render()` reads from `cachedItems` (no DB fetch). If Change 3 is not yet implemented, this will trigger a DB re-fetch — acceptable as a fallback.

**Dependency order:**

```
Phase 1 → must land first (all others depend on the events being dispatched)
Phase 2, 3, 4 → independent of each other; all depend on Phase 1
Phase 4 → zero DB cost only after Change 3 Phase 1 is implemented
```

---

### Change 7 — Desktop Tools Bar Visibility

**Goal:** Fix the desktop tools bar not appearing on desktop viewports due to a CSS
cascade issue.

#### Key facts

- `.desktop-tools-bar` is defined in the `@media (min-width: 768px)` block (lines 789-796) with `display: flex`
- Later in the file (lines 1534-1537), `.desktop-tools-bar` is set to `display: none` OUTSIDE any media query
- Same-specicity rules cascade, so the later `display: none` wins at all viewport sizes

#### Phase 1 — Wrap mobile-hidden rules in media query

**Files:** `src/style.css`

- Find lines 1534-1541 (mobile-hidden rules for desktop tools):

  ```css
  .desktop-tools-bar {
    display: none;
  }

  .desktop-tools-accordion {
    display: none;
  }
  ```

- Wrap them in a mobile-only media query:

  ```css
  @media (max-width: 767px) {
    .desktop-tools-bar {
      display: none;
    }

    .desktop-tools-accordion {
      display: none;
    }
  }
  ```

**Dependency order:**

```
Single phase — no dependencies
```

---

### Change 8 — Crosshair SVG Replacement

**Goal:** Replace the CSS-based crosshair with an SVG matching the Android app's
reticle design for consistent visibility on all map backgrounds.

#### Key facts

- Current crosshair uses `::before` and `::after` pseudo-elements with `mix-blend-mode: difference`
- `mix-blend-mode` doesn't work reliably with MapLibre's WebGL canvas
- Android app uses `ic_map_reticle.xml` vector drawable with white fill and dark gray outline

#### Phase 1 — Create crosshair SVG

**Files:** `public/crosshair.svg` (new file)

- Convert Android vector drawable `ic_map_reticle.xml` to SVG format
- viewBox="0 0 6.35 6.35", width="24", height="24"
- Two paths:
  1. Dark gray outline (`#404040`) — drawn first
  2. White cross fill (`#f8f8f8`) — drawn on top
- Center remains transparent

SVG content:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 6.35 6.35">
  <!-- Dark gray outline -->
  <path d="M3.17578,0C2.91949,0 2.71094,0.2066 2.71094,0.46289L2.71094,2.71094L0.46289,2.71094C0.2066,2.71094 0,2.91949 0,3.17578 0,3.43208 0.2066,3.63867 0.46289,3.63867L2.71094,3.63867v2.24805c0,0.25629 0.20855,0.46484 0.46484,0.46484 0.25629,0 0.46289,-0.20855 0.46289,-0.46484L3.63867,3.63867h2.24805c0.25629,0 0.46484,-0.2066 0.46484,-0.46289 0,-0.25629 -0.20855,-0.46484 -0.46484,-0.46484L3.63867,2.71094L3.63867,0.46289C3.63867,0.2066 3.43208,0 3.17578,0ZM3.17578,0.09961c0.20265,0 0.36328,0.16063 0.36328,0.36328L3.53906,2.81055L5.88672,2.81055C6.08937,2.81055 6.25,2.97313 6.25,3.17578 6.25,3.37843 6.08937,3.53906 5.88672,3.53906L3.53906,3.53906L3.53906,5.88672C3.53906,6.08937 3.37843,6.25 3.17578,6.25 2.97313,6.25 2.81055,6.08937 2.81055,5.88672L2.81055,3.53906L0.46289,3.53906c-0.20265,0 -0.36328,-0.16063 -0.36328,-0.36328 0,-0.20265 0.16063,-0.36523 0.36328,-0.36523L2.81055,2.81055L2.81055,0.46289c0,-0.20265 0.16259,-0.36328 0.36523,-0.36328z" fill="#404040"/>
  <!-- White cross fill -->
  <path d="m3.175,0.04922c-0.22947,0 -0.41412,0.18465 -0.41412,0.41412L2.76088,2.76088L3.58912,2.76088L3.58912,0.46335C3.58912,0.23388 3.40447,0.04922 3.175,0.04922ZM3.58912,2.76088v0.82825h2.29753c0.22947,0 0.41412,-0.18465 0.41412,-0.41412 0,-0.22947 -0.18465,-0.41412 -0.41412,-0.41412zM3.58912,3.58912L2.76088,3.58912v2.29753c0,0.22947 0.18465,0.41412 0.41412,0.41412 0.22947,0 0.41412,-0.18465 0.41412,-0.41412zM2.76088,3.58912L2.76088,2.76088L0.46335,2.76088c-0.22947,0 -0.41412,0.18465 -0.41412,0.41412 0,0.22947 0.18465,0.41412 0.41412,0.41412z" fill="#f8f8f8"/>
</svg>
```

#### Phase 2 — Replace HTML element

**Files:** `src/index.html`

- Line 36: Replace `<div id="crosshair"></div>` with:
  ```html
  <img id="crosshair" src="/crosshair.svg" alt="" />
  ```

#### Phase 3 — Update CSS

**Files:** `src/style.css`

- Remove lines 141-163 (`#crosshair::before` and `#crosshair::after` rules)
- Keep only the positioning on `#crosshair`:
  ```css
  #crosshair {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 24px;
    height: 24px;
    margin-left: -12px;
    margin-top: -12px;
    pointer-events: none;
    z-index: 1000;
  }
  ```

**Dependency order:**

```
Phase 1 → must exist before Phase 2
Phase 2 → must precede Phase 3 (CSS changes)
Phase 3 → independent of Phase 1, depends on Phase 2
```

---

### Change 9 — Import Button Icon

**Goal:** Replace the ambiguous `add` icon on the import button with a clearer `download`
icon.

#### Key facts

- Import button at `src/index.html:85` uses `add` icon
- The `add` icon can be confused with the "add pin" action
- Import functionality imports share codes, better represented by download icon

#### Phase 1 — Update icon

**Files:** `src/index.html`

- Line 85: Change:
  ```html
  <span class="material-symbols-outlined">add</span>
  ```
  to:
  ```html
  <span class="material-symbols-outlined">download</span>
  ```

**Dependency order:**

```
Single phase — no dependencies
```

---

### Change 10 — Sort Button Icon Replacement

**Goal:** Replace the sort button's text label with cycling icons to prevent layout
shifts when cycling through sort modes.

#### Key facts

- Sort button at `src/index.html:76` displays text ("Newest", "Oldest", etc.)
- Text changes cause button resize and layout shift
- `saved.js:cycleSort()` cycles through 5 modes: `newest`, `oldest`, `name-az`, `name-za`, `group`
- `saved.js:updateToolbar()` updates button text

#### Phase 1 — Update HTML

**Files:** `src/index.html`

- Line 76: Replace:
  ```html
  <button id="saved-sort-btn" class="btn-small" aria-label="Sort">Newest</button>
  ```
  with:
  ```html
  <button id="saved-sort-btn" class="btn-small" aria-label="Sort" title="Sort by: Newest">
    <span class="material-symbols-outlined">arrow_downward</span>
  </button>
  ```

#### Phase 2 — Update JavaScript

**Files:** `src/ui/saved.js`

- Update `updateToolbar()` function (lines 325-334) to change icon and title instead of text:

```js
if (sortBtn) {
  const icons = {
    newest: 'arrow_downward',
    oldest: 'arrow_upward',
    'name-az': 'sort_by_alpha',
    'name-za': 'sort_by_alpha',
    group: 'folder',
  };
  const titles = {
    newest: 'Sort by: Newest',
    oldest: 'Sort by: Oldest',
    'name-az': 'Sort by: Name A-Z',
    'name-za': 'Sort by: Name Z-A',
    group: 'Sort by: Group',
  };
  const iconEl = sortBtn.querySelector('.material-symbols-outlined');
  if (iconEl) iconEl.textContent = icons[sortBy];
  sortBtn.title = titles[sortBy];
}
```

**Icon mapping:**
| Mode | Icon | Tooltip |
|------|------|---------|
| `newest` | `arrow_downward` | "Sort by: Newest" |
| `oldest` | `arrow_upward` | "Sort by: Oldest" |
| `name-az` | `sort_by_alpha` | "Sort by: Name A-Z" |
| `name-za` | `sort_by_alpha` | "Sort by: Name Z-A" |
| `group` | `folder` | "Sort by: Group" |

**Dependency order:**

```
Phase 1 → must precede Phase 2 (JS needs icon element to target)
Phase 2 → depends on Phase 1
```

---

### Change 11 — Desktop Saved Panel Width Fix

**Goal:** Fix the Saved panel taking up too much space on desktop by enforcing a fixed
width instead of flex growth.

#### Key facts

- `.surface` class has `flex: 1` (line 87 of style.css)
- On desktop, `#main-content` switches to `flex-direction: row`
- `#saved-surface` has `width: 320px` but `flex: 1` causes it to grow
- The `flex: 1` from `.surface` overrides the fixed width

#### Phase 1 — Add flex: none to saved surface

**Files:** `src/style.css`

- In the `@media (min-width: 768px)` block, update `#saved-surface` rule:
  ```css
  #saved-surface {
    width: 320px;
    flex: none;
    border-left: 1px solid var(--color-border-subtle);
  }
  ```

#### Phase 2 — Remove redundant large desktop width override

**Files:** `src/style.css`

- In the `@media (min-width: 1024px)` block, remove the `#saved-surface` width override
  (lines 854-856) since we're keeping a consistent 320px:
  ```css
  /* Large Desktop */
  @media (min-width: 1024px) {
    #main-content {
      grid-column: 1 / 3;
    }
  }
  ```

**Dependency order:**

```
Phase 1, 2 → independent of each other
```
