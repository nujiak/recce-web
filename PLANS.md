# PLANS.md — Recce Web Implementation Plans

All planned features and refactors live here. Each plan is self-contained — an implementing agent should be able to execute it without any additional context beyond this file, AGENTS.md, and DESIGN.md.

**Rules:**

- Before starting a plan, read it in full.
- When complete, mark it `Status: Done`, delete the plan body, and leave only the header.
- One plan per section. Use `---` as a separator.

---

## Plan: SVG Icon Migration

**Status:** Pending
**Branch:** `refactor/svg-icons`

### Goal

Replace the Google Fonts Material Symbols Outlined web font with self-hosted, bundled SVG icons. The font currently causes a flash of unstyled text (FOUT) on slow networks — icon ligature strings such as `settings` and `arrow_downward` render as raw text before the font loads, stretching layouts and degrading UX for first-time visitors. Bundling the icons as SVGs eliminates the external CDN dependency, makes every icon available from the first paint, and adds compile-time type safety.

### Architecture

**Single `Icon` component** at `src/components/ui/Icon.tsx`:

- Statically imports exactly the 31 icons used in the app as raw SVG strings via Vite's `?raw` suffix. No dynamic imports, no lazy loading — 31 small SVGs inline in the bundle is the correct trade-off (~10 KB total, unnoticeable).
- Exports `IconName` — a string union of all 31 valid names — used to type icon fields in config arrays and dynamic patterns.
- Exports a single `Icon` component with props `name: IconName`, `size?: number` (pixels, default `24`), `class?: string`, `style?: JSX.CSSProperties`.
- Renders a `<span class="recce-icon">` with `innerHTML` set to the SVG string. The wrapper span carries `aria-hidden="true"` — all icons in this codebase are decorative; accessible labels belong on the parent interactive elements.
- `width` and `height` are set on the wrapper via the `size` prop; global CSS ensures the inner `<svg>` fills the wrapper.

**Anti-patterns deliberately avoided:**

- No per-icon component files (avoids 31-file proliferation with identical boilerplate).
- No global string-keyed icon registry with dynamic lookup (would defeat tree-shaking and lose type safety).
- No SVG transform plugin (e.g. `vite-plugin-solid-svg`) — the `?raw` import is a built-in Vite feature and sufficient here.
- No runtime `fetch` or dynamic `import()` — every icon must be available synchronously on first paint.

### Step 1 — Install the package

```bash
npm install @material-symbols/svg-200
```

After installing, verify the file naming convention the package uses:

```bash
ls node_modules/@material-symbols/svg-200/outlined/ | head -30
```

The import paths below assume **underscores** (e.g. `add_location.svg`). If the package uses hyphens (e.g. `add-location.svg`), adjust every import path accordingly. The icon names in `IconName` and the `icons` map keys always use underscores regardless of file naming.

Also inspect one SVG to confirm the fill strategy:

```bash
cat node_modules/@material-symbols/svg-200/outlined/settings.svg
```

If paths use `fill="currentColor"` (expected), the global CSS rule below is sufficient. If paths use a hardcoded colour, add `fill: currentColor` to `.recce-icon svg path` as noted in Step 4.

### Step 2 — Add `*.svg?raw` TypeScript declaration

In `src/vite-env.d.ts`, add the following declaration **after** the existing lines:

```ts
declare module '*.svg?raw' {
  const content: string;
  export default content;
}
```

### Step 3 — Create `src/components/ui/Icon.tsx`

Create the file with the following content (all 31 imports, the `IconName` union, the `icons` map, and the component):

