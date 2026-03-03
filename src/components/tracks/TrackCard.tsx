import { type Component, Show } from 'solid-js';
import type { Track } from '@/types';
import { preferences } from '@/stores/preferences';
import { formatDistance, calculateTotalDistance } from '@/utils/geo';

interface TrackCardProps {
  track: Track;
  selected?: boolean;
  onClick?: () => void;
}

export const TrackCard: Component<TrackCardProps> = (props) => {
  const distance = () => {
    const dist = calculateTotalDistance(props.track.nodes, props.track.isCyclical);
    return formatDistance(dist, preferences.lengthUnit());
  };

  const nodeCount = () => props.track.nodes?.length || 0;

  return (
    <div
      class="flex items-center gap-3 p-3 rounded-lg bg-surface cursor-pointer hover:bg-surface-hover transition-colors"
      classList={{ 'ring-2 ring-primary': props.selected }}
      onClick={props.onClick}
    >
      <div
        class="w-3 h-3 rounded-full flex-shrink-0"
        style={{ 'background-color': `var(--color-pin-${props.track.color})` }}
      />
      <div class="flex-1 min-w-0">
        <div class="font-medium truncate">{props.track.name}</div>
        <div class="flex items-center gap-2 text-sm text-secondary">
          <span class="flex items-center gap-1">
            <span class="material-symbols-outlined text-sm">
              {props.track.isCyclical ? 'trip_origin' : 'show_chart'}
            </span>
            {props.track.isCyclical ? 'Area' : 'Path'}
          </span>
          <span>{distance()}</span>
          <span>{nodeCount()} nodes</span>
        </div>
        <Show when={props.track.group}>
          <div class="text-sm text-secondary truncate">{props.track.group}</div>
        </Show>
      </div>
    </div>
  );
};
