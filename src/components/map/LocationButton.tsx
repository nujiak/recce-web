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
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={hasGps() ? 'var(--color-accent)' : 'var(--color-text-secondary)'} stroke-width="2">
        <circle cx="12" cy="12" r="4" />
        <line x1="12" y1="2" x2="12" y2="6" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <line x1="2" y1="12" x2="6" y2="12" />
        <line x1="18" y1="12" x2="22" y2="12" />
      </svg>
    </button>
  );
};

export default LocationButton;
