import { type Component, type JSX, createMemo } from 'solid-js';
import { Select } from '@kobalte/core/select';
import { usePrefs } from '../../context/PrefsContext';
import { SYSTEM_NAMES } from '../../coords/index';
import type { CoordinateSystem, AngleUnit, LengthUnit, Theme } from '../../types';

const REPO_URL = 'https://github.com/nujiak/recce-web';

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = `
  .sp-select-trigger {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 11px 14px;
    background: transparent;
    border: none;
    color: var(--color-text);
    cursor: pointer;
    outline: none;
    font-size: inherit;
    font-family: inherit;
    text-align: left;
    gap: 8px;
  }
  .sp-select-trigger:focus-visible {
    background: var(--color-bg-tertiary);
  }
  .sp-select-trigger:hover {
    background: color-mix(in srgb, var(--color-text) 4%, transparent);
  }
  .sp-select-label {
    flex: 1;
    font-size: 0.875rem;
    color: var(--color-text);
    white-space: nowrap;
  }
  .sp-select-value {
    font-size: 0.8125rem;
    color: var(--color-text-secondary);
    white-space: nowrap;
    flex-shrink: 0;
  }
  .sp-select-value[data-placeholder-shown] {
    color: var(--color-text-muted);
  }
  .sp-select-chevron {
    font-family: 'Material Symbols Outlined', sans-serif;
    font-size: 16px;
    color: var(--color-text-muted);
    flex-shrink: 0;
    transition: transform 0.15s ease;
    line-height: 1;
  }
  .sp-select-trigger[data-expanded] .sp-select-chevron {
    transform: rotate(180deg);
  }
  .sp-select-content {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: 0 4px 16px rgba(0,0,0,0.25);
    z-index: 200;
    min-width: 160px;
    max-height: 240px;
    overflow-y: auto;
    padding: 4px;
    outline: none;
    animation: sp-in 0.1s ease-out;
  }
  .sp-select-content[data-closed] {
    animation: sp-out 0.08s ease-in;
  }
  .sp-select-listbox {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .sp-select-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 10px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: 0.875rem;
    color: var(--color-text);
    outline: none;
    transition: background 0.1s;
  }
  .sp-select-item[data-highlighted],
  .sp-select-item:hover {
    background: var(--color-bg-secondary);
  }
  .sp-select-item[data-selected] .sp-item-check {
    opacity: 1;
  }
  .sp-item-check {
    font-family: 'Material Symbols Outlined', sans-serif;
    font-size: 16px;
    color: var(--color-accent);
    opacity: 0;
    flex-shrink: 0;
    margin-left: 8px;
    line-height: 1;
  }
  @keyframes sp-in {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes sp-out {
    from { opacity: 1; transform: translateY(0); }
    to   { opacity: 0; transform: translateY(-4px); }
  }
`;

// ── Primitives ────────────────────────────────────────────────────────────────

const SectionHeader: Component<{ label: string }> = (props) => (
  <div
    style={{
      'font-size': '0.6875rem',
      'font-weight': '600',
      'letter-spacing': '0.08em',
      'text-transform': 'uppercase',
      color: 'var(--color-accent)',
      padding: '0 2px',
      'margin-bottom': '2px',
    }}
  >
    {props.label}
  </div>
);

const GroupCard: Component<{ children: JSX.Element }> = (props) => (
  <div
    style={{
      background: 'var(--color-bg-secondary)',
      border: '1px solid var(--color-border)',
      'border-radius': '10px',
      overflow: 'hidden',
    }}
  >
    {props.children}
  </div>
);

const RowDivider = () => (
  <div
    style={{
      height: '1px',
      background: 'var(--color-border-subtle)',
      margin: '0 14px',
    }}
  />
);

// ── SettingSelectRow ──────────────────────────────────────────────────────────

interface SelectOption {
  value: string;
  label: string;
}

interface SettingSelectRowProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
}

const SettingSelectRow: Component<SettingSelectRowProps> = (props) => {
  const selectedOption = createMemo(
    () => props.options.find((o) => o.value === props.value) ?? null
  );

  return (
    <Select
      options={props.options}
      optionValue="value"
      optionTextValue="label"
      value={selectedOption()}
      onChange={(v: SelectOption | null) => {
        if (v) props.onChange(v.value);
      }}
      itemComponent={(itemProps) => (
        <Select.Item class="sp-select-item" item={itemProps.item}>
          <Select.ItemLabel>{itemProps.item.rawValue.label}</Select.ItemLabel>
          <span class="sp-item-check">check</span>
        </Select.Item>
      )}
    >
      <Select.Trigger class="sp-select-trigger">
        <span class="sp-select-label">{props.label}</span>
        <Select.Value<SelectOption> class="sp-select-value">
          {(state) => state.selectedOption().label}
        </Select.Value>
        <span class="sp-select-chevron">expand_more</span>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content class="sp-select-content">
          <Select.Listbox class="sp-select-listbox" />
        </Select.Content>
      </Select.Portal>
    </Select>
  );
};

// ── SettingToggleRow ──────────────────────────────────────────────────────────

interface SettingToggleRowProps {
  label: string;
  description?: string;
  value: boolean;
  onToggle: () => void;
}

