import { calculateTotalDistance, calculateArea, formatDistance, formatArea } from '../utils/geo.js';
import { getPrefs } from './settings.js';

let currentTrack = null;
let onEditCallback = null;

export function init() {
  const closeBtn = document.getElementById('track-info-close');
  const mapBtn = document.getElementById('track-info-map');
  const editBtn = document.getElementById('track-info-edit');
  const backdrop = document.getElementById('track-info-backdrop');

  if (closeBtn) {
    closeBtn.addEventListener('click', closeInfo);
  }

  if (mapBtn) {
    mapBtn.addEventListener('click', handleMap);
  }

  if (editBtn) {
    editBtn.addEventListener('click', handleEdit);
  }

  if (backdrop) {
    backdrop.addEventListener('click', closeInfo);
  }

  document.addEventListener('keydown', (e) => {
    const dialog = document.getElementById('track-info');
    if (e.key === 'Escape' && dialog?.classList.contains('open')) {
      closeInfo();
    }
  });
}

export function open(track, onEdit) {
  currentTrack = track;
  onEditCallback = onEdit;

  const prefs = getPrefs();

  const dialog = document.getElementById('track-info');
  const nameEl = document.getElementById('track-info-name');
  const typeIconEl = document.getElementById('track-info-type-icon');
  const typeLabelEl = document.getElementById('track-info-type-label');
  const statsEl = document.getElementById('track-info-stats');
  const checkpointsEl = document.getElementById('track-info-checkpoints');
  const groupEl = document.getElementById('track-info-group');
  const descEl = document.getElementById('track-info-description');

  // Set color header class
  const headerEl = document.getElementById('track-info-header');
  if (headerEl) {
    headerEl.className = `info-modal-header track-header color-${track.color || 'red'}`;
  }

  if (nameEl) nameEl.textContent = track.name;

  if (typeIconEl) {
    typeIconEl.className = 'material-symbols-outlined';
    typeIconEl.textContent = track.isCyclical ? 'trip_origin' : 'show_chart';
  }

  if (typeLabelEl) {
    typeLabelEl.textContent = track.isCyclical ? 'Area' : 'Path';
  }

  if (statsEl) {
    const distance = calculateTotalDistance(track.nodes, track.isCyclical);
    let statsHtml = `<div class="stat-row">
      <span class="stat-label">${track.isCyclical ? 'Perimeter' : 'Distance'}</span>
      <span class="stat-value">${formatDistance(distance, prefs.lengthUnit)}</span>
    </div>`;

    if (track.isCyclical) {
      const area = calculateArea(track.nodes);
      statsHtml += `<div class="stat-row">
        <span class="stat-label">Area</span>
        <span class="stat-value">${formatArea(area, prefs.lengthUnit)}</span>
      </div>`;
    }

    statsHtml += `<div class="stat-row">
      <span class="stat-label">Nodes</span>
      <span class="stat-value">${track.nodes?.length || 0}</span>
    </div>`;

    statsEl.innerHTML = statsHtml;
  }

  // Checkpoints (named nodes)
  if (checkpointsEl) {
    const checkpoints = (track.nodes || []).filter((n) => n.name);
    if (checkpoints.length > 0) {
      checkpointsEl.innerHTML = `
        <div class="checkpoints-header">Checkpoints</div>
        <ul class="checkpoints-list">
          ${checkpoints.map((cp) => `<li>${escapeHtml(cp.name)}</li>`).join('')}
        </ul>
      `;
      checkpointsEl.classList.remove('hidden');
    } else {
      checkpointsEl.classList.add('hidden');
    }
  }

  if (groupEl && track.group) {
    groupEl.textContent = track.group;
    groupEl.classList.remove('hidden');
  } else if (groupEl) {
    groupEl.classList.add('hidden');
  }

  if (descEl && track.description) {
    descEl.textContent = track.description;
    descEl.classList.remove('hidden');
  } else if (descEl) {
    descEl.classList.add('hidden');
  }

  dialog?.classList.add('open');
  document.getElementById('track-info-backdrop')?.classList.add('open');
}

function handleMap() {
  if (!currentTrack) return;

  window.dispatchEvent(new CustomEvent('flyToTrack', { detail: { track: currentTrack } }));
  closeInfo();
}

function handleEdit() {
  if (!currentTrack) return;

  const trackToEdit = currentTrack;
  const callback = onEditCallback;

  if (callback) {
    callback(trackToEdit);
  }

  closeInfo();
}

function closeInfo() {
  const dialog = document.getElementById('track-info');
  const backdrop = document.getElementById('track-info-backdrop');

  dialog?.classList.remove('open');
  backdrop?.classList.remove('open');

  currentTrack = null;
  onEditCallback = null;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