```tsx
import type { Component, JSX } from 'solid-js';

import addSvg from '@material-symbols/svg-200/outlined/add.svg?raw';
import addLocationSvg from '@material-symbols/svg-200/outlined/add_location.svg?raw';
import arrowBackSvg from '@material-symbols/svg-200/outlined/arrow_back.svg?raw';
import arrowDownwardSvg from '@material-symbols/svg-200/outlined/arrow_downward.svg?raw';
import bookmarksSvg from '@material-symbols/svg-200/outlined/bookmarks.svg?raw';
import checkSvg from '@material-symbols/svg-200/outlined/check.svg?raw';
import closeSvg from '@material-symbols/svg-200/outlined/close.svg?raw';
import constructionSvg from '@material-symbols/svg-200/outlined/construction.svg?raw';
import contentCopySvg from '@material-symbols/svg-200/outlined/content_copy.svg?raw';
import deleteSvg from '@material-symbols/svg-200/outlined/delete.svg?raw';
import downloadSvg from '@material-symbols/svg-200/outlined/download.svg?raw';
import editSvg from '@material-symbols/svg-200/outlined/edit.svg?raw';
import expandMoreSvg from '@material-symbols/svg-200/outlined/expand_more.svg?raw';
import exploreSvg from '@material-symbols/svg-200/outlined/explore.svg?raw';
import historySvg from '@material-symbols/svg-200/outlined/history.svg?raw';
import locationOnSvg from '@material-symbols/svg-200/outlined/location_on.svg?raw';
import mapSvg from '@material-symbols/svg-200/outlined/map.svg?raw';
import myLocationSvg from '@material-symbols/svg-200/outlined/my_location.svg?raw';
import nearMeSvg from '@material-symbols/svg-200/outlined/near_me.svg?raw';
import openInNewSvg from '@material-symbols/svg-200/outlined/open_in_new.svg?raw';
import paletteSvg from '@material-symbols/svg-200/outlined/palette.svg?raw';
import routeSvg from '@material-symbols/svg-200/outlined/route.svg?raw';
import satelliteAltSvg from '@material-symbols/svg-200/outlined/satellite_alt.svg?raw';
import scheduleSvg from '@material-symbols/svg-200/outlined/schedule.svg?raw';
import settingsSvg from '@material-symbols/svg-200/outlined/settings.svg?raw';
import shareSvg from '@material-symbols/svg-200/outlined/share.svg?raw';
import sortByAlphaSvg from '@material-symbols/svg-200/outlined/sort_by_alpha.svg?raw';
import straightenSvg from '@material-symbols/svg-200/outlined/straighten.svg?raw';
import toggleOffSvg from '@material-symbols/svg-200/outlined/toggle_off.svg?raw';
import toggleOnSvg from '@material-symbols/svg-200/outlined/toggle_on.svg?raw';
import undoSvg from '@material-symbols/svg-200/outlined/undo.svg?raw';

export type IconName =
  | 'add'
  | 'add_location'
  | 'arrow_back'
  | 'arrow_downward'
  | 'bookmarks'
  | 'check'
  | 'close'
  | 'construction'
  | 'content_copy'
  | 'delete'
  | 'download'
  | 'edit'
  | 'expand_more'
  | 'explore'
  | 'history'
  | 'location_on'
  | 'map'
  | 'my_location'
  | 'near_me'
  | 'open_in_new'
  | 'palette'
  | 'route'
  | 'satellite_alt'
  | 'schedule'
  | 'settings'
  | 'share'
  | 'sort_by_alpha'
  | 'straighten'
  | 'toggle_off'
  | 'toggle_on'
  | 'undo';

const icons: Record<IconName, string> = {
  add: addSvg,
  add_location: addLocationSvg,
  arrow_back: arrowBackSvg,
  arrow_downward: arrowDownwardSvg,
  bookmarks: bookmarksSvg,
  check: checkSvg,
  close: closeSvg,
  construction: constructionSvg,
  content_copy: contentCopySvg,
  delete: deleteSvg,
  download: downloadSvg,
  edit: editSvg,
  expand_more: expandMoreSvg,
  explore: exploreSvg,
  history: historySvg,
  location_on: locationOnSvg,
  map: mapSvg,
  my_location: myLocationSvg,
  near_me: nearMeSvg,
  open_in_new: openInNewSvg,
  palette: paletteSvg,
  route: routeSvg,
  satellite_alt: satelliteAltSvg,
  schedule: scheduleSvg,
  settings: settingsSvg,
  share: shareSvg,
  sort_by_alpha: sortByAlphaSvg,
  straighten: straightenSvg,
  toggle_off: toggleOffSvg,
  toggle_on: toggleOnSvg,
  undo: undoSvg,
};

export interface IconProps {
  name: IconName;
  size?: number;
  class?: string;
  style?: JSX.CSSProperties;
}

const Icon: Component<IconProps> = (props) => (
  <span
    class={`recce-icon${props.class ? ` ${props.class}` : ''}`}
    aria-hidden="true"
    style={{
      width: `${props.size ?? 24}px`,
      height: `${props.size ?? 24}px`,
      ...(props.style ?? {}),
    }}
    innerHTML={icons[props.name]}
  />
);

export default Icon;
```

