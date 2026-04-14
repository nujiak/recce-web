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
          font-size: 11px;
          margin-bottom: 4px;
          display: block;
          text-transform: uppercase;
          letter-spacing: 0.10em;
        }
        .ui-tf-input {
          width: 100%;
          background: var(--color-bg-tertiary);
          border: 1px solid var(--color-border-subtle);
          color: var(--color-text);
          border-radius: 0px;
          padding: 0.5rem 0.75rem;
          font-size: 14px;
          font-family: inherit;
          letter-spacing: 0.04em;
          box-sizing: border-box;
          outline: none;
          transition: border-color 75ms linear;
        }
        .ui-tf-input::placeholder {
          color: var(--color-text-muted);
          text-transform: uppercase;
        }
        .ui-tf-input[data-focus-visible] {
          border-color: var(--color-accent);
          border-left: 2px solid var(--color-accent);
        }
        .ui-tf-input:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .ui-tf-textarea {
          width: 100%;
          background: var(--color-bg-tertiary);
          border: 1px solid var(--color-border-subtle);
          color: var(--color-text);
          border-radius: 0px;
          padding: 0.5rem 0.75rem;
          font-size: 14px;
          font-family: inherit;
          letter-spacing: 0.04em;
          box-sizing: border-box;
          outline: none;
          transition: border-color 75ms linear;
          resize: vertical;
          min-height: 80px;
        }
        .ui-tf-textarea::placeholder {
          color: var(--color-text-muted);
          text-transform: uppercase;
        }
        .ui-tf-textarea[data-focus-visible] {
          border-color: var(--color-accent);
          border-left: 2px solid var(--color-accent);
        }
        .ui-tf-textarea:disabled {
          opacity: 0.3;
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
