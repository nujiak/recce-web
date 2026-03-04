import { Component } from 'solid-js';
import { usePrefs } from '../../context/PrefsContext';
import { SYSTEM_NAMES } from '../../coords/index';
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

      <label style={{ display: 'flex', 'flex-direction': 'column', gap: '4px' }}>
        <span style={{ 'font-size': '0.75rem', color: 'var(--color-text-secondary)' }}>Coordinate System</span>
        <select
          name="coordinateSystem"
          value={prefs.coordinateSystem}
          onChange={(e) => setPrefs('coordinateSystem', e.currentTarget.value as CoordinateSystem)}
          style={selectStyle}
        >
          <option value="WGS84">{SYSTEM_NAMES.WGS84}</option>
          <option value="UTM">{SYSTEM_NAMES.UTM}</option>
          <option value="MGRS">{SYSTEM_NAMES.MGRS}</option>
          <option value="BNG">{SYSTEM_NAMES.BNG}</option>
          <option value="QTH">{SYSTEM_NAMES.QTH}</option>
          <option value="KERTAU">{SYSTEM_NAMES.KERTAU}</option>
        </select>
      </label>

      <label style={{ display: 'flex', 'flex-direction': 'column', gap: '4px' }}>
        <span style={{ 'font-size': '0.75rem', color: 'var(--color-text-secondary)' }}>Angle Unit</span>
        <select
          name="angleUnit"
          value={prefs.angleUnit}
          onChange={(e) => setPrefs('angleUnit', e.currentTarget.value as AngleUnit)}
          style={selectStyle}
        >
          <option value="degrees">Degrees</option>
          <option value="mils">Mils</option>
        </select>
      </label>

      <label style={{ display: 'flex', 'flex-direction': 'column', gap: '4px' }}>
        <span style={{ 'font-size': '0.75rem', color: 'var(--color-text-secondary)' }}>Length Unit</span>
        <select
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

      <label style={{ display: 'flex', 'flex-direction': 'column', gap: '4px' }}>
        <span style={{ 'font-size': '0.75rem', color: 'var(--color-text-secondary)' }}>Theme</span>
        <select
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
