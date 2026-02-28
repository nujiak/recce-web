import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { CoordinateTransformer } from '../coords/index.js';
import { getAllPins } from '../db/db.js';
import { getPrefs } from '../ui/settings.js';
import {
  renderMarkers,
  addMarker as addMarkerToMap,
  updateMarker as updateMarkerOnMap,
  removeMarker as removeMarkerFromMap,
} from './markers.js';

let map = null;

export function init() {
  map = new maplibregl.Map({
    style: 'https://tiles.openfreemap.org/styles/liberty',
    center: [103.795, 1.376],
    zoom: 9.5,
    container: 'map',
  });

  const nav = new maplibregl.NavigationControl();
  map.addControl(nav, 'bottom-right');

  const geolocate = new maplibregl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: true,
  });
  map.addControl(geolocate, 'bottom-right');

  map.on('move', updateCoordDisplay);
  updateCoordDisplay();

  map.on('load', async () => {
    const pins = await getAllPins();
    renderMarkers(map, pins);
  });

  window.addEventListener('prefsChanged', (e) => {
    if (e.detail.key === 'coordinateSystem') {
      updateCoordDisplay();
    }
  });

  window.addEventListener('flyToPin', (e) => {
    const { lat, lng } = e.detail;
    map.flyTo({ center: [lng, lat], zoom: 15 });
  });
}

function updateCoordDisplay() {
  if (!map) return;
  const center = map.getCenter();
  const prefs = getPrefs();
  const display = CoordinateTransformer.toDisplay(center.lat, center.lng, prefs.coordinateSystem);
  const el = document.getElementById('target-coord-display');
  if (el) el.textContent = display;
}

export function addMarker(pin) {
  if (!map) return;
  addMarkerToMap(map, pin);
}

export function updateMarker(pin) {
  updateMarkerOnMap(map, pin);
}

export function removeMarker(pinId) {
  removeMarkerFromMap(pinId);
}

export function getMap() {
  return map;
}
