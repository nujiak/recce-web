import { CoordinateTransformer } from '../coords/index.js';
import { getPrefs } from './settings.js';
import {
  haversineDistance,
  calculateBearing,
  formatDistance,
  formatBearing,
} from '../utils/geo.js';
import { showToast } from '../utils/toast.js';
import { copyToClipboard } from '../utils/clipboard.js';

// State
let watchId = null;
let currentPosition = null;
let accuracy = null;
let altitude = null;
let hasOrientation = false;
let azimuth = null;
let pitch = null;
let roll = null;

// DOM elements (cached)
let gpsPanel = null;
let locationCard = null;
let compassCard = null;
let coordValue = null;
let accuracyValue = null;
let altitudeValue = null;
let gpsStatus = null;
let compassNeedle = null;
let azimuthValue = null;
let pitchValue = null;
let rollValue = null;
let compassStatus = null;
let compassHint = null;

export function init() {
  gpsPanel = document.getElementById('gps-panel');

  if (!gpsPanel) return;

  // Replace placeholder with actual content
  gpsPanel.innerHTML = `
    <h3>
      <span class="material-symbols-outlined">satellite_alt</span>
      GPS
    </h3>
    
    <!-- Location Card -->
    <div class="gps-card">
      <div class="gps-card-header">
        <span class="gps-card-title">Location</span>
        <span id="gps-status" class="gps-status">Inactive</span>
      </div>
      <div id="gps-coord-value" class="gps-value">--</div>
      <div class="gps-meta">
        <span id="gps-accuracy" class="gps-meta-item">Accuracy: --</span>
        <span id="gps-altitude" class="gps-meta-item">Altitude: --</span>
      </div>
      <button id="gps-copy-btn" class="gps-copy-btn" disabled>Copy</button>
    </div>
    
    <!-- Compass Card -->
    <div class="gps-card">
      <div class="gps-card-header">
        <span class="gps-card-title">Compass</span>
        <span id="compass-status" class="gps-status">Inactive</span>
      </div>
      <div class="compass-container">
        <div class="compass-dial">
          <div id="compass-needle" class="compass-needle">
            <div class="compass-needle-north"></div>
            <span class="compass-needle-north-label">N</span>
            <div class="compass-needle-south"></div>
          </div>
        </div>
        <div class="compass-values">
          <div class="compass-value-row">
            <span class="compass-value-label">Azimuth</span>
            <span id="compass-azimuth" class="compass-value-number">--</span>
          </div>
          <div class="compass-value-row">
            <span class="compass-value-label">Pitch</span>
            <span id="compass-pitch" class="compass-value-number">--</span>
          </div>
          <div class="compass-value-row">
            <span class="compass-value-label">Roll</span>
            <span id="compass-roll" class="compass-value-number">--</span>
          </div>
        </div>
      </div>
      <p id="compass-hint" class="compass-hint">Rotate device to calibrate compass</p>
    </div>
  `;

  // Cache DOM elements
  coordValue = document.getElementById('gps-coord-value');
  accuracyValue = document.getElementById('gps-accuracy');
  altitudeValue = document.getElementById('gps-altitude');
  gpsStatus = document.getElementById('gps-status');
  compassNeedle = document.getElementById('compass-needle');
  azimuthValue = document.getElementById('compass-azimuth');
  pitchValue = document.getElementById('compass-pitch');
  rollValue = document.getElementById('compass-roll');
  compassStatus = document.getElementById('compass-status');
  compassHint = document.getElementById('compass-hint');

  // Setup copy button
  const copyBtn = document.getElementById('gps-copy-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', handleCopyCoord);
  }

  // Make coord value tappable to copy
  if (coordValue) {
    coordValue.style.cursor = 'pointer';
    coordValue.addEventListener('click', handleCopyCoord);
  }

  // Start GPS
  startGPS();

  // Start compass
  startCompass();

  // Listen for preference changes
  window.addEventListener('prefsChanged', () => {
    updateDisplay();
    updateCompassDisplay();
  });
}

function startGPS() {
  if (!navigator.geolocation) {
    if (gpsStatus) {
      gpsStatus.textContent = 'Unavailable';
      gpsStatus.classList.add('error');
    }
    return;
  }

  if (gpsStatus) {
    gpsStatus.textContent = 'Searching...';
    gpsStatus.classList.add('active');
  }

  watchId = navigator.geolocation.watchPosition(handlePosition, handlePositionError, {
    enableHighAccuracy: true,
    maximumAge: 10000,
    timeout: 30000,
  });
}

function handlePosition(position) {
  currentPosition = {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
  };
  accuracy = position.coords.accuracy;
  altitude = position.coords.altitude;

  if (gpsStatus) {
    gpsStatus.textContent = 'Active';
    gpsStatus.classList.add('active');
    gpsStatus.classList.remove('error');
  }

  const copyBtn = document.getElementById('gps-copy-btn');
  if (copyBtn) copyBtn.disabled = false;

  updateDisplay();

  // Dispatch event for map overlay
  window.dispatchEvent(
    new CustomEvent('gpsPositionUpdate', {
      detail: {
        position: currentPosition,
        accuracy,
        altitude,
      },
    })
  );
}

function handlePositionError(error) {
  console.error('GPS error:', error);

  if (gpsStatus) {
    gpsStatus.classList.remove('active');
    gpsStatus.classList.add('error');

    switch (error.code) {
      case error.PERMISSION_DENIED:
        gpsStatus.textContent = 'Permission denied';
        break;
      case error.POSITION_UNAVAILABLE:
        gpsStatus.textContent = 'Unavailable';
        break;
      case error.TIMEOUT:
        gpsStatus.textContent = 'Timeout';
        break;
      default:
        gpsStatus.textContent = 'Error';
    }
  }
}

