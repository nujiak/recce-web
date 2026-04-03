import { Component, createSignal, createEffect, Show } from 'solid-js';
import { useUI } from '../../context/UIContext';
import { CoordinateTransformer } from '../../coords/index';
import { usePrefs } from '../../context/PrefsContext';
import { addPin, updatePin, deletePin } from '../../db/db';
import { showToast } from '../ui/Toast';
import { SYSTEM_NAMES } from '../../coords/index';
import type { PinColor } from '../../types';
import ColorPicker from '../ColorPicker';
import Dialog from '../ui/Dialog';
import TextField from '../ui/TextField';
import Button from '../ui/Button';

interface PinEditorProps {
  onSaved?: () => void;
}

const PinEditor: Component<PinEditorProps> = (props) => {
  const { editingPin, setEditingPin } = useUI();
  const [prefs] = usePrefs();

  const pin = editingPin;

  const [name, setName] = createSignal('');
  const [coordInput, setCoordInput] = createSignal('');
  const [coordError, setCoordError] = createSignal('');
  const [color, setColor] = createSignal<PinColor>('red');
  const [group, setGroup] = createSignal('');
  const [description, setDescription] = createSignal('');

  createEffect(() => {
    const p = pin();
    if (p) {
      setName(p.name);
      setCoordInput(CoordinateTransformer.toDisplay(p.lat, p.lng, prefs.coordinateSystem) ?? '');
      setColor(p.color);
      setGroup(p.group);
      setDescription(p.description);
    } else {
      setName('');
      setCoordInput('');
      setCoordError('');
      setColor('red');
      setGroup('');
      setDescription('');
    }
  });

  function validateCoord(): { lat: number; lng: number } | null {
    const raw = coordInput().trim();
    if (!raw) {
      setCoordError('Coordinate is required');
      return null;
    }
    const result = CoordinateTransformer.parse(raw, prefs.coordinateSystem);
    if (!result) {
      setCoordError(`Invalid ${SYSTEM_NAMES[prefs.coordinateSystem]} coordinate`);
      return null;
    }
    setCoordError('');
    return result;
  }

  async function handleSave() {
    const coord = validateCoord();
    if (!coord) return;
    if (!name().trim()) {
      showToast('Name is required', 'error');
      return;
    }

    const existing = pin();
    const data = {
      name: name().trim(),
      lat: coord.lat,
      lng: coord.lng,
      color: color(),
      group: group().trim(),
      description: description().trim(),
      createdAt: existing?.createdAt ?? Date.now(),
    };

    if (existing && existing.id !== 0) {
      await updatePin(existing.id, data);
      showToast('Pin updated', 'success');
    } else {
      await addPin(data);
      showToast('Pin saved', 'success');
    }
    setEditingPin(null);
    props.onSaved?.();
  }

  async function handleDelete() {
    const p = pin();
    if (!p || p.id === 0) return;
    await deletePin(p.id);
    showToast('Pin deleted', 'success');
    setEditingPin(null);
    props.onSaved?.();
  }

  return (
    <Dialog
      open={pin() !== null}
      onOpenChange={(open) => {
        if (!open) setEditingPin(null);
      }}
      title={pin() && pin()!.id !== 0 ? 'Edit Pin' : 'New Pin'}
    >
      <div
        style={{
          display: 'flex',
          'flex-direction': 'column',
          gap: '14px',
          'margin-top': '0.75rem',
        }}
      >
        <TextField label="Name" value={name()} onChange={setName} />

        <div style={{ display: 'flex', 'flex-direction': 'column', gap: '4px' }}>
          <TextField
            label={`Coordinate (${SYSTEM_NAMES[prefs.coordinateSystem]})`}
            value={coordInput()}
            onChange={(v) => {
              setCoordInput(v);
              setCoordError('');
            }}
            placeholder={`Enter ${SYSTEM_NAMES[prefs.coordinateSystem]} coordinate`}
            class={coordError() ? 'pin-coord-error' : ''}
          />
          <Show when={coordError()}>
            <span style={{ 'font-size': '0.75rem', color: 'var(--color-danger)' }}>
              {coordError()}
            </span>
          </Show>
        </div>

        <ColorPicker value={color()} onChange={setColor} />

        <TextField label="Group" value={group()} onChange={setGroup} />

        <TextField label="Description" value={description()} onChange={setDescription} multiline />

        <div style={{ display: 'flex', gap: '8px', 'margin-top': '4px' }}>
          <Show when={pin() && pin()!.id !== 0}>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </Show>
          <Button variant="primary" onClick={handleSave} style={{ flex: 1 }}>
            Save
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default PinEditor;
