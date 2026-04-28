/**
 * Tool Registry
 *
 * Single source of truth for all tool panel metadata.
 *
 * Adding a new tool:
 *   1. Create the content panel in src/components/tools/<Name>Panel.tsx.
 *      It must be a content-only component: no root <div>, no scroll container,
 *      no padding, no title bar. Import data from stores/contexts only.
 *   2. Import it lazily below and add a { id, label, icon, panel } entry to TOOLS.
 *   3. ToolboxModal and DesktopToolsBar will pick it up automatically.
 */

import { lazy, type Component } from 'solid-js';
import type { IconName } from '../ui/Icon';

// Content-only component: no props, no scroll container, no root padding
export type ToolContentPanel = Component<{}>;

export interface ToolDef {
  id: string;           // 'gps' | 'ruler' | 'settings'
  label: string;        // 'GPS / Compass' | 'Ruler' | 'Settings'
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
