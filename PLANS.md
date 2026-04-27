# PLANS.md — Recce Web Implementation Plans

All planned features and refactors live here. Each plan is self-contained — an implementing agent should be able to execute it without any additional context beyond this file, AGENTS.md, and DESIGN.md.

**Rules:**

- Before starting a plan, read it in full.
- When complete, mark it `Status: Done`, delete the plan body, and leave only the header.
- One plan per section. Use `---` as a separator.

---

## Plan: Unified Tool Panel Layout

**Status:** Pending
**Branch:** `refactor/unified-tool-layout`

### Problem

The three tool panels (`GpsPanel`, `RulerPanel`, `SettingsPanel`) each define their own outer padding, headers, scroll containers, and background shapes. When rendered side-by-side in the desktop toolbar or sequentially in the mobile toolbox modal, the visual rhythm is jarring:
- `GpsPanel` uses floating cards with no panel-level header
- `RulerPanel` has its own `"RULER"` header and different scroll handling
- `SettingsPanel` uses edge-to-edge cards with its own root padding

This causes the desktop toolbar (where all tools sit in a common resizable sidebar) to look messy and uncoordinated.

### Solution

Introduce a **single `ToolPanelShell`** component that owns the frame (header, body scroll, padding). Refactor every tool panel to be **content-only** — they render only cards, rows, and sections, never their own root `<div>`, title bar, or scroll container.

In addition, introduce a **Tool Registry** (`src/components/tools/toolRegistry.ts`) that maps tool IDs to their metadata (icon, label, panel component) so `ToolboxModal` and `DesktopToolsBar` can iterate tools without duplicating lists.

---

### 1. Architecture

```
tools/
├── ToolPanelShell.tsx      # NEW — frame component (header + scrollable body)
├── ToolPanelContent.tsx    # NEW — type alias: content-only component signature
├── toolRegistry.ts         # NEW — metadata + lazy component map
├── GpsPanel.tsx            # REFACTORED — content only
├── RulerPanel.tsx          # REFACTORED — content only
└── SettingsPanel.tsx       # REFACTORED — content only
```

**`ToolPanelShell` responsibilities:**
- Render a panel header with:
  - An optional icon (from `Icon`)
  - The tool label (from registry)
  - An optional slot for action buttons passed from the host
- On mobile: render a back button (arrow icon) that calls `onClose`
- Provide a scrollable body with `overflow-y: auto` and `flex: 1`
- Apply **zero** outer background/colour — it inherits from the host (`ToolboxModal` or `DesktopToolsBar`)
- Apply **zero** content padding inside the body; child panels bring their own internal padding via cards

**Content panel responsibilities:**
- Do NOT wrap in a root `<div>` with `overflow`, `height: 100%`, or outer padding
- Use `panel-header` class for section headers (already a convention in `SettingsPanel` and `RulerPanel`)
- Use a shared `ToolCard` primitive for grouped content (extracted from `SettingsPanel.GroupCard`)
- Content panels receive no props (they pull their own data from stores/contexts)

---

### 2. Tool Registry

Create `src/components/tools/toolRegistry.ts`:

```ts
import { lazy, type Component } from 'solid-js';
import type { IconName } from '../ui/Icon';

// Content-only component: no props, no scroll container, no root padding
export type ToolContentPanel = Component<{}>;

export interface ToolDef {
  id: string;           // 'gps' | 'ruler' | 'settings'
  label: string;        // 'GPS/Compass' | 'Ruler' | 'Settings'
  icon: IconName;       // 'satellite_alt' | 'straighten' | 'settings'
  panel: ToolContentPanel;
}

const LazyGpsPanel = lazy(() => import('./GpsPanel'));
const LazyRulerPanel = lazy(() => import('./RulerPanel'));
const LazySettingsPanel = lazy(() => import('../settings/SettingsPanel'));

export const TOOLS: ToolDef[] = [
  { id: 'gps',      label: 'GPS / Compass', icon: 'satellite_alt', panel: LazyGpsPanel },
  { id: 'ruler',    label: 'Ruler',         icon: 'straighten',    panel: LazyRulerPanel },
  { id: 'settings', label: 'Settings',      icon: 'settings',      panel: LazySettingsPanel },
];

export function getTool(id: string): ToolDef | undefined {
  return TOOLS.find((t) => t.id === id);
}
```

**Why a registry:**
- `ToolboxModal` currently duplicates the `TOOL_CARDS` array.
- `DesktopToolsBar` currently defines its own `TOOLS` array with a different shape.
- A single registry eliminates drift and makes adding a new tool a one-line change.

**Exception:** `DesktopToolsBar` also includes `'saved'` as a tab. It should continue to handle `'saved'` as a special case outside the tool registry since Saved is not a tool panel in the mobile flow.

---

### 3. Component: `ToolPanelShell`

Create `src/components/tools/ToolPanelShell.tsx`:

