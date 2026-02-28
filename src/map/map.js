import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { CoordinateTransformer } from '../coords/index.js';
import { getAllPins, addPin } from '../db/db.js';
import { renderMarkers, addMarker } from './markers.js';

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

  const addButton = document.getElementById('add-button');
  if (addButton) {
    addButton.addEventListener('click', openAddDialog);
  }

  const addPointDialog = document.getElementById('add-point');
  const addPointConfirm = document.getElementById('add-point-confirm');

  if (addPointDialog && addPointConfirm) {
    addPointDialog.addEventListener('click', (e) => {
      if (e.target === addPointDialog) addPointDialog.close();
    });

    addPointConfirm.addEventListener('click', handleAddConfirm);
  }
}

function updateCoordDisplay() {
  if (!map) return;
  const center = map.getCenter();
  const display = CoordinateTransformer.toDisplay(center.lat, center.lng, 'KERTAU');
  const el = document.getElementById('target-coord-display');
  if (el) el.textContent = display;
}

function openAddDialog() {
  if (!map) return;
  const center = map.getCenter();
  const display = CoordinateTransformer.toDisplay(center.lat, center.lng, 'KERTAU');
  const [easting, northing] = display.split(' ');

  const dialog = document.getElementById('add-point');
  const nameInput = dialog.querySelector('[name="name"]');
  const lngInput = dialog.querySelector('[name="lng"]');
  const latInput = dialog.querySelector('[name="lat"]');

  if (nameInput) nameInput.value = '';
  if (lngInput) lngInput.value = easting;
  if (latInput) latInput.value = northing;

  dialog.showModal();
}

async function handleAddConfirm() {
  const dialog = document.getElementById('add-point');
  const nameInput = dialog.querySelector('[name="name"]');
  const lngInput = dialog.querySelector('[name="lng"]');
  const latInput = dialog.querySelector('[name="lat"]');

  const name = nameInput.value.trim();
  const easting = parseFloat(lngInput.value);
  const northing = parseFloat(latInput.value);

  if (!name || isNaN(easting) || isNaN(northing)) return;

  const parsed = CoordinateTransformer.parse(`${easting} ${northing}`, 'KERTAU');
  if (!parsed) return;

  const pin = {
    createdAt: Date.now(),
    name,
    lat: parsed.lat,
    lng: parsed.lng,
    color: 'red',
    group: '',
    description: '',
  };

  const id = await addPin(pin);
  pin.id = id;
  addMarker(map, pin);

  dialog.close();
}

export function getMap() {
  return map;
}

export { map };
