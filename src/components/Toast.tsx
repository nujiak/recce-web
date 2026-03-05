import { Component, createSignal, For } from 'solid-js';
import type { ToastType } from '../types';

interface ToastMessage {
  text: string;
  type: ToastType;
  id: number;
}

const [toasts, setToasts] = createSignal<ToastMessage[]>([]);
let nextId = 0;

export function showToast(text: string, type: ToastType = 'info', duration = 3000) {
  const id = nextId++;
  setToasts((prev) => [...prev, { text, type, id }]);
  setTimeout(() => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, duration);
}

const Toast: Component = () => {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '72px',
        left: '50%',
        transform: 'translateX(-50%)',
        'z-index': '1000',
        display: 'flex',
        'flex-direction': 'column',
        gap: '8px',
        'pointer-events': 'none',
      }}
    >
      <For each={toasts()}>
        {(t) => (
          <div
            style={{
              padding: '8px 16px',
              'border-radius': 'var(--radius-md)',
              background:
                t.type === 'error'
                  ? 'var(--color-danger)'
                  : t.type === 'success'
                    ? 'var(--color-accent)'
                    : 'var(--color-bg-secondary)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              'font-size': '0.875rem',
              'white-space': 'nowrap',
            }}
          >
            {t.text}
          </div>
        )}
      </For>
    </div>
  );
};

export default Toast;
