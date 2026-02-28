import { addPin, updatePin, deletePin, getAllPins } from '../db/db.js';
import { CoordinateTransformer } from '../coords/index.js';
import { getPrefs } from './settings.js';

const COLORS = ['red', 'orange', 'green', 'azure', 'violet'];

let currentPin = null;
let isEditMode = false;
let onSaveCallback = null;

export function init() {
  setupEditorEvents();
}

function setupEditorEvents() {
  const closeBtn = document.getElementById('pin-editor-close');
  const saveBtn = document.getElementById('pin-editor-save');
  const deleteBtn = document.getElementById('pin-editor-delete');
  const backdrop = document.getElementById('pin-editor-backdrop');

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
    const dialog = document.getElementById('pin-editor');
    if (e.key === 'Escape' && dialog?.classList.contains('open')) {
      closeEditor();
    }
  });
}

function setupColorPicker() {
  const container = document.getElementById('pin-editor-colors');
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
  const container = document.getElementById('pin-editor-colors');
  if (!container) return;

  container.querySelectorAll('.color-swatch').forEach((btn) => {
    btn.classList.toggle('selected', btn.dataset.color === color);
  });
}

function getSelectedColor() {
  const container = document.getElementById('pin-editor-colors');
  const selected = container?.querySelector('.color-swatch.selected');
  return selected?.dataset.color || 'red';
}

export async function openCreate(lat, lng, onSave) {
  currentPin = null;
  isEditMode = false;
  onSaveCallback = onSave;

  const prefs = getPrefs();
  const coordDisplay = CoordinateTransformer.toDisplay(lat, lng, prefs.coordinateSystem);

  const dialog = document.getElementById('pin-editor');
  const nameInput = document.getElementById('pin-editor-name');
  const coordInput = document.getElementById('pin-editor-coord');
  const coordLabel = document.getElementById('pin-editor-coord-label');
  const groupInput = document.getElementById('pin-editor-group');
  const descInput = document.getElementById('pin-editor-description');
  const deleteBtn = document.getElementById('pin-editor-delete');
  const title = document.getElementById('pin-editor-title');

  if (title) title.textContent = 'Add Pin';
  if (nameInput) nameInput.value = '';
  if (coordInput) coordInput.value = coordDisplay;
  if (coordLabel) coordLabel.textContent = prefs.coordinateSystem;
  if (groupInput) groupInput.value = '';
  if (descInput) descInput.value = '';
  if (deleteBtn) deleteBtn.style.display = 'none';

  await populateGroupDatalist();
  setupColorPicker();
  selectColor('red');

  dialog?.classList.add('open');
  document.getElementById('pin-editor-backdrop')?.classList.add('open');
}

export async function openEdit(pin, onSave) {
  currentPin = pin;
  isEditMode = true;
  onSaveCallback = onSave;

  const prefs = getPrefs();
  const coordDisplay = CoordinateTransformer.toDisplay(pin.lat, pin.lng, prefs.coordinateSystem);

  const dialog = document.getElementById('pin-editor');
  const nameInput = document.getElementById('pin-editor-name');
  const coordInput = document.getElementById('pin-editor-coord');
  const coordLabel = document.getElementById('pin-editor-coord-label');
  const groupInput = document.getElementById('pin-editor-group');
  const descInput = document.getElementById('pin-editor-description');
  const deleteBtn = document.getElementById('pin-editor-delete');
  const title = document.getElementById('pin-editor-title');

  if (title) title.textContent = 'Edit Pin';
  if (nameInput) nameInput.value = pin.name;
  if (coordInput) coordInput.value = coordDisplay;
  if (coordLabel) coordLabel.textContent = prefs.coordinateSystem;
  if (groupInput) groupInput.value = pin.group || '';
  if (descInput) descInput.value = pin.description || '';
  if (deleteBtn) deleteBtn.style.display = 'block';

  await populateGroupDatalist();
  setupColorPicker();
  selectColor(pin.color || 'red');

  dialog?.classList.add('open');
  document.getElementById('pin-editor-backdrop')?.classList.add('open');
}

async function populateGroupDatalist() {
  const datalist = document.getElementById('pin-editor-groups');
  if (!datalist) return;

  const pins = await getAllPins();
  const groups = [...new Set(pins.map((p) => p.group).filter((g) => g))].sort();

  datalist.innerHTML = groups.map((g) => `<option value="${g}">`).join('');
}

async function handleSave() {
  const nameInput = document.getElementById('pin-editor-name');
  const coordInput = document.getElementById('pin-editor-coord');
  const groupInput = document.getElementById('pin-editor-group');
  const descInput = document.getElementById('pin-editor-description');

  const name = nameInput?.value.trim() || '';
  const coordStr = coordInput?.value.trim() || '';
  const group = groupInput?.value.trim() || '';
  const description = descInput?.value.trim() || '';
  const color = getSelectedColor();

  if (!name) return;

  const prefs = getPrefs();
  const parsed = CoordinateTransformer.parse(coordStr, prefs.coordinateSystem);
  if (!parsed) return;

  if (isEditMode && currentPin) {
    await updatePin(currentPin.id, {
      name,
      lat: parsed.lat,
      lng: parsed.lng,
      color,
      group,
      description,
    });
    currentPin = { ...currentPin, name, lat: parsed.lat, lng: parsed.lng, color, group, description };
  } else {
    const pin = {
      createdAt: Date.now(),
      name,
      lat: parsed.lat,
      lng: parsed.lng,
      color,
      group,
      description,
    };
    const id = await addPin(pin);
    pin.id = id;
    currentPin = pin;
  }

  const savedPin = currentPin;
  const wasEdit = isEditMode;
  closeEditor();

  if (onSaveCallback) {
    onSaveCallback(savedPin, wasEdit, false);
  }
}

async function handleDelete() {
  if (!currentPin) return;

  const deletedPin = currentPin;
  await deletePin(currentPin.id);
  closeEditor();

  if (onSaveCallback) {
    onSaveCallback(deletedPin, false, true);
  }
}

function closeEditor() {
  const dialog = document.getElementById('pin-editor');
  const backdrop = document.getElementById('pin-editor-backdrop');

  dialog?.classList.remove('open');
  backdrop?.classList.remove('open');

  currentPin = null;
  isEditMode = false;
  onSaveCallback = null;
}

export async function getGroups() {
  const pins = await getAllPins();
  const groups = new Set(pins.map((p) => p.group).filter((g) => g));
  return Array.from(groups).sort();
}
