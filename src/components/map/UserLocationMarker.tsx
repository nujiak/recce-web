import { Component, createEffect, onCleanup } from 'solid-js';
import maplibregl from 'maplibre-gl';
import { gpsPosition, gpsHeading, orientationAbsolute } from '../../stores/gps';

interface UserLocationMarkerProps {
  map: maplibregl.Map;
}

const UserLocationMarker: Component<UserLocationMarkerProps> = (props) => {
  let marker: maplibregl.Marker | null = null;
  let headingEl: HTMLDivElement | null = null;

  function createMarkerElement(): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = 'position: relative; width: 24px; height: 24px;';

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

  createEffect(() => {
    const pos = gpsPosition();
    const heading = gpsHeading();
    const hasAbsolute = orientationAbsolute();

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
    } else {
      marker.setLngLat([pos.longitude, pos.latitude]);
    }

    if (headingEl && heading !== null && hasAbsolute) {
      headingEl.style.opacity = '1';
      headingEl.style.transform = `translateX(-50%) rotate(${heading}deg)`;
      headingEl.style.transformOrigin = 'center calc(100% + 17px)';
    } else if (headingEl) {
      headingEl.style.opacity = '0';
    }
  });

  onCleanup(() => {
    marker?.remove();
    marker = null;
  });

  return null;
};

export default UserLocationMarker;
