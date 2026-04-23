# PLANS.md — Recce Web Implementation Plans

All planned features and refactors live here. Each plan is self-contained — an implementing agent should be able to execute it without any additional context beyond this file, AGENTS.md, and DESIGN.md.

**Rules:**

- Before starting a plan, read it in full.
- When complete, mark it `Status: Done`, delete the plan body, and leave only the header.
- One plan per section. Use `---` as a separator.

---

## Plan: SVG Icon Migration

**Status:** Done
**Branch:** `refactor/svg-icons`

---

## Plan: Reduce First-Load Bundle Size and Latency

**Status:** Pending  
**Branch:** `perf/first-load`  
**Goal:** Cut the amount of JS/CSS parsed and executed before the user sees interactive UI, especially on slow networks.

### Problem Summary

The current build produces a single large JS entry chunk because the app never uses SolidJS `lazy()` or Vite `manualChunks`. Every screen, modal, coordinate converter, SVG icon, and heavy mapping library is bundled into the initial download. On a bad network this means a long blank screen.

Specific bottlenecks identified:

1. **No code splitting** — `App.tsx` eagerly imports `MapView`, `SavedScreen`, `OnboardingFlow`, `PinEditor`, `PinInfo`, `TrackEditor`, `TrackInfo`, `ToolboxModal`, and `GpsTracker`. All of them ship in the first chunk.
2. **MapLibre GL blocks the main thread** — `maplibre-gl` (~500 KB parsed) is imported at the top of `MapView.tsx` and bundled into the entry chunk. Its CSS is also imported eagerly.
3. **All coordinate converters are bundled upfront** — `src/coords/index.ts` statically imports all six systems, pulling `proj4` and `utm-latlng` into the main chunk even though most users interact with only one system at a time.
4. **All 33 SVG icons live in the entry chunk** — `src/components/ui/Icon.tsx` uses `?raw` imports for every Material Symbols icon. Vite inlines every SVG string into the main bundle.
5. **No `manualChunks` configuration** — Vite rolls everything into one or two files by default.
6. **Render-blocking external font request** — `index.html` fetches Google Fonts CSS synchronously. On a slow connection the browser waits for the stylesheet before painting.
7. **Map style fetched from network** — `mapStyles.ts` fetches `https://tiles.openfreemap.org/styles/liberty` dynamically. On a slow network the map stays blank until this round-trip completes.
8. **No resource hints for tiles** — The tile CDN is not `dns-prefetch`ed or `preconnect`ed, adding latency to the first tile request.

### Proposed Changes

1. **Add Vite `manualChunks`** in `vite.config.ts`:
   - `maplibre` — everything from `maplibre-gl`.
   - `coords` — `proj4`, `utm-latlng`, `@turf/circle`.
   - `vendor` — `solid-js`, `@kobalte/core`, `dexie`.
   This guarantees that heavy third-party code is cached independently of app releases.

2. **Lazy-load major screens and modals** with `lazy()` + `Suspense`:
   - `MapView` (defer until `prefs.onboardingDone`).
   - `OnboardingFlow`.
   - `SavedScreen`.
   - `PinEditor`, `PinInfo`, `TrackEditor`, `TrackInfo`.
   - `ToolboxModal`.
   Keep a minimal, inline loading placeholder so the screen never feels empty.

3. **Lazy-load coordinate system modules** in `src/coords/index.ts`:
   - Convert the static `Record<CoordinateSystem, CoordModule>` into a function that `await import()`s the selected system on demand.
   - Keep lightweight systems (WGS84, MGRS, QTH) in the main chunk; dynamically import UTM, BNG, and KERTAU only when needed.

4. **Replace bundled SVG icons with an external sprite**:
   - Compile the 33 used Material Symbols SVGs into a single `public/icons/sprite.svg` (e.g. with `svg-sprite` or a build script).
   - Rewrite `Icon.tsx` to render `<svg><use href={`/icons/sprite.svg#${props.name}`} /></svg>`.
   - This removes every `?raw` import and drops the icon bytes from the JS bundle entirely.
   - Remove the `@material-symbols/svg-400` dependency once the sprite is in place.

5. **Self-host the app font and preload it**:
   - Download `IBM Plex Mono` WOFF2 files for weights 400 and 500.
   - Place them in `public/fonts/`.
   - Add `@font-face` rules to `theme.css` and `<link rel="preload" as="font" type="font/woff2" crossorigin>` tags in `index.html`.
   - Remove the Google Fonts `<link>` from `index.html`.

6. **Ship the default map style locally**:
   - Save a snapshot of the OpenFreeMap Liberty style JSON to `public/map-styles/liberty.json`.
   - Update `mapStyles.ts` to import or fetch from `/map-styles/liberty.json` (same-origin, instant on cached repeat visits).
   - Add a build-time check or script that warns when the remote style has drifted from the snapshot.

7. **Add resource hints for the tile CDN** in `index.html`:
   - `<link rel="dns-prefetch" href="https://tiles.openfreemap.org">`
   - `<link rel="preconnect" href="https://tiles.openfreemap.org">`

8. **Defer MapLibre CSS** implicitly:
   - Because `maplibre-gl.css` is imported inside `MapView.tsx`, lazy-loading `MapView` automatically splits the CSS into a separate chunk that is only fetched when the map is actually needed.

### Acceptance Criteria

- The gzipped entry JS chunk (the file loaded by `index.html`) is under **80 KB**.
- `maplibre-gl` and `proj4` do not appear in the entry chunk.
- Icons are not inlined in any JS chunk.
- Lighthouse Performance score on simulated mobile 3G improves by at least **10 points**.
- All existing functionality works: map renders, onboarding shows for new users, pins/tracks load, coordinate conversion works for all six systems.
- No new external network requests sit on the critical rendering path.
