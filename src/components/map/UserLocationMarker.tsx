import { Component, createEffect, onCleanup } from 'solid-js';
import maplibregl from 'maplibre-gl';
import { gpsPosition } from '../../stores/gps';

interface UserLocationMarkerProps {
  map: maplibregl.Map;
}

const UserLocationMarker: Component<UserLocationMarkerProps> = (props) => {
  let marker: maplibregl.Marker | null = null;
  let containerEl: HTMLDivElement | null = null;

  function updateRotation() {
    if (!containerEl) return;
    const bearing = props.map.getBearing();
    containerEl.style.transform = `rotate(${-bearing}deg)`;
  }

  function createMarkerElement(): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = 'position: relative; width: 24px; height: 24px;';
    containerEl = container;

    const img = document.createElement('img');
    img.src = '/icons/gps-location.svg';
    img.width = 24;
    img.height = 24;
    img.alt = 'Your location';
    img.style.cssText = 'display: block;';
    container.appendChild(img);

    return container;
  }

  createEffect(() => {
    const pos = gpsPosition();

    if (!pos) {
      if (marker) {
        marker.remove();
        marker = null;
      }
      return;
    }

    if (!marker) {
      const el = createMarkerElement();
      marker = new maplibregl.Marker({ element: el })
        .setLngLat([pos.longitude, pos.latitude])
        .addTo(props.map);

      props.map.on('rotate', updateRotation);
      updateRotation();
    } else {
      marker.setLngLat([pos.longitude, pos.latitude]);
    }
  });

  onCleanup(() => {
    props.map.off('rotate', updateRotation);
    marker?.remove();
    marker = null;
  });

  return null;
};

export default UserLocationMarker;
