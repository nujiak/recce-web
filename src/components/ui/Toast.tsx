import { Component } from 'solid-js';
import { Toast } from '@kobalte/core';
import type { ToastType } from '../../types';

const ACCENT_COLORS: Record<ToastType, string> = {
  info: 'var(--color-accent)',
  success: 'var(--color-accent)',
  error: 'var(--color-danger)',
};

function createToastItem(
  message: string,
  type: ToastType,
  duration: number
): Component<{ toastId: number }> {
  return (props) => (
    <Toast.Root
      toastId={props.toastId}
      duration={duration}
      class="kb-toast-item"
      style={{
        padding: '0.5rem 1rem',
        'border-radius': '999px',
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        color: 'var(--color-text)',
        'font-size': '0.8125rem',
        'white-space': 'nowrap',
        display: 'flex',
        'align-items': 'stretch',
        gap: '0.5rem',
        'pointer-events': 'auto',
        animation: 'kb-toast-in 0.2s ease-out',
        cursor: 'pointer',
      }}
      onClick={() => Toast.toaster.dismiss(props.toastId)}
    >
      <div
        style={{
          width: '3px',
          'border-radius': '999px',
          background: ACCENT_COLORS[type],
          'flex-shrink': '0',
        }}
      />
      <span style={{ display: 'flex', 'align-items': 'center' }}>{message}</span>
    </Toast.Root>
  );
}

export function showToast(text: string, type: ToastType = 'info', duration = 3000) {
  Toast.toaster.show(createToastItem(text, type, duration));
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
