import { Component, createSignal, createEffect, Show } from 'solid-js';
import { useEscapeToClose } from '../../utils/hooks';
import { useUI } from '../../context/UIContext';
import { addTrack, updateTrack, deleteTrack } from '../../db/db';
import { showToast } from '../Toast';
import type { Track, PinColor, TrackNode } from '../../types';
import ColorPicker from '../ColorPicker';
import { DESKTOP_BREAKPOINT } from '../../utils/constants';

interface TrackEditorProps {
  onSaved?: () => void;
}

const TrackEditor: Component<TrackEditorProps> = (props) => {
  const { editingTrack, setEditingTrack } = useUI();

  const [name, setName] = createSignal('');
  const [isCyclical, setIsCyclical] = createSignal(false);
  const [color, setColor] = createSignal<PinColor>('azure');
  const [group, setGroup] = createSignal('');
  const [description, setDescription] = createSignal('');
  const [nodes, setNodes] = createSignal<TrackNode[]>([]);

  useEscapeToClose(editingTrack, () => setEditingTrack(null));

  createEffect(() => {
    const t = editingTrack();
    if (t) {
      setName(t.name);
      setIsCyclical(t.isCyclical);
      setColor(t.color);
      setGroup(t.group);
      setDescription(t.description);
      setNodes(t.nodes);
    } else {
      setName('');
      setIsCyclical(false);
      setColor('azure');
      setGroup('');
      setDescription('');
      setNodes([]);
    }
  });

  async function handleSave() {
    if (!name().trim()) {
      showToast('Name is required', 'error');
      return;
    }
    const existing = editingTrack();
    const data = {
      name: name().trim(),
      nodes: nodes(),
      isCyclical: isCyclical(),
      color: color(),
      group: group().trim(),
      description: description().trim(),
      createdAt: existing?.createdAt ?? Date.now(),
    };
    if (existing && existing.id !== 0) {
      await updateTrack(existing.id, data);
      showToast('Track updated', 'success');
    } else {
      await addTrack(data);
      showToast('Track saved', 'success');
    }
    setEditingTrack(null);
    props.onSaved?.();
  }

  async function handleDelete() {
    const t = editingTrack();
    if (!t || t.id === 0) return;
    await deleteTrack(t.id);
    showToast('Track deleted', 'success');
    setEditingTrack(null);
    props.onSaved?.();
  }

  const isDesktop = () => window.innerWidth >= DESKTOP_BREAKPOINT;

  return (
    <Show when={editingTrack() !== null}>
      <div
        onClick={() => setEditingTrack(null)}
        style={{ position: 'fixed', inset: 0, background: 'var(--color-overlay)', 'z-index': '40' }}
      />

      <div
        role="dialog"
        aria-label={
          editingTrack() && editingTrack()!.id !== 0 ? `Edit ${editingTrack()!.name}` : 'New Track'
        }
        aria-modal="true"
        onKeyDown={(e) => {
          if (e.key !== 'Tab') return;
          const el = e.currentTarget;
          const focusable = Array.from(
            el.querySelectorAll<HTMLElement>(
              'button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
            )
          ).filter((n) => !n.hasAttribute('disabled'));
          if (focusable.length === 0) return;
          const first = focusable[0],
            last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }}
        style={{
          position: 'fixed',
          'z-index': '50',
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          ...(isDesktop()
            ? {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '360px',
                'border-radius': 'var(--radius-xl)',
              }
            : {
                bottom: 0,
                left: 0,
                right: 0,
                'border-radius': 'var(--radius-xl) var(--radius-xl) 0 0',
              }),
        }}
      >
        <div style={{ padding: '20px', display: 'flex', 'flex-direction': 'column', gap: '14px' }}>
          <div
            style={{ display: 'flex', 'align-items': 'center', 'justify-content': 'space-between' }}
          >
            <h2 style={{ 'font-size': '1rem', 'font-weight': '700' }}>
              {editingTrack() && editingTrack()!.id !== 0 ? 'Edit Track' : 'New Track'}
            </h2>
            <button
              aria-label="Close"
              onClick={() => setEditingTrack(null)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
                padding: '4px',
              }}
            >
              ✕
            </button>
          </div>

          <label style={{ display: 'flex', 'flex-direction': 'column', gap: '4px' }}>
            <span style={{ 'font-size': '0.75rem', color: 'var(--color-text-secondary)' }}>
              Name
            </span>
            <input
              name="track-name"
              value={name()}
              onInput={(e) => setName(e.currentTarget.value)}
              style={{
                background: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-border)',
                'border-radius': 'var(--radius-sm)',
                padding: '7px 10px',
                color: 'var(--color-text)',
                'font-family': 'inherit',
                'font-size': '0.875rem',
              }}
            />
          </label>

          {/* Path / Area toggle */}
          <div style={{ display: 'flex', 'flex-direction': 'column', gap: '6px' }}>
            <span style={{ 'font-size': '0.75rem', color: 'var(--color-text-secondary)' }}>
              Type
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                aria-pressed={!isCyclical()}
                onClick={() => setIsCyclical(false)}
                style={{
                  flex: 1,
                  padding: '7px',
                  background: !isCyclical() ? 'var(--color-accent-bg)' : 'var(--color-bg-tertiary)',
                  border: `1px solid ${!isCyclical() ? 'var(--color-accent-border)' : 'var(--color-border)'}`,
                  'border-radius': 'var(--radius-sm)',
                  cursor: 'pointer',
                  color: !isCyclical() ? 'var(--color-accent)' : 'var(--color-text)',
                  'font-family': 'inherit',
                  'font-size': '0.875rem',
                }}
              >
                Path
              </button>
              <button
                aria-pressed={isCyclical()}
                onClick={() => setIsCyclical(true)}
                style={{
                  flex: 1,
                  padding: '7px',
                  background: isCyclical() ? 'var(--color-accent-bg)' : 'var(--color-bg-tertiary)',
                  border: `1px solid ${isCyclical() ? 'var(--color-accent-border)' : 'var(--color-border)'}`,
                  'border-radius': 'var(--radius-sm)',
                  cursor: 'pointer',
                  color: isCyclical() ? 'var(--color-accent)' : 'var(--color-text)',
                  'font-family': 'inherit',
                  'font-size': '0.875rem',
                }}
              >
                Area
              </button>
            </div>
          </div>

          <ColorPicker value={color()} onChange={setColor} />

          <label style={{ display: 'flex', 'flex-direction': 'column', gap: '4px' }}>
            <span style={{ 'font-size': '0.75rem', color: 'var(--color-text-secondary)' }}>
              Group
            </span>
            <input
              name="track-group"
              value={group()}
              onInput={(e) => setGroup(e.currentTarget.value)}
              style={{
                background: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-border)',
                'border-radius': 'var(--radius-sm)',
                padding: '7px 10px',
                color: 'var(--color-text)',
                'font-family': 'inherit',
                'font-size': '0.875rem',
              }}
            />
          </label>

          <label style={{ display: 'flex', 'flex-direction': 'column', gap: '4px' }}>
            <span style={{ 'font-size': '0.75rem', color: 'var(--color-text-secondary)' }}>
              Description
            </span>
            <textarea
              name="track-desc"
              value={description()}
              onInput={(e) => setDescription(e.currentTarget.value)}
              rows={2}
              style={{
                background: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-border)',
                'border-radius': 'var(--radius-sm)',
                padding: '7px 10px',
                color: 'var(--color-text)',
                'font-family': 'inherit',
                'font-size': '0.875rem',
                resize: 'none',
              }}
            />
          </label>

          <div style={{ display: 'flex', gap: '8px', 'margin-top': '4px' }}>
            <Show when={editingTrack() && editingTrack()!.id !== 0}>
              <button
                onClick={handleDelete}
                style={{
                  padding: '9px 14px',
                  background: 'none',
                  border: '1px solid var(--color-danger)',
                  'border-radius': 'var(--radius-md)',
                  cursor: 'pointer',
                  color: 'var(--color-danger)',
                  'font-family': 'inherit',
                  'font-size': '0.875rem',
                }}
              >
                Delete
              </button>
            </Show>
            <button
              onClick={handleSave}
              style={{
                flex: 1,
                padding: '9px',
                background: 'var(--color-accent)',
                border: 'none',
                'border-radius': 'var(--radius-md)',
                cursor: 'pointer',
                color: 'oklch(0.1 0 0)',
                'font-family': 'inherit',
                'font-size': '0.875rem',
                'font-weight': '600',
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default TrackEditor;
