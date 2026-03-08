import { Component, createEffect, onCleanup } from 'solid-js';
import maplibregl from 'maplibre-gl';
import { useUI } from '../../context/UIContext';
import type { Pin } from '../../types';

const COLOR_SVG: Record<string, string> = {
  red: '/icons/pin-red.svg',
  orange: '/icons/pin-orange.svg',
  green: '/icons/pin-green.svg',
  azure: '/icons/pin-azure.svg',
  violet: '/icons/pin-violet.svg',
};

interface PinMarkersProps {
  map: maplibregl.Map;
  pins: Pin[];
}

const PinMarkers: Component<PinMarkersProps> = (props) => {
  const { setViewingPin } = useUI();
  const markerMap = new Map<number, maplibregl.Marker>();

  function syncMarkers() {
    const currentPins = props.pins;
    const currentIds = new Set(currentPins.map((p) => p.id));

    for (const [id, marker] of markerMap) {
      if (!currentIds.has(id)) {
        marker.remove();
        markerMap.delete(id);
      }
    }

    for (const pin of currentPins) {
      if (markerMap.has(pin.id)) {
        markerMap.get(pin.id)!.setLngLat([pin.lng, pin.lat]);
      } else {
        const el = createMarkerEl(pin);
        const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([pin.lng, pin.lat])
          .addTo(props.map);
        markerMap.set(pin.id, marker);
      }
    }
  }

  function createMarkerEl(pin: Pin): HTMLDivElement {
    const el = document.createElement('div');
    const img = document.createElement('img');
    img.src = COLOR_SVG[pin.color] ?? COLOR_SVG.red;
    img.width = 48;
    img.height = 48;
    img.alt = pin.name;
    img.style.cssText = 'display: block; cursor: pointer;';
    el.appendChild(img);
    el.style.cssText = 'background: transparent; border: none;';
    el.setAttribute('aria-label', pin.name);
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      setViewingPin(pin);
    });
    return el;
  }

  createEffect(() => {
    props.pins;
    syncMarkers();
  });

  props.map.on('styledata', syncMarkers);

  onCleanup(() => {
    props.map.off('styledata', syncMarkers);
    markerMap.forEach((m) => m.remove());
    markerMap.clear();
  });

  return null;
};

export default PinMarkers;
