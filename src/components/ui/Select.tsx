import { type Component, type JSX, Show, createMemo } from 'solid-js';
import { Select } from '@kobalte/core/select';

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
          font-size: 0.75rem;
          margin-bottom: 0.25rem;
          display: block;
        }
        .ui-select-trigger {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: var(--color-text);
          cursor: pointer;
          outline: none;
          text-align: left;
        }
        .ui-select-trigger:focus {
          border-color: var(--color-accent);
          box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-accent) 25%, transparent);
        }
        .ui-select-trigger[data-expanded] {
          border-color: var(--color-accent);
        }

        .ui-select-value {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .ui-select-value[data-placeholder-shown] {
          color: var(--color-text-secondary);
        }
        .ui-select-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Material Symbols Outlined', sans-serif;
          font-size: 20px;
          color: var(--color-text-secondary);
          margin-left: 0.5rem;
          flex-shrink: 0;
          transition: transform 0.15s ease;
        }
        .ui-select-icon[data-expanded] {
          transform: rotate(180deg);
        }
        .ui-select-content {
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          box-shadow: 0 4px 16px rgba(0,0,0,0.2);
          z-index: 200;
          max-height: 240px;
          overflow-y: auto;
          padding: 0.25rem;
          outline: none;
          animation: ui-select-content-in 0.12s ease-out;
        }
        .ui-select-content[data-closed] {
          animation: ui-select-content-out 0.1s ease-in;
        }
        .ui-select-listbox {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .ui-select-item {
          color: var(--color-text);
          padding: 0.5rem 0.75rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          font-size: 0.875rem;
          outline: none;
          border-left: 2px solid transparent;
          transition: background 0.1s;
        }
        .ui-select-item:hover,
        .ui-select-item[data-highlighted] {
          background: var(--color-bg-secondary);
        }
        .ui-select-item[data-selected] {
          border-left-color: var(--color-accent);
          background: var(--color-bg-secondary);
        }
        .ui-select-item[data-focused] {
          border-left-color: var(--color-accent);
        }
        @keyframes ui-select-content-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ui-select-content-out {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-4px); }
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
          <Select.Icon class="ui-select-icon">expand_more</Select.Icon>
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
