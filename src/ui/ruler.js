import { getPrefs } from './settings.js';
import {
  haversineDistance,
  calculateBearing,
  formatDistance,
  formatBearing,
} from '../utils/geo.js';

// State - in memory only, not persisted
let points = []; // Array of { label, lat, lng, color }

// DOM elements
let rulerPanel = null;

export function init() {
  rulerPanel = document.getElementById('ruler-panel');

  if (!rulerPanel) return;

  // Replace placeholder with actual content
  render();

  // Listen for add to ruler events
  window.addEventListener('addToRuler', (e) => {
    const { items } = e.detail;
    if (items && items.length > 0) {
      points.push(...items);
      render();
    }
  });

  // Listen for preference changes
  window.addEventListener('prefsChanged', () => {
    render();
  });
}

function render() {
  if (!rulerPanel) return;

  if (points.length === 0) {
    rulerPanel.innerHTML = `
      <h3>
        <span class="material-symbols-outlined">straighten</span>
        Ruler
      </h3>
      <div class="ruler-empty">
        <span class="material-symbols-outlined ruler-empty-icon">straighten</span>
        <p>No points added</p>
        <p class="empty-hint">Select items from Saved and tap the ruler button</p>
      </div>
    `;
    return;
  }

  const prefs = getPrefs();

  // Build HTML for points and segments
  let html = `
    <h3>
      <span class="material-symbols-outlined">straighten</span>
      Ruler
    </h3>
    <div class="ruler-list">
  `;

  let totalDistance = 0;

  for (let i = 0; i < points.length; i++) {
    const point = points[i];

    // Add point row
    html += `
      <div class="ruler-point">
        <div class="ruler-point-color color-${point.color || 'red'}"></div>
        <span class="ruler-point-label">${escapeHtml(point.label)}</span>
      </div>
    `;

    // Add segment row (distance and bearing to next point)
    if (i < points.length - 1) {
      const nextPoint = points[i + 1];
      const distance = haversineDistance(point.lat, point.lng, nextPoint.lat, nextPoint.lng);
      const bearing = calculateBearing(point.lat, point.lng, nextPoint.lat, nextPoint.lng);

      totalDistance += distance;

      html += `
        <div class="ruler-segment">
          <div class="ruler-segment-values">
            <span class="ruler-segment-distance">${formatDistance(distance, prefs.lengthUnit)}</span>
            <span class="ruler-segment-bearing">${formatBearing(bearing, prefs.angleUnit)}</span>
          </div>
        </div>
      `;
    }
  }

  html += `
    </div>
    <div class="ruler-total">
      <span class="ruler-total-label">Total</span>
      <span class="ruler-total-value">${formatDistance(totalDistance, prefs.lengthUnit)}</span>
    </div>
    <div class="ruler-actions">
      <button id="ruler-clear-btn" class="btn-danger">Clear All</button>
    </div>
  `;

  rulerPanel.innerHTML = html;

  // Attach clear button handler
  const clearBtn = document.getElementById('ruler-clear-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', handleClear);
  }
}

function handleClear() {
  points = [];
  render();
}

export function addPoint(point) {
  points.push(point);
  render();
}

export function clearPoints() {
  points = [];
  render();
}

export function getPoints() {
  return [...points];
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
