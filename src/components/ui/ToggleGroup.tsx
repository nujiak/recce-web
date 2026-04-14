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
        .ui-toggle-group {
          display: inline-flex;
          background: var(--color-bg-tertiary);
          border: 1px solid var(--color-border);
          border-radius: 0px;
          padding: 0.25rem;
          gap: 0.125rem;
        }
        .ui-toggle-item {
          border-radius: 0px;
          min-height: 48px;
          padding: 0.375rem 0.75rem;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          cursor: pointer;
          transition: background 75ms linear, color 75ms linear;
          border: 1px solid transparent;
          outline: none;
          display: inline-flex;
          align-items: center;
          background: transparent;
          color: var(--color-text-secondary);
          font-family: inherit;
        }
        .ui-toggle-item:focus-visible {
          outline: 1px solid var(--color-accent);
          outline-offset: 3px;
        }
        .ui-toggle-item[data-pressed] {
          background: var(--color-accent-bg);
          color: var(--color-accent);
          border-color: var(--color-accent-border);
          /* 4-corner bracket via box-shadow */
          box-shadow:
            -10px -10px 0 -9px var(--color-accent),
            10px -10px 0 -9px var(--color-accent),
            -10px 10px 0 -9px var(--color-accent),
            10px 10px 0 -9px var(--color-accent);
        }
      `}</style>
      <ToggleGroup.Root
        value={props.value}
        onChange={handleChange}
        multiple={false}
        class="ui-toggle-group"
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
