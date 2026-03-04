import { createSignal } from 'solid-js';

export const [gpsPosition, setGpsPosition] = createSignal<GeolocationCoordinates | null>(null);
export const [gpsHeading, setGpsHeading] = createSignal<number | null>(null);
export const [gpsPitch, setGpsPitch] = createSignal<number | null>(null);
export const [gpsRoll, setGpsRoll] = createSignal<number | null>(null);
export const [orientationAbsolute, setOrientationAbsolute] = createSignal(false);
