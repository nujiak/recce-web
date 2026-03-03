import { Component } from 'solid-js';
import { usePrefs } from '../../context/PrefsContext';
import type { CoordinateSystem, AngleUnit, LengthUnit, Theme } from '../../types';

const selectStyle = {
  background: 'var(--color-bg-secondary)',
  color: 'var(--color-text)',
  border: '1px solid var(--color-border)',
  'border-radius': 'var(--radius-sm)',
  padding: '6px 8px',
};

const SettingsPanel: Component = () => {
  const [prefs, setPrefs] = usePrefs();

  return (
    <div class="settings-panel" style={{ padding: '16px', display: 'flex', 'flex-direction': 'column', gap: '16px' }}>
      <h2 style={{ 'font-size': '1rem', 'font-weight': '600' }}>Settings</h2>

      <label for="setting-coord" style={{ display: 'flex', 'flex-direction': 'column', gap: '4px' }}>
        <span style={{ 'font-size': '0.75rem', color: 'var(--color-text-secondary)' }}>Coordinate System</span>
        <select
          id="setting-coord"
          name="coordinateSystem"
          value={prefs.coordinateSystem}
          onChange={(e) => setPrefs('coordinateSystem', e.currentTarget.value as CoordinateSystem)}
          style={selectStyle}
        >
          <option value="WGS84">WGS84</option>
          <option value="UTM">UTM</option>
          <option value="MGRS">MGRS</option>
          <option value="BNG">BNG</option>
          <option value="QTH">QTH</option>
          <option value="KERTAU">KERTAU</option>
        </select>
      </label>

      <label for="setting-angle" style={{ display: 'flex', 'flex-direction': 'column', gap: '4px' }}>
        <span style={{ 'font-size': '0.75rem', color: 'var(--color-text-secondary)' }}>Angle Unit</span>
        <select
          id="setting-angle"
          name="angleUnit"
          value={prefs.angleUnit}
          onChange={(e) => setPrefs('angleUnit', e.currentTarget.value as AngleUnit)}
          style={selectStyle}
        >
          <option value="degrees">Degrees</option>
          <option value="mils">Mils</option>
        </select>
      </label>

      <label for="setting-length" style={{ display: 'flex', 'flex-direction': 'column', gap: '4px' }}>
        <span style={{ 'font-size': '0.75rem', color: 'var(--color-text-secondary)' }}>Length Unit</span>
        <select
          id="setting-length"
          name="lengthUnit"
          value={prefs.lengthUnit}
          onChange={(e) => setPrefs('lengthUnit', e.currentTarget.value as LengthUnit)}
          style={selectStyle}
        >
          <option value="metric">Metric</option>
          <option value="imperial">Imperial</option>
          <option value="nautical">Nautical</option>
        </select>
      </label>

      <label for="setting-theme" style={{ display: 'flex', 'flex-direction': 'column', gap: '4px' }}>
        <span style={{ 'font-size': '0.75rem', color: 'var(--color-text-secondary)' }}>Theme</span>
        <select
          id="setting-theme"
          name="theme"
          value={prefs.theme}
          onChange={(e) => setPrefs('theme', e.currentTarget.value as Theme)}
          style={selectStyle}
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
          <option value="system">System</option>
        </select>
      </label>
    </div>
  );
};

export default SettingsPanel;
