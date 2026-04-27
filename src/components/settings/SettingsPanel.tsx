import { type Component, type JSX, createMemo } from 'solid-js';
import { Select } from '@kobalte/core/select';
import { usePrefs } from '../../context/PrefsContext';
import { SYSTEM_NAMES } from '../../coords/index';
import Icon from '../ui/Icon';
import type { IconName } from '../ui/Icon';
import type { CoordinateSystem, AngleUnit, LengthUnit, Theme } from '../../types';
import { ANGLE_UNIT_OPTIONS } from '../../types';
import { ToolCard, SectionHeader, RowDivider } from '../tools/ToolCard';

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
    font-size: 12px;
    font-weight: 400;
    color: var(--color-text-secondary);
    white-space: nowrap;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .sp-select-value {
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text);
    white-space: nowrap;
    flex-shrink: 0;
    text-transform: uppercase;
  }
  .sp-select-value[data-placeholder-shown] {
    color: var(--color-text-muted);
  }
  .sp-select-chevron {
    color: var(--color-text-muted);
    flex-shrink: 0;
    transition: transform 0.15s ease;
    line-height: 1;
  }
  .sp-select-trigger[data-expanded] .sp-select-chevron {
    transform: rotate(180deg);
  }
  .sp-select-content {
    background: var(--color-bg-tertiary);
    min-width: 160px;
    max-height: 240px;
    overflow-y: auto;
    padding: 0;
  }
  .sp-select-content[data-closed] {
    animation: popover-out 0.1s ease-in;
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
    border-radius: 0px;
    cursor: pointer;
    font-size: 12px;
    color: var(--color-text);
    outline: none;
    transition: background 0.1s;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .sp-select-item[data-highlighted],
  .sp-select-item:hover {
    background: var(--color-bg-secondary);
  }
  .sp-select-item[data-selected] .sp-item-check {
    opacity: 1;
  }
  .sp-item-check {
    color: var(--color-accent);
    opacity: 0;
    flex-shrink: 0;
    margin-left: 8px;
    line-height: 1;
  }
`;

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
          <span class="sp-item-check">
            <Icon name="check" size={16} />
          </span>
        </Select.Item>
      )}
    >
      <Select.Trigger class="sp-select-trigger">
        <span class="sp-select-label">{props.label}</span>
        <Select.Value<SelectOption> class="sp-select-value">
          {(state) => state.selectedOption().label}
        </Select.Value>
        <span class="sp-select-chevron">
          <Icon name="expand_more" size={16} />
        </span>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content class="sp-select-content popover-content">
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
      <span
        style={{
          'font-size': '12px',
          'font-weight': '400',
          'white-space': 'nowrap',
          'text-transform': 'uppercase',
          'letter-spacing': '0.06em',
          color: 'var(--color-text-secondary)',
        }}
      >
        {props.label}
      </span>
      {props.description && (
        <span
          style={{
            'font-size': '11px',
            color: 'var(--color-text-muted)',
            'white-space': 'normal',
            'line-height': '1.4',
          }}
        >
          {props.description}
        </span>
      )}
    </span>
    <Icon
      name={props.value ? 'toggle_on' : 'toggle_off'}
      size={28}
      style={{
        color: props.value ? 'var(--color-accent)' : 'var(--color-text-muted)',
        transition: 'color 0.15s ease',
      }}
    />
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
    <span
      style={{
        'font-size': '12px',
        'font-weight': '400',
        'white-space': 'nowrap',
        'text-transform': 'uppercase',
        'letter-spacing': '0.06em',
        color: 'var(--color-text-secondary)',
      }}
    >
      {props.label}
    </span>
    <span
      style={{
        display: 'flex',
        'align-items': 'center',
        gap: '4px',
        color: 'var(--color-text)',
        'font-size': '14px',
        'font-weight': '500',
        'flex-shrink': '0',
      }}
    >
      {props.value}
      <Icon name="open_in_new" size={14} />
    </span>
  </a>
);

// ── Main panel ────────────────────────────────────────────────────────────────

const SettingsPanel: Component = () => {
  const [prefs, setPrefs] = usePrefs();

  return (
    <>
      <style>{styles}</style>

      {/* ── Display ── */}
      <div style={{ display: 'flex', 'flex-direction': 'column', gap: '0' }}>
        <ToolCard>
          <SectionHeader label="Display" />
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
            options={ANGLE_UNIT_OPTIONS}
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
        </ToolCard>
      </div>

      {/* ── Map ── */}
      <div style={{ display: 'flex', 'flex-direction': 'column', gap: '0' }}>
        <ToolCard>
          <SectionHeader label="Map" />
          <SettingToggleRow
            label="Follow Tilt"
            description="Tilt map by device pitch in bearing mode"
            value={prefs.followPitch}
            onToggle={() => setPrefs('followPitch', !prefs.followPitch)}
          />
        </ToolCard>
      </div>

      {/* ── About ── */}
      <div style={{ display: 'flex', 'flex-direction': 'column', gap: '0' }}>
        <ToolCard>
          <SectionHeader label="About" />
          <SettingLinkRow
            label="Version"
            value={<>v{__APP_VERSION__}</>}
            href={`${REPO_URL}/releases`}
          />
        </ToolCard>
      </div>
    </>
  );
};

export default SettingsPanel;
