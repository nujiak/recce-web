import { Component, createEffect, onCleanup } from 'solid-js';
import maplibregl from 'maplibre-gl';
import { useUI } from '../../context/UIContext';
import type { Pin } from '../../types';

const COLOR_HEX: Record<string, string> = {
  red: '#e53935',
  orange: '#fb8c00',
  green: '#43a047',
  azure: '#1e88e5',
  violet: '#8e24aa',
};

interface PinMarkersProps {
  map: maplibregl.Map;
  pins: Pin[];
}

const PinMarkers: Component<PinMarkersProps> = (props) => {
  const { setViewingPin } = useUI();
  const markerMap = new Map<number, maplibregl.Marker>();

  function createMarkerEl(pin: Pin): HTMLDivElement {
    const el = document.createElement('div');
    el.style.cssText = `
      width: 22px; height: 22px; border-radius: 50%;
      background: ${COLOR_HEX[pin.color] ?? COLOR_HEX.red};
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.35);
      cursor: pointer;
    `;
    el.setAttribute('aria-label', pin.name);
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      setViewingPin(pin);
    });
    return el;
  }

  createEffect(() => {
    const currentPins = props.pins;
    const currentIds = new Set(currentPins.map(p => p.id!));

    // Remove stale markers
    for (const [id, marker] of markerMap) {
      if (!currentIds.has(id)) {
        marker.remove();
        markerMap.delete(id);
      }
    }

    // Add/update markers
    for (const pin of currentPins) {
      if (pin.id == null) continue;
      if (markerMap.has(pin.id)) {
        // Update position
        markerMap.get(pin.id)!.setLngLat([pin.lng, pin.lat]);
      } else {
        const el = createMarkerEl(pin);
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([pin.lng, pin.lat])
          .addTo(props.map);
        markerMap.set(pin.id, marker);
      }
    }
  });

  onCleanup(() => {
    markerMap.forEach(m => m.remove());
    markerMap.clear();
  });

  return null;
};

export default PinMarkers;
