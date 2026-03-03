import { type Component, createEffect, onCleanup } from 'solid-js';
import maplibregl, { type Map as MapLibreMap } from 'maplibre-gl';
import { pinsStore } from '@/stores/pins';
import type { Pin, PinColor } from '@/types';

const COLOR_MAP: Record<PinColor, string> = {
  red: '#e53935',
  orange: '#fb8c00',
  green: '#43a047',
  azure: '#1e88e5',
  violet: '#8e24aa',
};

export interface MarkersProps {
  map: MapLibreMap;
  onPinClick?: (pin: Pin) => void;
}

export const Markers: Component<MarkersProps> = (props) => {
  const markers = new globalThis.Map<number, maplibregl.Marker>();

  createEffect(() => {
    const pins = pinsStore.list();
    const currentIds = new globalThis.Set(pins.map((p) => p.id));

    for (const pin of pins) {
      if (!markers.has(pin.id)) {
        const color = COLOR_MAP[pin.color] || COLOR_MAP.red;

        const el = document.createElement('div');
        el.className = 'pin-marker';
        el.style.backgroundColor = color;
        el.style.width = '24px';
        el.style.height = '24px';
        el.style.borderRadius = '50%';
        el.style.border = '2px solid white';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        el.style.cursor = 'pointer';

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([pin.lng, pin.lat])
          .addTo(props.map);

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          props.onPinClick?.(pin);
        });

        markers.set(pin.id, marker);
      } else {
        const marker = markers.get(pin.id)!;
        marker.setLngLat([pin.lng, pin.lat]);
      }
    }

    for (const [id, marker] of markers) {
      if (!currentIds.has(id)) {
        marker.remove();
        markers.delete(id);
      }
    }
  });

  onCleanup(() => {
    for (const marker of markers.values()) {
      marker.remove();
    }
    markers.clear();
  });

  return null;
};