### Step 4 — Add global CSS for `.recce-icon`

In `src/styles/theme.css`, add the following rules inside the existing `@layer base` block (after the `*` reset block is a suitable location):

```css
.recce-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  user-select: none;
  line-height: 0;
}

.recce-icon svg {
  width: 100%;
  height: 100%;
}
```

If the SVG inspection in Step 1 revealed hardcoded fill colours (not `currentColor`), also add:

```css
.recce-icon svg path {
  fill: currentColor;
}
```

### Step 5 — Migrate each file

The `size` prop value for each `Icon` call should match the original `font-size` used in the existing code:

| Original `font-size` | `size` prop |
| -------------------- | ----------- |
| 24px (or omitted)    | omit prop   |
| 20px                 | `20`        |
| 18px                 | `18`        |
| 16px                 | `16`        |

Import `Icon` from `'../ui/Icon'` (adjust relative path per file). Import `IconName` from the same path wherever a config array or `Record` needs it typed.

---

#### `src/components/map/PlotControls.tsx`

All icons are rendered as `<span class="material-symbols-outlined" style={{ 'font-size': '...' }}>name</span>`.

Replace each with `<Icon name="..." />` (include `size` prop only when not 24). Icons: `undo`, `add`, `check`, `close`, `near_me`, `satellite_alt`, `map`, `explore`, `my_location`, `add_location`, `route`.

---

#### `src/components/nav/BottomNav.tsx`

Change the config array's `icon` field type from inferred `string` to `IconName` by importing and annotating:

```ts
import type { IconName } from '../ui/Icon';
// …
const tabs: { key: string; label: string; icon: IconName }[] = [
  { key: 'map',   label: 'MAP',   icon: 'map' },
  { key: 'saved', label: 'SAVED', icon: 'bookmarks' },
  { key: 'tools', label: 'TOOLS', icon: 'construction' },
];
```

Render site:

```tsx
// Before
<span class="material-symbols-outlined" style={{ 'font-size': '24px' }}>
  {tab.icon}
</span>
// After
<Icon name={tab.icon} />
```

---

#### `src/components/nav/ToolboxModal.tsx`

Same pattern. Import `IconName`, type the `TOOL_CARDS` array `icon` field as `IconName`. Replace rendered `{tool.icon}` string spans with `<Icon name={tool.icon} />`. Also replace the fixed `arrow_back` string span with `<Icon name="arrow_back" />`.

---

#### `src/components/nav/DesktopToolsBar.tsx`

Import `IconName`, type the `TOOLS` array `icon` field as `IconName`. Replace `{tool.icon}` with `<Icon name={tool.icon} />`. Remove the `font-family: 'Material Symbols Outlined'` declaration from the `.dtb-tab-icon` CSS class (the class can stay for other styles it carries; only the font-family line is removed).

---

#### `src/components/saved/SavedScreen.tsx`

Change `sortIcons` to use `IconName` values:

```ts
import type { IconName } from '../ui/Icon';

const sortIcons: Record<SortMode, IconName> = {
  'date-new': 'schedule',
  'date-old': 'history',
  'name-asc': 'sort_by_alpha',
  'name-desc': 'sort_by_alpha',
  color: 'palette',
};
```

All render sites for sort icons change from string interpolation to `<Icon>`:

```tsx
// Before: {sortIcons[sortMode()]}
// After:
<Icon name={sortIcons[sortMode()]} />
```

All fixed icon strings rendered inline (`download`, `share`, `straighten`, `delete`, `close`, `check`) become `<Icon name="..." />` with appropriate `size` props matching the original `font-size`. Remove any inline `style={{ 'font-family': ... }}` wrappers.

---

#### `src/components/saved/PinCard.tsx`

Replace the `edit` icon span with `<Icon name="edit" />`.

---

#### `src/components/saved/TrackCard.tsx`

Replace the `edit` icon span with `<Icon name="edit" />`.

---

#### `src/components/pin/PinInfo.tsx`

Replace the `content_copy` icon span with `<Icon name="content_copy" />`.

---

#### `src/components/tools/RulerPanel.tsx`

Replace the `straighten` and `arrow_downward` icon spans with `<Icon name="straighten" />` and `<Icon name="arrow_downward" />`.

---

