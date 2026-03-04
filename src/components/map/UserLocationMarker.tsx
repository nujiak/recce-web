import { Component, createEffect, onCleanup, createSignal } from 'solid-js';
import maplibregl from 'maplibre-gl';
import { gpsPosition, gpsHeading, orientationAbsolute } from '../../stores/gps';

interface UserLocationMarkerProps {
  map: maplibregl.Map;
}

const UserLocationMarker: Component<UserLocationMarkerProps> = (props) => {
  let marker: maplibregl.Marker | null = null;
  let containerEl: HTMLDivElement | null = null;
  let headingEl: HTMLDivElement | null = null;
  const [mapBearing, setMapBearing] = createSignal(0);

  function updateRotation() {
    if (!containerEl) return;
    const bearing = props.map.getBearing();
    setMapBearing(bearing);
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

    headingEl = document.createElement('div');
    headingEl.style.cssText = `
      position: absolute;
      top: -8px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-bottom: 10px solid #53b54e;
      opacity: 0;
      transition: opacity 0.2s ease;
    `;
    container.appendChild(headingEl);

    return container;
  }

  function updateHeading() {
    const heading = gpsHeading();
    const hasAbsolute = orientationAbsolute();
    const bearing = mapBearing();

    if (headingEl && heading !== null && hasAbsolute) {
      headingEl.style.opacity = '1';
      const triangleRotation = heading - bearing;
      headingEl.style.transform = `translateX(-50%) rotate(${triangleRotation}deg)`;
      headingEl.style.transformOrigin = 'center calc(100% + 17px)';
    } else if (headingEl) {
      headingEl.style.opacity = '0';
    }
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

    updateHeading();
  });

  createEffect(() => {
    mapBearing();
    updateHeading();
  });

  onCleanup(() => {
    props.map.off('rotate', updateRotation);
    marker?.remove();
    marker = null;
  });

  return null;
};

export default UserLocationMarker;
