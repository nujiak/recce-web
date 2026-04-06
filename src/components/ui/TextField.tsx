import { type Component, Show } from 'solid-js';
import { TextField as KobalteTextField } from '@kobalte/core/text-field';

interface TextFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
  type?: string;
  class?: string;
  disabled?: boolean;
  onDisabledClick?: () => void;
}

const TextField: Component<TextFieldProps> = (props) => {
  return (
    <>
      <style>{`
        .ui-tf-label {
          color: var(--color-text-secondary);
          font-size: 0.75rem;
          margin-bottom: 0.25rem;
          display: block;
          font-weight: 500;
        }
        .ui-tf-input {
          width: 100%;
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border);
          color: var(--color-text);
          border-radius: 8px;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          font-family: inherit;
          box-sizing: border-box;
          outline: 2px solid transparent;
          outline-offset: -1px;
          transition: border-color 0.15s;
        }
        .ui-tf-input[data-focus-visible] {
          outline: 2px solid var(--color-accent);
          outline-offset: -1px;
        }
        .ui-tf-input:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .ui-tf-textarea {
          width: 100%;
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border);
          color: var(--color-text);
          border-radius: 8px;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          font-family: inherit;
          box-sizing: border-box;
          outline: 2px solid transparent;
          outline-offset: -1px;
          transition: border-color 0.15s;
          resize: vertical;
          min-height: 80px;
        }
        .ui-tf-textarea[data-focus-visible] {
          outline: 2px solid var(--color-accent);
          outline-offset: -1px;
        }
        .ui-tf-textarea:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>
      <KobalteTextField value={props.value} onChange={props.onChange} class={props.class}>
        <Show when={props.label}>
          <KobalteTextField.Label class="ui-tf-label">{props.label}</KobalteTextField.Label>
        </Show>
        <Show
          when={!props.multiline}
          fallback={
            <KobalteTextField.TextArea
              class="ui-tf-textarea"
              placeholder={props.placeholder}
              maxLength={props.maxLength}
              disabled={props.disabled}
              onClick={props.disabled ? () => props.onDisabledClick?.() : undefined}
            />
          }
        >
          <KobalteTextField.Input
            class="ui-tf-input"
            type={props.type ?? 'text'}
            placeholder={props.placeholder}
            maxLength={props.maxLength}
            disabled={props.disabled}
            onClick={props.disabled ? () => props.onDisabledClick?.() : undefined}
          />
        </Show>
      </KobalteTextField>
    </>
  );
};

export default TextField;
