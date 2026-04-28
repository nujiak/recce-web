# PLANS.md — Recce Web Implementation Plans

All planned features and refactors live here. Each plan is self-contained — an implementing agent should be able to execute it without any additional context beyond this file, AGENTS.md, and DESIGN.md.

**Rules:**

- Before starting a plan, read it in full.
- When complete, mark it `Status: Done`, delete the plan body, and leave only the header.
- One plan per section. Use `---` as a separator.

---

## Plan: Unified Tool Panel Layout

**Status:** Done
**Branch:** `refactor/unified-tool-layout`

---

## Plan: SVG Icon Migration

**Status:** Done
**Branch:** `refactor/svg-icons`

---

## Plan: Touch-Target Optimisation

**Status:** Pending
**Branch:** `fix/touch-targets`

### Goal

The app is used in the field where precise touch is not always possible (gloves, rain, shaky hands). Audit and enlarge every interactive element that falls below a **48 × 48 px** minimum touch target. Where enlarging creates clutter, rearrange the UI to keep it neat and intuitive.

### Context for Implementing Agent

- Base interactive primitive is `src/components/ui/Button.tsx` — it already enforces `min-width: 48px; min-height: 48px` on `.ui-btn`. **However**, many components override these values inline or bypass Button entirely.
- `src/components/ui/TextField.tsx` is the base input primitive.
- `src/components/ui/Select.tsx` is the base dropdown primitive.
- `src/components/ColorPicker.tsx` is a standalone primitive used in PinEditor and TrackEditor.
- Map interactions go through MapLibre GL JS; marker and track hit targets are controlled by layer config, not DOM.

---

### 1. TextField — All text inputs are too short

**Files:** `src/components/ui/TextField.tsx`

**Problem:**
- `.ui-tf-input` has `padding: 0.5rem 0.75rem` (8 px vertical) and `font-size: 14px`. Computed height is ~39 px, well under 48 px.
- Same issue for `.ui-tf-textarea` (though multiline is less critical).
- This affects **every screen**: Saved search, Pin Editor (Name, Coordinate, Group), Track Editor, Go-To popover, Compass popover, Settings panel, Onboarding, Import box.

**Direction:**
- Increase vertical padding to at least `0.75rem` (12 px) or add `min-height: 48px` to `.ui-tf-input`.
- Verify the change does not blow out desktop layouts; the component is used in both panes.
- Do **not** change horizontal padding unless necessary — horizontal space is already tight in mobile dialogs.

---

### 2. ColorPicker — Swatches are 28 × 28 px

**Files:** `src/components/ui/TextField.tsx` (indirectly), `src/components/ColorPicker.tsx`, `src/components/pin/PinEditor.tsx`

**Problem:**
- `ColorPicker` renders 28 × 28 px circular buttons. That's far below 48 px.
- In `PinEditor`, the marker-picker dialog also has custom color/arrow swatches (~36–40 px image + 8 px padding = ~52 px, borderline but the picker trigger button itself is only ~42 px tall).

**Direction:**
- Enlarge `ColorPicker` swatches to **44 × 44 px** minimum (ideally 48 px). Keep them circular if desired, but the hit area must be 48 px.
- In `PinEditor`, ensure the **"Choose Marker" trigger button** (the row showing current color + type) has `min-height: 48px` and adequate vertical padding.
- In the marker-picker dialog, the 5 color swatch rows should each have `min-height: 48px` and generous gap (`gap: 12px`).

---

### 3. MapLibre Attribution Controls

**Files:** `src/components/map/MapView.tsx`

**Problem:**
- The MapLibre attribution toggle (`i` button) is **24 × 24 px**.
- Attribution links (OpenFreeMap, OpenStreetMap, etc.) are tiny text links that are nearly impossible to tap accurately.

**Direction:**
- Override MapLibre CSS to enlarge the attribution toggle to at least **48 × 48 px**.
- Alternatively, replace the compact attribution with a custom full-width button that opens a modal dialog with attribution text. This keeps the map clean and the links tappable.
- If keeping the native control, add a transparent padded overlay around the toggle to increase the hit area without changing the visual size.

---

### 4. Map Marker Hit Targets

**Files:** `src/components/map/PinMarkers.tsx`

