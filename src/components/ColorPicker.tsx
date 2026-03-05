import { Component, For } from 'solid-js';
import { PIN_COLOR_CSS, PIN_COLORS } from '../utils/colors';
import type { PinColor } from '../types';

interface ColorPickerProps {
  value: PinColor;
  onChange: (color: PinColor) => void;
}

const ColorPicker: Component<ColorPickerProps> = (props) => (
  <div style={{ display: 'flex', 'flex-direction': 'column', gap: '6px' }}>
    <span style={{ 'font-size': '0.75rem', color: 'var(--color-text-secondary)' }}>Color</span>
    <div style={{ display: 'flex', gap: '8px' }}>
      <For each={PIN_COLORS}>
        {(c) => (
          <button
            aria-label={c}
            aria-pressed={props.value === c}
            onClick={() => props.onChange(c)}
            style={{
              width: '28px',
              height: '28px',
              'border-radius': '50%',
              background: PIN_COLOR_CSS[c],
              border: props.value === c ? '2px solid var(--color-text)' : '2px solid transparent',
              cursor: 'pointer',
            }}
          />
        )}
      </For>
    </div>
  </div>
);

export default ColorPicker;
