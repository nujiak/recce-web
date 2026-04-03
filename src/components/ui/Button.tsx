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
        font-weight: 500;
        font-family: inherit;
        cursor: pointer;
        transition: opacity 0.15s;
        border: none;
        outline: none;
      }
      .ui-btn:focus-visible {
        outline: 2px solid var(--color-accent);
        outline-offset: 2px;
      }
      .ui-btn[data-disabled] {
        opacity: 0.4;
        pointer-events: none;
      }
      .ui-btn--primary {
        background: var(--color-accent);
        color: #fff;
        border-radius: 8px;
      }
      .ui-btn--ghost {
        background: transparent;
        color: var(--color-text);
        border: 1px solid var(--color-border);
        border-radius: 8px;
      }
      .ui-btn--danger {
        background: var(--color-danger);
        color: #fff;
        border-radius: 8px;
      }
      .ui-btn--icon {
        background: transparent;
        color: var(--color-text);
        border-radius: 50%;
        padding: 0.375rem;
      }
      .ui-btn--md {
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
      }
      .ui-btn--sm {
        padding: 0.25rem 0.625rem;
        font-size: 0.75rem;
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
