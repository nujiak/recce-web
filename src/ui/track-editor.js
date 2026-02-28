import { addTrack, updateTrack, deleteTrack, getAllGroups } from '../db/db.js';
import { calculateTotalDistance } from '../utils/geo.js';
import { getPrefs } from './settings.js';

const COLORS = ['red', 'orange', 'green', 'azure', 'violet'];

let currentTrack = null;
let isEditMode = false;
let sessionNodes = [];
let onSaveCallback = null;

export function init() {
  setupEditorEvents();
}

function setupEditorEvents() {
  const closeBtn = document.getElementById('track-editor-close');
  const saveBtn = document.getElementById('track-editor-save');
  const deleteBtn = document.getElementById('track-editor-delete');
  const backdrop = document.getElementById('track-editor-backdrop');

  if (closeBtn) {
    closeBtn.addEventListener('click', closeEditor);
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', handleSave);
  }

  if (deleteBtn) {
    deleteBtn.addEventListener('click', handleDelete);
  }

  if (backdrop) {
    backdrop.addEventListener('click', closeEditor);
  }

  document.addEventListener('keydown', (e) => {
    const dialog = document.getElementById('track-editor');
    if (e.key === 'Escape' && dialog?.classList.contains('open')) {
      closeEditor();
    }
  });
}

function setupColorPicker() {
  const container = document.getElementById('track-editor-colors');
  if (!container) return;

  container.innerHTML = COLORS.map(
    (color) => `
      <button type="button" class="color-swatch color-${color}" data-color="${color}" aria-label="${color}"></button>
    `
  ).join('');

  container.querySelectorAll('.color-swatch').forEach((btn) => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.color-swatch').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });
}

function selectColor(color) {
  const container = document.getElementById('track-editor-colors');
  if (!container) return;

  container.querySelectorAll('.color-swatch').forEach((btn) => {
    btn.classList.toggle('selected', btn.dataset.color === color);
  });
}

function getSelectedColor() {
  const container = document.getElementById('track-editor-colors');
  const selected = container?.querySelector('.color-swatch.selected');
  return selected?.dataset.color || 'red';
}

export async function openCreate(nodes, onSave) {
  currentTrack = null;
  sessionNodes = nodes || [];
  isEditMode = false;
  onSaveCallback = onSave;

  const dialog = document.getElementById('track-editor');
  const nameInput = document.getElementById('track-editor-name');
  const typeCheckbox = document.getElementById('track-editor-type');
  const groupInput = document.getElementById('track-editor-group');
  const descInput = document.getElementById('track-editor-description');
  const nodeCountEl = document.getElementById('track-editor-node-count');
  const deleteBtn = document.getElementById('track-editor-delete');
  const title = document.getElementById('track-editor-title');

  if (title) title.textContent = 'New Track';
  if (nameInput) nameInput.value = '';
  if (typeCheckbox) typeCheckbox.checked = false;
  if (groupInput) groupInput.value = '';
  if (descInput) descInput.value = '';
  if (nodeCountEl) nodeCountEl.textContent = `${sessionNodes.length} nodes`;
  if (deleteBtn) deleteBtn.style.display = 'none';

  await populateGroupDatalist();
  setupColorPicker();
  selectColor('red');

  dialog?.classList.add('open');
  document.getElementById('track-editor-backdrop')?.classList.add('open');
}

export async function openEdit(track, onSave) {
  currentTrack = track;
  sessionNodes = track.nodes || [];
  isEditMode = true;
  onSaveCallback = onSave;

  const dialog = document.getElementById('track-editor');
  const nameInput = document.getElementById('track-editor-name');
  const typeCheckbox = document.getElementById('track-editor-type');
  const groupInput = document.getElementById('track-editor-group');
  const descInput = document.getElementById('track-editor-description');
  const nodeCountEl = document.getElementById('track-editor-node-count');
  const deleteBtn = document.getElementById('track-editor-delete');
  const title = document.getElementById('track-editor-title');

  if (title) title.textContent = 'Edit Track';
  if (nameInput) nameInput.value = track.name;
  if (typeCheckbox) typeCheckbox.checked = track.isCyclical;
  if (groupInput) groupInput.value = track.group || '';
  if (descInput) descInput.value = track.description || '';
  if (nodeCountEl) nodeCountEl.textContent = `${sessionNodes.length} nodes`;
  if (deleteBtn) deleteBtn.style.display = 'block';

  await populateGroupDatalist();
  setupColorPicker();
  selectColor(track.color || 'red');

  dialog?.classList.add('open');
  document.getElementById('track-editor-backdrop')?.classList.add('open');
}

async function populateGroupDatalist() {
  const datalist = document.getElementById('track-editor-groups');
  if (!datalist) return;

  const groups = await getAllGroups();
  datalist.innerHTML = groups.map((g) => `<option value="${g}">`).join('');
}

async function handleSave() {
  const nameInput = document.getElementById('track-editor-name');
  const typeCheckbox = document.getElementById('track-editor-type');
  const groupInput = document.getElementById('track-editor-group');
  const descInput = document.getElementById('track-editor-description');

  const name = nameInput?.value.trim() || '';
  const isCyclical = typeCheckbox?.checked || false;
  const group = groupInput?.value.trim() || '';
  const description = descInput?.value.trim() || '';
  const color = getSelectedColor();

  if (!name) return;
  if (sessionNodes.length < 2) return;

  if (isEditMode && currentTrack) {
    await updateTrack(currentTrack.id, {
      name,
      nodes: sessionNodes,
      isCyclical,
      color,
      group,
      description,
    });
    currentTrack = {
      ...currentTrack,
      name,
      nodes: sessionNodes,
      isCyclical,
      color,
      group,
      description,
    };
  } else {
    const track = {
      createdAt: Date.now(),
      name,
      nodes: sessionNodes,
      isCyclical,
      color,
      group,
      description,
    };
    const id = await addTrack(track);
    track.id = id;
    currentTrack = track;
  }

  const savedTrack = currentTrack;
  const wasEdit = isEditMode;
  closeEditor();

  if (onSaveCallback) {
    onSaveCallback(savedTrack, wasEdit, false);
  }
}

async function handleDelete() {
  if (!currentTrack) return;

  const deletedTrack = currentTrack;
  await deleteTrack(currentTrack.id);
  closeEditor();

  if (onSaveCallback) {
    onSaveCallback(deletedTrack, false, true);
  }
}

function closeEditor() {
  const dialog = document.getElementById('track-editor');
  const backdrop = document.getElementById('track-editor-backdrop');

  dialog?.classList.remove('open');
  backdrop?.classList.remove('open');

  currentTrack = null;
  sessionNodes = [];
  isEditMode = false;
  onSaveCallback = null;
}
