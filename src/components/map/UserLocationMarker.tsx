import { Component, createEffect, onCleanup } from 'solid-js';
import maplibregl from 'maplibre-gl';
import { gpsPosition, setMarkerPosition } from '../../stores/gps';

interface UserLocationMarkerProps {
  map: maplibregl.Map;
}

const ANIM_DURATION = 500;

interface LocationState {
  lng: number;
  lat: number;
  accuracy: number;
}

const UserLocationMarker: Component<UserLocationMarkerProps> = (props) => {
  let locationMarker: maplibregl.Marker | null = null;
  let accuracyMarker: maplibregl.Marker | null = null;
  let animFrameId: number | null = null;
  let animStartTime = 0;
  let fromState: LocationState | null = null;
  let toState: LocationState | null = null;
  let currentState: LocationState | null = null;

  function createAccuracyElement(): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText =
      'border-radius: 50%; background: rgba(83, 181, 78, 0.15); pointer-events: none;';
    return el;
  }

  function createLocationElement(): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = 'position: relative; width: 24px; height: 24px;';

    const img = document.createElement('img');
    img.src = '/icons/gps-location.svg';
    img.width = 24;
    img.height = 24;
    img.alt = 'Your location';
    img.style.cssText = 'display: block;';
    container.appendChild(img);

    return container;
  }

  function updateAccuracySize() {
    if (!accuracyMarker || !currentState) return;
    const map = props.map;
    const center = map.project(new maplibregl.LngLat(currentState.lng, currentState.lat));
    const lngPerMeter = 1 / (111320 * Math.cos((currentState.lat * Math.PI) / 180));
    const edge = map.project(
      new maplibregl.LngLat(
        currentState.lng + currentState.accuracy * lngPerMeter,
        currentState.lat
      )
    );
    const pixelRadius = Math.abs(edge.x - center.x);
    const el = accuracyMarker.getElement();
    el.style.width = `${pixelRadius * 2}px`;
    el.style.height = `${pixelRadius * 2}px`;
  }

  function renderState(s: LocationState) {
    locationMarker?.setLngLat([s.lng, s.lat]);
    accuracyMarker?.setLngLat([s.lng, s.lat]);
    updateAccuracySize();
    setMarkerPosition({ lng: s.lng, lat: s.lat });
  }

  function tick(now: number) {
    if (!fromState || !toState) {
      animFrameId = null;
      return;
    }

    const t = Math.min((now - animStartTime) / ANIM_DURATION, 1);
    const s: LocationState = {
      lng: fromState.lng + (toState.lng - fromState.lng) * t,
      lat: fromState.lat + (toState.lat - fromState.lat) * t,
      accuracy: fromState.accuracy + (toState.accuracy - fromState.accuracy) * t,
    };
    currentState = s;
    renderState(s);

    if (t < 1) {
      animFrameId = requestAnimationFrame(tick);
    } else {
      animFrameId = null;
    }
  }

  function animateTo(target: LocationState) {
    if (!currentState) {
      currentState = target;
      renderState(target);
      return;
    }

    if (animFrameId !== null) {
      toState = target;
      return;
    }

    if (
      currentState.lng === target.lng &&
      currentState.lat === target.lat &&
      currentState.accuracy === target.accuracy
    ) {
      renderState(currentState);
      return;
    }

    fromState = { ...currentState };
    toState = target;
    animStartTime = performance.now();
    animFrameId = requestAnimationFrame(tick);
  }

  function clearAll() {
    if (animFrameId !== null) cancelAnimationFrame(animFrameId);
    animFrameId = null;
    currentState = null;
    fromState = null;
    toState = null;
    setMarkerPosition(null);
    locationMarker?.remove();
    locationMarker = null;
    accuracyMarker?.remove();
    accuracyMarker = null;
  }

  function sync() {
    const pos = gpsPosition();

    if (!pos) {
      if (locationMarker || currentState) clearAll();
      return;
    }

    const target: LocationState = { lng: pos.longitude, lat: pos.latitude, accuracy: pos.accuracy };

    if (!locationMarker) {
      const locEl = createLocationElement();
      locationMarker = new maplibregl.Marker({
        element: locEl,
        rotationAlignment: 'map',
        pitchAlignment: 'map',
      })
        .setLngLat([target.lng, target.lat])
        .addTo(props.map);

      const accEl = createAccuracyElement();
      accuracyMarker = new maplibregl.Marker({
        element: accEl,
        anchor: 'center',
      })
        .setLngLat([target.lng, target.lat])
        .addTo(props.map);

      currentState = target;
      renderState(target);
      return;
    }

    animateTo(target);
  }

  createEffect(() => {
    gpsPosition();
    sync();
  });

  props.map.on('styledata', sync);

  const onMove = () => updateAccuracySize();
  props.map.on('move', onMove);
  props.map.on('zoom', onMove);
  props.map.on('rotate', onMove);

  onCleanup(() => {
    props.map.off('styledata', sync);
    props.map.off('move', onMove);
    props.map.off('zoom', onMove);
    props.map.off('rotate', onMove);
    if (animFrameId !== null) cancelAnimationFrame(animFrameId);
    locationMarker?.remove();
    locationMarker = null;
    accuracyMarker?.remove();
    accuracyMarker = null;
  });

  return null;
};

export default UserLocationMarker;
