import { type Component, createSignal, createEffect, Show } from 'solid-js';
import { Modal } from '@/components/layout/Modal';
import { ColorPicker } from '@/components/pins/ColorPicker';
import { tracksStore } from '@/stores/tracks';
import { pinsStore } from '@/stores/pins';
import type { Track, TrackNode, PinColor } from '@/types';

interface TrackEditorProps {
  open: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  track?: Track;
  nodes?: TrackNode[];
  onSave?: (track: Track, isEdit: boolean, isDelete: boolean) => void;
}

export const TrackEditor: Component<TrackEditorProps> = (props) => {
  const [name, setName] = createSignal('');
  const [isCyclical, setIsCyclical] = createSignal(false);
  const [group, setGroup] = createSignal('');
  const [description, setDescription] = createSignal('');
  const [color, setColor] = createSignal<PinColor>('red');
  const [groups, setGroups] = createSignal<string[]>([]);
  const [sessionNodes, setSessionNodes] = createSignal<TrackNode[]>([]);

  createEffect(() => {
    if (props.open) {
      loadGroups();
      if (props.mode === 'edit' && props.track) {
        setName(props.track.name);
        setIsCyclical(props.track.isCyclical);
        setGroup(props.track.group || '');
        setDescription(props.track.description || '');
        setColor(props.track.color || 'red');
        setSessionNodes(props.track.nodes || []);
      } else {
        setName('');
        setIsCyclical(false);
        setGroup('');
        setDescription('');
        setColor('red');
        setSessionNodes(props.nodes || []);
      }
    }
  });

  const loadGroups = async () => {
    const allPins = pinsStore.list();
    const allTracks = tracksStore.list();
    const groupSet = new Set<string>();
    allPins.forEach((p) => {
      if (p.group) groupSet.add(p.group);
    });
    allTracks.forEach((t) => {
      if (t.group) groupSet.add(t.group);
    });
    setGroups(Array.from(groupSet).sort());
  };

  const handleSave = async () => {
    const nameVal = name().trim();
    if (!nameVal) return;
    if (sessionNodes().length < 2) return;

    const groupVal = group().trim();
    const descVal = description().trim();

    if (props.mode === 'edit' && props.track) {
      const updated = {
        ...props.track,
        name: nameVal,
        nodes: sessionNodes(),
        isCyclical: isCyclical(),
        color: color(),
        group: groupVal,
        description: descVal,
      };
      await tracksStore.update(props.track.id, updated);
      props.onSave?.(updated, true, false);
    } else {
      const newTrack = await tracksStore.add({
        name: nameVal,
        nodes: sessionNodes(),
        isCyclical: isCyclical(),
        color: color(),
        group: groupVal,
        description: descVal,
      });
      props.onSave?.(newTrack, false, false);
    }
    props.onClose();
  };

  const handleDelete = async () => {
    if (props.mode !== 'edit' || !props.track) return;
    await tracksStore.delete(props.track.id);
    props.onSave?.(props.track, false, true);
    props.onClose();
  };

  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={props.mode === 'edit' ? 'Edit Track' : 'New Track'}
      variant="bottom-sheet"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            class="w-full px-3 py-2 rounded-lg bg-surface-hover border border-border focus:border-primary outline-none"
            value={name()}
            onInput={(e) => setName(e.currentTarget.value)}
            placeholder="Enter track name"
          />
        </div>

        <div class="text-sm text-secondary">{sessionNodes().length} nodes</div>

        <div class="flex items-center gap-2">
          <input
            type="checkbox"
            id="track-cyclical"
            checked={isCyclical()}
            onChange={(e) => setIsCyclical(e.currentTarget.checked)}
            class="w-4 h-4 rounded border-border"
          />
          <label for="track-cyclical" class="text-sm">
            Closed loop (Area)
          </label>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Color</label>
          <ColorPicker value={color()} onChange={setColor} />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Group</label>
          <input
            type="text"
            class="w-full px-3 py-2 rounded-lg bg-surface-hover border border-border focus:border-primary outline-none"
            value={group()}
            onInput={(e) => setGroup(e.currentTarget.value)}
            list="track-groups"
            placeholder="Optional group name"
          />
          <datalist id="track-groups">
            {groups().map((g) => (
              <option value={g} />
            ))}
          </datalist>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Description</label>
          <textarea
            class="w-full px-3 py-2 rounded-lg bg-surface-hover border border-border focus:border-primary outline-none resize-none"
            rows={3}
            value={description()}
            onInput={(e) => setDescription(e.currentTarget.value)}
            placeholder="Optional description"
          />
        </div>

        <div class="flex gap-2 pt-2">
          <Show when={props.mode === 'edit'}>
            <button
              class="px-4 py-2 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors"
              onClick={handleDelete}
            >
              Delete
            </button>
          </Show>
          <div class="flex-1" />
          <button
            class="px-4 py-2 rounded-lg bg-surface-hover hover:bg-surface transition-colors"
            onClick={props.onClose}
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
            onClick={handleSave}
            disabled={sessionNodes().length < 2}
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
};
