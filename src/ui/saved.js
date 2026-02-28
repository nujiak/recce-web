import { getAllPins, getAllTracks, deletePin, deleteTrack, addPin, addTrack } from '../db/db.js';
import { CoordinateTransformer } from '../coords/index.js';
import { getPrefs } from './settings.js';
import { formatDistance } from '../utils/geo.js';
import { encode, decode } from '../share/share.js';
import { showToast } from '../utils/toast.js';

let pins = [];
let tracks = [];
let cachedItems = [];
let sortBy = 'newest';
let searchQuery = '';
let selectedIds = new Set();
let isMultiSelectMode = false;
let longPressTimer = null;
let longPressStart = null;
let longPressHandled = false;

export function init() {
  setupToolbarEvents();
  setupImportDialog();
  render(true);
}

function setupToolbarEvents() {
  const sortBtn = document.getElementById('saved-sort-btn');
  const searchInput = document.getElementById('saved-search');
  const deleteBtn = document.getElementById('saved-delete-btn');
  const shareBtn = document.getElementById('saved-share-btn');
  const rulerBtn = document.getElementById('saved-ruler-btn');
  const cancelBtn = document.getElementById('saved-cancel-btn');
  const importBtn = document.getElementById('saved-import-btn');

  if (sortBtn) {
    sortBtn.addEventListener('click', cycleSort);
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase();
      render();
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener('click', handleBulkDelete);
  }

  if (shareBtn) {
    shareBtn.addEventListener('click', handleShare);
  }

  if (rulerBtn) {
    rulerBtn.addEventListener('click', handleAddToRuler);
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', exitMultiSelect);
  }

  if (importBtn) {
    importBtn.addEventListener('click', openImportDialog);
  }
}

function cycleSort() {
  const sortOptions = ['newest', 'oldest', 'name-az', 'name-za', 'group'];
  const currentIndex = sortOptions.indexOf(sortBy);
  sortBy = sortOptions[(currentIndex + 1) % sortOptions.length];
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
  cachedItems = [];
  await render(true);
}

