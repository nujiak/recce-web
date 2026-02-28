# Recce Web

A mapping and reconnaissance utility for the browser — a feature-complete rewrite of the
Recce Android app in plain HTML, JavaScript, and CSS, built with Vite and deployed as a
fully static site.

---

## Running locally

```bash
npm install
npm run dev       # dev server with HMR at http://localhost:5173
npm run build     # production build → dist/
npx serve dist    # or: python3 -m http.server --directory dist
```

---

## Features

### Map

- Full-screen MapLibre GL JS map with OpenFreeMap vector tiles (no API key required)
- Fixed crosshair with live coordinate display in the active coordinate system
- Compass button showing current bearing; click resets rotation to north
- Location button centres map on GPS position
- Add Pin FAB pre-filled with crosshair coordinates
- Go To dialog — enter any coordinate in any supported system, map flies to that position
- Live GPS-to-crosshair overlay showing distance and bearing (when GPS is active)

### Track plotting mode

- Tap the plot FAB to append the current crosshair as a node
- Long-press the FAB to append and name a checkpoint
- Undo removes the last node; Save opens the track editor; Cancel discards the session

### Pin system

- Create, edit, and delete pins with name, coordinates, colour, group, and description
- Five colours: red, orange, green, azure, violet
- Pin Info modal shows all six coordinate representations simultaneously
- "Open in Maps" launches a `geo:` URI or Google Maps URL
- Pins rendered as markers on the map; click to open Pin Info

### Track system

- Ordered sequences of `{ lat, lng }` nodes rendered as paths (polylines) or areas (filled polygons)
- Named checkpoints displayed on the map and listed in Track Info
- Track Info shows total distance (paths) or perimeter + area (areas) in the preferred unit
- Click a track on the map to open Track Info

### Saved screen

- Unified list of pins and tracks with colour indicators, group tags, and coordinate/stats previews
- Sort by newest, oldest, name A–Z, name Z–A, or group
- Real-time search filtered by name or group
- Multi-select mode: bulk delete, share as a code, or add to Ruler

### Coordinate systems

All six systems share a unified API — display and parse in any system at any time:

| System                      | Coverage                        |
| --------------------------- | ------------------------------- |
| WGS84                       | Global                          |
| UTM                         | −80° to +84° lat                |
| MGRS                        | −80° to +84° lat                |
| BNG (British National Grid) | Great Britain                   |
| QTH (Maidenhead)            | Global                          |
| Kertau 1948                 | Peninsular Malaysia & Singapore |

### GPS & Compass (Toolbox)

- Live position in the active coordinate system with accuracy and altitude
- Compass needle (azimuth, pitch, roll) with animated diamond needle — red north, gray south
- Azimuth displayed in degrees or NATO mils depending on settings

### Ruler (Toolbox)

- Multi-point measurement with per-segment distance and bearing
- Populated from Saved multi-select; cumulative total at the bottom
- Memory-only; resets on page reload

### Settings (Toolbox)

| Setting           | Options                            |
| ----------------- | ---------------------------------- |
| Coordinate system | WGS84, UTM, MGRS, BNG, QTH, Kertau |
| Angle unit        | Degrees, NATO Mils                 |
| Length unit       | Metric, Imperial, Nautical         |
| Theme             | Light, Dark, System                |

### Share codes

- Compact Base62 + zlib codes (format `R1…`) that survive copy-paste through WhatsApp, Telegram, and SMS
- Export selected pins and tracks from the Saved screen
- Import dialog with preview and duplicate detection via `createdAt`

### PWA

- Installable via the in-app banner (`beforeinstallprompt`)
- Offline-capable via a Workbox-generated service worker
- App shell and fonts cached on first visit; map tiles cached network-first

### Accessibility & UX

- Keyboard navigation: global Escape closes all modals and sheets; focus trap inside each dialog
- Swipe-to-dismiss on bottom sheets (drag from header only)
- All interactive elements ≥ 44×44 px on touch devices
- `prefers-reduced-motion` disables all CSS transitions and animations
- `role="dialog"`, `aria-modal`, `aria-label`, and `aria-live` on all overlays

---

## Tech stack

| Concern        | Choice                              |
| -------------- | ----------------------------------- |
| Build          | Vite + vite-plugin-pwa              |
| Map            | MapLibre GL JS + OpenFreeMap tiles  |
| Database       | Dexie (IndexedDB)                   |
| Coordinates    | proj4js + custom parsers            |
| Compression    | pako (zlib / deflate)               |
| Share encoding | Base62 (custom, no deps)            |
| Icons          | Material Symbols (Google Fonts CDN) |
| Font           | Geist Mono (Google Fonts)           |
