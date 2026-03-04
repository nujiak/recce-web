import type { ToastType } from '../types';

let toastContainer: HTMLElement | null = null;
let currentToast: HTMLElement | null = null;

export function initToast(): void {
  if (toastContainer) return;

  toastContainer = document.createElement('div');
  toastContainer.id = 'toast-container';
  toastContainer.className = 'toast-container';
  document.body.appendChild(toastContainer);
}

export function showToast(
  message: string,
  type: ToastType = 'info',
  duration: number = 3000
): void {
  if (!toastContainer) initToast();

  if (currentToast) {
    currentToast.remove();
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
  toast.innerHTML = `
    <span class="toast-message">${escapeHtml(message)}</span>
  `;

  toastContainer!.appendChild(toast);
  currentToast = toast;

  requestAnimationFrame(() => {
    toast.classList.add('toast-visible');
  });

  setTimeout(() => {
    toast.classList.remove('toast-visible');
    setTimeout(() => {
      toast.remove();
      if (currentToast === toast) {
        currentToast = null;
      }
    }, 300);
  }, duration);
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
