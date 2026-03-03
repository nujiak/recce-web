import { type Component, Show } from 'solid-js';
import type { Pin } from '@/types';
import { preferences } from '@/stores/preferences';
import { CoordinateTransformer } from '@/coords';

interface PinCardProps {
  pin: Pin;
  selected?: boolean;
  onClick?: () => void;
}

export const PinCard: Component<PinCardProps> = (props) => {
  const coordDisplay = () => {
    const { lat, lng } = props.pin;
    const system = preferences.coordSystem();
    return CoordinateTransformer.toDisplay(lat, lng, system);
  };

  return (
    <div
      class="flex items-center gap-3 p-3 rounded-lg bg-surface cursor-pointer hover:bg-surface-hover transition-colors"
      classList={{ 'ring-2 ring-primary': props.selected }}
      onClick={props.onClick}
    >
      <div
        class="w-3 h-3 rounded-full flex-shrink-0"
        style={{ 'background-color': `var(--color-pin-${props.pin.color})` }}
      />
      <div class="flex-1 min-w-0">
        <div class="font-medium truncate">{props.pin.name}</div>
        <Show when={props.pin.group}>
          <div class="text-sm text-secondary truncate">{props.pin.group}</div>
        </Show>
      </div>
      <div class="text-xs text-secondary font-mono text-right flex-shrink-0">{coordDisplay()}</div>
    </div>
  );
};