**Problem:**
- **Pin markers** (DOM-based) are 48 × 48 px — exactly at minimum, no margin for error with gloves.
- **Arrow markers** (symbol layer) use a 36 × 48 px source image at `icon-size: 0.8`, giving a rendered hit area of roughly **29 × 38 px**. Far too small.

**Direction:**
- Increase pin marker element size to **56 × 56 px** (update `img.width/height` and scale the icon asset if needed).
- For arrow markers, either:
  - Increase `icon-size` to `1.0` or `1.2` (36 px → 43–50 px tall), **or**
  - Add a separate transparent symbol layer with a larger invisible icon (e.g., 64 × 64 px transparent PNG at `icon-size: 1.0`) that captures clicks and routes them to the arrow beneath.
- Ensure the click handler on the transparent layer delegates to the same `onArrowClick` logic.

---

### 5. Map Track Hit Targets

**Files:** `src/components/map/TrackLayers.tsx`

**Problem:**
- The visible track line layer uses `line-width: 3`. A 3 px-wide strip is impossible to tap with a finger, let alone a glove.

**Direction:**
- Add a second transparent line layer on top of each visible track line:
  - Same source, same geometry.
  - `line-width: 24` (or at least 16).
  - `line-opacity: 0`.
  - Attach the click handler to the transparent layer.
- Alternatively, if MapLibre supports `line-hit-width` or similar, use that. Otherwise the duplicate layer is the standard approach.

---

### 6. GPS Panel — Copy Coordinates Button Stripped

**Files:** `src/components/tools/GpsPanel.tsx`

**Problem:**
- The coordinate display is rendered as a `Button variant="ghost"` but with inline styles that strip all padding and min-height:
  ```
  padding: '0',
  'min-height': 'unset',
  ```
- Result is a text-only button ~18–20 px tall.

**Direction:**
- Remove the `padding: 0` and `min-height: unset` overrides.
- Keep `justify-content: flex-start` so text stays left-aligned.
- Ensure the button still looks like a readout, not a bulky button. `padding: 12px 8px` with `min-height: 48px` should work.

---

### 7. Ruler Panel — Cramped Rows and Tiny Icons

**Files:** `src/components/tools/RulerPanel.tsx`

**Problem:**
- Point list has `gap: 4px`. Very tight for field use.
- Leg-row arrow icon is `size={14}`. Decorative, but illegible at arm's length.
- Point rows themselves have `padding: 8px`, which with `min-height: 48px` is OK, but the number badge is only 20 × 20 px.

**Direction:**
- Increase list `gap` to **12 px**.
- Increase leg-row icon to at least **20 px** (24 px preferred).
- Increase the numbered badge to **28 × 28 px** minimum (32 px preferred) with `font-size: 14px`.

---

### 8. Toast Action Buttons

**Files:** `src/components/ui/Toast.tsx`

**Problem:**
- Toast action button has `padding: 0.2rem 0.65rem`, `font-size: 11px`. Computed height is ~20 px.

**Direction:**
- Increase to at least `padding: 0.5rem 1rem` and `font-size: 13px` to hit 48 px height.
- Alternatively, if the toast width becomes an issue, make the **entire toast row** tappable to dismiss and keep the action button as a secondary inline button with 48 px min-height.

---

### 9. Desktop Sidebar — Resize Handle and Tabs

**Files:** `src/components/nav/DesktopToolsBar.tsx`

**Problem:**
- Resize handle is **16 px** wide. On a touchscreen Surface Pro / iPad, this is very hard to grab.
- Tool tabs are **56 px** wide. They pass the 48 px rule, but horizontally tight for thumb use.

**Direction:**
- Widen the resize handle to **24 px** (visual) with an extra 8 px transparent padding on either side for a 40 px grab zone. Or simply make the handle 32 px wide.
- Increase tab width to **72 px** minimum. This gives more room for the icon and label.
- If tab labels become cramped, hide the label and show only the icon on narrow tabs, with a tooltip on hover/focus.

---

### 10. Saved Screen — Toolbar Button Density

**Files:** `src/components/saved/SavedScreen.tsx`, `src/components/saved/PinCard.tsx`, `src/components/saved/TrackCard.tsx`

