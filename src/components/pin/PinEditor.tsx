import { Component, createSignal, createEffect, createMemo, Show, For } from 'solid-js';
import { useUI } from '../../context/UIContext';
import { CoordinateTransformer } from '../../coords/index';
import { usePrefs } from '../../context/PrefsContext';
import { addPin, updatePin, deletePin } from '../../db/db';
import { showToast } from '../ui/Toast';
import { SYSTEM_NAMES } from '../../coords/index';
import { PIN_COLORS, getMarkerIconPath } from '../../utils/colors';
import { parseBearing } from '../../utils/geo';
import type { PinColor, MarkerType } from '../../types';
import Dialog from '../ui/Dialog';
import TextField from '../ui/TextField';
import Button from '../ui/Button';

interface PinEditorProps {
  onSaved?: () => void;
}

const PinEditor: Component<PinEditorProps> = (props) => {
  const { editingPin, setEditingPin, markerPickerOpen, setMarkerPickerOpen } = useUI();
  const [prefs] = usePrefs();

  const pin = editingPin;

  const [name, setName] = createSignal('');
  const [coordInput, setCoordInput] = createSignal('');
  const [coordError, setCoordError] = createSignal('');
  const [color, setColor] = createSignal<PinColor>('red');
  const [markerType, setMarkerType] = createSignal<MarkerType>('pin');

  const [bearingInput, setBearingInput] = createSignal('');

  const bearingDegrees = createMemo(() => {
    const raw = bearingInput().trim();
    if (!raw) return 0;
    return parseBearing(raw, prefs.angleUnit) ?? 0;
  });

  const [group, setGroup] = createSignal('');
  const [description, setDescription] = createSignal('');

  createEffect(() => {
    const p = pin();
    if (p) {
      setName(p.name);
      setCoordInput(CoordinateTransformer.toDisplay(p.lat, p.lng, prefs.coordinateSystem) ?? '');
      setColor(p.color);
      setMarkerType(p.markerType ?? 'pin');
      setBearingInput(
        p.bearing != null && p.bearing !== 0
          ? String(prefs.angleUnit === 'mils' ? Math.round((p.bearing * 6400) / 360) : p.bearing)
          : ''
      );
      setGroup(p.group);
      setDescription(p.description);
    } else {
      setName('');
      setCoordInput('');
      setCoordError('');
      setColor('red');
      setMarkerType('pin');
      setBearingInput('');
      setGroup('');
      setDescription('');
      setMarkerPickerOpen(false);
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
      bearing: bearingDegrees(),
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
          <span
            style={{
              'font-size': '11px',
              color: 'var(--color-text-secondary)',
              'text-transform': 'uppercase',
              'letter-spacing': '0.04em',
            }}
          >
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
              background: 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-border)',
              'border-radius': '0px',
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
              style={{
                width: '20px',
                height: '20px',
                'flex-shrink': 0,
                transform: markerType() === 'arrow' ? `rotate(${bearingDegrees()}deg)` : undefined,
                transition: 'transform 0.15s ease',
              }}
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
              <span
                style={{
                  'font-size': '11px',
                  color: 'var(--color-text-secondary)',
                  'text-transform': 'uppercase',
                  'letter-spacing': '0.04em',
                }}
              >
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
                      }}
                      style={{
                        background: 'none',
                        border:
                          color() === c && markerType() === 'pin'
                            ? '2px solid var(--color-text)'
                            : '2px solid transparent',
                        'border-radius': '0px',
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
              <span
                style={{
                  'font-size': '11px',
                  color: 'var(--color-text-secondary)',
                  'text-transform': 'uppercase',
                  'letter-spacing': '0.04em',
                }}
              >
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
                      }}
                      style={{
                        background: 'none',
                        border:
                          color() === c && markerType() === 'arrow'
                            ? '2px solid var(--color-text)'
                            : '2px solid transparent',
                        'border-radius': '0px',
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
                        style={{
                          width: '30px',
                          height: '40px',
                          transform: `rotate(${bearingDegrees()}deg)`,
                          transition: 'transform 0.15s ease',
                        }}
                      />
                    </button>
                  )}
                </For>
              </div>
            </div>

            <div style={{ display: 'flex', 'flex-direction': 'column', gap: '6px' }}>
              <div
                onKeyDown={(e: KeyboardEvent) => {
                  if (e.key === 'Enter') e.preventDefault();
                }}
              >
                <TextField
                  label={`Bearing (0-${prefs.angleUnit === 'mils' ? '6400' : '360'})`}
                  value={bearingInput()}
                  onChange={setBearingInput}
                  placeholder={prefs.angleUnit === 'mils' ? '0–6400' : '0–360'}
                  disabled={markerType() !== 'arrow'}
                  onDisabledClick={() => showToast('Pins do not support rotation', 'info')}
                />
              </div>
            </div>

            <Button
              variant="primary"
              onClick={() => setMarkerPickerOpen(false)}
              style={{ width: '100%' }}
            >
              Select
            </Button>
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
