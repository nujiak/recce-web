import { Component } from 'solid-js';
import { gpsPosition } from '../../stores/gps';

interface LocationButtonProps {
  onLocate: () => void;
}

const LocationButton: Component<LocationButtonProps> = (props) => {
  const hasGps = () => gpsPosition() !== null;

  return (
    <button
      aria-label="Center on GPS location"
      onClick={props.onLocate}
      style={{
        position: 'absolute',
        top: '64px',
        right: '16px',
        width: '40px',
        height: '40px',
        background: hasGps() ? 'var(--color-accent-bg)' : 'var(--color-bg-secondary)',
        border: `1px solid ${hasGps() ? 'var(--color-accent-border)' : 'var(--color-border)'}`,
        'border-radius': '50%',
        cursor: 'pointer',
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        'box-shadow': '0 2px 4px rgba(0,0,0,0.2)',
        'z-index': '10',
      }}
    >
      <span
        class="material-symbols-outlined"
        style={{
          'font-size': '20px',
          color: hasGps() ? 'var(--color-accent)' : 'var(--color-text-secondary)',
        }}
      >
        my_location
      </span>
    </button>
  );
};

export default LocationButton;
