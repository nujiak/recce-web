import { getAllPins } from '../db/db.js';
import { CoordinateTransformer } from '../coords/index.js';
import { getPrefs } from './settings.js';

let pins = [];
let sortBy = 'newest';
let searchQuery = '';
let selectedIds = new Set();
let isMultiSelectMode = false;

export function init() {
  setupToolbarEvents();
}

function setupToolbarEvents() {
  const sortBtn = document.getElementById('saved-sort-btn');
  const searchInput = document.getElementById('saved-search');
  const multiSelectBtn = document.getElementById('saved-multiselect-btn');
  const deleteBtn = document.getElementById('saved-delete-btn');
  const shareBtn = document.getElementById('saved-share-btn');
  const rulerBtn = document.getElementById('saved-ruler-btn');
  const cancelBtn = document.getElementById('saved-cancel-btn');

  if (sortBtn) {
    sortBtn.addEventListener('click', cycleSort);
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase();
      render();
    });
  }

  if (multiSelectBtn) {
    multiSelectBtn.addEventListener('click', toggleMultiSelect);
  }

  if (deleteBtn) {
    deleteBtn.addEventListener('click', handleBulkDelete);
  }

  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
    });
  }

  if (rulerBtn) {
    rulerBtn.addEventListener('click', () => {
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', exitMultiSelect);
  }
}

function cycleSort() {
  const sortOptions = ['newest', 'oldest', 'name-az', 'name-za', 'group'];
  const currentIndex = sortOptions.indexOf(sortBy);
  sortBy = sortOptions[(currentIndex + 1) % sortOptions.length];
  render();
}

function toggleMultiSelect() {
  isMultiSelectMode = !isMultiSelectMode;
  selectedIds.clear();
  render();
}

function exitMultiSelect() {
  isMultiSelectMode = false;
  selectedIds.clear();
  render();
}

async function handleBulkDelete() {
  if (selectedIds.size === 0) return;

  for (const id of selectedIds) {
    await window.db.pins.delete(id);
    window.dispatchEvent(new CustomEvent('pinDeleted', { detail: { id } }));
  }

  selectedIds.clear();
  isMultiSelectMode = false;
  await render();
}

export async function render() {
  const container = document.getElementById('saved-list');
  if (!container) return;

  pins = await getAllPins();

  let filtered = pins;

  if (searchQuery) {
    filtered = pins.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery) ||
        (p.group && p.group.toLowerCase().includes(searchQuery))
    );
  }

  filtered = sortPins(filtered);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="material-symbols-outlined empty-icon">pin_drop</span>
        <p>${searchQuery ? 'No matching pins' : 'No saved locations'}</p>
        <p class="empty-hint">${searchQuery ? 'Try a different search' : 'Add pins from the map screen'}</p>
      </div>
    `;
    return;
  }

  const prefs = getPrefs();

  if (sortBy === 'group') {
    container.innerHTML = renderGroupedCards(filtered, prefs);
  } else {
    container.innerHTML = filtered
      .map(
        (pin) => `
        <div class="pin-card ${selectedIds.has(pin.id) ? 'selected' : ''}" data-pin-id="${pin.id}">
          ${isMultiSelectMode ? `<input type="checkbox" class="pin-checkbox" ${selectedIds.has(pin.id) ? 'checked' : ''}>` : ''}
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
  }

  container.querySelectorAll('.pin-card').forEach((card) => {
    card.addEventListener('click', () => {
      const pinId = parseInt(card.dataset.pinId);
      if (isMultiSelectMode) {
        if (selectedIds.has(pinId)) {
          selectedIds.delete(pinId);
        } else {
          selectedIds.add(pinId);
        }
        render();
      } else {
        const pin = pins.find((p) => p.id === pinId);
        if (pin) {
          window.dispatchEvent(new CustomEvent('pinCardClicked', { detail: { pin } }));
        }
      }
    });
  });

  updateToolbar();
}

function renderGroupedCards(pins, prefs) {
  const groups = {};
  pins.forEach((pin) => {
    const group = pin.group || 'Ungrouped';
    if (!groups[group]) groups[group] = [];
    groups[group].push(pin);
  });

  const sortedGroups = Object.keys(groups).sort();

  return sortedGroups
    .map(
      (group) => `
    <div class="pin-group-header">${escapeHtml(group)}</div>
    ${groups[group]
      .map(
        (pin) => `
      <div class="pin-card ${selectedIds.has(pin.id) ? 'selected' : ''}" data-pin-id="${pin.id}">
        ${isMultiSelectMode ? `<input type="checkbox" class="pin-checkbox" ${selectedIds.has(pin.id) ? 'checked' : ''}>` : ''}
        <div class="pin-card-color color-${pin.color || 'red'}"></div>
        <div class="pin-card-content">
          <h3 class="pin-card-name">${escapeHtml(pin.name)}</h3>
          <p class="pin-card-coord">${CoordinateTransformer.toDisplay(pin.lat, pin.lng, prefs.coordinateSystem) || ''}</p>
        </div>
      </div>
    `
      )
      .join('')}
  `
    )
    .join('');
}

function sortPins(pinsToSort) {
  const sorted = [...pinsToSort];

  switch (sortBy) {
    case 'newest':
      return sorted.sort((a, b) => b.createdAt - a.createdAt);
    case 'oldest':
      return sorted.sort((a, b) => a.createdAt - b.createdAt);
    case 'name-az':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'name-za':
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case 'group':
      return sorted.sort((a, b) => {
        const groupA = a.group || '';
        const groupB = b.group || '';
        return groupA.localeCompare(groupB) || a.name.localeCompare(b.name);
      });
    default:
      return sorted;
  }
}

function updateToolbar() {
  const sortBtn = document.getElementById('saved-sort-btn');
  const toolbar = document.getElementById('saved-toolbar');
  const multiToolbar = document.getElementById('saved-multi-toolbar');

  if (sortBtn) {
    const labels = {
      newest: 'Newest',
      oldest: 'Oldest',
      'name-az': 'A-Z',
      'name-za': 'Z-A',
      group: 'Group',
    };
    sortBtn.textContent = labels[sortBy];
  }

  if (toolbar) {
    toolbar.style.display = isMultiSelectMode ? 'none' : '';
  }

  if (multiToolbar) {
    multiToolbar.style.display = isMultiSelectMode ? '' : 'none';
  }
}

export async function refresh() {
  await render();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
