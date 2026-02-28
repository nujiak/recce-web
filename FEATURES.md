# Recce Android App - Features Documentation

## App Overview

**Recce** is a mapping/reconnaissance utility app that allows users to save locations (pins), create routes/areas (chains), and perform coordinate-based calculations. The app is offline-first, storing all data locally, and supports multiple coordinate systems for professional/military use.

- **Package:** `com.nujiak.recce`
- **Version:** 2.2.1
- **Min SDK:** 21 (Android 5.0)
- **Target SDK:** 31 (Android 12)

---

## Table of Contents

1. [Screens & Navigation](#1-screens--navigation)
2. [Map Screen](#2-map-screen)
3. [Saved Screen](#3-saved-screen)
4. [GPS Screen](#4-gps-screen)
5. [Ruler Screen](#5-ruler-screen)
6. [Pin System](#6-pin-system)
7. [Chain System](#7-chain-system)
8. [Coordinate Systems](#8-coordinate-systems)
9. [Settings & Preferences](#9-settings--preferences)
10. [Sharing System](#10-sharing-system)
11. [Onboarding Flow](#11-onboarding-flow)
12. [Data Models](#12-data-models)
13. [Technical Architecture](#13-technical-architecture)
14. [UI Components](#14-ui-components)
15. [Permissions](#15-permissions)
16. [Dependencies](#16-dependencies)

---

## 1. Screens & Navigation

### Navigation Structure

```
App Launch
    │
    ├── First Launch → OnboardingActivity (3 pages)
    │       └── Complete → MainActivity
    │
    └── Returning User → MainActivity
            │
            ├── [Tab 1] MapFragment
            ├── [Tab 2] SavedFragment
            ├── [Tab 3] GpsFragment
            └── [Tab 4] RulerFragment
```

### Main Navigation

- **Type:** ViewPager2 + BottomNavigationView
- **4 Tabs:** Map, Saved, GPS, Ruler
- **Swipeable:** Users can swipe between tabs
- **Bottom Navigation Icons:** Map pin, Saved list, GPS icon, Ruler icon

---

## 2. Map Screen

### Purpose
Primary map view with Google Maps integration for viewing, creating, and navigating to pins and chains.

### UI Components

| Component | Description |
|-----------|-------------|
| **MapView** | Full-screen Google Maps with custom styling |
| **Crosshair** | Center reticle for precise location selection |
| **Coordinate Display** | Shows current crosshair position in selected coordinate system |
| **Live Measurement** | Distance and direction from current location to crosshair |
| **Map Compass** | Shows current bearing/tilt, clickable to reset rotation |
| **Map Type Toggle** | Switch between Normal, Satellite, Hybrid views |
| **Zoom Controls** | Zoom in/out buttons |

### Floating Action Buttons (FABs)

| FAB | Action |
|-----|--------|
| **Main FAB** | Add new pin at crosshair location |
| **Long Press Main FAB** | Add named checkpoint to current chain plot |
| **Go To FAB** | Open coordinate input dialog to navigate to specific coordinates |
| **Chain Plot FAB** | Add point to current chain being plotted |

### Map Interactions

| Interaction | Action |
|-------------|--------|
| **Click Marker** | Show pin info dialog |
| **Click Polyline/Polygon** | Show chain info dialog |
| **Location Button** | Center map on current location |
| **Long Press Location Button** | Center and reset map rotation |
| **Compass Click** | Reset map rotation to north |

### Chain Plotting Mode

When plotting a chain (route/area):
- Add points to chain via FAB
- Undo last point
- Save chain with name/type/color
- Cancel plotting

### Interactive Guide

- First-time hints using MaterialShowcaseView
- Guide for chain plotting feature

---

## 3. Saved Screen

### Purpose
List and manage all saved pins and chains with sorting, selection, and import/export capabilities.

### UI Components

| Component | Description |
|-----------|-------------|
| **RecyclerView** | Staggered grid layout of saved items |
| **Empty State** | Illustration and message when no items saved |
| **FAB Speed Dial** | Quick actions menu |

### List Items

Each pin/card displays:
- Name with color indicator
- Coordinate system label
- Coordinates in selected system
- Group tag
- For chains: Route/Area icon, distance, checkpoint count

### Sorting Options

| Sort By | Options |
|---------|---------|
| **Name** | A-Z, Z-A |
| **Time** | Newest first, Oldest first |
| **Group** | Group by category |

### Multi-Select Mode

| Action | Description |
|--------|-------------|
| **Long Press** | Enter selection mode |
| **Select Multiple** | Tap items to select |
| **Add to Ruler** | Add selected items to measurement tool |
| **Delete** | Remove selected items |
| **Share** | Generate share code for selected items |

### FAB Speed Dial Actions

1. **Add Pin** - Open pin creator sheet
2. **Share Code** - Import from share code

---

## 4. GPS Screen

### Purpose
Display real-time GPS location and device orientation data.

### Location Card

| Field | Description |
|-------|-------------|
| **Accuracy** | GPS accuracy in meters/feet |
| **Altitude** | Elevation above sea level |
| **Grid Coordinates** | Current position in selected coordinate system |

### Compass Card

| Field | Description |
|-------|-------------|
| **Azimuth** | Compass heading (0-360° or mils) |
| **Pitch** | Device tilt forward/backward |
| **Roll** | Device tilt side to side |
| **Compass Needle** | Animated needle showing direction |

### Calibration

- Instructions for compass calibration when accuracy is low

---

## 5. Ruler Screen

### Purpose
Measurement tool for calculating distances and bearings between multiple points.

### Features

| Feature | Description |
|---------|-------------|
| **Point List** | Ordered list of measurement points |
| **Distance Display** | Distance between each segment |
| **Cumulative Distance** | Total distance of all segments |
| **Direction** | Bearing between points |

### UI Components

| Component | Description |
|-----------|-------------|
| **RecyclerView** | List of measurement segments |
| **Dashed Lines** | Visual connector between measurements |
| **Color Coding** | Points colored by source pin/chain |

### Actions

| Action | Description |
|--------|-------------|
| **Clear All** | Remove all items from ruler |
| **Add from Saved** | Add pins/chains via multi-select in Saved tab |

---

## 6. Pin System

### Pin Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | Long | Unique identifier (auto-generated) |
| `name` | String | Display name (required, max 20 chars) |
| `lat` | Double | Latitude coordinate |
| `lng` | Double | Longitude coordinate |
| `color` | Enum | Pin color (Red, Orange, Green, Azure, Violet) |
| `group` | String | Group/category name |
| `description` | String | Optional notes |

### Pin Colors

| Color | Usage |
|-------|-------|
| **Red** | Default, attention |
| **Orange** | Warning, intermediate |
| **Green** | Safe, completed |
| **Azure** | Water, special |
| **Violet** | Unique, marked |

### Pin Creator Sheet

Form fields:
1. **Name** (required, max 20 characters)
2. **Coordinates** (in selected coordinate system)
3. **Color** (dropdown selector)
4. **Group** (dropdown with "new group" option)
5. **Description** (multiline text)

Actions:
- **Save** - Create or update pin
- **Delete** - Remove existing pin (edit mode only)

### Pin Info Dialog

Displays:
- Pin name with color theming
- Group tag
- Description
- All coordinate system conversions

Actions:
- **Open in Maps** - Launch external Google Maps app
- **Map** - Navigate to pin on map, close dialog
- **Edit** - Open pin creator for editing

---

## 7. Chain System

### Chain Types

| Type | Description | Visual |
|------|-------------|--------|
| **Route** | Open polyline (A→B→C) | Line with direction arrows |
| **Area** | Closed polygon (A→B→C→A) | Filled polygon outline |

### Chain Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | Long | Unique identifier |
| `name` | String | Display name (required, max 20 chars) |
| `nodes` | List<ChainNode> | Ordered list of points |
| `isCyclical` | Boolean | Route (false) or Area (true) |
| `color` | Enum | Chain color |
| `group` | String | Group/category name |
| `description` | String | Optional notes |

### ChainNode Properties

| Property | Type | Description |
|----------|------|-------------|
| `lat` | Double | Latitude |
| `lng` | Double | Longitude |
| `name` | String? | Optional checkpoint name |

### Calculations

| Calculation | Route | Area |
|-------------|-------|------|
| **Total Distance** | Sum of all segments | Perimeter |
| **Area** | N/A | Calculated polygon area |

### Chain Creator Sheet

Form fields:
1. **Name** (required, max 20 characters)
2. **Type** (Route or Area dropdown)
3. **Color** (dropdown selector)
4. **Group** (dropdown with "new group" option)
5. **Description** (multiline text)

Actions:
- **Save** - Create or update chain
- **Delete** - Remove existing chain (edit mode only)

### Chain Info Dialog

Displays:
- Chain name with color theming
- Type indicator (Route/Area icon)
- Total distance or area
- Checkpoints list (named nodes)
- Group tag
- Description

Actions:
- **Map** - Navigate to chain on map, close dialog
- **Edit** - Open chain creator for editing

### Checkpoints

- Named points within a chain
- Created via long-press on main FAB during plotting
- Displayed in chain info and on map

---

## 8. Coordinate Systems

The app uses **Proj4j** library for coordinate transformations between different reference systems. All transformations go through WGS84 as the intermediate reference system.

### 8.1 WGS84 (World Geodetic System 1984)

**Description:** Standard latitude/longitude coordinate system used by GPS and Google Maps.

**EPSG Code:** `4326`

**Parameters:**
| Parameter | Value |
|-----------|-------|
| Datum | WGS 84 |
| Ellipsoid | WGS 84 |
| Semi-major axis (a) | 6,378,137.0 m |
| Inverse flattening (1/f) | 298.257223563 |
| Prime Meridian | Greenwich |

**Display Format:**
```
1.35210° N 103.81980° E
```

**Input Parsing Formats:**
1. **Degree with direction suffix:**
   - `1.3521° N 103.8198° E`
   - `1.3521 N 103.8198 E`
   - `1.3521, S, 103.8198, W`

2. **Signed decimal degrees:**
   - `1.3521 103.8198` (lat, lng order)
   - `-1.3521 -103.8198` (negative for S/W)

**Regex Patterns:**
```kotlin
// Format 1: "1.3521° N 103.8198° E"
regex1 = "^\s*([0123456789.,]+)\s*°?\s*([NSns])\s*([0123456789.,]+)\s*°?\s*([EWew])\s*$"

// Format 2: "1.3521 103.8198" or "-1.3521 -103.8198"
regex2 = "^\s*([-+0123456789.,]+)\s*°?\s+([-+0123456789.,]+)\s*°?\s*$"
```

**Valid Range:**
- Latitude: -90 to +90
- Longitude: -180 to +180

---

### 8.2 UTM (Universal Transverse Mercator)

**Description:** Projected coordinate system dividing Earth into 60 zones, each 6° of longitude wide.

**EPSG Codes:**
| Hemisphere | EPSG Range | Formula |
|------------|------------|---------|
| Northern | 32601 - 32660 | `zone + 32600` |
| Southern | 32701 - 32760 | `zone + 32700` |

**Parameters:**
| Parameter | Value |
|-----------|-------|
| Projection | Transverse Mercator |
| Central meridian | Zone-dependent |
| Scale factor (k0) | 0.9996 |
| False easting | 500,000 m |
| False northing (North) | 0 m |
| False northing (South) | 10,000,000 m |
| Datum | WGS 84 |

**Zone Calculation:**
```kotlin
zone = floor((longitude + 180) / 6) + 1
// Results in zones 1-60
```

**Band Determination:**
| Latitude >= 0 | Band |
|---------------|------|
| Yes | N (Northern) |
| No | S (Southern) |

**Display Format:**
```
48N 361234 149234
```
- `48` = Zone number (1-60)
- `N` = Band (N or S)
- `361234` = Easting (7 digits, meters)
- `149234` = Northing (7 digits, meters)

**Input Parsing:**
```kotlin
// Regex: "48N361234149234" or "48N 361234 149234"
utmRegex = "(^\d{1,2})([NSns])(\d{1,14})$"
```

**Input Format Examples:**
- `48N361234149234`
- `48N 361234 149234`
- `48n 361234 149234` (case insensitive)

**Valid Range:**
- Latitude: -80° to +84° (excludes polar regions)
- Easting: 100,000 to 900,000 m (per zone)
- Northing: 0 to 10,000,000 m

---

### 8.3 MGRS (Military Grid Reference System)

**Description:** Military coordinate system based on UTM, using alphanumeric grid designators for concise position reporting.

**EPSG Codes:** Same as UTM (derived from UTM coordinates)

**Zone/Band Grid:**
- UTM zones 1-60 (same as UTM)
- Latitude bands C-X (excluding I and O)

**Latitude Band Letters:**
| Latitude Range | Band |
|----------------|------|
| -80° to -72° | C |
| -72° to -64° | D |
| -64° to -56° | E |
| -56° to -48° | F |
| -48° to -40° | G |
| -40° to -32° | H |
| -32° to -24° | J |
| -24° to -16° | K |
| -16° to -8° | L |
| -8° to 0° | M |
| 0° to 8° | N |
| 8° to 16° | P |
| 16° to 24° | Q |
| 24° to 32° | R |
| 32° to 40° | S |
| 40° to 48° | T |
| 48° to 56° | U |
| 56° to 64° | V |
| 64° to 72° | W |
| 72° to 84° | X |

**100km Grid Square Letters:**

Column Letters (Easting) - by zone group:
```
Zone % 3 == 0: S T U V W X Y Z
Zone % 3 == 1: A B C D E F G H
Zone % 3 == 2: J K L M N P Q R
```

Row Letters (Northing) - by zone parity:
```
Zone % 2 == 0: F G H J K L M N P Q R S T U V A B C D E
Zone % 2 == 1: A B C D E F G H J K L M N P Q R S T U V
```

**Display Format:**
```
48PWW 12345 67890
```
- `48` = UTM zone
- `P` = MGRS latitude band
- `WW` = 100km grid square (column + row letters)
- `12345` = Easting (within 100km square)
- `67890` = Northing (within 100km square)

**Input Parsing:**
```kotlin
// Regex: "48PWW1234567890" or "48P WW 12345 67890"
mgrsRegex = "(^\d{1,2})(\w{3})(\d{1,12})$"
```

**Precision Levels:**
| Grid Digits | Precision |
|-------------|-----------|
| 2 digits | 10 km |
| 4 digits | 1 km |
| 6 digits | 100 m |
| 8 digits | 10 m |
| 10 digits | 1 m |

**Y-Band Mapping:**
For resolving ambiguous coordinates, each MGRS band maps to possible UTM row bands:
```kotlin
Y_BANDS = mapOf(
    'C' to [1, 0], 'D' to [1, 0], 'E' to [1],
    'F' to [2, 1], 'G' to [2], 'H' to [3, 2],
    'J' to [3], 'K' to [4, 3], 'L' to [4],
    'M' to [4, 4], 'N' to [0], 'P' to [0],
    'Q' to [0, 1], 'R' to [1], 'S' to [1, 2],
    'T' to [2], 'U' to [2, 3], 'V' to [3],
    'W' to [3, 4], 'X' to [3, 4]
)
```

**Valid Range:**
- Latitude: -80° to +84°

---

### 8.4 BNG (British National Grid)

**Description:** National grid system for Great Britain, also known as Ordnance Survey National Grid.

**EPSG Code:** `27700`

**Parameters:**
| Parameter | Value |
|-----------|-------|
| Projection | Transverse Mercator |
| Datum | OSGB 1936 |
| Central meridian | -2° |
| Latitude of origin | 49° N |
| Scale factor (k0) | 0.9996012717 |
| False easting | 400,000 m |
| False northing | -100,000 m |
| Ellipsoid | Airy 1830 |
| Semi-major axis (a) | 6,377,563.396 m |
| Semi-minor axis (b) | 6,356,256.909 m |

**Major Letters (500km squares):**
```
      0km      500km     1000km (Easting)
        |         |          |
0km   S T       N O       H J   (Northing)
500km S T       N O       H J
1000km S T       N O       H J
```

**Minor Letters (100km squares within 500km):**
```
     0   100  200  300  400 (km within 500km)
400  A   B    C    D    E
300  F   G    H    J    K
200  L   M    N    O    P
100  Q   R    S    T    U
0    V   W    X    Y    Z
```

**Display Format:**
```
TQ 12345 67890
```
- `T` = Major letter (500km square)
- `Q` = Minor letter (100km square)
- `12345` = Easting (within 100km square, 5 digits)
- `67890` = Northing (within 100km square, 5 digits)

**Input Parsing:**
```kotlin
// Regex: "TQ1234567890" or "TQ 12345 67890"
bngRegex = "(^[JHONST])([A-HJ-Z])(\d{1,12})$"
```

**Valid Major Letters:** H, J, N, O, S, T

**Coordinate Decoding:**
```kotlin
// Easting offset from major letter
T, O, J → +500,000m
S, N, H → +0m

// Easting offset from minor letter
E, K, P, U, Z → +400,000m
D, J, O, T, Y → +300,000m
C, H, N, S, X → +200,000m
B, G, M, R, W → +100,000m
A, F, L, Q, V → +0m

// Northing offset from major letter
H, J → +1,000,000m
O, N → +500,000m
S, T → +0m

// Northing offset from minor letter
A-E → +400,000m
F-K → +300,000m
L-P → +200,000m
Q-U → +100,000m
V-Z → +0m
```

**Valid Range:**
- Coverage: Great Britain mainland
- Easting: 0 to 700,000 m
- Northing: 0 to 1,250,000 m

---

### 8.5 QTH (Maidenhead Locator System)

**Description:** Geocode system used by amateur radio operators, also known as grid squares.

**EPSG Code:** None (purely algorithmic, based on WGS84)

**Grid Structure:**
| Level | Name | Division | Characters |
|-------|------|----------|------------|
| 1 | Field | 20°×10° | 2 letters (AA-RR) |
| 2 | Square | 2°×1° | 2 digits (00-99) |
| 3 | Subsquare | 5'×2.5' | 2 letters (aa-xx) |
| 4 | Extended square | 30"×15" | 2 digits (00-99) |

**Calculation Algorithm:**
```kotlin
// From WGS84 to QTH
lng = longitude + 180  // 0 to 360
lat = latitude + 90    // 0 to 180

// Field (20°×10°)
field.first = uppercaseLetter(floor(lng / 20))   // A-R
field.second = uppercaseLetter(floor(lat / 10))  // A-R

lng %= 20
lat %= 10

// Square (2°×1°)
square.first = digit(floor(lng / 2))   // 0-9
square.second = digit(floor(lat))      // 0-9

lng %= 2
lat %= 1

// Subsquare (5'×2.5' = 1/12° × 1/24°)
subsquare.first = lowercaseLetter(floor(lng * 12))   // a-x
subsquare.second = lowercaseLetter(floor(lat * 24))  // a-x

lng %= 1.0 / 12
lat %= 1.0 / 24

// Extended square (30"×15" = 1/120° × 1/240°)
extendedSquare.first = digit(floor(lng * 120))   // 0-9
extendedSquare.second = digit(floor(lat * 240))  // 0-9
```

**Display Format:**
```
OK21AB12
```
- `OK` = Field (2 uppercase letters)
- `21` = Square (2 digits)
- `AB` = Subsquare (2 lowercase letters)
- `12` = Extended square (2 digits, optional)

**Input Parsing:**
```kotlin
// Regex accepts 2, 4, 6, or 8 characters
qthRegex = "^[A-Ra-r]{2}([0-9]{2}([A-Xa-x]{2}([0-9]{2})?)?)?$"
```

**Precision:**
| Length | Precision |
|--------|-----------|
| 2 chars | ±10° lat, ±20° lng (~1200 km) |
| 4 chars | ±1° lat, ±2° lng (~120 km) |
| 6 chars | ±2.5' lat, ±5' lng (~5 km) |
| 8 chars | ±15" lat, ±30" lng (~500 m) |

**Valid Range:**
- Latitude: -90° to +90°
- Longitude: -180° to +180° (global)

---

### 8.6 Kertau 1948 (SVY21)

**Description:** Local coordinate system for Malaysia and Singapore, based on the Kertau 1948 datum.

**EPSG Code:** None assigned (custom projection)

**Proj4 String:**
```
+proj=omerc +lat_0=4 +lonc=102.25 +alpha=323.0257905 +k=0.99984 +x_0=804670.24 +y_0=0 +no_uoff +gamma=323.1301023611111 +a=6377295.664 +b=6356094.667915204 +units=m +no_defs +towgs84=-11,851,5
```

**Parameters:**
| Parameter | Value |
|-----------|-------|
| Projection | Oblique Mercator |
| Latitude of origin (lat_0) | 4° N |
| Longitude of center (lonc) | 102.25° E |
| Azimuth (alpha) | 323.0257905° |
| Scale factor (k) | 0.99984 |
| False easting (x_0) | 804,670.24 m |
| False northing (y_0) | 0 m |
| Rectified bearing (gamma) | 323.1301023611111° |
| Ellipsoid | Everest 1830 (Modified) |
| Semi-major axis (a) | 6,377,295.664 m |
| Semi-minor axis (b) | 6,356,094.667915204 m |
| Datum shift to WGS84 (towgs84) | -11, +851, +5 m |

**Display Format:**
```
12345 67890
```
- `12345` = Easting (6 digits, meters)
- `67890` = Northing (6 digits, meters)

**Input Parsing:**
```kotlin
// Accepts two numbers separated by comma, semicolon, or whitespace
// "12345 67890" or "12345,67890" or "12345;67890"
```

**Valid Range:**
| Coordinate | Min | Max |
|------------|-----|-----|
| Latitude | 1.12° N | 6.72° N |
| Longitude | 99.59° E | 104.6° E |

**Coverage:**
- Peninsular Malaysia
- Singapore
- Southern Thailand (partial)

---

### 8.7 Coordinate Display

- All coordinates displayed in user-selected system
- Real-time conversion as map moves (crosshair position)
- Pin info dialog shows ALL coordinate system conversions simultaneously
- Crosshair position updates live with map pan/zoom

### 8.8 Transformation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                         WGS84                               │
│                    (Base Reference)                         │
│                      EPSG:4326                              │
└─────────────────┬───────────────────────────┬───────────────┘
                  │                           │
        ┌─────────┴─────────┐       ┌─────────┴─────────┐
        │        UTM        │       │       BNG         │
        │  EPSG:32601-32760 │       │   EPSG:27700      │
        │ (Proj4j CRS)      │       │ (Proj4j CRS)      │
        └─────────┬─────────┘       └───────────────────┘
                  │
        ┌─────────┴─────────┐
        │       MGRS        │
        │ (Derived from UTM)│
        │ (Algorithmic)     │
        └───────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                       QTH Locator                           │
│               (Purely Algorithmic, WGS84-based)             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      Kertau 1948                            │
│               (Proj4j Custom Parameters)                    │
│              (Oblique Mercator Projection)                   │
└─────────────────────────────────────────────────────────────┘
```

### 8.9 Implementation Details

**Library:** Proj4j (org.locationtech.proj4j)

**CRS Factory:**
```kotlin
val crsFactory = CRSFactory()
val ctFactory = CoordinateTransformFactory()
val wgs84Crs = crsFactory.createFromName("EPSG:4326")
```

**Transform Caching:**
- UTM transforms cached by EPSG code
- BNG, Kertau transforms created lazily and cached
- MGRS and QTH transforms are algorithmic (no CRS needed)

**Parser Registry:**
```kotlin
object Parser {
    fun getParser(coordinateSystem: CoordinateSystem): Parser {
        return when (coordinateSystem) {
            CoordinateSystem.WGS84 -> Wgs84Parser
            CoordinateSystem.UTM -> UtmParser
            CoordinateSystem.MGRS -> MgrsParser
            CoordinateSystem.BNG -> BngParser
            CoordinateSystem.QTH -> QthParser
            CoordinateSystem.KERTAU -> KertauParser
        }
    }
}
```

---

### 8.10 Complete Implementation Reference

This section provides complete, portable implementation code for each coordinate system. Code is provided in TypeScript/JavaScript for easy adaptation to HTML/JS projects.

#### 8.10.1 WGS84 Implementation

```typescript
// =====================
// WGS84 Coordinate System
// =====================

interface WGS84Coordinate {
  lat: number;  // Latitude in degrees
  lng: number;  // Longitude in degrees
}

// Ellipsoid parameters for WGS84
const WGS84_A = 6378137.0;                    // Semi-major axis (meters)
const WGS84_F = 1 / 298.257223563;            // Flattening
const WGS84_B = WGS84_A * (1 - WGS84_F);      // Semi-minor axis
const WGS84_E2 = 2 * WGS84_F - WGS84_F * WGS84_F;  // First eccentricity squared

class WGS84Parser {
  // Regex for "1.3521° N 103.8198° E" format
  private static regex1 = /^\s*([0-9.,]+)\s*°?\s*([NSns])\s*([0-9.,]+)\s*°?\s*([EWew])\s*$/;
  
  // Regex for "1.3521 103.8198" or "-1.3521 -103.8198" format
  private static regex2 = /^\s*([-+0-9.,]+)\s*°?\s+([-+0-9.,]+)\s*°?\s*$/;

  static parse(input: string): WGS84Coordinate | null {
    // Try format 1: "lat N/S lng E/W"
    const match1 = this.regex1.exec(input.toUpperCase());
    if (match1) {
      let lat = parseFloat(match1[1].replace(',', '.'));
      let lng = parseFloat(match1[3].replace(',', '.'));
      
      if (isNaN(lat) || isNaN(lng)) return null;
      
      lat = match1[2] === 'S' ? -lat : lat;
      lng = match1[4] === 'W' ? -lng : lng;
      
      return this.validate({ lat, lng });
    }

    // Try format 2: "lat lng" (signed decimal)
    const match2 = this.regex2.exec(input);
    if (match2) {
      const lat = parseFloat(match2[1].replace(',', '.'));
      const lng = parseFloat(match2[2].replace(',', '.'));
      
      if (isNaN(lat) || isNaN(lng)) return null;
      
      return this.validate({ lat, lng });
    }

    return null;
  }

  private static validate(coord: WGS84Coordinate): WGS84Coordinate | null {
    if (coord.lat < -90 || coord.lat > 90) return null;
    if (coord.lng < -180 || coord.lng > 180) return null;
    return coord;
  }

  static format(coord: WGS84Coordinate): string {
    const latDir = coord.lat >= 0 ? 'N' : 'S';
    const lngDir = coord.lng >= 0 ? 'E' : 'W';
    const latVal = Math.abs(coord.lat).toFixed(5);
    const lngVal = Math.abs(coord.lng).toFixed(5);
    return `${latVal}° ${latDir} ${lngVal}° ${lngDir}`;
  }
}
```

#### 8.10.2 UTM Implementation

```typescript
// =====================
// UTM Coordinate System
// =====================

interface UTMCoordinate {
  zone: number;        // 1-60
  band: 'N' | 'S';     // North or South
  easting: number;     // meters, typically 100000-900000
  northing: number;    // meters, 0-10000000
  latLng: WGS84Coordinate;
}

const UTM_K0 = 0.9996;
const UTM_FALSE_EASTING = 500000;
const UTM_FALSE_NORTHING_NORTH = 0;
const UTM_FALSE_NORTHING_SOUTH = 10000000;

class UTMUtils {
  // Get UTM zone from longitude
  static getZone(lng: number): number {
    // Wrap longitude to -180 to 180
    const wrappedLng = ((lng + 180) % 360) - 180;
    return Math.floor((wrappedLng + 180) / 6) + 1;
  }

  // Get UTM band from latitude
  static getBand(lat: number): 'N' | 'S' {
    return lat >= 0 ? 'N' : 'S';
  }

  // Get EPSG code from zone and band
  static getEpsgCode(zone: number, band: 'N' | 'S'): number {
    if (zone < 1 || zone > 60) {
      throw new Error(`Invalid UTM zone: ${zone}`);
    }
    return band === 'N' ? zone + 32600 : zone + 32700;
  }

  // Convert WGS84 to UTM using proj4js or manual calculation
  static fromWGS84(coord: WGS84Coordinate): UTMCoordinate | null {
    const lat = coord.lat;
    const lng = coord.lng;

    // Valid range check
    if (lat < -80 || lat > 84) return null;

    const zone = this.getZone(lng);
    const band = this.getBand(lat);

    // Calculate central meridian for the zone
    const centralMeridian = (zone - 1) * 6 - 180 + 3;

    // Convert to radians
    const latRad = lat * Math.PI / 180;
    const lngRad = lng * Math.PI / 180;
    const centralMeridianRad = centralMeridian * Math.PI / 180;

    // Transverse Mercator projection formulas
    const N = WGS84_A / Math.sqrt(1 - WGS84_E2 * Math.sin(latRad) ** 2);
    const T = Math.tan(latRad) ** 2;
    const C = (WGS84_E2 / (1 - WGS84_E2)) * Math.cos(latRad) ** 2;
    const A = (lngRad - centralMeridianRad) * Math.cos(latRad);

    // Calculate easting
    const M = this.calculateM(latRad);
    
    const easting = UTM_K0 * N * (
      A + 
      (1 - T + C) * A ** 3 / 6 + 
      (5 - 18 * T + T ** 2 + 72 * C - 58 * WGS84_E2) * A ** 5 / 120
    ) + UTM_FALSE_EASTING;

    // Calculate northing
    let northing = UTM_K0 * (
      M + 
      N * Math.tan(latRad) * (
        A ** 2 / 2 + 
        (5 - T + 9 * C + 4 * C ** 2) * A ** 4 / 24 +
        (61 - 58 * T + T ** 2 + 600 * C - 330 * WGS84_E2) * A ** 6 / 720
      )
    );

    // Apply false northing for southern hemisphere
    if (band === 'S') {
      northing += UTM_FALSE_NORTHING_SOUTH;
    }

    return {
      zone,
      band,
      easting: Math.round(easting),
      northing: Math.round(northing),
      latLng: coord
    };
  }

  // Calculate M (distance along meridian from equator)
  private static calculateM(latRad: number): number {
    const e4 = WGS84_E2 ** 2;
    const e6 = WGS84_E2 ** 3;
    
    return WGS84_A * (
      latRad -
      WGS84_E2 / 2 * Math.sin(2 * latRad) +
      e4 / 24 * Math.sin(4 * latRad) * (3 - 4 * (1 - WGS84_E2)) +
      e6 / 720 * Math.sin(6 * latRad) * (27 - 48 * (1 - WGS84_E2) + 24 * (1 - WGS84_E2) ** 2)
    );
  }

  // Convert UTM to WGS84
  static toWGS84(utm: { zone: number; band: 'N' | 'S'; easting: number; northing: number }): WGS84Coordinate | null {
    const { zone, band, easting, northing } = utm;

    if (zone < 1 || zone > 60) return null;

    // Central meridian for the zone
    const centralMeridian = (zone - 1) * 6 - 180 + 3;

    // Remove false easting/northing
    const x = easting - UTM_FALSE_EASTING;
    let y = northing;
    if (band === 'S') {
      y -= UTM_FALSE_NORTHING_SOUTH;
    }

    // Calculate footprint latitude
    const M = y / UTM_K0;
    const mu = M / (WGS84_A * (1 - WGS84_E2 / 4 - WGS84_E2 ** 2 / 64 - WGS84_E2 ** 3 / 256));
    
    const e1 = (1 - Math.sqrt(1 - WGS84_E2)) / (1 + Math.sqrt(1 - WGS84_E2));
    
    let latRad = mu + 
      (3 * e1 / 2 - 27 * e1 ** 3 / 32) * Math.sin(2 * mu) +
      (21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32) * Math.sin(4 * mu) +
      (151 * e1 ** 3 / 96) * Math.sin(6 * mu) +
      (1097 * e1 ** 4 / 512) * Math.sin(8 * mu);

    const N = WGS84_A / Math.sqrt(1 - WGS84_E2 * Math.sin(latRad) ** 2);
    const T = Math.tan(latRad) ** 2;
    const C = (WGS84_E2 / (1 - WGS84_E2)) * Math.cos(latRad) ** 2;
    const D = x / (N * UTM_K0);

    // Final latitude
    latRad = latRad - (N * Math.tan(latRad) / UTM_K0) * (
      D ** 2 / 2 -
      (5 + 3 * T + 10 * C - 4 * C ** 2 - 9 * WGS84_E2) * D ** 4 / 24 +
      (61 + 90 * T + 298 * C + 45 * T ** 2 - 252 * WGS84_E2 - 3 * C ** 2) * D ** 6 / 720
    );

    // Longitude
    const lngRad = centralMeridian * Math.PI / 180 + (
      D -
      (1 + 2 * T + C) * D ** 3 / 6 +
      (5 - 2 * C + 28 * T - 3 * C ** 2 + 8 * WGS84_E2 + 24 * T ** 2) * D ** 5 / 120
    ) / Math.cos(latRad);

    return {
      lat: latRad * 180 / Math.PI,
      lng: lngRad * 180 / Math.PI
    };
  }
}

class UTMParser {
  private static regex = /^(\d{1,2})([NSns])(\d{1,14})$/;

  static parse(input: string): UTMCoordinate | null {
    const cleaned = input.replace(/\s/g, '');
    const match = this.regex.exec(cleaned);
    
    if (!match) return null;

    const zone = parseInt(match[1]);
    const band = match[2].toUpperCase() as 'N' | 'S';
    const digits = match[3];

    // Split digits into easting and northing
    const { easting, northing } = this.splitGridDigits(digits, 7);

    const latLng = UTMUtils.toWGS84({ zone, band, easting, northing });
    if (!latLng) return null;

    // Validate latitude range
    if (latLng.lat < -80 || latLng.lat > 84) return null;

    return { zone, band, easting, northing, latLng };
  }

  private static splitGridDigits(digits: string, magnitude: number): { easting: number; northing: number } {
    const halfLen = digits.length / 2;
    const precision = halfLen;
    
    const eastingStr = digits.slice(0, halfLen);
    const northingStr = digits.slice(halfLen);
    
    const multiplier = Math.pow(10, magnitude - precision);
    
    return {
      easting: parseInt(eastingStr) * multiplier,
      northing: parseInt(northingStr) * multiplier
    };
  }

  static format(utm: UTMCoordinate): string {
    const zoneStr = utm.zone.toString().padStart(2, '0');
    const eastingStr = Math.round(utm.easting).toString().padStart(7, '0');
    const northingStr = Math.round(utm.northing).toString().padStart(7, '0');
    return `${zoneStr}${utm.band} ${eastingStr} ${northingStr}`;
  }
}
```

#### 8.10.3 MGRS Implementation

```typescript
// =====================
// MGRS Coordinate System
// =====================

interface MGRSCoordinate {
  zone: number;           // 1-60
  band: string;           // C-X (latitude band)
  columnLetter: string;   // 100km column
  rowLetter: string;      // 100km row
  easting: number;        // meters within 100km square
  northing: number;       // meters within 100km square
  latLng: WGS84Coordinate;
}

class MGRSUtils {
  // Column letters for each zone group (zone % 3)
  private static COLUMN_LETTERS = [
    ['S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],  // zone % 3 === 0
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],  // zone % 3 === 1
    ['J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R'],  // zone % 3 === 2
  ];

  // Row letters for each zone parity (zone % 2)
  private static ROW_LETTERS = [
    ['F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'A', 'B', 'C', 'D', 'E'],  // zone % 2 === 0
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V'],  // zone % 2 === 1
  ];

  // Y-bands for resolving ambiguous coordinates
  private static Y_BANDS: Record<string, number[]> = {
    'C': [1, 0], 'D': [1, 0], 'E': [1],
    'F': [2, 1], 'G': [2], 'H': [3, 2],
    'J': [3], 'K': [4, 3], 'L': [4],
    'M': [4, 4], 'N': [0], 'P': [0],
    'Q': [0, 1], 'R': [1], 'S': [1, 2],
    'T': [2], 'U': [2, 3], 'V': [3],
    'W': [3, 4], 'X': [3, 4]
  };

  // Get MGRS latitude band from latitude
  static getMgrsBand(lat: number): string {
    if (lat < -80 || lat > 84) {
      throw new Error(`Latitude out of MGRS range: ${lat}`);
    }
    
    const bands = 'CDEFGHJKLMNPQRSTUVWX';
    const index = Math.floor((lat + 80) / 8);
    return bands[Math.min(index, bands.length - 1)];
  }

  // Get column letter from easting and zone
  static getColumnLetter(easting: number, zone: number): string {
    const column = Math.floor(easting / 100000) - 1;
    return this.COLUMN_LETTERS[zone % 3][column];
  }

  // Get row letter from northing and zone
  static getRowLetter(northing: number, zone: number): string {
    const row = Math.floor((northing % 2000000) / 100000);
    return this.COLUMN_LETTERS[zone % 2][row];
  }

  // Convert WGS84 to MGRS
  static fromWGS84(coord: WGS84Coordinate): MGRSCoordinate | null {
    const lat = coord.lat;
    const lng = coord.lng;

    // Valid range check
    if (lat < -80 || lat > 84) return null;

    // Convert to UTM first
    const utm = UTMUtils.fromWGS84(coord);
    if (!utm) return null;

    const zone = utm.zone;
    const band = this.getMgrsBand(lat);
    const columnLetter = this.getColumnLetter(utm.easting, zone);
    const rowLetter = this.getRowLetter(utm.northing, zone);

    // Extract easting/northing within 100km square
    const easting = utm.easting % 100000;
    const northing = utm.northing % 100000;

    return {
      zone,
      band,
      columnLetter,
      rowLetter,
      easting,
      northing,
      latLng: coord
    };
  }

  // Convert MGRS to WGS84
  static toWGS84(mgrs: { 
    zone: number; 
    band: string; 
    columnLetter: string; 
    rowLetter: string; 
    easting: number; 
    northing: number;
  }): WGS84Coordinate | null {
    const { zone, band, columnLetter, rowLetter, easting, northing } = mgrs;

    // Get UTM band from MGRS band
    const utmBand: 'N' | 'S' = 'NPQRSTUVWX'.includes(band) ? 'N' : 'S';

    // Find column index
    const columnIndex = this.COLUMN_LETTERS[zone % 3].indexOf(columnLetter.toUpperCase()) + 1;
    if (columnIndex < 1) return null;

    // Find row index
    const rowIndex = this.ROW_LETTERS[zone % 2].indexOf(rowLetter.toUpperCase());
    if (rowIndex === -1) return null;

    // Calculate UTM easting and preliminary northing
    const utmEasting = 100000 * columnIndex + easting;
    const yPrelim = 100000 * rowIndex + northing;

    // Try each possible Y-band to find the correct one
    const yBands = this.Y_BANDS[band.toUpperCase()];
    if (!yBands) return null;

    for (const yBand of yBands) {
      const utmNorthing = 2000000 * yBand + yPrelim;
      
      const latLng = UTMUtils.toWGS84({ 
        zone, 
        band: utmBand, 
        easting: utmEasting, 
        northing: utmNorthing 
      });
      
      if (latLng) {
        const derivedBand = this.getMgrsBand(latLng.lat);
        if (derivedBand === band.toUpperCase()) {
          return latLng;
        }
      }
    }

    return null;
  }
}

class MGRSParser {
  private static regex = /^(\d{1,2})(\w{3})(\d{1,12})$/;

  static parse(input: string): MGRSCoordinate | null {
    const cleaned = input.replace(/\s/g, '').toUpperCase();
    const match = this.regex.exec(cleaned);
    
    if (!match) return null;

    const zone = parseInt(match[1]);
    const [band, columnLetter, rowLetter] = match[2].split('');
    const digits = match[3];

    // Split digits into easting and northing
    const { easting, northing } = this.splitGridDigits(digits, 5);

    const latLng = MGRSUtils.toWGS84({ 
      zone, 
      band, 
      columnLetter, 
      rowLetter, 
      easting, 
      northing 
    });
    
    if (!latLng) return null;

    return { zone, band, columnLetter, rowLetter, easting, northing, latLng };
  }

  private static splitGridDigits(digits: string, magnitude: number): { easting: number; northing: number } {
    const halfLen = digits.length / 2;
    const precision = halfLen;
    
    const eastingStr = digits.slice(0, halfLen);
    const northingStr = digits.slice(halfLen);
    
    const multiplier = Math.pow(10, magnitude - precision);
    
    return {
      easting: parseInt(eastingStr) * multiplier,
      northing: parseInt(northingStr) * multiplier
    };
  }

  static format(mgrs: MGRSCoordinate): string {
    const zoneStr = mgrs.zone.toString().padStart(2, '0');
    const eastingStr = Math.round(mgrs.easting).toString().padStart(5, '0');
    const northingStr = Math.round(mgrs.northing).toString().padStart(5, '0');
    return `${zoneStr}${mgrs.band}${mgrs.columnLetter}${mgrs.rowLetter} ${eastingStr} ${northingStr}`;
  }
}
```

#### 8.10.4 BNG (British National Grid) Implementation

```typescript
// =====================
// BNG Coordinate System
// =====================

interface BNGCoordinate {
  majorLetter: string;    // 500km square
  minorLetter: string;    // 100km square within 500km
  easting: number;        // meters within 100km square
  northing: number;       // meters within 100km square
  latLng: WGS84Coordinate;
}

// Airy 1830 ellipsoid parameters
const AIRY_A = 6377563.396;
const AIRY_B = 6356256.909;
const AIRY_E2 = (AIRY_A ** 2 - AIRY_B ** 2) / AIRY_A ** 2;

// BNG projection parameters
const BNG_CENTRAL_MERIDIAN = -2;  // degrees
const BNG_LAT_OF_ORIGIN = 49;      // degrees
const BNG_K0 = 0.9996012717;
const BNG_FALSE_EASTING = 400000;
const BNG_FALSE_NORTHING = -100000;

class BNGUtils {
  // Major letter grid (500km squares)
  // Format: [northingIndex][eastingIndex]
  private static MAJOR_LETTERS = [
    ['S', 'T'],  // 0-500km northing
    ['N', 'O'],  // 500-1000km northing
    ['H', 'J'],  // 1000-1500km northing
  ];

  // Minor letter grid (100km squares within 500km)
  // Format: [northingIndex][eastingIndex] where indices 0-4 represent 0-400km
  private static MINOR_LETTERS = [
    ['V', 'W', 'X', 'Y', 'Z'],  // 400-500km within 500km
    ['Q', 'R', 'S', 'T', 'U'],  // 300-400km
    ['L', 'M', 'N', 'O', 'P'],  // 200-300km
    ['F', 'G', 'H', 'J', 'K'],  // 100-200km
    ['A', 'B', 'C', 'D', 'E'],  // 0-100km
  ];

  // Easting offsets for major letters
  private static MAJOR_EASTING_OFFSET: Record<string, number> = {
    'S': 0, 'N': 0, 'H': 0,
    'T': 500000, 'O': 500000, 'J': 500000,
  };

  // Northing offsets for major letters
  private static MAJOR_NORTHING_OFFSET: Record<string, number> = {
    'S': 0, 'T': 0,
    'N': 500000, 'O': 500000,
    'H': 1000000, 'J': 1000000,
  };

  // Easting offsets for minor letters (by last letter of row)
  private static MINOR_EASTING_OFFSET: Record<string, number> = {
    'A': 0, 'F': 0, 'L': 0, 'Q': 0, 'V': 0,
    'B': 100000, 'G': 100000, 'M': 100000, 'R': 100000, 'W': 100000,
    'C': 200000, 'H': 200000, 'N': 200000, 'S': 200000, 'X': 200000,
    'D': 300000, 'J': 300000, 'O': 300000, 'T': 300000, 'Y': 300000,
    'E': 400000, 'K': 400000, 'P': 400000, 'U': 400000, 'Z': 400000,
  };

  // Northing offsets for minor letters (by row position)
  private static MINOR_NORTHING_OFFSET: Record<string, number> = {
    'A': 400000, 'B': 400000, 'C': 400000, 'D': 400000, 'E': 400000,
    'F': 300000, 'G': 300000, 'H': 300000, 'J': 300000, 'K': 300000,
    'L': 200000, 'M': 200000, 'N': 200000, 'O': 200000, 'P': 200000,
    'Q': 100000, 'R': 100000, 'S': 100000, 'T': 100000, 'U': 100000,
    'V': 0, 'W': 0, 'X': 0, 'Y': 0, 'Z': 0,
  };

  // Convert WGS84 to BNG
  // Note: For production use, use proj4js library for accurate transformation
  // This is a simplified version that requires Helmert transformation
  static fromWGS84(coord: WGS84Coordinate): BNGCoordinate | null {
    // For accurate conversion, use proj4js:
    // import proj4 from 'proj4';
    // const bngCoord = proj4('EPSG:4326', 'EPSG:27700', [coord.lng, coord.lat]);
    
    // Simplified approach using proj4js string:
    const proj4 = require('proj4');  // or use import
    const bngProj = '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.06,0.1502,0.247,0.8421,-20.4894 +units=m +no_defs';
    const wgs84Proj = 'EPSG:4326';
    
    const [easting, northing] = proj4(wgs84Proj, bngProj, [coord.lng, coord.lat]);

    // Validate range (Great Britain bounds)
    if (easting < 0 || easting > 700000) return null;
    if (northing < 0 || northing > 1250000) return null;

    // Determine major and minor letters
    const majorNorthingIndex = Math.floor(northing / 500000);
    const majorEastingIndex = Math.floor(easting / 500000);
    const majorLetter = this.MAJOR_LETTERS[majorNorthingIndex]?.[majorEastingIndex];
    if (!majorLetter) return null;

    const minorNorthingIndex = Math.floor((northing % 500000) / 100000);
    const minorEastingIndex = Math.floor((easting % 500000) / 100000);
    const minorLetter = this.MINOR_LETTERS[minorNorthingIndex]?.[minorEastingIndex];
    if (!minorLetter) return null;

    return {
      majorLetter,
      minorLetter,
      easting: easting % 100000,
      northing: northing % 100000,
      latLng: coord
    };
  }

  // Convert BNG to WGS84
  static toWGS84(bng: { 
    majorLetter: string; 
    minorLetter: string; 
    easting: number; 
    northing: number;
  }): WGS84Coordinate | null {
    const { majorLetter, minorLetter, easting, northing } = bng;

    // Calculate full easting
    let fullEasting = (this.MAJOR_EASTING_OFFSET[majorLetter.toUpperCase()] ?? -1) +
                      (this.MINOR_EASTING_OFFSET[minorLetter.toUpperCase()] ?? -1) +
                      easting;
    
    // Calculate full northing
    let fullNorthing = (this.MAJOR_NORTHING_OFFSET[majorLetter.toUpperCase()] ?? -1) +
                       (this.MINOR_NORTHING_OFFSET[minorLetter.toUpperCase()] ?? -1) +
                       northing;

    if (fullEasting < 0 || fullNorthing < 0) return null;

    // Convert to WGS84 using proj4js
    const proj4 = require('proj4');
    const bngProj = '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.06,0.1502,0.247,0.8421,-20.4894 +units=m +no_defs';
    const wgs84Proj = 'EPSG:4326';
    
    const [lng, lat] = proj4(bngProj, wgs84Proj, [fullEasting, fullNorthing]);

    return { lat, lng };
  }
}

class BNGParser {
  private static regex = /^([JHONST])([A-HJ-Z])(\d{1,12})$/;
  private static VALID_MAJOR = ['H', 'J', 'N', 'O', 'S', 'T'];

  static parse(input: string): BNGCoordinate | null {
    const cleaned = input.replace(/\s/g, '').toUpperCase();
    const match = this.regex.exec(cleaned);
    
    if (!match) return null;

    const majorLetter = match[1];
    if (!this.VALID_MAJOR.includes(majorLetter)) return null;
    
    const minorLetter = match[2];
    const digits = match[3];

    // Split digits into easting and northing
    const { easting, northing } = this.splitGridDigits(digits, 5);

    const latLng = BNGUtils.toWGS84({ majorLetter, minorLetter, easting, northing });
    if (!latLng) return null;

    return { majorLetter, minorLetter, easting, northing, latLng };
  }

  private static splitGridDigits(digits: string, magnitude: number): { easting: number; northing: number } {
    const halfLen = digits.length / 2;
    const precision = halfLen;
    
    const eastingStr = digits.slice(0, halfLen);
    const northingStr = digits.slice(halfLen);
    
    const multiplier = Math.pow(10, magnitude - precision);
    
    return {
      easting: parseInt(eastingStr) * multiplier,
      northing: parseInt(northingStr) * multiplier
    };
  }

  static format(bng: BNGCoordinate): string {
    const eastingStr = Math.round(bng.easting).toString().padStart(5, '0');
    const northingStr = Math.round(bng.northing).toString().padStart(5, '0');
    return `${bng.majorLetter}${bng.minorLetter} ${eastingStr} ${northingStr}`;
  }
}
```

#### 8.10.5 QTH (Maidenhead Locator) Implementation

```typescript
// =====================
// QTH / Maidenhead Locator System
// =====================

interface QTHCoordinate {
  field: [string, string];      // 2 uppercase letters (AA-RR)
  square: [string, string];     // 2 digits (00-99)
  subsquare: [string, string];  // 2 lowercase letters (aa-xx)
  extendedSquare: [string, string]; // 2 digits (00-99)
  latLng: WGS84Coordinate;
}

class QTHUtils {
  // Convert WGS84 to QTH
  static fromWGS84(coord: WGS84Coordinate): QTHCoordinate {
    let lng = coord.lng + 180;  // 0 to 360
    let lat = coord.lat + 90;   // 0 to 180

    // Field (20° × 10°) - letters A-R
    const fieldFirst = this.getUppercaseLetter(Math.floor(lng / 20));
    const fieldSecond = this.getUppercaseLetter(Math.floor(lat / 10));
    
    lng = lng % 20;
    lat = lat % 10;

    // Square (2° × 1°) - digits 0-9
    const squareFirst = Math.floor(lng / 2).toString();
    const squareSecond = Math.floor(lat).toString();
    
    lng = lng % 2;
    lat = lat % 1;

    // Subsquare (5' × 2.5' = 1/12° × 1/24°) - letters a-x
    const subsquareFirst = this.getLowercaseLetter(Math.floor(lng * 12));
    const subsquareSecond = this.getLowercaseLetter(Math.floor(lat * 24));
    
    lng = lng % (1 / 12);
    lat = lat % (1 / 24);

    // Extended square (30" × 15" = 1/120° × 1/240°) - digits 0-9
    const extendedFirst = Math.floor(lng * 120).toString();
    const extendedSecond = Math.floor(lat * 240).toString();

    return {
      field: [fieldFirst, fieldSecond],
      square: [squareFirst, squareSecond],
      subsquare: [subsquareFirst, subsquareSecond],
      extendedSquare: [extendedFirst, extendedSecond],
      latLng: coord
    };
  }

  // Convert QTH to WGS84
  static toWGS84(qth: {
    field: [string, string];
    square?: [string, string];
    subsquare?: [string, string];
    extendedSquare?: [string, string];
  }): WGS84Coordinate {
    let lng = 20 * this.getIndex(qth.field[0]);
    let lat = 10 * this.getIndex(qth.field[1]);

    if (qth.square) {
      lng += 2 * parseInt(qth.square[0]);
      lat += 1 * parseInt(qth.square[1]);
    }

    if (qth.subsquare) {
      lng += (1 / 12) * this.getIndex(qth.subsquare[0]);
      lat += (1 / 24) * this.getIndex(qth.subsquare[1]);
    }

    if (qth.extendedSquare) {
      lng += (1 / 120) * parseInt(qth.extendedSquare[0]);
      lat += (1 / 240) * parseInt(qth.extendedSquare[1]);
    }

    // Convert back from shifted coordinates
    lng -= 180;
    lat -= 90;

    return { lat, lng };
  }

  private static getUppercaseLetter(index: number): string {
    return String.fromCharCode(65 + index);  // A = 65
  }

  private static getLowercaseLetter(index: number): string {
    return String.fromCharCode(97 + index);  // a = 97
  }

  private static getIndex(letter: string): number {
    const code = letter.charCodeAt(0);
    return code >= 97 ? code - 97 : code - 65;
  }
}

class QTHParser {
  // Regex: 2-8 characters, accepts 2, 4, 6, or 8 char locators
  private static regex = /^[A-Ra-r]{2}([0-9]{2}([A-Xa-x]{2}([0-9]{2})?)?)?$/;

  static parse(input: string): QTHCoordinate | null {
    const cleaned = input.trim();
    
    if (!this.regex.test(cleaned)) return null;

    const field: [string, string] = [cleaned[0].toUpperCase(), cleaned[1].toUpperCase()];
    const square: [string, string] = cleaned.length >= 4 
      ? [cleaned[2], cleaned[3]] 
      : ['0', '0'];
    const subsquare: [string, string] = cleaned.length >= 6 
      ? [cleaned[4].toLowerCase(), cleaned[5].toLowerCase()] 
      : ['a', 'a'];
    const extendedSquare: [string, string] = cleaned.length >= 8 
      ? [cleaned[6], cleaned[7]] 
      : ['0', '0'];

    const latLng = QTHUtils.toWGS84({ field, square, subsquare, extendedSquare });

    return { field, square, subsquare, extendedSquare, latLng };
  }

  static format(qth: QTHCoordinate, precision: 2 | 4 | 6 | 8 = 8): string {
    let result = qth.field.join('') + qth.square.join('');
    
    if (precision >= 6) {
      result += qth.subsquare.join('');
    }
    if (precision >= 8) {
      result += qth.extendedSquare.join('');
    }
    
    return result;
  }
}
```

#### 8.10.6 Kertau 1948 Implementation

```typescript
// =====================
// Kertau 1948 / SVY21 Coordinate System
// =====================

interface KertauCoordinate {
  easting: number;   // meters
  northing: number;  // meters
  latLng: WGS84Coordinate;
}

class KertauUtils {
  // Proj4 string for Kertau 1948 (SVY21)
  private static PROJ4_STRING = '+proj=omerc +lat_0=4 +lonc=102.25 +alpha=323.0257905 +k=0.99984 +x_0=804670.24 +y_0=0 +no_uoff +gamma=323.1301023611111 +a=6377295.664 +b=6356094.667915204 +units=m +no_defs +towgs84=-11,851,5';

  // Valid bounds for Kertau projection
  private static VALID_BOUNDS = {
    minLat: 1.12,
    maxLat: 6.72,
    minLng: 99.59,
    maxLng: 104.6
  };

  // Convert WGS84 to Kertau 1948
  static fromWGS84(coord: WGS84Coordinate): KertauCoordinate | null {
    // Check bounds
    if (coord.lat < this.VALID_BOUNDS.minLat || 
        coord.lat > this.VALID_BOUNDS.maxLat ||
        coord.lng < this.VALID_BOUNDS.minLng || 
        coord.lng > this.VALID_BOUNDS.maxLng) {
      return null;
    }

    // Use proj4js for transformation
    const proj4 = require('proj4');
    const wgs84Proj = 'EPSG:4326';
    
    const [easting, northing] = proj4(wgs84Proj, this.PROJ4_STRING, [coord.lng, coord.lat]);

    return {
      easting,
      northing,
      latLng: coord
    };
  }

  // Convert Kertau 1948 to WGS84
  static toWGS84(kertau: { easting: number; northing: number }): WGS84Coordinate | null {
    const proj4 = require('proj4');
    const wgs84Proj = 'EPSG:4326';
    
    const [lng, lat] = proj4(this.PROJ4_STRING, wgs84Proj, [kertau.easting, kertau.northing]);

    // Validate bounds
    if (lat < this.VALID_BOUNDS.minLat || 
        lat > this.VALID_BOUNDS.maxLat ||
        lng < this.VALID_BOUNDS.minLng || 
        lng > this.VALID_BOUNDS.maxLng) {
      return null;
    }

    return { lat, lng };
  }
}

class KertauParser {
  // Parses space, comma, or semicolon separated easting and northing
  static parse(input: string): KertauCoordinate | null {
    const parts = input.trim().split(/[,;\s]+/);
    
    if (parts.length !== 2) return null;

    const easting = this.shiftToMagnitude(parts[0], 6);
    const northing = this.shiftToMagnitude(parts[1], 6);

    if (easting === null || northing === null) return null;

    const latLng = KertauUtils.toWGS84({ easting, northing });
    if (!latLng) return null;

    return { easting, northing, latLng };
  }

  private static shiftToMagnitude(s: string, magnitude: number): number | null {
    if (!/^\d+$/.test(s)) return null;
    const value = parseInt(s);
    const multiplier = Math.pow(10, magnitude - s.length);
    return value * multiplier;
  }

  static format(kertau: KertauCoordinate): string {
    const eastingStr = Math.round(kertau.easting).toString().padStart(6, '0');
    const northingStr = Math.round(kertau.northing).toString().padStart(6, '0');
    return `${eastingStr} ${northingStr}`;
  }
}
```

#### 8.10.7 Unified Coordinate System Interface

```typescript
// =====================
// Unified Coordinate System Interface
// =====================

enum CoordinateSystemType {
  WGS84 = 'WGS84',
  UTM = 'UTM',
  MGRS = 'MGRS',
  BNG = 'BNG',
  QTH = 'QTH',
  KERTAU = 'KERTAU'
}

interface Coordinate {
  type: CoordinateSystemType;
  latLng: WGS84Coordinate;
  formatted: string;
}

class CoordinateTransformer {
  // Transform from WGS84 to any coordinate system
  static transformTo(type: CoordinateSystemType, latLng: WGS84Coordinate): Coordinate | null {
    switch (type) {
      case CoordinateSystemType.WGS84:
        return {
          type,
          latLng,
          formatted: WGS84Parser.format(latLng)
        };

      case CoordinateSystemType.UTM: {
        const utm = UTMUtils.fromWGS84(latLng);
        if (!utm) return null;
        return {
          type,
          latLng,
          formatted: UTMParser.format(utm)
        };
      }

      case CoordinateSystemType.MGRS: {
        const mgrs = MGRSUtils.fromWGS84(latLng);
        if (!mgrs) return null;
        return {
          type,
          latLng,
          formatted: MGRSParser.format(mgrs)
        };
      }

      case CoordinateSystemType.BNG: {
        const bng = BNGUtils.fromWGS84(latLng);
        if (!bng) return null;
        return {
          type,
          latLng,
          formatted: BNGParser.format(bng)
        };
      }

      case CoordinateSystemType.QTH: {
        const qth = QTHUtils.fromWGS84(latLng);
        return {
          type,
          latLng,
          formatted: QTHParser.format(qth, 8)
        };
      }

      case CoordinateSystemType.KERTAU: {
        const kertau = KertauUtils.fromWGS84(latLng);
        if (!kertau) return null;
        return {
          type,
          latLng,
          formatted: KertauParser.format(kertau)
        };
      }

      default:
        return null;
    }
  }

  // Parse input string in any coordinate system
  static parse(input: string, type: CoordinateSystemType): Coordinate | null {
    switch (type) {
      case CoordinateSystemType.WGS84: {
        const coord = WGS84Parser.parse(input);
        if (!coord) return null;
        return {
          type,
          latLng: coord,
          formatted: WGS84Parser.format(coord)
        };
      }

      case CoordinateSystemType.UTM: {
        const utm = UTMParser.parse(input);
        if (!utm) return null;
        return {
          type,
          latLng: utm.latLng,
          formatted: UTMParser.format(utm)
        };
      }

      case CoordinateSystemType.MGRS: {
        const mgrs = MGRSParser.parse(input);
        if (!mgrs) return null;
        return {
          type,
          latLng: mgrs.latLng,
          formatted: MGRSParser.format(mgrs)
        };
      }

      case CoordinateSystemType.BNG: {
        const bng = BNGParser.parse(input);
        if (!bng) return null;
        return {
          type,
          latLng: bng.latLng,
          formatted: BNGParser.format(bng)
        };
      }

      case CoordinateSystemType.QTH: {
        const qth = QTHParser.parse(input);
        if (!qth) return null;
        return {
          type,
          latLng: qth.latLng,
          formatted: QTHParser.format(qth, 8)
        };
      }

      case CoordinateSystemType.KERTAU: {
        const kertau = KertauParser.parse(input);
        if (!kertau) return null;
        return {
          type,
          latLng: kertau.latLng,
          formatted: KertauParser.format(kertau)
        };
      }

      default:
        return null;
    }
  }

  // Get all coordinate representations for a point
  static getAllRepresentations(latLng: WGS84Coordinate): Map<CoordinateSystemType, string> {
    const result = new Map<CoordinateSystemType, string>();
    
    for (const type of Object.values(CoordinateSystemType)) {
      const coord = this.transformTo(type as CoordinateSystemType, latLng);
      if (coord) {
        result.set(type as CoordinateSystemType, coord.formatted);
      }
    }
    
    return result;
  }
}

// Example usage:
// const coord = CoordinateTransformer.parse('48NWW 12345 67890', CoordinateSystemType.MGRS);
// const allFormats = CoordinateTransformer.getAllRepresentations(coord.latLng);
// console.log(allFormats.get(CoordinateSystemType.WGS84));  // "1.23456° N 103.45678° E"
```

#### 8.10.8 Required Dependencies for JavaScript/TypeScript Implementation

```json
{
  "dependencies": {
    "proj4": "^2.9.0"
  },
  "devDependencies": {
    "@types/proj4": "^2.5.3"
  }
}
```

**Installation:**
```bash
npm install proj4
# or
yarn add proj4
```

**Browser Usage:**
```html
<script src="https://cdn.jsdelivr.net/npm/proj4@2.9.0/dist/proj4.min.js"></script>
<script>
  // proj4 is now available globally
  const bngCoord = proj4('EPSG:4326', 'EPSG:27700', [103.8, 1.35]);
</script>
```

---

## 9. Settings & Preferences

### Preference Options

| Category | Setting | Options |
|----------|---------|---------|
| **Coordinate System** | Display format | WGS84, UTM, MGRS, BNG, QTH, Kertau |
| **Angle Unit** | Compass/bearing units | Degrees, NATO Mils |
| **Length Unit** | Distance units | Metric, Imperial, Nautical |
| **Theme** | App appearance | Light, Dark, System Default |

### Map Preferences

| Setting | Options |
|---------|---------|
| **Map Type** | Normal, Satellite, Hybrid |

### Preference Storage

- Stored in SharedPreferences
- Real-time updates via LiveData
- Persisted across app restarts

### Preference Screen

- Accessed via Settings icon in Saved tab toolbar
- Material Design preference UI
- Theme changes apply immediately

---

## 10. Sharing System

### Share Code Generation

1. Select pins/chains in Saved tab
2. Tap Share in action mode
3. Share code generated via KotlinX Serialization
4. Copy to clipboard

### Share Code Import

1. Tap FAB in Saved tab
2. Select "Share Code" option
3. Paste share code
4. Pins/chains imported to database

### Share Code Format

- Base64-encoded JSON
- Contains pin/chain data with all properties
- Version-stamped for future compatibility

---

## 11. Onboarding Flow

### Structure

3-page ViewPager2 flow:

| Page | Content |
|------|---------|
| **Page 0** | App logo, "Recce" title, welcome message |
| **Page 1** | Preference setup (coordinate system, units, theme) |
| **Page 2** | "All Set!" completion screen |

### Features

- Dark theme enforced during onboarding
- Back/Next navigation buttons
- Skip option not available (settings required)
- Onboarding completion stored in SharedPreferences

### On Completion

- Marks `onboarding_complete = true`
- Navigates to MainActivity

---

## 12. Data Models

### Entity: Pin

```kotlin
@Entity(tableName = "pins_table")
data class Pin(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val lat: Double,
    val lng: Double,
    val color: Int,  // Color enum ordinal
    val group: String,
    val description: String
)
```

### Entity: Chain

```kotlin
@Entity(tableName = "chains_table")
data class Chain(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val nodes: List<ChainNode>,  // JSON serialized
    val isCyclical: Boolean,
    val color: Int,
    val group: String,
    val description: String
)
```

### Model: ChainNode

```kotlin
data class ChainNode(
    val lat: Double,
    val lng: Double,
    val name: String? = null  // Named checkpoint
)
```

### Sealed Interface: RecceData

```kotlin
sealed interface RecceData {
    val id: Long
    val name: String
    val color: Int
    val group: String
    val description: String
}
```

### Enum: Color

```kotlin
enum class Color {
    RED, ORANGE, GREEN, AZURE, VIOLET
}
```

### Enum: CoordinateSystem

```kotlin
enum class CoordinateSystem {
    WGS84, UTM, MGRS, BNG, QTH, KERTAU
}
```

---

## 13. Technical Architecture

### Architecture Pattern

**MVVM (Model-View-ViewModel)**

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     View        │────▶│   ViewModel     │────▶│     Model       │
│  (Fragments)    │     │ (MainViewModel) │     │    (Room DB)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        └───────────────────────┴───────────────────────┘
                      LiveData / Coroutines
```

### Dependency Injection

- **Hilt** for dependency injection
- `@AndroidEntryPoint` on activities/fragments
- Modules: `DatabaseModule`, `SharedPreferencesModule`

### Database

- **Room** database library
- Database name: `recce_database`
- Version: 5
- Entities: Pin, Chain
- DAO: `RecceDatabaseDao`

### Reactive UI

- **LiveData** for reactive data updates
- **Coroutines** for async database operations
- **ViewBinding** for type-safe view access

### Location Services

- **FusedLocationProviderClient** (Google Play Services)
- Update interval: 5000ms
- Priority: HIGH_ACCURACY

### Sensor Monitoring

- **SensorManager** for device orientation
- Sensors: Accelerometer, Magnetometer
- Output: Azimuth, Pitch, Roll

---

## 14. UI Components

### Layout Files

| Layout | Purpose |
|--------|---------|
| `activity_main.xml` | Main container with ViewPager2 + BottomNav |
| `activity_onboarding.xml` | Onboarding flow container |
| `activity_preference.xml` | Settings screen |
| `fragment_map.xml` | Map view with all controls |
| `fragment_gps.xml` | GPS and compass display |
| `fragment_saved.xml` | Saved pins/chains list |
| `fragment_ruler.xml` | Measurement tool |
| `sheet_pin_creator.xml` | Pin creation/edit form |
| `sheet_chain_creator.xml` | Chain creation/edit form |
| `dialog_pin_info.xml` | Pin details dialog |
| `dialog_chain_info.xml` | Chain details dialog |
| `dialog_go_to.xml` | Coordinate input dialog |
| `dialog_share.xml` | Share code output |
| `dialog_share_input.xml` | Share code input |

### Menu Files

| Menu | Items |
|------|-------|
| `bottom_navigation_menu.xml` | Map, Saved, GPS, Ruler |
| `pin_selector_options.xml` | Sort options, Settings |
| `pin_selector_action_options.xml` | Delete, Add to Ruler, Share |
| `menu_fab_speed_dial.xml` | Share Code, Add Pin |
| `ruler_options.xml` | Clear Ruler |

### Styles

| Style | Usage |
|-------|-------|
| `Theme.Recce` | Main app theme |
| `Theme.Recce.BottomSheetDialog.Creators` | Creator sheets |
| `Theme.Recce.Onboarding` | Onboarding screens |
| `Theme.Recce.InfoDialogs` | Info dialogs |

### Colors

| Color | Hex | Usage |
|-------|-----|-------|
| `colorPrimary` | #51ba00 | Primary green |
| `colorPrimaryLight` | #88ed48 | Light green accent |
| `colorPrimaryDark` | #008900 | Dark green status bar |

### Typography

- **Font Family:** Open Sans
- **Variants:** Regular, Semibold, Bold, Extrabold

---

## 15. Permissions

| Permission | Purpose |
|------------|---------|
| `ACCESS_FINE_LOCATION` | Precise GPS location |
| `ACCESS_COARSE_LOCATION` | Approximate location (fallback) |

---

## 16. Dependencies

### Core Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| AppCompat | 1.4.1 | Android compatibility |
| Core-KTX | 1.7.0 | Kotlin extensions |
| Material Components | 1.5.0 | UI components |
| RecyclerView | 1.2.1 | List display |
| ViewPager2 | 1.0.0 | Swipeable pages |
| ConstraintLayout | 2.1.3 | Layout system |

### Architecture

| Library | Version | Purpose |
|---------|---------|---------|
| Room | 2.4.2 | Local database |
| Lifecycle | 2.4.1 | ViewModel, LiveData |
| Hilt | 2.40.5 | Dependency injection |

### Maps & Location

| Library | Version | Purpose |
|---------|---------|---------|
| Play Services Maps | 18.0.2 | Google Maps SDK |
| Play Services Location | 19.0.1 | GPS location |
| Android Maps Utils | 2.2.0 | Map utilities |

### Utilities

| Library | Version | Purpose |
|---------|---------|---------|
| KotlinX Serialization | 1.0.1 | JSON serialization |
| Proj4j | 1.1.3 | Coordinate projections |
| FAB Speed Dial | 1.0.6 | Expandable FAB menu |
| MaterialShowcaseView | 1.3.4 | Onboarding hints |

---

## 17. User Flows

### Create a Pin

1. Open Map tab
2. Pan map to desired location
3. Tap main FAB
4. Fill in name, color, group, description
5. Tap Save

### Create a Chain

1. Open Map tab
2. Pan to first point
3. Tap chain plot FAB to start
4. Add points by tapping FAB
5. Long press FAB to add named checkpoint
6. Tap save button
7. Fill in name, type (Route/Area), color, group
8. Tap Save

### Import from Share Code

1. Open Saved tab
2. Tap FAB
3. Select "Share Code"
4. Paste code
5. Tap Done

### Measure Distance

1. Open Saved tab
2. Long press first item
3. Select additional items
4. Tap "Add to Ruler"
5. Open Ruler tab
6. View distances and bearings

### Navigate to Coordinate

1. Open Map tab
2. Tap Go To FAB
3. Enter coordinates in selected system
4. Tap Go

---

## 18. Recreating as HTML/JS App

### Recommended Stack

| Component | Recommendation |
|-----------|----------------|
| **Map Library** | Leaflet or Mapbox GL JS |
| **State Management** | Zustand, Redux, or Vue's Pinia |
| **UI Framework** | React, Vue, or Svelte |
| **Component Library** | Material UI, Vuetify, or custom |
| **Database** | IndexedDB (Dexie.js) or LocalStorage |
| **Coordinate Library** | Proj4js |
| **Build Tool** | Vite or Next.js |

### Key Considerations

1. **Offline Support:** Use Service Workers for PWA
2. **Location API:** Browser Geolocation API
3. **Device Orientation:** DeviceOrientationEvent API
4. **Storage:** IndexedDB for pins/chains, LocalStorage for preferences
5. **Sharing:** Base64 encode JSON, use Clipboard API

### Feature Parity Checklist

- [ ] Map with custom tiles (satellite/hybrid options)
- [ ] Crosshair for coordinate selection
- [ ] Pin creation/editing with color and group
- [ ] Chain (route/area) creation with checkpoints
- [ ] Multiple coordinate systems (UTM, MGRS, etc.)
- [ ] GPS location display
- [ ] Compass with device orientation
- [ ] Measurement tool (ruler)
- [ ] Share code import/export
- [ ] Dark/light theme
- [ ] Onboarding flow
- [ ] Responsive design for mobile/tablet
