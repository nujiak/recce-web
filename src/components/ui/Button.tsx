import { type Component, type JSX, splitProps } from 'solid-js';
import { Root } from '@kobalte/core/button';

type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'icon';
type ButtonSize = 'sm' | 'md';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  onClick?: (e: MouseEvent) => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
  children: JSX.Element;
  class?: string;
  style?: JSX.CSSProperties;
}

const Button: Component<ButtonProps> = (props) => {
  const [local, rest] = splitProps(props, ['variant', 'size', 'children', 'class']);

  const variant = () => (local.variant ?? 'primary') as ButtonVariant;
  const size = () => (local.size ?? 'md') as ButtonSize;

  return (
    <>
      <style>{`
      .ui-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.375rem;
        font-family: inherit;
        cursor: pointer;
        border: none;
        outline: none;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        min-width: 48px;
        min-height: 48px;
        transition: background 75ms linear, color 75ms linear;
        border-radius: 0px;
      }
      .ui-btn:focus-visible {
        outline: 1px solid var(--color-accent);
        outline-offset: 3px;
      }
      .ui-btn:active {
        opacity: 0.75;
      }
      .ui-btn[data-disabled] {
        opacity: 0.3;
        pointer-events: none;
      }
      .ui-btn--primary {
        background: var(--color-accent);
        color: #000000;
      }
      .ui-btn--ghost {
        background: transparent;
        color: var(--color-text);
        border: 1px solid var(--color-border);
      }
      .ui-btn--ghost:hover {
        background: var(--color-accent-bg);
        color: var(--color-accent);
      }
      .ui-btn--danger {
        background: var(--color-danger);
        color: #ffffff;
      }
      .ui-btn--icon {
        background: transparent;
        color: var(--color-text);
        padding: 0.375rem;
      }
      .ui-btn--icon:hover {
        background: var(--color-accent-bg);
        color: var(--color-accent);
      }
      .ui-btn--md {
        padding: 0.5rem 1rem;
        font-size: 13px;
      }
      .ui-btn--sm {
        padding: 0.25rem 0.625rem;
        font-size: 11px;
      }
    `}</style>
      <Root
        class={`ui-btn ui-btn--${variant()} ui-btn--${size()} ${local.class ?? ''}`}
        type={props.type ?? 'button'}
        disabled={props.disabled}
        aria-label={props['aria-label']}
        onClick={props.onClick}
        {...rest}
      >
        {local.children}
      </Root>
    </>
  );
};

export default Button;