**Problem:**
- Search + Import + Sort buttons sit in a single row with `gap: 4px`.
- Multi-select action bar (Share, Add to Ruler, Delete, Cancel) uses `gap: 8px`.
- Card edit buttons are exactly 48 × 48 px but flush against the card edge.
- Sort dropdown menu items (`sort-menu-item`) have `padding: 0.4rem 0.625rem` — computed height ~36 px.

**Direction:**
- Increase the search row `gap` to **12 px**.
- Increase multi-select action bar `gap` to **12 px**. Consider adding text labels below the icons on the bar if vertical space allows, or use a bottom-sheet style action bar on mobile.
- Increase sort dropdown trigger padding to ensure it's comfortably >48 px (it likely already is, but verify).
- **Sort dropdown items**: increase `padding` to `0.75rem 0.625rem` (min-height 48 px).
- Consider making the **entire PinCard/TrackCard** tappable for "info" and keeping the edit button as a secondary action, rather than having two separate small hit areas side-by-side.

---

### 11. PinInfo — Coordinate Copy Buttons

**Files:** `src/components/pin/PinInfo.tsx`

**Problem:**
- 6 coordinate rows each have a small copy icon button (48 × 48 px, exactly at minimum) crammed at the right edge of a dense list.
- The row itself (`min-height: 48px`) is tappable only for viewing, not copying.

**Direction:**
- **Rearrangement idea**: Make the **entire coordinate row** tappable to copy. Show the copy icon as a visual affordance, not a separate button. This:
  - Enlarges the copy hit target from 48 × 48 to the full row width (~300 px).
  - Reduces clutter (6 small buttons become 0).
  - Keeps the UI cleaner.
- If keeping separate buttons, ensure the row `min-height` is at least **56 px** to give the button breathing room.

---

### 12. PlotControls — Confirmation State and Popovers

**Files:** `src/components/map/PlotControls.tsx`

**Problem:**
- The "DISCARD TRACK?" inline confirmation uses small text (`font-size: 10px`) and ghost buttons.
- The Go-To and Compass popover inputs are `TextField`s that inherit the 39 px height issue.

**Direction:**
- Increase the discard confirmation text to `font-size: 12px` minimum.
- Ensure the DISCARD and KEEP buttons in the confirmation row span the full 64 px row height (they already use `ghostBase` with `min-height: 52px`, but should stretch to the row).
- Fix the TextField height in popovers via the global TextField change (see §1).

---

### 13. Settings Panel / Select Dropdown Items

**Files:** `src/components/ui/Select.tsx`, `src/components/settings/SettingsPanel.tsx`

**Problem:**
- Visual audit measured Settings dropdown rows at **43 px** tall — just under 48 px.
- `.ui-select-item` has `min-height: 48px` but `padding: 0 12px`. If box-sizing is content-box and content is small, it might compute slightly under 48 px in some browsers.

**Direction:**
- Add `box-sizing: border-box` to `.ui-select-item` and ensure `min-height: 48px` is respected.
- Add `padding: 12px` vertically (currently `padding: 0 12px`) so items feel spacious.
- Increase the Select trigger `min-height` from 48 px to **52 px** for consistency with other inputs after the TextField fix.

---

### Implementation Order (Recommended)

1. **TextField** (§1) — single-file change, highest impact because it fixes every input in the app.
2. **ColorPicker** (§2) — single-file change, affects editor UX.
3. **Select** (§13) — single-file change, affects onboarding and settings.
4. **Map markers & tracks** (§4, §5) — MapLibre layer changes.
5. **Map attribution** (§3) — CSS override or custom modal.
6. **GpsPanel, RulerPanel, Toast** (§6, §7, §8) — panel-level fixes.
7. **SavedScreen, PinInfo** (§10, §11) — layout rearrangement.
8. **DesktopToolsBar** (§9) — desktop-only touch improvements.
9. **PlotControls** (§12) — confirmation state polish.

### Testing Requirements

- Test on **mobile viewport** (375 × 812) and **desktop viewport** (1280 × 800).
- Verify that no interactive element is smaller than 48 × 48 px using Chrome DevTools element inspector.
- Test map marker and track tapping on a touch device or emulated touch.
- Run `tsc --noEmit` after all changes.
- Ensure no layout regressions in dialogs (which are width-constrained on mobile).