function startCompass() {
  // Check if DeviceOrientationEvent is available
  if (!window.DeviceOrientationEvent) {
    if (compassStatus) {
      compassStatus.textContent = 'Unavailable';
      compassStatus.classList.add('error');
    }
    if (compassHint) {
      compassHint.textContent = 'Compass not supported on this device';
    }
    return;
  }

  // Request permission on iOS 13+
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    // We need to request permission on user interaction
    // For now, show a hint
    if (compassStatus) {
      compassStatus.textContent = 'Tap to enable';
      compassStatus.classList.add('active');
    }
    if (compassHint) {
      compassHint.textContent = 'Tap compass card to enable';
    }

    // Add click handler to request permission
    const compassCardEl = gpsPanel?.querySelector('.gps-card:last-child');
    if (compassCardEl) {
      compassCardEl.addEventListener('click', requestCompassPermission, { once: true });
    }
  } else {
    // Non-iOS or older iOS - just listen
    enableCompassListeners();
  }
}

async function requestCompassPermission(e) {
  try {
    const permission = await DeviceOrientationEvent.requestPermission();
    if (permission === 'granted') {
      enableCompassListeners();
    } else {
      if (compassStatus) {
        compassStatus.textContent = 'Denied';
        compassStatus.classList.add('error');
      }
    }
  } catch (err) {
    console.error('Compass permission error:', err);
    if (compassStatus) {
      compassStatus.textContent = 'Error';
      compassStatus.classList.add('error');
    }
  }
}

function enableCompassListeners() {
  window.addEventListener('deviceorientation', handleOrientation, true);

  if (compassStatus) {
    compassStatus.textContent = 'Active';
    compassStatus.classList.add('active');
    compassStatus.classList.remove('error');
  }
}

function handleOrientation(event) {
  // Get azimuth from compass heading (iOS) or alpha (Android)
  if (event.webkitCompassHeading !== undefined) {
    // iOS
    azimuth = event.webkitCompassHeading;
    hasOrientation = true;
  } else if (event.alpha !== null && event.absolute) {
    // Android with absolute orientation
    azimuth = 360 - event.alpha;
    hasOrientation = true;
  } else if (event.alpha !== null) {
    // Relative orientation - may need calibration
    azimuth = 360 - event.alpha;
    hasOrientation = true;
  } else {
    hasOrientation = false;
  }

  // Get pitch and roll
  pitch = event.beta; // -180 to 180 (front/back tilt)
  roll = event.gamma; // -90 to 90 (side tilt)

  updateCompassDisplay();
}

function updateDisplay() {
  if (!currentPosition) return;

  const prefs = getPrefs();
  const coordDisplay = CoordinateTransformer.toDisplay(
    currentPosition.lat,
    currentPosition.lng,
    prefs.coordinateSystem
  );

  if (coordValue) {
    coordValue.textContent = coordDisplay || '--';
  }

  if (accuracyValue) {
    if (accuracy !== null) {
      const accMeters = Math.round(accuracy);
      if (prefs.lengthUnit === 'imperial') {
        const accFeet = Math.round(accMeters * 3.28084);
        accuracyValue.textContent = `Accuracy: ±${accFeet} ft`;
      } else {
        accuracyValue.textContent = `Accuracy: ±${accMeters} m`;
      }
    } else {
      accuracyValue.textContent = 'Accuracy: --';
    }
  }

  if (altitudeValue) {
    if (altitude !== null) {
      if (prefs.lengthUnit === 'imperial') {
        const altFeet = Math.round(altitude * 3.28084);
        altitudeValue.textContent = `Altitude: ${altFeet} ft`;
      } else {
        const altMeters = Math.round(altitude);
        altitudeValue.textContent = `Altitude: ${altMeters} m`;
      }
    } else {
      altitudeValue.textContent = 'Altitude: --';
    }
  }
}

function updateCompassDisplay() {
  const prefs = getPrefs();

  if (azimuth !== null && hasOrientation) {
    // Needle always points north: rotate opposite to device heading
    if (compassNeedle) {
      compassNeedle.style.transform = `rotate(${-azimuth}deg)`;
    }

    // Update azimuth display
    if (azimuthValue) {
      azimuthValue.textContent = formatBearing(azimuth, prefs.angleUnit);
    }

    // Update calibration hint
    if (compassHint) {
      compassHint.textContent = '';
    }
  } else {
    if (azimuthValue) {
      azimuthValue.textContent = '--';
    }
    if (compassHint) {
      compassHint.textContent = 'Rotate device to calibrate compass';
    }
  }

  if (pitch !== null) {
    if (pitchValue) {
      pitchValue.textContent = `${pitch.toFixed(1)}°`;
    }
  } else {
    if (pitchValue) {
      pitchValue.textContent = '--';
    }
  }

  if (roll !== null) {
    if (rollValue) {
      rollValue.textContent = `${roll.toFixed(1)}°`;
    }
  } else {
    if (rollValue) {
      rollValue.textContent = '--';
    }
  }
}

async function handleCopyCoord() {
  if (!currentPosition) return;

  const prefs = getPrefs();
  const coordDisplay = CoordinateTransformer.toDisplay(
    currentPosition.lat,
    currentPosition.lng,
    prefs.coordinateSystem
  );

  try {
    await copyToClipboard(coordDisplay);
    showToast('Coordinates copied', 'success');
  } catch (err) {
    showToast('Failed to copy', 'error');
  }
}

export function getCurrentPosition() {
  return currentPosition;
}

export function hasGPSPosition() {
  return currentPosition !== null;
}
