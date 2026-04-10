import { Component, createSignal, createEffect, Show } from 'solid-js';
import { useUI } from '../../context/UIContext';
import { addTrack, updateTrack, deleteTrack } from '../../db/db';
import { showToast } from '../ui/Toast';
import type { Track, PinColor, TrackNode } from '../../types';
import ColorPicker from '../ColorPicker';
import Dialog from '../ui/Dialog';
import TextField from '../ui/TextField';
import Button from '../ui/Button';
import ToggleGroup from '../ui/ToggleGroup';

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

  const isEdit = () => editingTrack() !== null && editingTrack()!.id !== 0;
  const dialogTitle = () => (isEdit() ? 'Edit Track' : 'New Track');

  return (
    <Dialog
      open={editingTrack() !== null}
      onOpenChange={(open) => {
        if (!open) setEditingTrack(null);
      }}
      title={dialogTitle()}
    >
      <div style={{ display: 'flex', 'flex-direction': 'column', gap: '14px' }}>
        <TextField label="Name" value={name()} onChange={setName} />

        <div style={{ display: 'flex', 'flex-direction': 'column', gap: '6px' }}>
          <span
            style={{
              'font-size': '11px',
              color: 'var(--color-text-secondary)',
              'text-transform': 'uppercase',
              'letter-spacing': '0.04em',
            }}
          >
            Type
          </span>
          <ToggleGroup
            value={isCyclical() ? 'area' : 'path'}
            onChange={(v) => setIsCyclical(v === 'area')}
            options={[
              { value: 'path', label: 'Path' },
              { value: 'area', label: 'Area' },
            ]}
          />
        </div>

        <ColorPicker value={color()} onChange={setColor} />

        <TextField label="Group" value={group()} onChange={setGroup} />

        <TextField label="Description" value={description()} onChange={setDescription} multiline />

        <div style={{ display: 'flex', gap: '8px', 'margin-top': '4px' }}>
          <Show when={isEdit()}>
            <Button
              variant="ghost"
              onClick={handleDelete}
              style={{ color: 'var(--color-danger)', 'border-color': 'var(--color-danger)' }}
            >
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

export default TrackEditor;
