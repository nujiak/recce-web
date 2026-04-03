import { Component, Show } from 'solid-js';
import { usePrefs } from '../../context/PrefsContext';
import { formatBearing } from '../../utils/geo';
import Needle from '../ui/Needle';

interface CompassButtonProps {
  bearing: number;
  onReset: () => void;
}

const CompassButton: Component<CompassButtonProps> = (props) => {
  const [prefs] = usePrefs();

  const inverseBearing = () => {
    const inverse = (360 - props.bearing) % 360;
    return formatBearing(inverse, prefs.angleUnit);
  };

  return (
    <button
      aria-label="Reset map north"
      onClick={props.onReset}
      style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        width: '40px',
        height: '40px',
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        'border-radius': '50%',
        cursor: 'pointer',
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        'box-shadow': '0 2px 4px rgba(0,0,0,0.2)',
        'z-index': '10',
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
        }}
      >
        <Needle
          showLabel={false}
          style={{
            position: 'absolute',
            height: '26px',
            'aspect-ratio': '1 / 1',
            transform: `rotate(${-props.bearing}deg)`,
          }}
        />
        <Show when={props.bearing !== 0}>
          <span
            style={{
              position: 'relative',
              'font-size': '0.65rem',
              'font-weight': '700',
              color: '#fff',
              'text-shadow': '0 0 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.7)',
              'z-index': '2',
              'pointer-events': 'none',
            }}
          >
            {inverseBearing()}
          </span>
        </Show>
      </div>
    </button>
  );
};

export default CompassButton;
