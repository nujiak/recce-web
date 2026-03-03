import { type Component } from 'solid-js';
import { preferences } from '@/stores/preferences';
import type { CoordSystem, AngleUnit, LengthUnit, Theme } from '@/types';

export const SettingsPanel: Component = () => {
  return (
    <div class="space-y-4">
      <h3 class="flex items-center gap-2 text-lg font-semibold">
        <span class="material-symbols-outlined">settings</span>
        Settings
      </h3>

      <div class="space-y-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium" for="pref-coord-system">
            Coordinate System
          </label>
          <select
            id="pref-coord-system"
            class="w-full px-3 py-2 rounded-lg bg-surface-hover border border-border focus:border-primary outline-none"
            value={preferences.coordSystem()}
            onChange={(e) => preferences.setCoordSystem(e.currentTarget.value as CoordSystem)}
          >
            <option value="WGS84">WGS84</option>
            <option value="UTM">UTM</option>
            <option value="MGRS">MGRS</option>
            <option value="BNG">British National Grid</option>
            <option value="QTH">QTH (Maidenhead)</option>
            <option value="KERTAU">Kertau 1948</option>
          </select>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium" for="pref-angle-unit">
            Angle Unit
          </label>
          <select
            id="pref-angle-unit"
            class="w-full px-3 py-2 rounded-lg bg-surface-hover border border-border focus:border-primary outline-none"
            value={preferences.angleUnit()}
            onChange={(e) => preferences.setAngleUnit(e.currentTarget.value as AngleUnit)}
          >
            <option value="degrees">Degrees (0-360°)</option>
            <option value="mils">NATO Mils (0-6400)</option>
          </select>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium" for="pref-length-unit">
            Length Unit
          </label>
          <select
            id="pref-length-unit"
            class="w-full px-3 py-2 rounded-lg bg-surface-hover border border-border focus:border-primary outline-none"
            value={preferences.lengthUnit()}
            onChange={(e) => preferences.setLengthUnit(e.currentTarget.value as LengthUnit)}
          >
            <option value="metric">Metric (m, km)</option>
            <option value="imperial">Imperial (ft, mi)</option>
            <option value="nautical">Nautical (nm)</option>
          </select>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium" for="pref-theme">
            Theme
          </label>
          <select
            id="pref-theme"
            class="w-full px-3 py-2 rounded-lg bg-surface-hover border border-border focus:border-primary outline-none"
            value={preferences.theme()}
            onChange={(e) => {
              const theme = e.currentTarget.value as Theme;
              preferences.setTheme(theme);
              document.documentElement.setAttribute('data-theme', theme);
            }}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="system">System</option>
          </select>
        </div>
      </div>
    </div>
  );
};
