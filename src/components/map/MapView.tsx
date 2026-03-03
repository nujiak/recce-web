import { type Component, onMount, onCleanup } from 'solid-js';
import maplibregl, { type Map as MapLibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { mapStore } from '@/stores/map';

export interface MapViewProps {
  onMapReady?: (map: MapLibreMap) => void;
}

let mapInstance: MapLibreMap | undefined;

export const MapView: Component<MapViewProps> = (props) => {
  let container: HTMLDivElement | undefined;

  onMount(() => {
    if (!container) return;

    const initialCenter = mapStore.center();
    const initialZoom = mapStore.zoom();
    const initialBearing = mapStore.bearing();

    mapInstance = new maplibregl.Map({
      container,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [initialCenter.lng, initialCenter.lat],
      zoom: initialZoom,
      bearing: initialBearing,
      attributionControl: false,
    });

    mapInstance.addControl(new maplibregl.NavigationControl(), 'bottom-right');

    mapInstance.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
      'bottom-right'
    );

    mapInstance.on('move', () => {
      if (!mapInstance) return;
      const center = mapInstance.getCenter();
      mapStore.setCenter({ lat: center.lat, lng: center.lng });
      mapStore.setZoom(mapInstance.getZoom());
      mapStore.setBearing(mapInstance.getBearing());
    });

    mapInstance.on('load', () => {
      props.onMapReady?.(mapInstance!);
    });
  });

  onCleanup(() => {
    mapInstance?.remove();
    mapInstance = undefined;
  });

  return <div ref={container} class="absolute inset-0" />;
};

export function getMapInstance(): MapLibreMap | undefined {
  return mapInstance;
}
