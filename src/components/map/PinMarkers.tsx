import { Component, createEffect, onCleanup } from 'solid-js';
import maplibregl from 'maplibre-gl';
import { useUI } from '../../context/UIContext';
import { getMarkerIconPath } from '../../utils/colors';
import type { Pin, PinColor } from '../../types';

const ARROW_SOURCE_ID = 'arrow-markers';
const ARROW_LAYER_ID = 'arrow-markers-layer';
const IMAGE_PREFIX = 'arrow-icon-';

function arrowImageId(color: PinColor): string {
  return `${IMAGE_PREFIX}${color}`;
}

interface PinMarkersProps {
  map: maplibregl.Map;
  pins: Pin[];
}

const PinMarkers: Component<PinMarkersProps> = (props) => {
  const { setViewingPin } = useUI();
  const markerMap = new Map<number, maplibregl.Marker>();
  let imagesLoaded = false;

  async function loadArrowImages() {
    const colors: PinColor[] = ['red', 'orange', 'green', 'azure', 'violet'];
    const loads = colors.map(
      (color) =>
        new Promise<void>((resolve, reject) => {
          const id = arrowImageId(color);
          if (props.map.hasImage(id)) {
            resolve();
            return;
          }
          const img = new Image(36, 48);
          img.onload = () => {
            if (!props.map.hasImage(id)) {
              props.map.addImage(id, img);
            }
            resolve();
          };
          img.onerror = reject;
          img.src = getMarkerIconPath(color, 'arrow');
        })
    );
    await Promise.all(loads);
    imagesLoaded = true;
  }

  function syncMarkers() {
    const currentPins = props.pins;
    const arrowPins = currentPins.filter((p) => p.markerType === 'arrow');
    const pinPins = currentPins.filter((p) => p.markerType !== 'arrow');

    for (const [id, marker] of markerMap) {
      if (!pinPins.some((p) => p.id === id)) {
        marker.remove();
        markerMap.delete(id);
      }
    }

    for (const pin of pinPins) {
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

    if (imagesLoaded) {
      syncArrowLayer(arrowPins);
    }
  }

  function syncArrowLayer(arrowPins: Pin[]) {
    const source = props.map.getSource(ARROW_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;

    if (arrowPins.length === 0) {
      if (props.map.getLayer(ARROW_LAYER_ID)) props.map.removeLayer(ARROW_LAYER_ID);
      if (source) source.setData({ type: 'FeatureCollection', features: [] });
      return;
    }

    if (!source) {
      props.map.addSource(ARROW_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
    }

    if (!props.map.getLayer(ARROW_LAYER_ID)) {
      props.map.addLayer({
        id: ARROW_LAYER_ID,
        type: 'symbol',
        source: ARROW_SOURCE_ID,
        layout: {
          'icon-image': ['concat', IMAGE_PREFIX, ['get', 'color']],
          'icon-size': 0.8,
          'icon-rotate': ['get', 'bearing'],
          'icon-rotation-alignment': 'map',
          'icon-pitch-alignment': 'map',
          'icon-allow-overlap': true,
          'icon-anchor': 'center',
        },
      });
    }

    const features = arrowPins.map((p) => ({
      type: 'Feature' as const,
      properties: { color: p.color, pinId: p.id, bearing: p.bearing ?? 0 },
      geometry: { type: 'Point' as const, coordinates: [p.lng, p.lat] },
    }));

    (props.map.getSource(ARROW_SOURCE_ID) as maplibregl.GeoJSONSource).setData({
      type: 'FeatureCollection',
      features,
    });
  }

  function createMarkerEl(pin: Pin): HTMLDivElement {
    const el = document.createElement('div');
    const img = document.createElement('img');
    img.src = getMarkerIconPath(pin.color, 'pin');
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

  function onArrowClick(e: maplibregl.MapLayerMouseEvent) {
    const pinId = e.features?.[0]?.properties?.pinId as number | undefined;
    if (pinId == null) return;
    const pin = props.pins.find((p) => p.id === pinId);
    if (pin) setViewingPin(pin);
  }

  async function reloadArrowLayer() {
    imagesLoaded = false;
    await loadArrowImages();
    syncMarkers();
  }

  createEffect(() => {
    props.pins;
    syncMarkers();
  });

  props.map.on('styledata', reloadArrowLayer);
  props.map.on('click', ARROW_LAYER_ID, onArrowClick);

  reloadArrowLayer();

  onCleanup(() => {
    props.map.off('styledata', reloadArrowLayer);
    props.map.off('click', onArrowClick);
    markerMap.forEach((m) => m.remove());
    markerMap.clear();
    if (props.map.getLayer(ARROW_LAYER_ID)) props.map.removeLayer(ARROW_LAYER_ID);
    if (props.map.getSource(ARROW_SOURCE_ID)) props.map.removeSource(ARROW_SOURCE_ID);
  });

  return null;
};

export default PinMarkers;
