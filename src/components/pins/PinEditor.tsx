import { type Component, createSignal, createEffect, Show, onMount } from 'solid-js';
import { Modal } from '@/components/layout/Modal';
import { ColorPicker } from '@/components/pins/ColorPicker';
import { pinsStore } from '@/stores/pins';
import { preferences } from '@/stores/preferences';
import { CoordinateTransformer } from '@/coords';
import type { Pin, PinColor } from '@/types';

interface PinEditorProps {
  open: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  pin?: Pin;
  lat: number;
  lng: number;
  onSave?: (pin: Pin, isEdit: boolean, isDelete: boolean) => void;
}

export const PinEditor: Component<PinEditorProps> = (props) => {
  const [name, setName] = createSignal('');
  const [coord, setCoord] = createSignal('');
  const [group, setGroup] = createSignal('');
  const [description, setDescription] = createSignal('');
  const [color, setColor] = createSignal<PinColor>('red');
  const [groups, setGroups] = createSignal<string[]>([]);

  createEffect(() => {
    if (props.open) {
      loadGroups();
      if (props.mode === 'edit' && props.pin) {
        setName(props.pin.name);
        setCoord(
          CoordinateTransformer.toDisplay(
            props.pin.lat,
            props.pin.lng,
            preferences.coordSystem()
          ) || ''
        );
        setGroup(props.pin.group || '');
        setDescription(props.pin.description || '');
        setColor(props.pin.color || 'red');
      } else {
        setName('');
        setCoord(
          CoordinateTransformer.toDisplay(props.lat, props.lng, preferences.coordSystem()) || ''
        );
        setGroup('');
        setDescription('');
        setColor('red');
      }
    }
  });

  const loadGroups = async () => {
    const allPins = pinsStore.list();
    const groupSet = new Set(allPins.map((p) => p.group).filter((g) => g));
    setGroups(Array.from(groupSet).sort());
  };

  const handleSave = async () => {
    const nameVal = name().trim();
    if (!nameVal) return;

    const coordStr = coord().trim();
    const parsed = CoordinateTransformer.parse(coordStr, preferences.coordSystem());
    if (!parsed) return;

    const groupVal = group().trim();
    const descVal = description().trim();

    if (props.mode === 'edit' && props.pin) {
      const updated = {
        ...props.pin,
        name: nameVal,
        lat: parsed.lat,
        lng: parsed.lng,
        color: color(),
        group: groupVal,
        description: descVal,
      };
      await pinsStore.update(props.pin.id, updated);
      props.onSave?.(updated, true, false);
    } else {
      const newPin = await pinsStore.add({
        name: nameVal,
        lat: parsed.lat,
        lng: parsed.lng,
        color: color(),
        group: groupVal,
        description: descVal,
      });
      props.onSave?.(newPin, false, false);
    }
    props.onClose();
  };

  const handleDelete = async () => {
    if (props.mode !== 'edit' || !props.pin) return;
    await pinsStore.delete(props.pin.id);
    props.onSave?.(props.pin, false, true);
    props.onClose();
  };

  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={props.mode === 'edit' ? 'Edit Pin' : 'Add Pin'}
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
            placeholder="Enter pin name"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">
            Coordinates ({preferences.coordSystem()})
          </label>
          <input
            type="text"
            class="w-full px-3 py-2 rounded-lg bg-surface-hover border border-border focus:border-primary outline-none font-mono text-sm"
            value={coord()}
            onInput={(e) => setCoord(e.currentTarget.value)}
          />
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
            list="pin-groups"
            placeholder="Optional group name"
          />
          <datalist id="pin-groups">
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
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
};
