import { Component } from 'solid-js';
import { usePrefs } from '../../context/PrefsContext';
import { SYSTEM_NAMES } from '../../coords/index';
import type { CoordinateSystem, AngleUnit, LengthUnit, Theme } from '../../types';
import Select from '../ui/Select';

const REPO_URL = 'https://github.com/nujiak/recce-web';

const SettingsPanel: Component = () => {
  const [prefs, setPrefs] = usePrefs();

  return (
    <div
      class="settings-panel"
      style={{
        padding: '16px',
        display: 'flex',
        'flex-direction': 'column',
        gap: '16px',
        'overflow-y': 'auto',
      }}
    >
      <Select
        label="Coordinate System"
        value={prefs.coordinateSystem}
        onChange={(v) => setPrefs('coordinateSystem', v as CoordinateSystem)}
        options={[
          { value: 'WGS84', label: SYSTEM_NAMES.WGS84 },
          { value: 'UTM', label: SYSTEM_NAMES.UTM },
          { value: 'MGRS', label: SYSTEM_NAMES.MGRS },
          { value: 'BNG', label: SYSTEM_NAMES.BNG },
          { value: 'QTH', label: SYSTEM_NAMES.QTH },
          { value: 'KERTAU', label: SYSTEM_NAMES.KERTAU },
        ]}
      />

      <Select
        label="Angle Unit"
        value={prefs.angleUnit}
        onChange={(v) => setPrefs('angleUnit', v as AngleUnit)}
        options={[
          { value: 'degrees', label: 'Degrees' },
          { value: 'mils', label: 'Mils' },
        ]}
      />

      <Select
        label="Length Unit"
        value={prefs.lengthUnit}
        onChange={(v) => setPrefs('lengthUnit', v as LengthUnit)}
        options={[
          { value: 'metric', label: 'Metric' },
          { value: 'imperial', label: 'Imperial' },
          { value: 'nautical', label: 'Nautical' },
        ]}
      />

      <Select
        label="Theme"
        value={prefs.theme}
        onChange={(v) => setPrefs('theme', v as Theme)}
        options={[
          { value: 'dark', label: 'Dark' },
          { value: 'light', label: 'Light' },
          { value: 'system', label: 'System' },
        ]}
      />

      <button
        type="button"
        onClick={() => setPrefs('followPitch', !prefs.followPitch)}
        style={{
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'space-between',
          padding: '0.5rem 0.75rem',
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          'border-radius': '8px',
          color: 'var(--color-text)',
          cursor: 'pointer',
          'font-size': 'inherit',
        }}
      >
        <span style={{ display: 'flex', 'flex-direction': 'column', gap: '2px' }}>
          <span>Follow Tilt</span>
          <span style={{ 'font-size': '0.75rem', color: 'var(--color-text-secondary)' }}>
            Tilt map by device pitch in bearing mode
          </span>
        </span>
        <span
          class="material-symbols-outlined"
          style={{
            'font-size': '24px',
            color: prefs.followPitch ? 'var(--color-accent)' : 'var(--color-text-secondary)',
          }}
        >
          {prefs.followPitch ? 'toggle_on' : 'toggle_off'}
        </span>
      </button>

      <a
        href={`${REPO_URL}/releases`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'space-between',
          padding: '0.5rem 0.75rem',
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          'border-radius': '8px',
          color: 'var(--color-text)',
          'text-decoration': 'none',
          cursor: 'pointer',
          'font-size': 'inherit',
        }}
      >
        <span>Version</span>
        <span
          style={{
            display: 'flex',
            'align-items': 'center',
            gap: '4px',
            color: 'var(--color-text-secondary)',
          }}
        >
          v{__APP_VERSION__}
          <span class="material-symbols-outlined" style={{ 'font-size': '18px' }}>
            open_in_new
          </span>
        </span>
      </a>
    </div>
  );
};

export default SettingsPanel;
