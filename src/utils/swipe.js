/**
 * Swipe-to-dismiss functionality for bottom sheets.
 * Uses pointer events for consistent touch/mouse handling.
 */

/**
 * Enable swipe-to-dismiss on a bottom sheet.
 * @param {Object} options - Configuration options
 * @param {HTMLElement} options.sheet - The bottom sheet element
 * @param {HTMLElement} options.backdrop - The backdrop element
 * @param {Function} options.onDismiss - Callback when sheet should be dismissed
 * @param {number} options.threshold - Minimum distance (px) to trigger dismiss (default: 100)
 * @param {string} options.openClass - CSS class for open state (default: 'open')
 */
export function enableSwipeToDismiss(options) {
  const { sheet, backdrop, onDismiss, threshold = 100, openClass = 'open' } = options;

  if (!sheet) return;

  let isDragging = false;
  let startY = 0;
  let currentY = 0;
  let sheetHeight = 0;

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function handlePointerDown(e) {
    // Only drag from the sheet header — never intercept clicks on interactive content
    const isHeader = e.target.closest('.sheet-header');
    if (!isHeader) return;

    isDragging = true;
    startY = e.clientY;
    currentY = e.clientY;
    sheetHeight = sheet.offsetHeight;

    sheet.style.transition = 'none';
    sheet.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e) {
    if (!isDragging) return;

    currentY = e.clientY;
    const deltaY = currentY - startY;

    // Only allow downward swipes
    if (deltaY < 0) return;

    const progress = deltaY / sheetHeight;

    // Transform the sheet
    sheet.style.transform = `translateY(${deltaY}px)`;

    // Fade the backdrop
    if (backdrop) {
      backdrop.style.opacity = 1 - progress * 0.5;
    }
  }

  function handlePointerUp(e) {
    if (!isDragging) return;

    isDragging = false;
    sheet.releasePointerCapture(e.pointerId);

    const deltaY = currentY - startY;

    // Reset styles
    sheet.style.transition = '';
    sheet.style.transform = '';
    if (backdrop) {
      backdrop.style.opacity = '';
    }

    // Check if swipe exceeded threshold
    if (deltaY > threshold) {
      onDismiss?.();
    }
  }

  function handlePointerCancel(e) {
    if (!isDragging) return;

    isDragging = false;
    sheet.releasePointerCapture(e.pointerId);

    // Reset styles
    sheet.style.transition = '';
    sheet.style.transform = '';
    if (backdrop) {
      backdrop.style.opacity = '';
    }
  }

  // Attach event listeners
  sheet.addEventListener('pointerdown', handlePointerDown);
  sheet.addEventListener('pointermove', handlePointerMove);
  sheet.addEventListener('pointerup', handlePointerUp);
  sheet.addEventListener('pointercancel', handlePointerCancel);

  // Return cleanup function
  return function disableSwipeToDismiss() {
    sheet.removeEventListener('pointerdown', handlePointerDown);
    sheet.removeEventListener('pointermove', handlePointerMove);
    sheet.removeEventListener('pointerup', handlePointerUp);
    sheet.removeEventListener('pointercancel', handlePointerCancel);
  };
}

/**
 * Enable swipe-to-dismiss on multiple sheets.
 * @param {Array<Object>} sheetsConfig - Array of sheet configurations
 * @returns {Function} Cleanup function to disable all
 */
export function enableSwipeToDismissMultiple(sheetsConfig) {
  const cleanupFns = sheetsConfig.map((config) => enableSwipeToDismiss(config));

  return function disableAll() {
    cleanupFns.forEach((fn) => fn());
  };
}
