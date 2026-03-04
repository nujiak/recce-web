import { Component, createEffect, onCleanup } from 'solid-js';
import maplibregl from 'maplibre-gl';
import { gpsPosition } from '../../stores/gps';

interface UserLocationMarkerProps {
  map: maplibregl.Map;
}

const SOURCE_ID = 'user-location-accuracy';
const LAYER_ID = 'user-location-accuracy-circle';

const UserLocationMarker: Component<UserLocationMarkerProps> = (props) => {
  let marker: maplibregl.Marker | null = null;
  let containerEl: HTMLDivElement | null = null;
  let sourceAdded = false;

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

  function updateAccuracyCircle(lng: number, lat: number, accuracy: number) {
    if (!sourceAdded) {
      props.map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          properties: {
            accuracy,
          },
        },
      });

      props.map.addLayer({
        id: LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        paint: {
          'circle-radius': [
            '/',
            ['*', ['get', 'accuracy'], ['^', 2, ['zoom']]],
            ['*', 156543.03392, ['cos', ['*', ['get', 'lat'], ['/', Math.PI, 180]]]],
          ],
          'circle-color': '#53b54e',
          'circle-opacity': 0.15,
          'circle-stroke-color': '#53b54e',
          'circle-stroke-opacity': 0.4,
          'circle-stroke-width': 1,
        },
      });

      sourceAdded = true;
    }

    const source = props.map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource;
    source?.setData({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      properties: {
        accuracy,
        lat,
      },
    });
  }

  function removeAccuracyCircle() {
    if (sourceAdded) {
      if (props.map.getLayer(LAYER_ID)) {
        props.map.removeLayer(LAYER_ID);
      }
      if (props.map.getSource(SOURCE_ID)) {
        props.map.removeSource(SOURCE_ID);
      }
      sourceAdded = false;
    }
  }

  createEffect(() => {
    const pos = gpsPosition();

    if (!pos) {
      if (marker) {
        marker.remove();
        marker = null;
      }
      removeAccuracyCircle();
      return;
    }

    updateAccuracyCircle(pos.longitude, pos.latitude, pos.accuracy);

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
    removeAccuracyCircle();
  });

  return null;
};

export default UserLocationMarker;
