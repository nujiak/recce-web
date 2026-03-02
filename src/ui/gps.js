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
let currentNeedleRotation = 0;

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

function generateCompassGradations() {
  const cardinal = ['N', 'E', 'S', 'W'];
  const intermediate = ['NE', 'SE', 'SW', 'NW'];
  let html = '';

  // Cardinal directions (0, 90, 180, 270)
  cardinal.forEach((label, i) => {
    const deg = i * 90;
    html += `<div class="compass-mark compass-mark--cardinal" style="--deg: ${deg}deg">${label}</div>`;
  });

  // Intermediate directions (45, 135, 225, 315)
  intermediate.forEach((label, i) => {
    const deg = 45 + i * 90;
    html += `<div class="compass-mark compass-mark--intermediate" style="--deg: ${deg}deg">${label}</div>`;
  });

  // Minor tick marks every 15° (skip 0, 45, 90, etc. which already have labels)
  for (let deg = 0; deg < 360; deg += 15) {
    if (deg % 45 === 0) continue; // Skip positions with labels
    html += `<div class="compass-mark compass-mark--tick" style="--deg: ${deg}deg"></div>`;
  }

  return html;
}

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
      <div class="gps-location-layout">
        <div class="gps-coord-row">
          <span id="gps-coord-value" class="gps-coord-value">--</span>
        </div>
        <div class="gps-divider"></div>
        <div class="gps-meta-row">
          <div class="gps-meta-item">
            <span class="gps-meta-label">Altitude</span>
            <span id="gps-altitude" class="gps-meta-value">--</span>
          </div>
          <div class="gps-meta-item">
            <span class="gps-meta-label">Accuracy</span>
            <span id="gps-accuracy" class="gps-meta-value">--</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Compass Card -->
    <div class="gps-card">
      <div class="gps-card-header">
        <span class="gps-card-title">Compass</span>
        <span id="compass-status" class="gps-status">Inactive</span>
      </div>
      <div class="compass-container">
        <div class="compass-dial">
          <div class="compass-gradations">${generateCompassGradations()}</div>
          <div id="compass-needle" class="compass-needle">
            <div class="compass-needle-north"></div>
            <span class="compass-needle-north-label">N</span>
            <div class="compass-needle-south"></div>
          </div>
        </div>
        <div class="compass-values">
          <div class="compass-value-item">
            <span class="compass-value-label">Azimuth</span>
            <span id="compass-azimuth" class="compass-value-number">--</span>
          </div>
          <div class="compass-value-item">
            <span class="compass-value-label">Pitch</span>
            <span id="compass-pitch" class="compass-value-number">--</span>
          </div>
          <div class="compass-value-item">
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

function getScreenOrientation() {
  if (screen.orientation) {
    return screen.orientation.angle;
  }
  if (window.orientation !== undefined) {
    return window.orientation;
  }
  return 0;
}

function transformOrientationValues(azimuthVal, pitchVal, rollVal) {
  const orientation = getScreenOrientation();

  switch (orientation) {
    case 90:
      return {
        azimuth: azimuthVal - 90,
        pitch: -rollVal,
        roll: pitchVal,
      };
    case -90:
    case 270:
      return {
        azimuth: azimuthVal + 90,
        pitch: rollVal,
        roll: -pitchVal,
      };
    case 180:
      return {
        azimuth: azimuthVal,
        pitch: -pitchVal,
        roll: -rollVal,
      };
    default:
      return { azimuth: azimuthVal + 180, pitch: pitchVal, roll: rollVal };
  }
}

function updateNeedleRotation(targetAzimuth) {
  // targetAzimuth is 0-360 from compass
  // currentNeedleRotation is unbounded (can be any value)

  // Calculate the difference
  let delta = targetAzimuth - (currentNeedleRotation % 360);

  // Normalize to shortest path (-180 to 180)
  while (delta > 180) delta -= 360;
  while (delta < -180) delta += 360;

  // Accumulate rotation (unbounded)
  currentNeedleRotation += delta;

  // Apply rotation (negative because needle rotates opposite to heading)
  if (compassNeedle) {
    compassNeedle.style.transform = `rotate(${-currentNeedleRotation}deg)`;
  }
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
        accuracyValue.textContent = `±${accFeet} ft`;
      } else {
        accuracyValue.textContent = `±${accMeters} m`;
      }
    } else {
      accuracyValue.textContent = '--';
    }
  }

  if (altitudeValue) {
    if (altitude !== null) {
      if (prefs.lengthUnit === 'imperial') {
        const altFeet = Math.round(altitude * 3.28084);
        altitudeValue.textContent = `${altFeet} ft`;
      } else {
        const altMeters = Math.round(altitude);
        altitudeValue.textContent = `${altMeters} m`;
      }
    } else {
      altitudeValue.textContent = '--';
    }
  }
}

function updateCompassDisplay() {
  const prefs = getPrefs();

  if (azimuth !== null && hasOrientation) {
    // Transform values based on screen orientation
    let transformed = transformOrientationValues(azimuth, pitch, roll);

    // Apply +90° offset on mobile devices
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      transformed.azimuth += 90;
    }

    // Normalize azimuth to 0-360
    let displayAzimuth = ((transformed.azimuth % 360) + 360) % 360;

    // Update needle with smooth rotation
    updateNeedleRotation(displayAzimuth);

    // Update azimuth display
    if (azimuthValue) {
      azimuthValue.textContent = formatBearing(displayAzimuth, prefs.angleUnit);
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
    const transformed = transformOrientationValues(azimuth || 0, pitch, roll || 0);
    if (pitchValue) {
      pitchValue.textContent = `${transformed.pitch.toFixed(1)}°`;
    }
  } else {
    if (pitchValue) {
      pitchValue.textContent = '--';
    }
  }

  if (roll !== null) {
    const transformed = transformOrientationValues(azimuth || 0, pitch || 0, roll);
    if (rollValue) {
      rollValue.textContent = `${transformed.roll.toFixed(1)}°`;
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
