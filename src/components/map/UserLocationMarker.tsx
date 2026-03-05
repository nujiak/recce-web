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
    // A triangle that orbits the location dot, pointing toward the azimuth.
    // The SVG canvas is 40×40; the geographic point (dot center) maps to the
    // SVG center (20, 20). The triangle sits above the center so that when
    // MapLibre calls setRotation(heading) it sweeps around the dot.
    //
    // Triangle vertices (isosceles, pointing up):
    //   tip:         (20,  3)  — apex, ~17px above center
    //   base-left:   (14, 14)  — base corners
    //   base-right:  (26, 14)
    //
    // MapLibre anchor = "center" (default) → rotation origin = (20, 20) = geo point.
    // rotationAlignment/pitchAlignment: 'map' keeps the element glued to map space.
    const container = document.createElement('div');
    container.style.cssText = 'width: 40px; height: 40px; position: relative;';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '40');
    svg.setAttribute('height', '40');
    svg.setAttribute('viewBox', '0 0 40 40');
    svg.style.cssText = 'display: block; position: absolute; left: 0; top: 0;';

    // White outline (slightly larger triangle for contrast)
    const outline = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    outline.setAttribute('points', '20,1 13,15 27,15');
    outline.setAttribute('fill', 'white');
    outline.setAttribute('stroke', 'white');
    outline.setAttribute('stroke-width', '2');
    outline.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(outline);

    // Green filled triangle
    const inner = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    inner.setAttribute('points', '20,3 14,14 26,14');
    inner.setAttribute('fill', '#53b54e');
    svg.appendChild(inner);

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
