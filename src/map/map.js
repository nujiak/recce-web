import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { CoordinateTransformer } from '../coords/index.js';
import { getAllPins, getAllTracks } from '../db/db.js';
import { getPrefs } from '../ui/settings.js';
import {
  renderMarkers,
  addMarker as addMarkerToMap,
  updateMarker as updateMarkerOnMap,
  removeMarker as removeMarkerFromMap,
} from './markers.js';
import * as tracksModule from './tracks.js';
import {
  haversineDistance,
  calculateBearing,
  formatDistance,
  formatBearing,
} from '../utils/geo.js';

let map = null;

// Track plotting state
let isPlottingMode = false;
let plotNodes = [];
let plotColor = 'red';

// GPS state
let gpsPosition = null;

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

  // Update GPS overlay on map move
  map.on('move', updateGPSOverlay);

  map.on('load', async () => {
    const [pins, tracks] = await Promise.all([getAllPins(), getAllTracks()]);
    renderMarkers(map, pins);
    tracksModule.init(map);
    tracksModule.loadTracks();
  });

  // Reload map data after import
  window.addEventListener('reloadMapData', async () => {
    const [pins, tracks] = await Promise.all([getAllPins(), getAllTracks()]);
    renderMarkers(map, pins);
    tracksModule.loadTracks();
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

  window.addEventListener('flyToTrack', (e) => {
    const { track } = e.detail;
    tracksModule.fitToTrack(track);
  });

  // Setup Go To dialog
  setupGotoDialog();

  // Setup Add button
  setupAddButton();

  // Setup track plotting
  setupTrackPlotting();

  // Listen for GPS position updates
  window.addEventListener('gpsPositionUpdate', (e) => {
    gpsPosition = e.detail.position;
    updateGPSOverlay();
  });
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

// Track plotting mode
function setupTrackPlotting() {
  const startTrackBtn = document.getElementById('start-track-btn');
  const plotBar = document.getElementById('track-plot-bar');
  const plotNodeBtn = document.getElementById('plot-node-btn');
  const plotUndoBtn = document.getElementById('plot-undo-btn');
  const plotSaveBtn = document.getElementById('plot-save-btn');
  const plotCancelBtn = document.getElementById('plot-cancel-btn');
  const plotNodeCount = document.getElementById('plot-node-count');

  // Show/hide start track button
  updateStartTrackButton();

  if (startTrackBtn) {
    startTrackBtn.addEventListener('click', startPlotting);
  }

  if (plotNodeBtn) {
    // Short press: add node without name
    // Long press: add node with checkpoint name
    let pressTimer = null;
    let isLongPress = false;

    plotNodeBtn.addEventListener('pointerdown', (e) => {
      isLongPress = false;
      pressTimer = setTimeout(() => {
        isLongPress = true;
        addNodeWithName();
      }, 500);
    });

    plotNodeBtn.addEventListener('pointerup', () => {
      clearTimeout(pressTimer);
      if (!isLongPress) {
        addNode();
      }
    });

    plotNodeBtn.addEventListener('pointerleave', () => {
      clearTimeout(pressTimer);
    });
  }

  if (plotUndoBtn) {
    plotUndoBtn.addEventListener('click', undoNode);
  }

  if (plotSaveBtn) {
    plotSaveBtn.addEventListener('click', savePlot);
  }

  if (plotCancelBtn) {
    plotCancelBtn.addEventListener('click', cancelPlot);
  }
}

function updateStartTrackButton() {
  const startTrackBtn = document.getElementById('start-track-btn');
  if (startTrackBtn) {
    startTrackBtn.disabled = isPlottingMode;
  }
}

function startPlotting() {
  isPlottingMode = true;
  plotNodes = [];
  plotColor = 'red';

  const plotBar = document.getElementById('track-plot-bar');

  if (plotBar) plotBar.style.display = 'flex';

  updatePlotCount();
}

function addNode() {
  if (!isPlottingMode) return;

  const center = map.getCenter();
  plotNodes.push({ lat: center.lat, lng: center.lng });
  tracksModule.updateTempTrack(plotNodes, false, plotColor);
  updatePlotCount();
}

function addNodeWithName() {
  if (!isPlottingMode) return;

  const center = map.getCenter();

  // Show checkpoint dialog
  const dialog = document.getElementById('checkpoint-dialog');
  const backdrop = document.getElementById('checkpoint-backdrop');
  const input = document.getElementById('checkpoint-name');
  const confirmBtn = document.getElementById('checkpoint-confirm');
  const skipBtn = document.getElementById('checkpoint-skip');
  const closeBtn = document.getElementById('checkpoint-close');

  if (input) input.value = '';
  dialog?.classList.add('open');
  backdrop?.classList.add('open');
  input?.focus();

  const handleConfirm = () => {
    const name = input?.value.trim();
    plotNodes.push({ lat: center.lat, lng: center.lng, name: name || undefined });
    tracksModule.updateTempTrack(plotNodes, false, plotColor);
    updatePlotCount();
    closeCheckpointDialog();
    cleanup();
  };

  const handleSkip = () => {
    addNode();
    closeCheckpointDialog();
    cleanup();
  };

  const handleClose = () => {
    closeCheckpointDialog();
    cleanup();
  };

  const closeCheckpointDialog = () => {
    dialog?.classList.remove('open');
    backdrop?.classList.remove('open');
  };

  const cleanup = () => {
    confirmBtn?.removeEventListener('click', handleConfirm);
    skipBtn?.removeEventListener('click', handleSkip);
    closeBtn?.removeEventListener('click', handleClose);
  };

  confirmBtn?.addEventListener('click', handleConfirm);
  skipBtn?.addEventListener('click', handleSkip);
  closeBtn?.addEventListener('click', handleClose);
}

function undoNode() {
  if (!isPlottingMode || plotNodes.length === 0) return;

  plotNodes.pop();
  tracksModule.updateTempTrack(plotNodes, false, plotColor);
  updatePlotCount();
}

function savePlot() {
  if (!isPlottingMode || plotNodes.length < 2) return;

  tracksModule.clearTempTrack();
  exitPlottingMode();

  window.dispatchEvent(
    new CustomEvent('openTrackEditor', {
      detail: { nodes: plotNodes },
    })
  );

  plotNodes = [];
}

function cancelPlot() {
  if (plotNodes.length > 0) {
    if (!confirm('Discard track?')) return;
  }

  tracksModule.clearTempTrack();
  exitPlottingMode();
  plotNodes = [];
}

function exitPlottingMode() {
  isPlottingMode = false;

  const plotBar = document.getElementById('track-plot-bar');
  if (plotBar) plotBar.style.display = 'none';

  updateStartTrackButton();
}

function updatePlotCount() {
  const plotNodeCount = document.getElementById('plot-node-count');
  if (plotNodeCount) {
    plotNodeCount.textContent = `${plotNodes.length} node${plotNodes.length !== 1 ? 's' : ''}`;
  }
}

// === GPS Overlay ===
function updateGPSOverlay() {
  const overlay = document.getElementById('gps-overlay');
  const distanceEl = document.getElementById('gps-overlay-distance');
  const bearingEl = document.getElementById('gps-overlay-bearing');

  if (!gpsPosition || !map) {
    overlay?.classList.add('hidden');
    return;
  }

  const center = map.getCenter();
  const distance = haversineDistance(gpsPosition.lat, gpsPosition.lng, center.lat, center.lng);
  const bearing = calculateBearing(gpsPosition.lat, gpsPosition.lng, center.lat, center.lng);

  const prefs = getPrefs();

  if (distanceEl) {
    distanceEl.textContent = formatDistance(distance, prefs.lengthUnit);
  }

  if (bearingEl) {
    bearingEl.textContent = formatBearing(bearing, prefs.angleUnit);
  }

  overlay?.classList.remove('hidden');
}

function updateCoordDisplay() {
  if (!map) return;
  const center = map.getCenter();
  const prefs = getPrefs();
  const display = CoordinateTransformer.toDisplay(center.lat, center.lng, prefs.coordinateSystem);
  const el = document.getElementById('target-coord-display');
  if (el) el.textContent = display;
}

// Pin marker functions
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

// Track functions - delegate to tracks module
export function addTrack(track) {
  tracksModule.addTrack(track);
}

export function updateTrack(track) {
  tracksModule.updateTrack(track);
}

export function removeTrack(trackId) {
  tracksModule.removeTrack(trackId);
}

export function getMap() {
  return map;
}
