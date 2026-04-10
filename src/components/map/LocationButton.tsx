import { Component } from 'solid-js';
import { gpsPosition } from '../../stores/gps';

export type LocationMode = 'unavailable' | 'available' | 'following' | 'following-bearing';

interface LocationButtonProps {
  mode: LocationMode;
  onLocate: () => void;
}

const LocationButton: Component<LocationButtonProps> = (props) => {
  const hasGps = () => gpsPosition() !== null;

  const buttonStyle = () => {
    switch (props.mode) {
      case 'following-bearing':
        return {
          background: 'var(--color-accent)',
          border: '1px solid var(--color-accent)',
        };
      case 'following':
        return {
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
        };
      case 'available':
        return {
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
        };
      default: // unavailable
        return {
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          opacity: '0.5',
        };
    }
  };

  const iconColor = () => {
    switch (props.mode) {
      case 'following-bearing':
        return 'white';
      case 'following':
        return 'var(--color-accent)';
      case 'available':
        return 'white';
      default: // unavailable
        return 'var(--color-text-secondary)';
    }
  };

  return (
    <button
      aria-label="Center on GPS location"
      onClick={props.onLocate}
      disabled={!hasGps()}
      style={{
        position: 'absolute',
        top: '64px',
        right: '16px',
        width: '48px',
        height: '48px',
        ...buttonStyle(),
        'border-radius': '0px',
        cursor: hasGps() ? 'pointer' : 'default',
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        'box-shadow': '0 2px 4px rgba(0,0,0,0.2)',
        'z-index': '10',
        transition: 'background 0.2s, border-color 0.2s, opacity 0.2s',
      }}
    >
      <span
        class="material-symbols-outlined"
        style={{
          'font-size': '20px',
          color: iconColor(),
          transition: 'color 0.2s',
        }}
      >
        my_location
      </span>
    </button>
  );
};

export default LocationButton;
