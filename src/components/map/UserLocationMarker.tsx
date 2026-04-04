import { Component, createEffect, onCleanup } from 'solid-js';
import maplibregl from 'maplibre-gl';
import circle from '@turf/circle';
import { gpsPosition } from '../../stores/gps';

interface UserLocationMarkerProps {
  map: maplibregl.Map;
}

const ACCURACY_SOURCE_ID = 'user-location-accuracy';
const ACCURACY_LAYER_ID = 'user-location-accuracy-circle';
const ANIM_DURATION = 500;

interface LocationState {
  lng: number;
  lat: number;
  accuracy: number;
}

const UserLocationMarker: Component<UserLocationMarkerProps> = (props) => {
  let locationMarker: maplibregl.Marker | null = null;
  let animFrameId: number | null = null;
  let animStartTime = 0;
  let fromState: LocationState | null = null;
  let toState: LocationState | null = null;
  let currentState: LocationState | null = null;

  function ensureAccuracyLayer() {
    if (props.map.getSource(ACCURACY_SOURCE_ID) && props.map.getLayer(ACCURACY_LAYER_ID)) return;

    if (!props.map.getSource(ACCURACY_SOURCE_ID)) {
      props.map.addSource(ACCURACY_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
    }

    if (!props.map.getLayer(ACCURACY_LAYER_ID)) {
      props.map.addLayer({
        id: ACCURACY_LAYER_ID,
        type: 'fill',
        source: ACCURACY_SOURCE_ID,
        paint: {
          'fill-color': '#53b54e',
          'fill-opacity': 0.15,
        },
      });
    }
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

  function renderState(s: LocationState) {
    ensureAccuracyLayer();
    const source = props.map.getSource(ACCURACY_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    source?.setData(circle([s.lng, s.lat], s.accuracy, { steps: 64, units: 'meters' }));
    locationMarker?.setLngLat([s.lng, s.lat]);
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
    locationMarker?.remove();
    locationMarker = null;
    const source = props.map.getSource(ACCURACY_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData({ type: 'FeatureCollection', features: [] });
    }
  }

  function sync() {
    const pos = gpsPosition();

    if (!pos) {
      if (locationMarker || currentState) clearAll();
      return;
    }

    const target: LocationState = { lng: pos.longitude, lat: pos.latitude, accuracy: pos.accuracy };

    if (!locationMarker) {
      const el = createLocationElement();
      locationMarker = new maplibregl.Marker({
        element: el,
        rotationAlignment: 'map',
        pitchAlignment: 'map',
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

  onCleanup(() => {
    props.map.off('styledata', sync);
    if (animFrameId !== null) cancelAnimationFrame(animFrameId);
    locationMarker?.remove();
    locationMarker = null;
    const source = props.map.getSource(ACCURACY_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData({ type: 'FeatureCollection', features: [] });
    }
  });

  return null;
};

export default UserLocationMarker;