#### `src/components/settings/SettingsPanel.tsx`

This file uses CSS `font-family: 'Material Symbols Outlined'` on classes `.sp-select-chevron` and `.sp-item-check`, with the icon text content passed as JSX children to Kobalte elements.

For each such element, replace the text content with an `<Icon>` child and remove the `font-family` (and `font-size` if it is only sizing the icon) from the corresponding CSS class. Specifically:

- `.sp-select-chevron` — carries `expand_more`; replace with `<Icon name="expand_more" size={16} />` (verify original `font-size` in the file).
- `.sp-item-check` — carries `check`; replace with `<Icon name="check" />`.
- `toggle_on` / `toggle_off` ternary — change the string ternary to `<Icon name={props.value ? 'toggle_on' : 'toggle_off'} />`.
- `open_in_new` — replace the string span with `<Icon name="open_in_new" />`.

Read the full file before editing to confirm all icon occurrences and their CSS classes.

---

#### `src/components/CompassPermissionDialog.tsx`

The inline feature list uses an array of `[iconName, description]` pairs. Type the icon entries as `IconName`:

```ts
import type { IconName } from '../ui/Icon';

const features: [IconName, string][] = [
  ['near_me',     'Rotating the map to match your heading'],
  ['explore',     'Showing live azimuth, pitch, and roll…'],
  ['location_on', 'Orienting the directional arc…'],
];
```

Replace `{icon}` rendered as text with `<Icon name={icon} />`. Replace the fixed `explore` span at the top with `<Icon name="explore" />`.

---

#### `src/components/ui/Select.tsx`

- In the `.ui-select-icon` CSS block, remove `font-family: 'Material Symbols Outlined', sans-serif` and the `font-size` line (sizing is now controlled by the `Icon` `size` prop).
- Change the Select.Icon content:

```tsx
// Before
<Select.Icon class="ui-select-icon">expand_more</Select.Icon>
// After
<Select.Icon class="ui-select-icon"><Icon name="expand_more" size={20} /></Select.Icon>
```

---

#### `src/components/ui/Dialog.tsx`

- In the `.ui-dialog-close` CSS block, remove `font-family: 'Material Symbols Outlined', sans-serif` and the `font-size` line.
- Change the close button content:

```tsx
// Before
<Dialog.CloseButton class="ui-dialog-close" aria-label="Close">
  close
</Dialog.CloseButton>
// After
<Dialog.CloseButton class="ui-dialog-close" aria-label="Close">
  <Icon name="close" size={18} />
</Dialog.CloseButton>
```

---

#### `src/components/ui/Accordion.tsx`

- In the `.ui-accordion-chevron` CSS block, remove `font-family: 'Material Symbols Outlined', sans-serif` and the `font-size` line. The `transition: transform` and `color` rules must stay — they still apply to the `Icon` component's wrapper span.
- Change the chevron span:

```tsx
// Before
<span class="ui-accordion-chevron" aria-hidden="true">
  expand_more
</span>
// After
<Icon name="expand_more" class="ui-accordion-chevron" size={18} />
```

Note: `aria-hidden` is already handled by the `Icon` component internally, so it does not need to be added as a prop.

---

### Step 6 — Remove the icon font link from `src/index.html`

Delete the `<!-- Icons -->` comment and its `<link>` tag:

```html
<!-- Icons -->
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
/>
```

Leave the `<link rel="preconnect">` tags and the IBM Plex Mono `<link>` tag intact — they are still needed for the app font.

The Workbox runtime cache entries for `fonts.googleapis.com` and `fonts.gstatic.com` in `vite.config.ts` should also be kept — they still serve IBM Plex Mono.

### Step 7 — Verify

```bash
npx tsc --noEmit   # zero type errors required
npm run build      # production build must succeed
```

After `npm run dev`, use Chrome MCP tools to verify:

1. Mobile screenshot (viewport < 768 px) — all icons render with correct shapes immediately on load; no raw text strings visible anywhere.
2. Desktop screenshot (viewport ≥ 768 px) — same.
3. Icons inherit colour correctly in all states: default, accent (active/selected), muted, disabled.
4. CSS-animated chevrons (Select dropdown, Accordion) still rotate on open/close via the `transform` rule on their class.
5. `tsc --noEmit` produces zero errors.
6. `npm run build` succeeds with no warnings about unresolved SVG paths.
