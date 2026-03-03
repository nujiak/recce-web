import { type Component, JSX, Show, createEffect, onCleanup } from 'solid-js';
import { uiStore } from '@/stores/ui';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: JSX.Element;
  variant?: 'center' | 'bottom-sheet';
}

export const Modal: Component<ModalProps> = (props) => {
  createEffect(() => {
    if (props.open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  });

  onCleanup(() => {
    document.body.style.overflow = '';
  });

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && props.open) {
      props.onClose();
    }
  };

  createEffect(() => {
    if (props.open) {
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.removeEventListener('keydown', handleKeyDown);
    }
  });

  onCleanup(() => {
    document.removeEventListener('keydown', handleKeyDown);
  });

  const isBottomSheet = () => props.variant === 'bottom-sheet' && uiStore.isMobile();

  return (
    <Show when={props.open}>
      <div class="fixed inset-0 z-50">
        <div class="absolute inset-0 bg-black/50" onClick={props.onClose} />
        <div
          class={
            isBottomSheet()
              ? 'fixed inset-x-0 bottom-0 rounded-t-2xl max-h-[85vh] overflow-auto bg-surface shadow-xl'
              : 'fixed inset-0 flex items-center justify-center p-4 pointer-events-none'
          }
        >
          <Show when={props.title}>
            <div class="flex items-center justify-between p-4 border-b border-border">
              <h2 class="text-lg font-semibold">{props.title}</h2>
              <button
                class="p-2 hover:bg-surface-hover rounded-full transition-colors"
                onClick={props.onClose}
              >
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
          </Show>
          <div
            class={`p-4 ${isBottomSheet() ? '' : 'bg-surface rounded-xl shadow-xl max-w-md w-full max-h-[85vh] overflow-auto pointer-events-auto'}`}
          >
            {props.children}
          </div>
        </div>
      </div>
    </Show>
  );
};
