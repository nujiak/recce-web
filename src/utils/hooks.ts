import { createEffect, onCleanup, type Accessor } from 'solid-js';

/**
 * Listens for Escape keydown while `isOpen` is true and calls `onClose`.
 * Cleans up the listener automatically when `isOpen` becomes false or the
 * owning component unmounts.
 */
export function useEscapeToClose(isOpen: Accessor<unknown>, onClose: () => void): void {
  createEffect(() => {
    if (!isOpen()) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    onCleanup(() => window.removeEventListener('keydown', onKey));
  });
}
