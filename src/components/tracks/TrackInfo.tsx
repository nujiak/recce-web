import { type Component, For, Show } from 'solid-js';
import { Modal } from '@/components/layout/Modal';
import { preferences } from '@/stores/preferences';
import { calculateTotalDistance, calculateArea, formatDistance, formatArea } from '@/utils/geo';
import type { Track } from '@/types';

interface TrackInfoProps {
  open: boolean;
  onClose: () => void;
  track?: Track;
  onEdit?: (track: Track) => void;
  onFlyTo?: (track: Track) => void;
}

export const TrackInfo: Component<TrackInfoProps> = (props) => {
  const distance = () => {
    if (!props.track) return null;
    const dist = calculateTotalDistance(props.track.nodes, props.track.isCyclical);
    return formatDistance(dist, preferences.lengthUnit());
  };

  const area = () => {
    if (!props.track || !props.track.isCyclical) return null;
    const a = calculateArea(props.track.nodes);
    return formatArea(a, preferences.lengthUnit());
  };

  const checkpoints = () => {
    if (!props.track) return [];
    return props.track.nodes.filter((n) => n.name);
  };

  const handleMap = () => {
    if (props.track) {
      props.onFlyTo?.(props.track);
      props.onClose();
    }
  };

  const handleEdit = () => {
    if (props.track) {
      props.onEdit?.(props.track);
      props.onClose();
    }
  };

  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={props.track?.name || 'Track Info'}
      variant="bottom-sheet"
    >
      <Show when={props.track}>
        <div class="space-y-4">
          <div class="flex items-center gap-2 text-secondary">
            <span class="material-symbols-outlined">
              {props.track!.isCyclical ? 'trip_origin' : 'show_chart'}
            </span>
            <span>{props.track!.isCyclical ? 'Area' : 'Path'}</span>
          </div>

          <div class="space-y-2">
            <div class="flex justify-between p-2 rounded-lg bg-surface-hover">
              <span class="text-secondary">
                {props.track!.isCyclical ? 'Perimeter' : 'Distance'}
              </span>
              <span class="font-medium">{distance()}</span>
            </div>

            <Show when={area()}>
              <div class="flex justify-between p-2 rounded-lg bg-surface-hover">
                <span class="text-secondary">Area</span>
                <span class="font-medium">{area()}</span>
              </div>
            </Show>

            <div class="flex justify-between p-2 rounded-lg bg-surface-hover">
              <span class="text-secondary">Nodes</span>
              <span class="font-medium">{props.track!.nodes?.length || 0}</span>
            </div>
          </div>

          <Show when={props.track!.group}>
            <div class="text-secondary">{props.track!.group}</div>
          </Show>

          <Show when={props.track!.description}>
            <div class="text-secondary text-sm">{props.track!.description}</div>
          </Show>

          <Show when={checkpoints().length > 0}>
            <div class="space-y-2">
              <div class="font-medium">Checkpoints</div>
              <ul class="space-y-1 text-sm text-secondary">
                <For each={checkpoints()}>{(cp) => <li>{cp.name}</li>}</For>
              </ul>
            </div>
          </Show>

          <div class="flex gap-2 pt-2">
            <button
              class="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-surface-hover hover:bg-surface transition-colors"
              onClick={handleMap}
            >
              <span class="material-symbols-outlined">map</span>
              Map
            </button>
            <button
              class="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-surface-hover hover:bg-surface transition-colors"
              onClick={handleEdit}
            >
              <span class="material-symbols-outlined">edit</span>
              Edit
            </button>
          </div>
        </div>
      </Show>
    </Modal>
  );
};
