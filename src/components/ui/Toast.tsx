import { Component, Show } from 'solid-js';
import { Toast } from '@kobalte/core';
import type { ToastType } from '../../types';

const ACCENT_COLORS: Record<ToastType, string> = {
  info: 'var(--color-accent)',
  success: 'var(--color-accent)',
  error: 'var(--color-danger)',
};

interface ToastAction {
  label: string;
  onClick: (toastId: number) => void;
}

function createToastItem(
  message: string,
  type: ToastType,
  duration: number,
  action?: ToastAction
): Component<{ toastId: number }> {
  return (props) => (
    <Toast.Root
      toastId={props.toastId}
      duration={duration}
      class="kb-toast-item"
      style={{
        padding: '0.5rem 1rem',
        'border-radius': '0px',
        background: 'var(--color-bg-secondary)',
        border: `1px solid var(--color-border)`,
        'border-left': `3px solid ${ACCENT_COLORS[type]}`,
        color: 'var(--color-text)',
        'font-size': '13px',
        'text-transform': 'uppercase',
        'letter-spacing': '0.04em',
        'white-space': 'nowrap',
        display: 'flex',
        'align-items': 'stretch',
        gap: '0.5rem',
        'pointer-events': 'auto',
        animation: 'kb-toast-in 0.15s ease-out',
        cursor: 'pointer',
      }}
      onClick={() => Toast.toaster.dismiss(props.toastId)}
    >
      <span style={{ display: 'flex', 'align-items': 'center', flex: 1 }}>{message}</span>
      <Show when={action}>
        {(a) => (
          <button
            style={{
              background: 'var(--color-accent)',
              border: 'none',
              color: 'oklch(0.07 0 0)',
              'font-size': '11px',
              'font-weight': '400',
              'text-transform': 'uppercase',
              'letter-spacing': '0.04em',
              'border-radius': '0px',
              cursor: 'pointer',
              padding: '0.2rem 0.65rem',
              'white-space': 'nowrap',
            }}
            onClick={(e) => {
              e.stopPropagation();
              a().onClick(props.toastId);
            }}
          >
            {a().label}
          </button>
        )}
      </Show>
    </Toast.Root>
  );
}

export function showToast(text: string, type: ToastType = 'info', duration = 3000) {
  Toast.toaster.show(createToastItem(text, type, duration));
}

export function showToastWithAction(
  text: string,
  action: ToastAction,
  type: ToastType = 'info',
  duration = 8000
) {
  Toast.toaster.show(createToastItem(text, type, duration, action));
}

export function ToastRegion() {
  return (
    <>
      <style>{`
        @keyframes kb-toast-in {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .kb-toast-item[data-kb-toast-dismiss] {
          animation: kb-toast-out 0.15s ease-in forwards;
        }
        @keyframes kb-toast-out {
          to {
            opacity: 0;
            transform: translateY(-4px);
          }
        }
      `}</style>
      <Toast.Region
        limit={3}
        duration={3000}
        swipeDirection="down"
        style={{
          position: 'fixed',
          bottom: '72px',
          left: '50%',
          transform: 'translateX(-50%)',
          'z-index': '1000',
          'pointer-events': 'none',
        }}
      >
        <Toast.List
          style={{
            display: 'flex',
            'flex-direction': 'column-reverse',
            gap: '8px',
            'align-items': 'center',
            'list-style': 'none',
            margin: '0',
            padding: '0',
          }}
        />
      </Toast.Region>
    </>
  );
}
