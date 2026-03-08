import { Component, createEffect, onCleanup } from 'solid-js';
import maplibregl from 'maplibre-gl';
import circle from '@turf/circle';
import { gpsPosition } from '../../stores/gps';

interface UserLocationMarkerProps {
  map: maplibregl.Map;
}

const ACCURACY_SOURCE_ID = 'user-location-accuracy';
const ACCURACY_LAYER_ID = 'user-location-accuracy-circle';

const UserLocationMarker: Component<UserLocationMarkerProps> = (props) => {
  let locationMarker: maplibregl.Marker | null = null;
  let accuracyAdded = false;

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

  function updateAccuracyCircle(lng: number, lat: number, accuracy: number) {
    const circleGeojson = circle([lng, lat], accuracy, {
      steps: 64,
      units: 'meters',
    });

    if (!accuracyAdded) {
      props.map.addSource(ACCURACY_SOURCE_ID, {
        type: 'geojson',
        data: circleGeojson,
      });

      props.map.addLayer({
        id: ACCURACY_LAYER_ID,
        type: 'fill',
        source: ACCURACY_SOURCE_ID,
        paint: {
          'fill-color': '#53b54e',
          'fill-opacity': 0.15,
        },
      });

      accuracyAdded = true;
    } else {
      const source = props.map.getSource(ACCURACY_SOURCE_ID) as maplibregl.GeoJSONSource;
      source?.setData(circleGeojson);
    }
  }

  function removeAccuracyCircle() {
    if (accuracyAdded) {
      if (props.map.getLayer(ACCURACY_LAYER_ID)) {
        props.map.removeLayer(ACCURACY_LAYER_ID);
      }
      if (props.map.getSource(ACCURACY_SOURCE_ID)) {
        props.map.removeSource(ACCURACY_SOURCE_ID);
      }
      accuracyAdded = false;
    }
  }

  function syncLocationState() {
    const pos = gpsPosition();

    if (!pos) {
      if (locationMarker) {
        locationMarker.remove();
        locationMarker = null;
      }
      removeAccuracyCircle();
      return;
    }

    updateAccuracyCircle(pos.longitude, pos.latitude, pos.accuracy);

    if (!locationMarker) {
      const el = createLocationElement();
      locationMarker = new maplibregl.Marker({
        element: el,
        rotationAlignment: 'map',
        pitchAlignment: 'map',
      })
        .setLngLat([pos.longitude, pos.latitude])
        .addTo(props.map);
    } else {
      locationMarker.setLngLat([pos.longitude, pos.latitude]);
    }
  }

  createEffect(() => {
    gpsPosition();
    syncLocationState();
  });

  props.map.on('styledata', syncLocationState);

  onCleanup(() => {
    props.map.off('styledata', syncLocationState);
    locationMarker?.remove();
    locationMarker = null;
    removeAccuracyCircle();
  });

  return null;
};

export default UserLocationMarker;
