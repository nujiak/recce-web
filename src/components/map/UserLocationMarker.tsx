import { Component, createEffect, onCleanup } from 'solid-js';
import maplibregl from 'maplibre-gl';
import circle from '@turf/circle';
import { gpsPosition, gpsHeading, setMarkerPosition } from '../../stores/gps';

interface UserLocationMarkerProps {
  map: maplibregl.Map;
}

const ACCURACY_SOURCE_ID = 'user-location-accuracy';
const ACCURACY_LAYER_ID = 'user-location-accuracy-circle';
const LOCATION_SOURCE_ID = 'user-location';
const LOCATION_LAYER_ID = 'user-location-dot';
const LOCATION_IMAGE_ID = 'gps-bearing';
const ANIM_DURATION = 500;

interface LocationState {
  lng: number;
  lat: number;
  accuracy: number;
}

let imageLoaded = false;
let imageLoadPromise: Promise<void> | null = null;

function loadImageOnce(map: maplibregl.Map): Promise<void> {
  if (imageLoaded) return Promise.resolve();
  if (imageLoadPromise) return imageLoadPromise;

  imageLoadPromise = new Promise<void>((resolve, reject) => {
    const img = new Image(48, 48);
    img.onload = () => {
      if (!map.hasImage(LOCATION_IMAGE_ID)) {
        map.addImage(LOCATION_IMAGE_ID, img);
      }
      imageLoaded = true;
      resolve();
    };
    img.onerror = reject;
    img.src = '/icons/gps-location-bearing.svg';
  });

  return imageLoadPromise;
}

const UserLocationMarker: Component<UserLocationMarkerProps> = (props) => {
  let animFrameId: number | null = null;
  let animStartTime = 0;
  let fromState: LocationState | null = null;
  let toState: LocationState | null = null;
  let currentState: LocationState | null = null;

  let cachedAccuracy = -1;
  let baseRing: number[][] | null = null;
  let renderRing: number[][] | null = null;
  let featureData: GeoJSON.Feature<GeoJSON.Polygon> | null = null;
  let pointData: GeoJSON.Feature<GeoJSON.Point> | null = null;
  let currentHeading = 0;

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

  function ensureLocationLayer() {
    if (props.map.getSource(LOCATION_SOURCE_ID) && props.map.getLayer(LOCATION_LAYER_ID)) return;

    if (!props.map.getSource(LOCATION_SOURCE_ID)) {
      pointData = {
        type: 'Feature',
        properties: { heading: currentHeading },
        geometry: { type: 'Point', coordinates: [0, 0] },
      };
      props.map.addSource(LOCATION_SOURCE_ID, {
        type: 'geojson',
        data: pointData,
      });
    }

    if (!props.map.getLayer(LOCATION_LAYER_ID)) {
      props.map.addLayer({
        id: LOCATION_LAYER_ID,
        type: 'symbol',
        source: LOCATION_SOURCE_ID,
        layout: {
          'icon-image': LOCATION_IMAGE_ID,
          'icon-size': 0.5,
          'icon-rotate': ['get', 'heading'],
          'icon-rotation-alignment': 'map',
          'icon-pitch-alignment': 'map',
          'icon-allow-overlap': true,
          'icon-anchor': 'center',
        },
      });
    }
  }

  function renderState(s: LocationState) {
    ensureAccuracyLayer();
    const accSource = props.map.getSource(ACCURACY_SOURCE_ID) as
      | maplibregl.GeoJSONSource
      | undefined;

    if (!baseRing || s.accuracy !== cachedAccuracy) {
      const c = circle([0, 0], s.accuracy, { steps: 64, units: 'meters' });
      baseRing = c.geometry.coordinates[0] as number[][];
      renderRing = baseRing.map(() => [0, 0]);
      featureData = {
        type: 'Feature',
        properties: {},
        geometry: { type: 'Polygon', coordinates: [renderRing] },
      };
      cachedAccuracy = s.accuracy;
    }

    for (let i = 0; i < baseRing.length; i++) {
      renderRing![i][0] = baseRing[i][0] + s.lng;
      renderRing![i][1] = baseRing[i][1] + s.lat;
    }

    accSource?.setData(featureData!);

    const locSource = props.map.getSource(LOCATION_SOURCE_ID) as
      | maplibregl.GeoJSONSource
      | undefined;
    if (locSource) {
      locSource.setData({
        type: 'Feature',
        properties: { heading: currentHeading },
        geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
      });
    }

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
    cachedAccuracy = -1;
    baseRing = null;
    renderRing = null;
    featureData = null;
    pointData = null;
    setMarkerPosition(null);

    if (props.map.getLayer(LOCATION_LAYER_ID)) {
      props.map.removeLayer(LOCATION_LAYER_ID);
    }
    if (props.map.getSource(LOCATION_SOURCE_ID)) {
      props.map.removeSource(LOCATION_SOURCE_ID);
    }

    const accSource = props.map.getSource(ACCURACY_SOURCE_ID) as
      | maplibregl.GeoJSONSource
      | undefined;
    if (accSource) {
      accSource.setData({ type: 'FeatureCollection', features: [] });
    }
  }

  function sync() {
    const pos = gpsPosition();

    if (!pos) {
      if (currentState) clearAll();
      return;
    }

    const target: LocationState = { lng: pos.longitude, lat: pos.latitude, accuracy: pos.accuracy };

    if (!currentState) {
      loadImageOnce(props.map).then(() => {
        ensureLocationLayer();
        currentState = target;
        renderState(target);
      });
      return;
    }

    animateTo(target);
  }

  function updateHeading() {
    const h = gpsHeading();
    currentHeading = h ?? 0;

    if (!currentState) return;

    const locSource = props.map.getSource(LOCATION_SOURCE_ID) as
      | maplibregl.GeoJSONSource
      | undefined;
    if (locSource) {
      locSource.setData({
        type: 'Feature',
        properties: { heading: currentHeading },
        geometry: { type: 'Point', coordinates: [currentState.lng, currentState.lat] },
      });
    }
  }

  createEffect(() => {
    gpsPosition();
    sync();
  });

  createEffect(() => {
    gpsHeading();
    updateHeading();
  });

  props.map.on('styledata', sync);

  onCleanup(() => {
    props.map.off('styledata', sync);
    if (animFrameId !== null) cancelAnimationFrame(animFrameId);

    if (props.map.getLayer(LOCATION_LAYER_ID)) {
      props.map.removeLayer(LOCATION_LAYER_ID);
    }
    if (props.map.getSource(LOCATION_SOURCE_ID)) {
      props.map.removeSource(LOCATION_SOURCE_ID);
    }
    const accSource = props.map.getSource(ACCURACY_SOURCE_ID) as
      | maplibregl.GeoJSONSource
      | undefined;
    if (accSource) {
      accSource.setData({ type: 'FeatureCollection', features: [] });
    }
  });

  return null;
};

export default UserLocationMarker;