```tsx
import { type Component, type JSX, Show } from 'solid-js';
import { useUI } from '../../context/UIContext';
import Icon from '../ui/Icon';
import type { IconName } from '../ui/Icon';

interface ToolPanelShellProps {
  title: string;
  icon?: IconName;
  actions?: JSX.Element;      // e.g. Ruler "Clear All" button
  children: JSX.Element;
  onClose?: () => void;       // Back button shown when provided (mobile)
}

const ToolPanelShell: Component<ToolPanelShellProps> = (props) => {
  return (
    <div class="tool-panel-shell" style={{ display: 'flex', 'flex-direction': 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        'align-items': 'center',
        gap: '8px',
        padding: '12px 16px',
        'border-bottom': '1px solid var(--color-border)',
        background: 'var(--color-bg-secondary)',
        'flex-shrink': 0,
      }}>
        <Show when={props.onClose}>
          <button aria-label="Back" onClick={props.onClose!} class="icon-btn">
            <Icon name="arrow_back" size={20} />
          </button>
        </Show>
        <Show when={props.icon}>
          <Icon name={props.icon!} size={20} />
        </Show>
        <span style={{ 'font-size': '0.875rem', 'font-weight': 500, flex: 1 }}>{props.title}</span>
        <Show when={props.actions}>
          <div style={{ display: 'flex', gap: '8px' }}>{props.actions}</div>
        </Show>
      </div>

      {/* Body */}
      <div style={{ flex: 1, 'overflow-y': 'auto', 'min-height': 0 }}>
        <div style={{ padding: '16px', display: 'flex', 'flex-direction': 'column', gap: '16px' }}>
          {props.children}
        </div>
      </div>
    </div>
  );
};

export default ToolPanelShell;
```

Open questions for the implementing agent:
- The back button should use the existing `Button variant="icon"` component instead of a raw `<button>` if it exists and matches the icon-btn pattern.
- Verify `var(--color-bg-secondary)` and `var(--color-border)` are valid tokens; if not, use the closest Tailwind equivalent or document the missing token in `DESIGN.md`.

---

### 4. Refactor Existing Panels

Each panel must drop its own root container, header, and scroll handling. They should all return a `JSX.Element` fragment containing only the cards/rows.

#### 4a. `GpsPanel.tsx`

- Remove outer `<div style={{ padding: '16px', overflow-y: 'auto' }}>`.
- Remove the `"LOCATION"` and `"COMPASS"` header `<div>` elements — instead wrap each section in `ToolCard` + `SectionHeader` (see 4d).
- Keep all internal readout grids, coordinate buttons, and `CompassNeedle`; just drop the outer frame.
- The iOS compass enable button can stay inside the card body.

#### 4b. `RulerPanel.tsx`

- Remove the outer `<div style={{ flex-direction: 'column', height: '100%', overflow: 'hidden' }}>`.
- Remove the `"RULER"` header `<div>` — `ToolPanelShell` owns the title now.
- Move the `"Clear All"` button from inside the body into a prop supplied by the host (`ToolboxModal` / `DesktopToolsBar`) via the `actions` slot.
  - The host knows `points().length > 0` by importing from `ruler` store; if not convenient, keep the button inside the body but style it as a ghost button aligned to the end.
- Remove root padding; the shell provides it.

#### 4c. `SettingsPanel.tsx`

- Remove the outer `<div class="settings-panel" style={{ padding: '16px', overflow-y: 'auto' }}>`.
- Keep the `GroupCard`, `SectionHeader`, `SettingSelectRow`, `SettingToggleRow`, and `SettingLinkRow` internal primitives — these are fine as reusable UI atoms.
- Keep the `<style>{styles}</style>` injection; it is scoped to the settings panel and doesn't affect layout.
- Because `SettingsPanel` lives in `src/components/settings/`, consider whether it belongs in the tool registry. **Keep it in the registry** — it is a tool panel on both mobile and desktop.

#### 4d. Shared primitives — move them into `src/components/tools/`

Extract these from `SettingsPanel` and make them available to all tool panels:

```tsx
// src/components/tools/ToolCard.tsx
export const ToolCard: Component<{ children: JSX.Element }> = (props) => (
  <div style={{
    background: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border)',
    'border-radius': '0px',
    overflow: 'hidden',
  }}>
    {props.children}
  </div>
);

export const SectionHeader: Component<{ label: string }> = (props) => (
  <div class="panel-header" style={{
    'font-size': '11px',
    'letter-spacing': '0.10em',
    'text-transform': 'uppercase',
    color: 'var(--color-text-secondary)',
    padding: '6px 12px 6px 9px',
    'border-bottom': '1px solid var(--color-border)',
    background: 'var(--color-bg-secondary)',
  }}>
    {props.label}
  </div>
);

export const RowDivider = () => (
  <div style={{ height: '1px', background: 'var(--color-border-subtle)', margin: '0 14px' }} />
);
```

Update `SettingsPanel` and `GpsPanel` to import these from `ToolCard.tsx` instead of declaring them locally.

---

### 5. Update Host Containers

#### 5a. `ToolboxModal`

