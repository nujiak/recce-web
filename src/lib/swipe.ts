interface SwipeToDismissConfig {
  sheet: HTMLElement;
  backdrop?: HTMLElement;
  onDismiss?: () => void;
  threshold?: number;
  openClass?: string;
}

export function enableSwipeToDismiss(options: SwipeToDismissConfig): () => void {
  const { sheet, backdrop, onDismiss, threshold = 100, openClass = 'open' } = options;

  if (!sheet) return () => {};

  let isDragging = false;
  let startY = 0;
  let currentY = 0;
  let sheetHeight = 0;

  function handlePointerDown(e: PointerEvent): void {
    const isHeader = (e.target as HTMLElement).closest('.sheet-header');
    if (!isHeader) return;

    isDragging = true;
    startY = e.clientY;
    currentY = e.clientY;
    sheetHeight = sheet.offsetHeight;

    sheet.style.transition = 'none';
    sheet.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: PointerEvent): void {
    if (!isDragging) return;

    currentY = e.clientY;
    const deltaY = currentY - startY;

    if (deltaY < 0) return;

    const progress = deltaY / sheetHeight;

    sheet.style.transform = `translateY(${deltaY}px)`;

    if (backdrop) {
      backdrop.style.opacity = String(1 - progress * 0.5);
    }
  }

  function handlePointerUp(e: PointerEvent): void {
    if (!isDragging) return;

    isDragging = false;
    sheet.releasePointerCapture(e.pointerId);

    const deltaY = currentY - startY;

    sheet.style.transition = '';
    sheet.style.transform = '';
    if (backdrop) {
      backdrop.style.opacity = '';
    }

    if (deltaY > threshold) {
      onDismiss?.();
    }
  }

  function handlePointerCancel(e: PointerEvent): void {
    if (!isDragging) return;

    isDragging = false;
    sheet.releasePointerCapture(e.pointerId);

    sheet.style.transition = '';
    sheet.style.transform = '';
    if (backdrop) {
      backdrop.style.opacity = '';
    }
  }

  sheet.addEventListener('pointerdown', handlePointerDown);
  sheet.addEventListener('pointermove', handlePointerMove);
  sheet.addEventListener('pointerup', handlePointerUp);
  sheet.addEventListener('pointercancel', handlePointerCancel);

  return function disableSwipeToDismiss(): void {
    sheet.removeEventListener('pointerdown', handlePointerDown);
    sheet.removeEventListener('pointermove', handlePointerMove);
    sheet.removeEventListener('pointerup', handlePointerUp);
    sheet.removeEventListener('pointercancel', handlePointerCancel);
  };
}

export function enableSwipeToDismissMultiple(sheetsConfig: SwipeToDismissConfig[]): () => void {
  const cleanupFns = sheetsConfig.map((config) => enableSwipeToDismiss(config));

  return function disableAll(): void {
    cleanupFns.forEach((fn) => fn());
  };
}
