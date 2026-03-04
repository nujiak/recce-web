import { Component, createEffect, onCleanup, Show } from 'solid-js';
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

    const circle = document.createElement('div');
    circle.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #ffffff;
      box-shadow: 0 0 0 2px rgba(83, 181, 78, 0.4);
    `;

    const innerCircle = document.createElement('div');
    innerCircle.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #53b54e;
    `;

    circle.appendChild(innerCircle);
    container.appendChild(circle);

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
