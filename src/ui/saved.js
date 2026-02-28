import { getAllPins } from '../db/db.js';
import { CoordinateTransformer } from '../coords/index.js';
import { getPrefs } from './settings.js';

let pins = [];

export function init() {}

export async function render() {
  const container = document.getElementById('saved-list');
  if (!container) return;

  pins = await getAllPins();

  if (pins.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="material-symbols-outlined empty-icon">pin_drop</span>
        <p>No saved locations</p>
        <p class="empty-hint">Add pins from the map screen</p>
      </div>
    `;
    return;
  }

  const prefs = getPrefs();

  container.innerHTML = pins
    .map(
      (pin) => `
      <div class="pin-card" data-pin-id="${pin.id}">
        <div class="pin-card-color color-${pin.color || 'red'}"></div>
        <div class="pin-card-content">
          <h3 class="pin-card-name">${escapeHtml(pin.name)}</h3>
          <p class="pin-card-coord">${CoordinateTransformer.toDisplay(pin.lat, pin.lng, prefs.coordinateSystem) || ''}</p>
          ${pin.group ? `<span class="pin-card-group">${escapeHtml(pin.group)}</span>` : ''}
        </div>
      </div>
    `
    )
    .join('');

  container.querySelectorAll('.pin-card').forEach((card) => {
    card.addEventListener('click', () => {
      const pinId = parseInt(card.dataset.pinId);
      const pin = pins.find((p) => p.id === pinId);
      if (pin) {
        window.dispatchEvent(new CustomEvent('pinCardClicked', { detail: { pin } }));
      }
    });
  });
}

export async function refresh() {
  await render();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
