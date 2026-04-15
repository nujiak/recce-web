# PLANS.md — Recce Web Implementation Plans

All planned features and refactors live here. Each plan is self-contained — an implementing agent should be able to execute it without any additional context beyond this file, AGENTS.md, and DESIGN.md.

**Rules:**

- Before starting a plan, read it in full.
- When complete, mark it `Status: Done` — do not delete it.
- One plan per section. Use `---` as a separator.

---

## Plan: Map Controls Overhaul

**Status:** Done  
**Branch:** `refactor/map-controls-overhaul`

### Goal

Replace the current scattered map controls (floating `MapStyleToggle` top-left; orphaned `CompassButton` + `LocationButton` top-right; split coordinate pill + action buttons bottom-centre) with a single unified **two-row instrument bar** anchored to the bottom of the map canvas. This removes all floating elements from the map surface and consolidates everything into one bordered HUD panel consistent with DESIGN.md.

### Final Layout

```
╔══════════════════════════════════════════════════════════════╗  ← plot row (isPlotting only)
║  [↩ UNDO]   3 NODES   [+ NODE]         [✓ SAVE]  [✕ CANCEL] ║
╠══════════════════════════════════════════════════════════════╣  ← top row (always)
║  1.37600° N 103.79500° E      [→ GO]   [+ PIN]   [⌇ TRACK]  ║
╠══════════════════════════════════════════════════════════════╣  ← bottom row (always)
║       [⊞ DEFAULT]           [↑ NORTH]           [⊕ LOC]     ║
╚══════════════════════════════════════════════════════════════╝
```

The whole assembly: `position: absolute; bottom: 16px; left: 16px; right: 16px; z-index: 10` on the map canvas.

### Files to touch

- `src/components/map/PlotControls.tsx` — primary rewrite; absorbs logic from the three files below
- `src/components/map/CompassButton.tsx` — logic migrated into PlotControls bottom row; standalone render removed from MapView
- `src/components/map/LocationButton.tsx` — logic migrated into PlotControls bottom row; standalone render removed from MapView
- `src/components/map/MapStyleToggle.tsx` — logic migrated into PlotControls bottom row; standalone render removed from MapView
- `src/components/map/MapView.tsx` — remove `<MapStyleToggle>`, `<CompassButton>`, `<LocationButton>` renders; remove injected attribution CSS override

### Row-by-row specification

#### Plot row (`isPlotting === true` only)

- Rendered above the top row; snaps in/out with `75ms linear` opacity (`opacity: 0` → `1` on mount, `0` on unmount). No slide, no scale — per DESIGN.md §4.
- Button order left-to-right: `UNDO` · `[N NODES label]` · `+ NODE` · `SAVE` · `CANCEL`.
- `UNDO`: disabled (`opacity: 0.3; pointer-events: none`) when node count === 0. On click: remove last node from `plotState.nodes`.
- `N NODES`: not a button — a muted static label, `font-size: 10px; color: var(--color-text-muted); letter-spacing: 0.08em; text-transform: uppercase`. Shows e.g. `3 NODES`. Positioned between UNDO and +NODE, centered in the available space.
- `+ NODE`: always enabled. On click: append current crosshair `{ lat, lng }` to `plotState.nodes`.
- `SAVE`: disabled when node count < 2. On click: open `TrackEditor` pre-filled with plotted nodes (existing behaviour).
- `CANCEL`: always enabled. Existing cancel flow preserved — if node count ≥ 3 show inline discard confirmation (`DISCARD` / `KEEP` buttons replacing the row content); if < 3 exit plot mode immediately.
- All four buttons: `ghost` variant (see Styling rules below).

#### Top row (always visible)

Left section (`flex: 1`, min-width 0):

- Coordinate display — same data as current: system label (`font-size: 10px; color: var(--color-text-muted); letter-spacing: 0.08em; uppercase`) on one line, coordinate value (`font-size: 15px; font-weight: 500; color: var(--color-text); letter-spacing: 0.02em`) on the next. Truncate with `text-overflow: ellipsis; overflow: hidden; white-space: nowrap` on the value line.
- On click: copy coordinate string to clipboard and show existing toast.
- Not a `ghost` button — use `background: transparent; cursor: pointer`. Hover: `background: var(--color-accent-bg)` at `75ms linear`.
- GPS distance/bearing label: when GPS is active and crosshair is not near the user position, show a small muted `DIST · BRG` readout as a single line inside this section, above the system label. Hide entirely (do not reflow) on viewports < 360px wide.

Right section (fixed width, no shrink):

- Three `ghost` buttons in order: `GO TO` · `+ PIN` · `TRACK`.
- `GO TO`: opens existing coordinate-input `<Popover>` (behaviour unchanged). Always enabled.
- `+ PIN`: opens `PinEditor` pre-filled with crosshair coordinates (behaviour unchanged). **Disabled** when `isPlotting === true`.
- `TRACK`: sets `plotState({ active: true })` (behaviour unchanged). **Disabled** when `isPlotting === true`.
- Column separators: `border-left: 1px solid var(--color-border)` on each button.

#### Bottom row (always visible)

Three equal-width `ghost` buttons (`flex: 1` each):