export async function render(forceRefetch = false) {
  const container = document.getElementById('saved-list');
  if (!container) return;

  if (forceRefetch || cachedItems.length === 0) {
    [pins, tracks] = await Promise.all([getAllPins(), getAllTracks()]);
    cachedItems = [
      ...pins.map((p) => ({ ...p, itemType: 'pin' })),
      ...tracks.map((t) => ({ ...t, itemType: 'track' })),
    ];
  }

  const items = cachedItems;

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

  // Attach event handlers
  container.querySelectorAll('.pin-card, .track-card').forEach((card) => {
    card.addEventListener('pointerdown', (e) => {
      longPressStart = { x: e.clientX, y: e.clientY };
      longPressHandled = false;
      longPressTimer = setTimeout(() => {
        const type = card.dataset.type;
        const id = parseInt(card.dataset.id);
        const key = `${type}:${id}`;
        isMultiSelectMode = true;
        selectedIds.add(key);
        render();
        navigator.vibrate?.(30);
        longPressHandled = true;
      }, 300);
    });

    card.addEventListener('pointermove', (e) => {
      if (!longPressStart || !longPressTimer) return;
      const dx = e.clientX - longPressStart.x;
      const dy = e.clientY - longPressStart.y;
      if (Math.sqrt(dx * dx + dy * dy) > 8) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    });

    card.addEventListener('pointerup', () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
      longPressStart = null;
    });

    card.addEventListener('pointercancel', () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
      longPressStart = null;
    });

    card.addEventListener('click', () => {
      if (longPressHandled) return;

      const type = card.dataset.type;
      const id = parseInt(card.dataset.id);
      const key = `${type}:${id}`;

      if (isMultiSelectMode) {
        if (selectedIds.has(key)) {
          selectedIds.delete(key);
        } else {
          selectedIds.add(key);
        }
        card.classList.toggle('selected');
        const checkbox = card.querySelector('input[type="checkbox"]');
        if (checkbox) checkbox.checked = selectedIds.has(key);
        if (selectedIds.size === 0) {
          exitMultiSelect();
        } else {
          updateToolbar();
        }
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
  const hintEl = document.getElementById('saved-hint');

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

  if (hintEl) {
    hintEl.style.display = isMultiSelectMode ? 'none' : '';
  }
}

export async function refresh() {
  cachedItems = [];
  await render(true);
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

// === Share functionality ===
async function handleShare() {
  if (selectedIds.size === 0) return;

  const selectedPins = [];
  const selectedTracks = [];

  for (const key of selectedIds) {
    const [type, idStr] = key.split(':');
    const id = parseInt(idStr);

    if (type === 'pin') {
      const pin = pins.find((p) => p.id === id);
      if (pin) selectedPins.push(pin);
    } else if (type === 'track') {
      const track = tracks.find((t) => t.id === id);
      if (track) selectedTracks.push(track);
    }
  }

  if (selectedPins.length === 0 && selectedTracks.length === 0) return;

  try {
    const code = encode(selectedPins, selectedTracks);
    await copyToClipboard(code);
    showToast(
      `Share code copied (${selectedPins.length} pin${selectedPins.length !== 1 ? 's' : ''}, ${selectedTracks.length} track${selectedTracks.length !== 1 ? 's' : ''})`,
      'success'
    );
    exitMultiSelect();
  } catch (err) {
    console.error('Share error:', err);
    showToast('Failed to copy share code', 'error');
  }
}

async function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

// === Import functionality ===
let importPreviewData = null;

function setupImportDialog() {
  const dialog = document.getElementById('import-dialog');
  const backdrop = document.getElementById('import-backdrop');
  const closeBtn = document.getElementById('import-close');
  const cancelBtn = document.getElementById('import-cancel');
  const confirmBtn = document.getElementById('import-confirm');
  const input = document.getElementById('import-input');

  if (closeBtn) {
    closeBtn.addEventListener('click', closeImportDialog);
  }

  if (backdrop) {
    backdrop.addEventListener('click', closeImportDialog);
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeImportDialog);
  }

  if (confirmBtn) {
    confirmBtn.addEventListener('click', handleImportConfirm);
  }

  if (input) {
    input.addEventListener('input', handleImportInput);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dialog?.classList.contains('open')) {
      closeImportDialog();
    }
  });
}

function openImportDialog() {
  const dialog = document.getElementById('import-dialog');
  const backdrop = document.getElementById('import-backdrop');
  const input = document.getElementById('import-input');
  const preview = document.getElementById('import-preview');
  const error = document.getElementById('import-error');
  const confirmBtn = document.getElementById('import-confirm');

  if (input) input.value = '';
  if (preview) preview.style.display = 'none';
  if (error) error.style.display = 'none';
  if (confirmBtn) confirmBtn.disabled = true;

  importPreviewData = null;

  dialog?.classList.add('open');
  backdrop?.classList.add('open');
  input?.focus();
}

function closeImportDialog() {
  const dialog = document.getElementById('import-dialog');
  const backdrop = document.getElementById('import-backdrop');

  dialog?.classList.remove('open');
  backdrop?.classList.remove('open');

  importPreviewData = null;
}

function handleImportInput() {
  const input = document.getElementById('import-input');
  const preview = document.getElementById('import-preview');
  const previewText = preview?.querySelector('.import-preview-text');
  const error = document.getElementById('import-error');
  const confirmBtn = document.getElementById('import-confirm');

  const code = input?.value.trim();

  if (!code) {
    if (preview) preview.style.display = 'none';
    if (error) error.style.display = 'none';
    if (confirmBtn) confirmBtn.disabled = true;
    importPreviewData = null;
    return;
  }

  const decoded = decode(code);

  if (!decoded) {
    if (preview) preview.style.display = 'none';
    if (error) {
      error.textContent = 'Invalid share code. Please check and try again.';
      error.style.display = 'block';
    }
    if (confirmBtn) confirmBtn.disabled = true;
    importPreviewData = null;
    return;
  }

  // Valid code - show preview
  importPreviewData = decoded;

  if (error) error.style.display = 'none';
  if (previewText) {
    const pinCount = decoded.pins.length;
    const trackCount = decoded.tracks.length;
    previewText.textContent = `Found ${pinCount} pin${pinCount !== 1 ? 's' : ''} and ${trackCount} track${trackCount !== 1 ? 's' : ''}`;
  }
  if (preview) preview.style.display = 'block';
  if (confirmBtn) confirmBtn.disabled = false;
}

async function handleImportConfirm() {
  if (!importPreviewData) return;

  const { pins: importPins, tracks: importTracks } = importPreviewData;

  // Get existing items to check for duplicates
  const existingPins = await getAllPins();
  const existingTracks = await getAllTracks();
  const existingPinTimestamps = new Set(existingPins.map((p) => p.createdAt));
  const existingTrackTimestamps = new Set(existingTracks.map((t) => t.createdAt));

  let addedPins = 0;
  let addedTracks = 0;
  let skippedPins = 0;
  let skippedTracks = 0;

  // Import pins (skip duplicates by createdAt)
  for (const pin of importPins) {
    if (existingPinTimestamps.has(pin.createdAt)) {
      skippedPins++;
    } else {
      await addPin(pin);
      addedPins++;
    }
  }

  // Import tracks (skip duplicates by createdAt)
  for (const track of importTracks) {
    if (existingTrackTimestamps.has(track.createdAt)) {
      skippedTracks++;
    } else {
      await addTrack(track);
      addedTracks++;
    }
  }

  closeImportDialog();

  // Show result
  const messages = [];
  if (addedPins > 0 || addedTracks > 0) {
    messages.push(
      `Imported ${addedPins} pin${addedPins !== 1 ? 's' : ''}, ${addedTracks} track${addedTracks !== 1 ? 's' : ''}`
    );
  }
  if (skippedPins > 0 || skippedTracks > 0) {
    messages.push(
      `Skipped ${skippedPins + skippedTracks} duplicate${skippedPins + skippedTracks !== 1 ? 's' : ''}`
    );
  }

  showToast(messages.join('. '), addedPins > 0 || addedTracks > 0 ? 'success' : 'info');

  cachedItems = [];
  await render(true);
  window.dispatchEvent(new CustomEvent('dataImported'));
}

// === Ruler functionality ===
function handleAddToRuler() {
  if (selectedIds.size === 0) return;

  const items = [];

  for (const key of selectedIds) {
    const [type, idStr] = key.split(':');
    const id = parseInt(idStr);

    if (type === 'pin') {
      const pin = pins.find((p) => p.id === id);
      if (pin) {
        items.push({
          label: pin.name,
          lat: pin.lat,
          lng: pin.lng,
          color: pin.color,
        });
      }
    } else if (type === 'track') {
      const track = tracks.find((t) => t.id === id);
      if (track && track.nodes) {
        // Add all track nodes
        track.nodes.forEach((node, index) => {
          const isFirst = index === 0;
          const isLast = index === track.nodes.length - 1;
          const hasName = node.name && node.name.trim();

          let label;
          if (hasName) {
            label = node.name;
          } else if (track.nodes.length === 1) {
            label = track.name;
          } else if (isFirst) {
            label = `${track.name} (start)`;
          } else if (isLast) {
            label = `${track.name} (end)`;
          } else {
            // Intermediate node - show coordinates
            const prefs = getPrefs();
            label =
              CoordinateTransformer.toDisplay(node.lat, node.lng, prefs.coordinateSystem) ||
              `Point ${index + 1}`;
          }

          items.push({
            label,
            lat: node.lat,
            lng: node.lng,
            color: track.color,
          });
        });
      }
    }
  }

  if (items.length > 0) {
    window.dispatchEvent(new CustomEvent('addToRuler', { detail: { items } }));
    showToast(`Added ${items.length} point${items.length !== 1 ? 's' : ''} to Ruler`, 'success');
    exitMultiSelect();
  }
}
