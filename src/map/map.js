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

  // Setup Go To dialog
  setupGotoDialog();

  // Setup Add button
  setupAddButton();
}

function setupGotoDialog() {
  const gotoBtn = document.getElementById('goto-btn');
  const gotoDialog = document.getElementById('goto-dialog');
  const gotoBackdrop = document.getElementById('goto-backdrop');
  const gotoClose = document.getElementById('goto-close');
  const gotoInput = document.getElementById('goto-input');
  const gotoSubmit = document.getElementById('goto-submit');

  if (gotoBtn) {
    gotoBtn.addEventListener('click', () => {
      const prefs = getPrefs();
      gotoInput.placeholder = `Enter ${prefs.coordinateSystem} coordinates`;
      gotoInput.value = '';
      gotoDialog?.classList.add('open');
      gotoBackdrop?.classList.add('open');
      gotoInput?.focus();
    });
  }

  if (gotoClose) {
    gotoClose.addEventListener('click', closeGotoDialog);
  }

  if (gotoBackdrop) {
    gotoBackdrop.addEventListener('click', closeGotoDialog);
  }

  if (gotoSubmit) {
    gotoSubmit.addEventListener('click', handleGotoSubmit);
  }

  if (gotoInput) {
    gotoInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleGotoSubmit();
      } else if (e.key === 'Escape') {
        closeGotoDialog();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && gotoDialog?.classList.contains('open')) {
      closeGotoDialog();
    }
  });
}

function handleGotoSubmit() {
  const gotoInput = document.getElementById('goto-input');
  const input = gotoInput?.value.trim();

  if (!input) return;

  const prefs = getPrefs();
  const parsed = CoordinateTransformer.parse(input, prefs.coordinateSystem);

  if (parsed) {
    map.flyTo({ center: [parsed.lng, parsed.lat], zoom: 15 });
    closeGotoDialog();
  } else {
    gotoInput.classList.add('error');
    setTimeout(() => gotoInput?.classList.remove('error'), 1000);
  }
}

function closeGotoDialog() {
  const gotoDialog = document.getElementById('goto-dialog');
  const gotoBackdrop = document.getElementById('goto-backdrop');
  gotoDialog?.classList.remove('open');
  gotoBackdrop?.classList.remove('open');
}

function setupAddButton() {
  const addButton = document.getElementById('add-button');

  if (addButton) {
    addButton.addEventListener('click', () => {
      const center = map.getCenter();
      window.dispatchEvent(
        new CustomEvent('openPinEditor', {
          detail: { lat: center.lat, lng: center.lng },
        })
      );
    });
  }
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