- `MAP STYLE`: icon (`map` or `satellite_alt`) + text label (`DEFAULT` or `SATELLITE`). On click: toggle map style (existing `handleToggleMapStyle` logic). Active state (satellite): `background: var(--color-accent-bg); color: var(--color-accent)`.
- `NORTH`: renders the existing `<Needle>` SVG component (counter-rotates with map bearing). Label: `NORTH` when bearing === 0, or formatted bearing value (e.g. `045.2°` or in mils per prefs) when bearing ≠ 0. On click when bearing ≠ 0: `map.resetNorth()`. On click when bearing === 0: open bearing-input `<Popover>` (existing behaviour). Active state (bearing ≠ 0): `color: var(--color-accent)`.
- `LOCATION`: icon `my_location`. Cycles through GPS states as before (`unavailable` → `available` → `following` → `following-bearing`). `unavailable`: `opacity: 0.5; pointer-events: none`. `following` / `following-bearing`: `background: var(--color-accent-bg); color: var(--color-accent)`.
- Column separators: `border-left: 1px solid var(--color-border)` on the middle and right buttons.

### What to remove / migrate

1. **`MapView.tsx`**:
   - Remove `<MapStyleToggle ... />` JSX.
   - Remove `<CompassButton ... />` JSX.
   - Remove `<LocationButton ... />` JSX.
   - Remove the injected `<style>` block (or inline CSS string) that overrides `.maplibregl-ctrl-top-right` positioning. Restore MapLibre attribution to its default bottom-right position by removing the override; do not add a replacement.
   - Keep all props/state that were passed to those components — they now live in `PlotControls`.

2. **`CompassButton.tsx`**, **`LocationButton.tsx`**, **`MapStyleToggle.tsx`**:
   - Do not delete the files immediately (avoids import errors during migration).
   - After their logic is fully absorbed into `PlotControls.tsx`, delete all three files and remove their imports from `MapView.tsx`.

### Styling rules (DESIGN.md compliance)

- **Outer container**: `background: var(--color-bg-secondary); border: 1px solid var(--color-border)`. No `border-radius` anywhere.
- **Row dividers**: `border-top: 1px solid var(--color-border)` on the top row and bottom row (i.e. the plot row has no top border of its own — the container top border suffices when it is the topmost row).
- **Ghost button** (all interactive controls in this bar):
  - Default: `background: transparent; color: var(--color-text); border: none; min-height: 48px; min-width: 48px; font-size: 13px; font-weight: 400; letter-spacing: 0.08em; text-transform: uppercase; border-radius: 0; cursor: pointer; transition: background 75ms linear, color 75ms linear`.
  - Hover: `background: var(--color-accent-bg); color: var(--color-accent)`.
  - Active/pressed: `opacity: 0.75`.
  - Disabled: `opacity: 0.3; pointer-events: none`.
  - Focus ring: `outline: 1px solid var(--color-accent); outline-offset: 3px`.
- **No box-shadow anywhere** (DESIGN.md §6.3).
- **Active state** (map mode active, GPS following, satellite style): `background: var(--color-accent-bg); color: var(--color-accent)`.

### Responsive behaviour

- **Mobile (< 768px)**: bar sits `16px` above the bottom nav. `left: 16px; right: 16px`. Coordinate value truncates with ellipsis — never wraps. GPS distance/bearing label hidden below 360px.
- **Desktop (≥ 768px)**: bar sits `16px` above the map pane bottom edge. `left: 16px; right: 16px`. Same structure — no layout changes between mobile and desktop for this component.
- Bottom-row buttons always `flex: 1` (equal width).
- Top-row action buttons (`GO TO`, `+ PIN`, `TRACK`) have `min-width: 48px; flex-shrink: 0`. Coordinate area gets all remaining space.

### Verification checklist

After implementation, verify with Chrome MCP tools (`npm run dev` must be running at `http://localhost:5173`):

1. **Mobile screenshot** (viewport ≤ 767px): two-row bar visible at bottom, no floating controls anywhere on the map.
2. **Desktop screenshot** (viewport ≥ 768px): two-row bar visible, no overlap with right sidebar.
3. **Plot mode**: tap `TRACK` → plot row snaps in above top row; `+ PIN` and `TRACK` are visually disabled (opacity 0.3).
4. **Plot row UNDO**: disabled at 0 nodes; enabled after first `+ NODE` tap.
5. **Plot row SAVE**: disabled at 0–1 nodes; enabled at 2+ nodes.
6. **Plot row CANCEL < 3 nodes**: exits plot mode immediately.
7. **Plot row CANCEL ≥ 3 nodes**: shows `DISCARD` / `KEEP` inline confirmation.
8. **NORTH button**: label shows bearing when rotated; click resets north; bearing returns to 0 and label returns to `NORTH`.
9. **NORTH popover**: click when north-up opens bearing input; submitting flies map to entered bearing.
10. **LOCATION button**: cycles states correctly; accent-coloured when following.
11. **MAP STYLE button**: toggles label and map tiles correctly; accent-coloured on satellite.
12. **GO TO popover**: opens, accepts coordinate input, flies to location.
13. **Coordinate display**: tapping copies to clipboard; toast appears.
14. **`tsc --noEmit`**: zero type errors.
15. **No regressions**: existing PinEditor, TrackEditor, and back-nav flows unaffected.
