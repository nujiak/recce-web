import type { PinColor, MarkerType } from '../types';

/** CSS variable references — use in JSX style props */
export const PIN_COLOR_CSS: Record<PinColor, string> = {
  red: 'var(--color-red)',
  orange: 'var(--color-orange)',
  green: 'var(--color-green)',
  azure: 'var(--color-azure)',
  violet: 'var(--color-violet)',
};

/** Hex values — use in MapLibre layer paint expressions */
export const PIN_COLOR_HEX: Record<PinColor, string> = {
  red: '#e53935',
  orange: '#fb8c00',
  green: '#43a047',
  azure: '#1e88e5',
  violet: '#8e24aa',
};

export const PIN_COLORS: PinColor[] = ['red', 'orange', 'green', 'azure', 'violet'];

export const PIN_ICON_PATH: Record<PinColor, string> = {
  red: '/icons/pin-red.svg',
  orange: '/icons/pin-orange.svg',
  green: '/icons/pin-green.svg',
  azure: '/icons/pin-azure.svg',
  violet: '/icons/pin-violet.svg',
};

export const ARROW_ICON_PATH: Record<PinColor, string> = {
  red: '/icons/arrow-red.svg',
  orange: '/icons/arrow-orange.svg',
  green: '/icons/arrow-green.svg',
  azure: '/icons/arrow-azure.svg',
  violet: '/icons/arrow-violet.svg',
};

export const MARKER_TYPES: MarkerType[] = ['pin', 'arrow'];

export function getMarkerIconPath(color: PinColor, markerType: MarkerType): string {
  return markerType === 'arrow' ? ARROW_ICON_PATH[color] : PIN_ICON_PATH[color];
}
