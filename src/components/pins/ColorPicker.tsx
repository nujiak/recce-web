import { type Component, For } from 'solid-js';
import type { PinColor } from '@/types';

interface ColorPickerProps {
  value: PinColor;
  onChange: (color: PinColor) => void;
}

const COLORS: PinColor[] = ['red', 'orange', 'green', 'azure', 'violet'];

export const ColorPicker: Component<ColorPickerProps> = (props) => {
  return (
    <div class="flex gap-2">
      <For each={COLORS}>
        {(color) => (
          <button
            type="button"
            class={`w-8 h-8 rounded-full border-2 transition-all ${
              props.value === color ? 'border-text scale-110' : 'border-transparent hover:scale-105'
            }`}
            style={{ 'background-color': `var(--color-pin-${color})` }}
            onClick={() => props.onChange(color)}
            aria-label={`Select ${color} color`}
          />
        )}
      </For>
    </div>
  );
};
