import { createSignal } from 'solid-js';

export const [mapCenter, setMapCenter] = createSignal<{ lat: number; lng: number }>({
  lat: 1.3521,
  lng: 103.8198,
});
