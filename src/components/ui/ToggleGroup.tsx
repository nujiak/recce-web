import { type Component, For, mergeProps, splitProps } from 'solid-js';
import { ToggleGroup } from '@kobalte/core';
import type { JSX } from 'solid-js';

interface ToggleGroupOption {
  value: string;
  label: string | JSX.Element;
}

interface ToggleGroupProps {
  value: string;
  onChange: (value: string) => void;
  options: ToggleGroupOption[];
}

const ToggleGroupPrimitive: Component<ToggleGroupProps> = (_props) => {
  const props = mergeProps(_props);
  const [, rest] = splitProps(props, ['value', 'onChange', 'options']);

  const handleChange = (value: string | null) => {
    if (value !== null) {
      props.onChange(value);
    }
  };

  return (
    <>
      <style>{`
        .ui-toggle-item {
          border-radius: 6px;
          padding: 0.375rem 0.75rem;
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
          border: none;
          outline: none;
          display: inline-flex;
          align-items: center;
          background: transparent;
          color: var(--color-text-secondary);
        }
        .ui-toggle-item[data-pressed] {
          background: var(--color-accent);
          color: #fff;
        }
      `}</style>
      <ToggleGroup.Root
        value={props.value}
        onChange={handleChange}
        multiple={false}
        style={{
          display: 'inline-flex',
          background: 'var(--color-bg-secondary)',
          'border-radius': 'var(--radius-md)',
          padding: '0.25rem',
          gap: '0.125rem',
        }}
        {...rest}
      >
        <For each={props.options}>
          {(option) => (
            <ToggleGroup.Item value={option.value} class="ui-toggle-item">
              {option.label}
            </ToggleGroup.Item>
          )}
        </For>
      </ToggleGroup.Root>
    </>
  );
};

export default ToggleGroupPrimitive;
