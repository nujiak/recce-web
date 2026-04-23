import { type Component, type JSX, Show, createMemo } from 'solid-js';
import { Select } from '@kobalte/core/select';
import Icon from './Icon';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
}

const Select_: Component<SelectProps> = (props) => {
  const selectedOption = createMemo(
    () => props.options.find((o) => o.value === props.value) ?? null
  );

  const handleChange = (value: SelectOption | null) => {
    if (value) props.onChange(value.value);
  };

  return (
    <>
      <style>{`
        .ui-select-label {
          color: var(--color-text-secondary);
          font-size: 11px;
          margin-bottom: 4px;
          display: block;
          text-transform: uppercase;
          letter-spacing: 0.10em;
        }
        .ui-select-trigger {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          min-height: 48px;
          background: var(--color-bg-tertiary);
          border: 1px solid var(--color-border-subtle);
          border-radius: 0px;
          padding: 0.5rem 0.75rem;
          font-size: 14px;
          letter-spacing: 0.04em;
          color: var(--color-text);
          cursor: pointer;
          outline: none;
          text-align: left;
          text-transform: uppercase;
          font-family: inherit;
          transition: border-color 75ms linear;
        }
        .ui-select-trigger:focus,
        .ui-select-trigger[data-expanded] {
          border-color: var(--color-accent);
          border-left: 2px solid var(--color-accent);
        }

        .ui-select-value {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .ui-select-value[data-placeholder-shown] {
          color: var(--color-text-muted);
        }
        .ui-select-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-muted);
          margin-left: 0.5rem;
          flex-shrink: 0;
          transition: transform 75ms linear;
        }
        .ui-select-icon[data-expanded] {
          transform: rotate(180deg);
        }
        .ui-select-content {
          background: var(--color-bg-tertiary);
          border: 1px solid var(--color-border);
          border-radius: 0px;
          /* no box-shadow */
          z-index: 200;
          max-height: 240px;
          overflow-y: auto;
          padding: 0;
          outline: none;
          animation: ui-select-content-in 0.075s linear;
        }
        .ui-select-content[data-closed] {
          animation: ui-select-content-out 0.075s linear;
        }
        .ui-select-listbox {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .ui-select-item {
          color: var(--color-text);
          min-height: 48px;
          padding: 0 12px;
          cursor: pointer;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          outline: none;
          border-left: 3px solid transparent;
          transition: background 75ms linear;
          display: flex;
          align-items: center;
        }
        .ui-select-item:hover,
        .ui-select-item[data-highlighted] {
          background: var(--color-accent-bg);
        }
        .ui-select-item[data-selected] {
          border-left-color: var(--color-accent);
          background: var(--color-accent-bg);
        }
        .ui-select-item[data-focused] {
          background: var(--color-accent-bg);
        }
        @keyframes ui-select-content-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes ui-select-content-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>

      <Select
        options={props.options}
        optionValue="value"
        optionTextValue="label"
        value={selectedOption()}
        onChange={handleChange}
        placeholder={props.placeholder || 'Select\u2026'}
        itemComponent={(itemProps) => (
          <Select.Item class="ui-select-item" item={itemProps.item}>
            <Select.ItemLabel>{itemProps.item.rawValue.label}</Select.ItemLabel>
          </Select.Item>
        )}
      >
        <Show when={props.label}>
          <Select.Label class="ui-select-label">{props.label}</Select.Label>
        </Show>
        <Select.Trigger class="ui-select-trigger">
          <Select.Value<SelectOption> class="ui-select-value">
            {(state) => state.selectedOption().label}
          </Select.Value>
          <Select.Icon class="ui-select-icon">
            <Icon name="expand_more" size={20} />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content class="ui-select-content">
            <Select.Listbox class="ui-select-listbox" />
          </Select.Content>
        </Select.Portal>
      </Select>
    </>
  );
};

export default Select_;