- Import `ToolPanelShell`, `TOOLS`, `getTool` from `toolRegistry`.
- Remove the duplicated `TOOL_CARDS` array and the duplicated mobile header (back button + title).
- The modal layer stays: `position: absolute`, `inset: 0`, `z-index: 10`.
- For `activeTool() !== null`, render:
  ```tsx
  <ToolPanelShell
    title={tool.label}
    icon={tool.icon}
    onClose={() => setActiveTool(null)}
    actions={ /* optional: Clear All for ruler */ }
  >
    <tool.panel />
  </ToolPanelShell>
  ```
- For `activeTool() === null`, keep the grid of tool launchers (icon + label) — this grid is NOT inside `ToolPanelShell`.

#### 5b. `DesktopToolsBar`

- Import `ToolPanelShell`, `TOOLS` from `toolRegistry`.
- In the panel body, replace the per-tool absolute overlays with a single `ToolPanelShell` that renders the active tool's content.
- The `TOOL_CARDS` / `TOOLS` array in `DesktopToolsBar` should change to:
  ```ts
  const TOOLS: { id: ToolId; label: string; icon: IconName }[] = [
    { id: 'saved', label: 'Saved', icon: 'bookmarks' },
    ...TOOL_REGISTRY_TOOLS.map(t => ({ id: t.id as ToolId, label: t.label, icon: t.icon })),
  ];
  ```
  Or, more simply, inline the saved tab and import the tool metadata.
- Keep the resize handle, tab strip, and width logic unchanged — only the inner panel rendering changes.
- The `SavedScreen` remains a special case rendered outside the `ToolPanelShell`.

---

### 6. Back-Navigation Impact

The back-navigation layers in `App.tsx` rely on `activeTool` to close the tool detail view on mobile (`activeNav === 'tools' && activeTool() !== null`). This logic does **not** change, because `activeTool` still controls which panel is visible.

No changes needed in `App.tsx` for back navigation.

---

### 7. Styling Standards

After the refactor, every tool panel must follow these rules:

| Rule | Violation before | After |
|------|------------------|-------|
| No root `<div>` with `height: 100%` or `overflow` | RulerPanel, SettingsPanel | Content panels are fragments or shallow wrappers |
| No panel-level padding | GpsPanel, SettingsPanel | Only `ToolPanelShell` applies padding |
| No panel-level title bar | GpsPanel, RulerPanel | Only `ToolPanelShell` renders the title |
| Use `ToolCard` + `SectionHeader` for grouped sections | RulerPanel (flat list) | All panels use cards for logical groupings |
| `panel-header` class on section headers | Already used in RulerPanel, SettingsPanel | Continue using it (used by `SectionHeader`) |

---

### 8. Testing Checklist (Chrome MCP)

Run `npm run dev` and verify at `http://localhost:5173`:

1. **Mobile viewport (375×812)**
   - [ ] Tap Tools tab → grid shows 3 tools with correct icons/labels.
   - [ ] Tap GPS → panel opens with back arrow, title "GPS / Compass", and two cards (LOCATION, COMPASS).
   - [ ] Tap back → returns to grid.
   - [ ] Tap Ruler → panel opens with title "Ruler", empty state card.
   - [ ] Add points via Saved multi-select → Ruler list appears in a card, total at bottom.
   - [ ] Tap Settings → panel opens with title "Settings", cards for Display, Map, About.
   - [ ] Swipe/scroll inside each panel works; no double scrollbars.

2. **Desktop viewport (1280×800)**
   - [ ] Sidebar shows Saved + 3 tool tabs.
   - [ ] Click GPS tab → panel title "GPS / Compass" appears, cards correctly laid out.
   - [ ] Click Ruler tab → same consistent frame, content scrollable.
   - [ ] Click Settings tab → same consistent frame.
   - [ ] Resize sidebar → no layout glitches, content reflows.
   - [ ] Switch between tools rapidly → no flashing, smooth opacity transition preserved.

3. **Cross-regression**
   - [ ] Onboarding still blocks map until complete.
   - [ ] Back button (browser) on mobile correctly closes tool detail → grid → map.
   - [ ] `npm run build` passes with no TypeScript errors.

---

### 9. Rollout Order

1. Create `toolRegistry.ts` and `ToolPanelShell.tsx`.
2. Extract `ToolCard.tsx` / `SectionHeader` / `RowDivider` from `SettingsPanel`.
3. Refactor `GpsPanel` → content only, use `ToolCard`.
4. Refactor `RulerPanel` → content only, use `ToolCard`.
5. Refactor `SettingsPanel` → content only, import shared primitives.
6. Update `ToolboxModal` → use `ToolPanelShell` + registry.
7. Update `DesktopToolsBar` → use `ToolPanelShell` + registry.
8. Run typecheck and dev server; verify both viewports.
9. Mark plan as Done in PLANS.md.

**Estimated effort:** ~2–3 hours.

---

## Plan: SVG Icon Migration

**Status:** Done
**Branch:** `refactor/svg-icons`
