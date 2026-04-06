import { Component, createSignal, createEffect, Show, For } from 'solid-js';
import { useUI } from '../../context/UIContext';
import { CoordinateTransformer } from '../../coords/index';
import { usePrefs } from '../../context/PrefsContext';
import { addPin, updatePin, deletePin } from '../../db/db';
import { showToast } from '../ui/Toast';
import { SYSTEM_NAMES } from '../../coords/index';
import { PIN_COLORS, ARROW_ICON_PATH, getMarkerIconPath } from '../../utils/colors';
import type { PinColor, MarkerType } from '../../types';
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
  const [markerType, setMarkerType] = createSignal<MarkerType>('pin');
  const [markerPickerOpen, setMarkerPickerOpen] = createSignal(false);
  const [group, setGroup] = createSignal('');
  const [description, setDescription] = createSignal('');

  createEffect(() => {
    const p = pin();
    if (p) {
      setName(p.name);
      setCoordInput(CoordinateTransformer.toDisplay(p.lat, p.lng, prefs.coordinateSystem) ?? '');
      setColor(p.color);
      setMarkerType(p.markerType ?? 'pin');
      setGroup(p.group);
      setDescription(p.description);
    } else {
      setName('');
      setCoordInput('');
      setCoordError('');
      setColor('red');
      setMarkerType('pin');
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
      markerType: markerType(),
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

        <div style={{ display: 'flex', 'flex-direction': 'column', gap: '6px' }}>
          <span style={{ 'font-size': '0.75rem', color: 'var(--color-text-secondary)' }}>
            Marker
          </span>
          <button
            type="button"
            onClick={() => setMarkerPickerOpen(true)}
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: '10px',
              padding: '0.5rem 0.75rem',
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              'border-radius': '8px',
              color: 'var(--color-text)',
              cursor: 'pointer',
              width: '100%',
              'text-align': 'left',
              'font-size': 'inherit',
              'font-family': 'inherit',
            }}
          >
            <img
              src={getMarkerIconPath(color(), markerType())}
              alt=""
              style={{ width: '20px', height: '20px', 'flex-shrink': 0 }}
            />
            <span style={{ 'text-transform': 'capitalize' }}>
              {color()} {markerType()}
            </span>
          </button>
        </div>

        <Dialog open={markerPickerOpen()} onOpenChange={setMarkerPickerOpen} title="Choose Marker">
          <div
            style={{
              display: 'flex',
              'flex-direction': 'column',
              gap: '16px',
              'margin-top': '0.75rem',
            }}
          >
            <div style={{ display: 'flex', 'flex-direction': 'column', gap: '6px' }}>
              <span style={{ 'font-size': '0.75rem', color: 'var(--color-text-secondary)' }}>
                Pins
              </span>
              <div style={{ display: 'flex', gap: '8px', 'justify-content': 'center' }}>
                <For each={PIN_COLORS}>
                  {(c) => (
                    <button
                      type="button"
                      aria-label={`${c} pin`}
                      aria-pressed={color() === c && markerType() === 'pin'}
                      onClick={() => {
                        setColor(c);
                        setMarkerType('pin');
                        setMarkerPickerOpen(false);
                      }}
                      style={{
                        background: 'none',
                        border:
                          color() === c && markerType() === 'pin'
                            ? '2px solid var(--color-text)'
                            : '2px solid transparent',
                        'border-radius': '8px',
                        padding: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        'align-items': 'center',
                        'justify-content': 'center',
                      }}
                    >
                      <img
                        src={getMarkerIconPath(c, 'pin')}
                        alt={c}
                        style={{ width: '36px', height: '36px' }}
                      />
                    </button>
                  )}
                </For>
              </div>
            </div>

            <div style={{ display: 'flex', 'flex-direction': 'column', gap: '6px' }}>
              <span style={{ 'font-size': '0.75rem', color: 'var(--color-text-secondary)' }}>
                Arrows
              </span>
              <div style={{ display: 'flex', gap: '8px', 'justify-content': 'center' }}>
                <For each={PIN_COLORS}>
                  {(c) => (
                    <button
                      type="button"
                      aria-label={`${c} arrow`}
                      aria-pressed={color() === c && markerType() === 'arrow'}
                      onClick={() => {
                        setColor(c);
                        setMarkerType('arrow');
                        setMarkerPickerOpen(false);
                      }}
                      style={{
                        background: 'none',
                        border:
                          color() === c && markerType() === 'arrow'
                            ? '2px solid var(--color-text)'
                            : '2px solid transparent',
                        'border-radius': '8px',
                        padding: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        'align-items': 'center',
                        'justify-content': 'center',
                      }}
                    >
                      <img
                        src={getMarkerIconPath(c, 'arrow')}
                        alt={c}
                        style={{ width: '24px', height: '32px' }}
                      />
                    </button>
                  )}
                </For>
              </div>
            </div>
          </div>
        </Dialog>

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
