/**
 * Keyboard navigation utilities for modals and bottom sheets.
 * Provides focus trapping and Escape key handling.
 */

// Track all registered overlays for global Escape handling
const overlays = new Map();

// Currently active overlay (for focus trap)
let activeOverlay = null;
let previousFocus = null;

/**
 * Register an overlay element for keyboard handling.
 * @param {string} id - Unique identifier for the overlay
 * @param {Object} options - Configuration options
 * @param {HTMLElement} options.element - The overlay element
 * @param {HTMLElement} options.backdrop - The backdrop element (optional)
 * @param {Function} options.onClose - Callback when overlay should close
 * @param {string} options.openClass - CSS class for open state (default: 'open')
 */
export function registerOverlay(id, options) {
  const { element, backdrop, onClose, openClass = 'open' } = options;

  if (!element) return;

  overlays.set(id, {
    element,
    backdrop,
    onClose,
    openClass,
  });
}

/**
 * Unregister an overlay.
 * @param {string} id - Overlay identifier
 */
export function unregisterOverlay(id) {
  overlays.delete(id);
}

/**
 * Open an overlay with focus management.
 * @param {string} id - Overlay identifier
 * @param {HTMLElement} focusElement - Element to focus on open (optional)
 */
export function openOverlay(id, focusElement = null) {
  const overlay = overlays.get(id);
  if (!overlay) return;

  const { element, backdrop, openClass } = overlay;

  // Store current focus
  previousFocus = document.activeElement;

  // Open the overlay
  element.classList.add(openClass);
  if (backdrop) backdrop.classList.add(openClass);

  // Set as active for focus trap
  activeOverlay = { id, ...overlay };

  // Set initial focus
  requestAnimationFrame(() => {
    if (focusElement) {
      focusElement.focus();
    } else {
      // Focus first focusable element or the overlay itself
      const firstFocusable = getFirstFocusable(element);
      if (firstFocusable) {
        firstFocusable.focus();
      } else {
        element.setAttribute('tabindex', '-1');
        element.focus();
      }
    }
  });

  // Add aria attributes
  element.setAttribute('aria-hidden', 'false');
}

/**
 * Close an overlay and restore focus.
 * @param {string} id - Overlay identifier
 */
export function closeOverlay(id) {
  const overlay = overlays.get(id);
  if (!overlay) return;

  const { element, backdrop, openClass } = overlay;

  // Close the overlay
  element.classList.remove(openClass);
  if (backdrop) backdrop.classList.remove(openClass);

  // Clear active overlay
  if (activeOverlay?.id === id) {
    activeOverlay = null;
  }

  // Restore focus
  if (previousFocus && typeof previousFocus.focus === 'function') {
    previousFocus.focus();
  }
  previousFocus = null;

  // Update aria
  element.setAttribute('aria-hidden', 'true');
}

/**
 * Check if an overlay is open.
 * @param {string} id - Overlay identifier
 * @returns {boolean}
 */
export function isOverlayOpen(id) {
  const overlay = overlays.get(id);
  if (!overlay) return false;
  return overlay.element.classList.contains(overlay.openClass);
}

/**
 * Get all focusable elements within a container.
 * @param {HTMLElement} container
 * @returns {NodeList}
 */
function getFocusableElements(container) {
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

/**
 * Get the first focusable element within a container.
 * @param {HTMLElement} container
 * @returns {HTMLElement|null}
 */
function getFirstFocusable(container) {
  const elements = getFocusableElements(container);
  return elements.length > 0 ? elements[0] : null;
}

/**
 * Get the last focusable element within a container.
 * @param {HTMLElement} container
 * @returns {HTMLElement|null}
 */
function getLastFocusable(container) {
  const elements = getFocusableElements(container);
  return elements.length > 0 ? elements[elements.length - 1] : null;
}

/**
 * Initialize global keyboard handlers.
 * Should be called once in main.js.
 */
export function initKeyboardNavigation() {
  // Global Escape key handler
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && activeOverlay) {
      e.preventDefault();
      activeOverlay.onClose?.();
    }
  });

  // Global Tab key handler for focus trap
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
      // Shift+Tab: focus previous element
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab: focus next element
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  });
}
