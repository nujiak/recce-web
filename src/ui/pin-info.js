import { CoordinateTransformer } from '../coords/index.js';
import { showToast } from '../utils/toast.js';

let currentPin = null;
let onEditCallback = null;

export function init() {
  const closeBtn = document.getElementById('pin-info-close');
  const mapBtn = document.getElementById('pin-info-map');
  const editBtn = document.getElementById('pin-info-edit');
  const openMapsBtn = document.getElementById('pin-info-open-maps');
  const backdrop = document.getElementById('pin-info-backdrop');

  if (closeBtn) {
    closeBtn.addEventListener('click', closeInfo);
  }

  if (mapBtn) {
    mapBtn.addEventListener('click', handleMap);
  }

  if (editBtn) {
    editBtn.addEventListener('click', handleEdit);
  }

  if (openMapsBtn) {
    openMapsBtn.addEventListener('click', handleOpenMaps);
  }

  if (backdrop) {
    backdrop.addEventListener('click', closeInfo);
  }

  document.addEventListener('keydown', (e) => {
    const dialog = document.getElementById('pin-info');
    if (e.key === 'Escape' && dialog?.classList.contains('open')) {
      closeInfo();
    }
  });
}

export function open(pin, onEdit) {
  currentPin = pin;
  onEditCallback = onEdit;

  const dialog = document.getElementById('pin-info');
  const nameEl = document.getElementById('pin-info-name');
  const groupEl = document.getElementById('pin-info-group');
  const descEl = document.getElementById('pin-info-description');
  const coordListEl = document.getElementById('pin-info-coord-list');

  if (nameEl) nameEl.textContent = pin.name;

  if (groupEl && pin.group) {
    groupEl.textContent = pin.group;
    groupEl.classList.remove('hidden');
  } else if (groupEl) {
    groupEl.classList.add('hidden');
  }

  if (descEl && pin.description) {
    descEl.textContent = pin.description;
    descEl.classList.remove('hidden');
  } else if (descEl) {
    descEl.classList.add('hidden');
  }

  if (coordListEl) {
    const allCoords = CoordinateTransformer.allSystems(pin.lat, pin.lng);
    coordListEl.innerHTML = '';
    for (const [system, display] of allCoords) {
      const row = document.createElement('div');
      row.className = 'pin-info-coord-row';
      row.innerHTML = `
        <span class="pin-info-coord-name">${system}</span>
        <span class="pin-info-coord-value">${display}</span>
      `;
      row.addEventListener('click', async () => {
        const value = row.querySelector('.pin-info-coord-value')?.textContent.trim();
        if (!value) return;
        try {
          await navigator.clipboard.writeText(value);
          showToast('Coordinates copied', 'success');
        } catch {
          showToast('Failed to copy', 'error');
        }
      });
      coordListEl.appendChild(row);
    }
  }

  dialog?.classList.add('open');
  document.getElementById('pin-info-backdrop')?.classList.add('open');
}

function handleMap() {
  if (!currentPin) return;

  window.dispatchEvent(
    new CustomEvent('flyToPin', { detail: { lat: currentPin.lat, lng: currentPin.lng } })
  );
  closeInfo();
}

function handleEdit() {
  if (!currentPin) return;

  const pinToEdit = currentPin;
  const callback = onEditCallback;
  closeInfo();

  if (callback) {
    callback(pinToEdit);
  }
}

function handleOpenMaps() {
  if (!currentPin) return;

  const { lat, lng, name } = currentPin;

  // Try geo: URI first (works on mobile)
  const geoUri = `geo:${lat},${lng}?q=${lat},${lng}${name ? ` (${encodeURIComponent(name)})` : ''}`;

  // Fallback to Google Maps URL
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  // Create a temporary link and try to open
  const link = document.createElement('a');
  link.href = geoUri;
  link.target = '_blank';

  // On mobile, geo: URI might work; on desktop, fall back to Google Maps
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isMobile) {
    window.location.href = geoUri;
  } else {
    window.open(googleMapsUrl, '_blank', 'noopener');
  }
}

function closeInfo() {
  const dialog = document.getElementById('pin-info');
  const backdrop = document.getElementById('pin-info-backdrop');

  dialog?.classList.remove('open');
  backdrop?.classList.remove('open');

  currentPin = null;
  onEditCallback = null;
}
