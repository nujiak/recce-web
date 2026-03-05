import { Component, createEffect, onCleanup } from 'solid-js';
import maplibregl from 'maplibre-gl';
import circle from '@turf/circle';
import { gpsPosition, gpsHeading } from '../../stores/gps';

interface UserLocationMarkerProps {
  map: maplibregl.Map;
}

const ACCURACY_SOURCE_ID = 'user-location-accuracy';
const ACCURACY_LAYER_ID = 'user-location-accuracy-circle';

const UserLocationMarker: Component<UserLocationMarkerProps> = (props) => {
  let locationMarker: maplibregl.Marker | null = null;
  let headingMarker: maplibregl.Marker | null = null;
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

  function createHeadingElement(): HTMLElement {
    // SVG from ic_twotone_play_arrow_24.xml: 24×24, points right.
    // Android anchor(-0.2, 0.5) = the geographic point is at (-4.8, 12) in
    // the original SVG coordinate space.
    // MapLibre rotates around the element center, so we make a 0×0 container
    // positioned at the latlng, then absolutely position the SVG so that the
    // point (-4.8, 12) in SVG space lands exactly at the container's origin.
    // That means: left = 4.8px, top = -12px (shifting the SVG left and up).
    const container = document.createElement('div');
    container.style.cssText = 'width: 0; height: 0; position: relative;';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '24');
    svg.setAttribute('height', '24');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.style.cssText = 'display: block; position: absolute; left: 4.8px; top: -12px;';

    const inner = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    inner.setAttribute('d', 'M10,8.64v6.72L15.27,12z');
    inner.setAttribute('fill', '#53b54e');
    svg.appendChild(inner);

    const outline = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    outline.setAttribute('d', 'M8,19l11,-7L8,5v14zM10,8.64L15.27,12 10,15.36L10,8.64z');
    outline.setAttribute('fill', 'white');
    svg.appendChild(outline);

    container.appendChild(svg);
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

  createEffect(() => {
    const pos = gpsPosition();

    if (!pos) {
      if (locationMarker) {
        locationMarker.remove();
        locationMarker = null;
      }
      if (headingMarker) {
        headingMarker.remove();
        headingMarker = null;
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
  });

  createEffect(() => {
    const heading = gpsHeading();
    const pos = gpsPosition();

    if (!pos) {
      if (headingMarker) {
        headingMarker.remove();
        headingMarker = null;
      }
      return;
    }

    if (heading !== null) {
      if (!headingMarker) {
        const el = createHeadingElement();
        headingMarker = new maplibregl.Marker({
          element: el,
          rotationAlignment: 'map',
          pitchAlignment: 'map',
        })
          .setLngLat([pos.longitude, pos.latitude])
          .setRotation(heading)
          .addTo(props.map);
      } else {
        headingMarker.setLngLat([pos.longitude, pos.latitude]);
        headingMarker.setRotation(heading);
      }
    } else if (headingMarker) {
      headingMarker.remove();
      headingMarker = null;
    }
  });

  onCleanup(() => {
    locationMarker?.remove();
    locationMarker = null;
    headingMarker?.remove();
    headingMarker = null;
    removeAccuracyCircle();
  });

  return null;
};

export default UserLocationMarker;
