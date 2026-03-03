import { type Component, createEffect, onCleanup, Show } from 'solid-js';
import maplibregl from 'maplibre-gl';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { mapStore } from '@/stores/map';

export interface GpsMarkerProps {
  map: MapLibreMap;
}

export const GpsMarker: Component<GpsMarkerProps> = (props) => {
  let marker: maplibregl.Marker | undefined;

  createEffect(() => {
    const position = mapStore.gpsPosition();
    const accuracy = mapStore.gpsAccuracy();

    if (!position) {
      if (marker) {
        marker.remove();
        marker = undefined;
      }
      return;
    }

    if (!marker) {
      const el = document.createElement('div');
      el.className = 'gps-marker';
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#4285f4';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 0 10px rgba(66, 133, 244, 0.5)';

      marker = new maplibregl.Marker({ element: el })
        .setLngLat([position.lng, position.lat])
        .addTo(props.map);
    } else {
      marker.setLngLat([position.lng, position.lat]);
    }
  });

  onCleanup(() => {
    marker?.remove();
    marker = undefined;
  });

  return null;
};

export interface GpsOverlayProps {
  map: MapLibreMap;
}

export const GpsOverlay: Component<GpsOverlayProps> = (props) => {
  const hasPosition = () => mapStore.gpsPosition() !== null;

  const distanceDisplay = () => {
    const pos = mapStore.gpsPosition();
    if (!pos) return null;

    const center = mapStore.center();
    const distance = haversineDistance(pos.lat, pos.lng, center.lat, center.lng);
    const bearing = calculateBearing(pos.lat, pos.lng, center.lat, center.lng);

    return {
      distance: formatDistance(distance, 'metric'),
      bearing: formatBearing(bearing, 'degrees'),
    };
  };

  return (
    <Show when={hasPosition()}>
      <div class="absolute top-4 right-4 bg-surface/90 backdrop-blur px-3 py-2 rounded-lg shadow-lg pointer-events-none">
        <div class="text-xs text-secondary">Distance from GPS</div>
        <Show when={distanceDisplay()}>
          <div class="font-mono text-sm">
            <span>{distanceDisplay()?.distance}</span>
            <span class="mx-2 text-secondary">•</span>
            <span>{distanceDisplay()?.bearing}</span>
          </div>
        </Show>
      </div>
    </Show>
  );
};

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLng);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

function formatDistance(meters: number, unit: string): string {
  if (unit === 'imperial') {
    const feet = meters * 3.28084;
    if (feet < 5280) {
      return `${Math.round(feet)}ft`;
    }
    return `${(feet / 5280).toFixed(2)}mi`;
  }
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(2)}km`;
}

function formatBearing(degrees: number, unit: string): string {
  if (unit === 'mils') {
    return `${Math.round(degrees * (6400 / 360))}mil`;
  }
  return `${Math.round(degrees)}°`;
}
