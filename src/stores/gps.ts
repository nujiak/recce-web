import { createSignal } from 'solid-js';

// equals: false is required because the browser reuses the same GeolocationCoordinates
// object reference between watchPosition callbacks, mutating it in place. Without this,
// SolidJS's default referential equality check would suppress re-renders on position updates.
export const [gpsPosition, setGpsPosition] = createSignal<GeolocationCoordinates | null>(null, {
  equals: false,
});
export const [gpsHeading, setGpsHeading] = createSignal<number | null>(null);
export const [gpsPitch, setGpsPitch] = createSignal<number | null>(null);
export const [gpsRoll, setGpsRoll] = createSignal<number | null>(null);
export const [orientationAbsolute, setOrientationAbsolute] = createSignal(false);
