interface OverlayConfig {
  element: HTMLElement;
  backdrop?: HTMLElement;
  onClose?: () => void;
  openClass?: string;
}

interface Overlay extends OverlayConfig {
  openClass: string;
}

const overlays = new Map<string, Overlay>();

let activeOverlay: (Overlay & { id: string }) | null = null;
let previousFocus: HTMLElement | null = null;

export function registerOverlay(id: string, options: OverlayConfig): void {
  const { element, backdrop, onClose, openClass = 'open' } = options;

  if (!element) return;

  overlays.set(id, {
    element,
    backdrop,
    onClose,
    openClass,
  });
}

export function unregisterOverlay(id: string): void {
  overlays.delete(id);
}

export function openOverlay(id: string, focusElement: HTMLElement | null = null): void {
  const overlay = overlays.get(id);
  if (!overlay) return;

  const { element, backdrop, openClass } = overlay;

  previousFocus = document.activeElement as HTMLElement | null;

  element.classList.add(openClass);
  if (backdrop) backdrop.classList.add(openClass);

  activeOverlay = { id, ...overlay };

  requestAnimationFrame(() => {
    if (focusElement) {
      focusElement.focus();
    } else {
      const firstFocusable = getFirstFocusable(element);
      if (firstFocusable) {
        firstFocusable.focus();
      } else {
        element.setAttribute('tabindex', '-1');
        element.focus();
      }
    }
  });

  element.setAttribute('aria-hidden', 'false');
}

export function closeOverlay(id: string): void {
  const overlay = overlays.get(id);
  if (!overlay) return;

  const { element, backdrop, openClass } = overlay;

  element.classList.remove(openClass);
  if (backdrop) backdrop.classList.remove(openClass);

  if (activeOverlay?.id === id) {
    activeOverlay = null;
  }

  if (previousFocus && typeof previousFocus.focus === 'function') {
    previousFocus.focus();
  }
  previousFocus = null;

  element.setAttribute('aria-hidden', 'true');
}

export function isOverlayOpen(id: string): boolean {
  const overlay = overlays.get(id);
  if (!overlay) return false;
  return overlay.element.classList.contains(overlay.openClass);
}

function getFocusableElements(container: HTMLElement): NodeListOf<HTMLElement> {
  const selector = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return container.querySelectorAll(selector);
}

function getFirstFocusable(container: HTMLElement): HTMLElement | null {
  const elements = getFocusableElements(container);
  return elements.length > 0 ? elements[0] : null;
}

function getLastFocusable(container: HTMLElement): HTMLElement | null {
  const elements = getFocusableElements(container);
  return elements.length > 0 ? elements[elements.length - 1] : null;
}

export function initKeyboardNavigation(): void {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && activeOverlay) {
      e.preventDefault();
      activeOverlay.onClose?.();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || !activeOverlay) return;

    const { element } = activeOverlay;
    const focusableElements = getFocusableElements(element);

    if (focusableElements.length === 0) {
      e.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  });
}
