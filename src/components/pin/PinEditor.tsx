import { Component, createSignal, createEffect, Show } from 'solid-js';
import { useUI } from '../../context/UIContext';
import { CoordinateTransformer } from '../../coords/index';
import { usePrefs } from '../../context/PrefsContext';
import { addPin, updatePin, deletePin } from '../../db/db';
import { showToast } from '../Toast';
import type { Pin, PinColor } from '../../types';

const COLORS: PinColor[] = ['red', 'orange', 'green', 'azure', 'violet'];
const COLOR_VALUES: Record<PinColor, string> = {
  red: 'var(--color-red)',
  orange: 'var(--color-orange)',
  green: 'var(--color-green)',
  azure: 'var(--color-azure)',
  violet: 'var(--color-violet)',
};

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

  // Populate fields when pin changes
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
      setCoordError(`Invalid ${prefs.coordinateSystem} coordinate`);
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

    if (existing?.id != null) {
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
    if (p?.id == null) return;
    await deletePin(p.id);
    showToast('Pin deleted', 'success');
    setEditingPin(null);
    props.onSaved?.();
  }

  const isDesktop = () => window.innerWidth >= 768;

  return (
    <Show when={pin() !== null}>
      {/* Backdrop */}
      <div
        onClick={() => setEditingPin(null)}
        style={{ position: 'fixed', inset: 0, background: 'var(--color-overlay)', 'z-index': '40' }}
      />

      {/* Sheet / Dialog */}
      <div
        role="dialog"
        aria-label={pin() ? `Edit ${pin()?.name}` : 'New Pin'}
        style={{
          position: 'fixed',
          'z-index': '50',
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          ...(isDesktop()
            ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '360px', 'border-radius': 'var(--radius-xl)' }
            : { bottom: 0, left: 0, right: 0, 'border-radius': 'var(--radius-xl) var(--radius-xl) 0 0' }),
        }}
      >
        <div style={{ padding: '20px', display: 'flex', 'flex-direction': 'column', gap: '14px' }}>
          <div style={{ display: 'flex', 'align-items': 'center', 'justify-content': 'space-between' }}>
            <h2 style={{ 'font-size': '1rem', 'font-weight': '700' }}>{pin()?.id ? 'Edit Pin' : 'New Pin'}</h2>
            <button aria-label="Close" onClick={() => setEditingPin(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: '4px' }}>✕</button>
          </div>

          <label style={{ display: 'flex', 'flex-direction': 'column', gap: '4px' }}>
            <span style={{ 'font-size': '0.75rem', color: 'var(--color-text-secondary)' }}>Name</span>
            <input
              name="pin-name"
              value={name()}
              onInput={(e) => setName(e.currentTarget.value)}
              style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', 'border-radius': 'var(--radius-sm)', padding: '7px 10px', color: 'var(--color-text)', 'font-family': 'inherit', 'font-size': '0.875rem' }}
            />
          </label>

          <label style={{ display: 'flex', 'flex-direction': 'column', gap: '4px' }}>
            <span style={{ 'font-size': '0.75rem', color: 'var(--color-text-secondary)' }}>
              Coordinate ({prefs.coordinateSystem})
            </span>
            <input
              name="pin-coord"
              value={coordInput()}
              onInput={(e) => { setCoordInput(e.currentTarget.value); setCoordError(''); }}
              placeholder={`Enter ${prefs.coordinateSystem} coordinate`}
              style={{ background: 'var(--color-bg-tertiary)', border: `1px solid ${coordError() ? 'var(--color-danger)' : 'var(--color-border)'}`, 'border-radius': 'var(--radius-sm)', padding: '7px 10px', color: 'var(--color-text)', 'font-family': 'inherit', 'font-size': '0.875rem' }}
            />
            <Show when={coordError()}>
              <span style={{ 'font-size': '0.75rem', color: 'var(--color-danger)' }}>{coordError()}</span>
            </Show>
          </label>

          {/* Color picker */}
          <div style={{ display: 'flex', 'flex-direction': 'column', gap: '6px' }}>
            <span style={{ 'font-size': '0.75rem', color: 'var(--color-text-secondary)' }}>Color</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {COLORS.map(c => (
                <button
                  aria-label={c}
                  aria-pressed={color() === c}
                  onClick={() => setColor(c)}
                  style={{ width: '28px', height: '28px', 'border-radius': '50%', background: COLOR_VALUES[c], border: color() === c ? '2px solid var(--color-text)' : '2px solid transparent', cursor: 'pointer' }}
                />
              ))}
            </div>
          </div>

          <label style={{ display: 'flex', 'flex-direction': 'column', gap: '4px' }}>
            <span style={{ 'font-size': '0.75rem', color: 'var(--color-text-secondary)' }}>Group</span>
            <input
              name="pin-group"
              value={group()}
              onInput={(e) => setGroup(e.currentTarget.value)}
              style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', 'border-radius': 'var(--radius-sm)', padding: '7px 10px', color: 'var(--color-text)', 'font-family': 'inherit', 'font-size': '0.875rem' }}
            />
          </label>

          <label style={{ display: 'flex', 'flex-direction': 'column', gap: '4px' }}>
            <span style={{ 'font-size': '0.75rem', color: 'var(--color-text-secondary)' }}>Description</span>
            <textarea
              name="pin-desc"
              value={description()}
              onInput={(e) => setDescription(e.currentTarget.value)}
              rows={2}
              style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', 'border-radius': 'var(--radius-sm)', padding: '7px 10px', color: 'var(--color-text)', 'font-family': 'inherit', 'font-size': '0.875rem', resize: 'none' }}
            />
          </label>

          <div style={{ display: 'flex', gap: '8px', 'margin-top': '4px' }}>
            <Show when={pin()?.id != null}>
              <button
                onClick={handleDelete}
                style={{ padding: '9px 14px', background: 'none', border: '1px solid var(--color-danger)', 'border-radius': 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-danger)', 'font-family': 'inherit', 'font-size': '0.875rem' }}
              >
                Delete
              </button>
            </Show>
            <button
              onClick={handleSave}
              style={{ flex: 1, padding: '9px', background: 'var(--color-accent)', border: 'none', 'border-radius': 'var(--radius-md)', cursor: 'pointer', color: 'oklch(0.1 0 0)', 'font-family': 'inherit', 'font-size': '0.875rem', 'font-weight': '600' }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default PinEditor;
