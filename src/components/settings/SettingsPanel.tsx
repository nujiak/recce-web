import { Component } from 'solid-js';
import { usePrefs } from '../../context/PrefsContext';
import { SYSTEM_NAMES } from '../../coords/index';
import type { CoordinateSystem, AngleUnit, LengthUnit, Theme } from '../../types';
import Select from '../ui/Select';

const SettingsPanel: Component = () => {
  const [prefs, setPrefs] = usePrefs();

  return (
    <div
      class="settings-panel"
      style={{ padding: '16px', display: 'flex', 'flex-direction': 'column', gap: '16px' }}
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
    </div>
  );
};

export default SettingsPanel;
