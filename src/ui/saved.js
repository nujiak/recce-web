import { getAllPins, getAllTracks, deletePin, deleteTrack } from '../db/db.js';
import { CoordinateTransformer } from '../coords/index.js';
import { getPrefs } from './settings.js';
import { formatDistance } from '../utils/geo.js';

let pins = [];
let tracks = [];
let sortBy = 'newest';
let searchQuery = '';
let selectedIds = new Set(); // stores 'pin:id' or 'track:id' strings
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
      // TODO: Phase 7 - Share functionality
    });
  }

  if (rulerBtn) {
    rulerBtn.addEventListener('click', () => {
      // TODO: Phase 9 - Add to Ruler
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

  for (const key of selectedIds) {
    const [type, idStr] = key.split(':');
    const id = parseInt(idStr);

    if (type === 'pin') {
      await deletePin(id);
      window.dispatchEvent(new CustomEvent('pinDeleted', { detail: { id } }));
    } else if (type === 'track') {
      await deleteTrack(id);
      window.dispatchEvent(new CustomEvent('trackDeleted', { detail: { id } }));
    }
  }

  selectedIds.clear();
  isMultiSelectMode = false;
  await render();
}

export async function render() {
  const container = document.getElementById('saved-list');
  if (!container) return;

  [pins, tracks] = await Promise.all([getAllPins(), getAllTracks()]);

  // Create unified list with type markers
  const items = [
    ...pins.map((p) => ({ ...p, itemType: 'pin' })),
    ...tracks.map((t) => ({ ...t, itemType: 'track' })),
  ];

  let filtered = items;

  if (searchQuery) {
    filtered = items.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery) ||
        (item.group && item.group.toLowerCase().includes(searchQuery))
    );
  }

  filtered = sortItems(filtered);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="material-symbols-outlined empty-icon">pin_drop</span>
        <p>${searchQuery ? 'No matching items' : 'No saved locations'}</p>
        <p class="empty-hint">${searchQuery ? 'Try a different search' : 'Add pins or tracks from the map screen'}</p>
      </div>
    `;
    return;
  }

  const prefs = getPrefs();

  if (sortBy === 'group') {
    container.innerHTML = renderGroupedCards(filtered, prefs);
  } else {
    container.innerHTML = filtered.map((item) => renderCard(item, prefs)).join('');
  }

  // Attach click handlers
  container.querySelectorAll('.pin-card, .track-card').forEach((card) => {
    card.addEventListener('click', () => {
      const type = card.dataset.type;
      const id = parseInt(card.dataset.id);
      const key = `${type}:${id}`;

      if (isMultiSelectMode) {
        if (selectedIds.has(key)) {
          selectedIds.delete(key);
        } else {
          selectedIds.add(key);
        }
        render();
      } else {
        if (type === 'pin') {
          const pin = pins.find((p) => p.id === id);
          if (pin) {
            window.dispatchEvent(new CustomEvent('pinCardClicked', { detail: { pin } }));
          }
        } else {
          const track = tracks.find((t) => t.id === id);
          if (track) {
            window.dispatchEvent(new CustomEvent('trackCardClicked', { detail: { track } }));
          }
        }
      }
    });
  });

  updateToolbar();
}

function renderCard(item, prefs) {
  const key = `${item.itemType}:${item.id}`;
  const isSelected = selectedIds.has(key);
  const checkboxHtml = isMultiSelectMode
    ? `<input type="checkbox" class="pin-checkbox" ${isSelected ? 'checked' : ''}>`
    : '';

  if (item.itemType === 'pin') {
    return `
      <div class="pin-card ${isSelected ? 'selected' : ''}" data-type="pin" data-id="${item.id}">
        ${checkboxHtml}
        <div class="pin-card-color color-${item.color || 'red'}"></div>
        <div class="pin-card-content">
          <h3 class="pin-card-name">${escapeHtml(item.name)}</h3>
          <p class="pin-card-coord">${CoordinateTransformer.toDisplay(item.lat, item.lng, prefs.coordinateSystem) || ''}</p>
          ${item.group ? `<span class="pin-card-group">${escapeHtml(item.group)}</span>` : ''}
        </div>
      </div>
    `;
  } else {
    const distance = formatDistance(
      calculateTrackDistance(item.nodes, item.isCyclical),
      prefs.lengthUnit
    );
    return `
      <div class="track-card ${isSelected ? 'selected' : ''}" data-type="track" data-id="${item.id}">
        ${checkboxHtml}
        <div class="track-card-color color-${item.color || 'red'}"></div>
        <div class="track-card-content">
          <h3 class="track-card-name">${escapeHtml(item.name)}</h3>
          <p class="track-card-meta">
            <span class="track-card-type">
              <span class="material-symbols-outlined">${item.isCyclical ? 'trip_origin' : 'show_chart'}</span>
              ${item.isCyclical ? 'Area' : 'Path'}
            </span>
            <span>${distance}</span>
            <span>${item.nodes?.length || 0} nodes</span>
          </p>
          ${item.group ? `<span class="pin-card-group">${escapeHtml(item.group)}</span>` : ''}
        </div>
      </div>
    `;
  }
}

function renderGroupedCards(items, prefs) {
  const groups = {};
  items.forEach((item) => {
    const group = item.group || 'Ungrouped';
    if (!groups[group]) groups[group] = [];
    groups[group].push(item);
  });

  const sortedGroups = Object.keys(groups).sort();

  return sortedGroups
    .map(
      (group) => `
    <div class="pin-group-header">${escapeHtml(group)}</div>
    ${groups[group].map((item) => renderCard(item, prefs)).join('')}
  `
    )
    .join('');
}

function sortItems(itemsToSort) {
  const sorted = [...itemsToSort];

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
  const selectedCountEl = document.getElementById('selected-count');

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

  if (selectedCountEl) {
    selectedCountEl.textContent = selectedIds.size;
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

function calculateTrackDistance(nodes, isCyclical) {
  if (!nodes || nodes.length < 2) return 0;

  let total = 0;
  for (let i = 0; i < nodes.length - 1; i++) {
    total += haversine(nodes[i].lat, nodes[i].lng, nodes[i + 1].lat, nodes[i + 1].lng);
  }

  if (isCyclical && nodes.length >= 3) {
    total += haversine(
      nodes[nodes.length - 1].lat,
      nodes[nodes.length - 1].lng,
      nodes[0].lat,
      nodes[0].lng
    );
  }

  return total;
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