const SettingToggleRow: Component<SettingToggleRowProps> = (props) => (
  <button
    type="button"
    onClick={props.onToggle}
    style={{
      display: 'flex',
      'align-items': 'center',
      'justify-content': 'space-between',
      width: '100%',
      padding: '11px 14px',
      background: 'transparent',
      border: 'none',
      color: 'var(--color-text)',
      cursor: 'pointer',
      'font-size': 'inherit',
      'font-family': 'inherit',
      'text-align': 'left',
      gap: '12px',
    }}
  >
    <span
      style={{
        display: 'flex',
        'flex-direction': 'column',
        gap: '2px',
        'min-width': '0',
      }}
    >
      <span style={{ 'font-size': '0.875rem', 'white-space': 'nowrap' }}>{props.label}</span>
      {props.description && (
        <span
          style={{
            'font-size': '0.75rem',
            color: 'var(--color-text-secondary)',
            'white-space': 'normal',
            'line-height': '1.3',
          }}
        >
          {props.description}
        </span>
      )}
    </span>
    <span
      class="material-symbols-outlined"
      style={{
        'font-size': '28px',
        color: props.value ? 'var(--color-accent)' : 'var(--color-text-muted)',
        transition: 'color 0.15s ease',
        'flex-shrink': '0',
        'line-height': '1',
      }}
    >
      {props.value ? 'toggle_on' : 'toggle_off'}
    </span>
  </button>
);

// ── SettingLinkRow ────────────────────────────────────────────────────────────

interface SettingLinkRowProps {
  label: string;
  value: JSX.Element;
  href: string;
}

const SettingLinkRow: Component<SettingLinkRowProps> = (props) => (
  <a
    href={props.href}
    target="_blank"
    rel="noopener noreferrer"
    style={{
      display: 'flex',
      'align-items': 'center',
      'justify-content': 'space-between',
      padding: '11px 14px',
      color: 'var(--color-text)',
      'text-decoration': 'none',
      cursor: 'pointer',
      gap: '8px',
    }}
  >
    <span style={{ 'font-size': '0.875rem', 'white-space': 'nowrap' }}>{props.label}</span>
    <span
      style={{
        display: 'flex',
        'align-items': 'center',
        gap: '4px',
        color: 'var(--color-text-secondary)',
        'font-size': '0.8125rem',
        'flex-shrink': '0',
      }}
    >
      {props.value}
      <span class="material-symbols-outlined" style={{ 'font-size': '14px', 'line-height': '1' }}>
        open_in_new
      </span>
    </span>
  </a>
);

// ── Main panel ────────────────────────────────────────────────────────────────

const SettingsPanel: Component = () => {
  const [prefs, setPrefs] = usePrefs();

  return (
    <div
      class="settings-panel"
      style={{
        padding: '16px',
        display: 'flex',
        'flex-direction': 'column',
        gap: '20px',
        'overflow-y': 'auto',
      }}
    >
      <style>{styles}</style>

      {/* ── Display ── */}
      <div style={{ display: 'flex', 'flex-direction': 'column', gap: '6px' }}>
        <SectionHeader label="Display" />
        <GroupCard>
          <SettingSelectRow
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
          <RowDivider />
          <SettingSelectRow
            label="Angle Unit"
            value={prefs.angleUnit}
            onChange={(v) => setPrefs('angleUnit', v as AngleUnit)}
            options={[
              { value: 'degrees', label: 'Degrees' },
              { value: 'mils', label: 'Mils' },
            ]}
          />
          <RowDivider />
          <SettingSelectRow
            label="Length Unit"
            value={prefs.lengthUnit}
            onChange={(v) => setPrefs('lengthUnit', v as LengthUnit)}
            options={[
              { value: 'metric', label: 'Metric' },
              { value: 'imperial', label: 'Imperial' },
              { value: 'nautical', label: 'Nautical' },
            ]}
          />
          <RowDivider />
          <SettingSelectRow
            label="Theme"
            value={prefs.theme}
            onChange={(v) => setPrefs('theme', v as Theme)}
            options={[
              { value: 'dark', label: 'Dark' },
              { value: 'light', label: 'Light' },
              { value: 'system', label: 'System' },
            ]}
          />
        </GroupCard>
      </div>

      {/* ── Map ── */}
      <div style={{ display: 'flex', 'flex-direction': 'column', gap: '6px' }}>
        <SectionHeader label="Map" />
        <GroupCard>
          <SettingToggleRow
            label="Follow Tilt"
            description="Tilt map by device pitch in bearing mode"
            value={prefs.followPitch}
            onToggle={() => setPrefs('followPitch', !prefs.followPitch)}
          />
        </GroupCard>
      </div>

      {/* ── About ── */}
      <div style={{ display: 'flex', 'flex-direction': 'column', gap: '6px' }}>
        <SectionHeader label="About" />
        <GroupCard>
          <SettingLinkRow
            label="Version"
            value={<>v{__APP_VERSION__}</>}
            href={`${REPO_URL}/releases`}
          />
        </GroupCard>
      </div>
    </div>
  );
};

export default SettingsPanel;
