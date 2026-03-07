import { Component } from 'solid-js';
import type { MapStyle } from '../../types';

interface LayerButtonProps {
  mapStyle: MapStyle;
  onToggle: () => void;
}

const LayerButton: Component<LayerButtonProps> = (props) => {
  const isSatellite = () => props.mapStyle === 'satellite';
  const label = () => (isSatellite() ? 'Switch to standard map' : 'Switch to satellite map');

  return (
    <button
      aria-label={label()}
      title={label()}
      onClick={props.onToggle}
      style={{
        position: 'absolute',
        top: '112px',
        right: '16px',
        width: '40px',
        height: '40px',
        background: isSatellite() ? 'var(--color-accent-bg)' : 'var(--color-bg-secondary)',
        border: `1px solid ${isSatellite() ? 'var(--color-accent-border)' : 'var(--color-border)'}`,
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
          color: isSatellite() ? 'var(--color-accent)' : 'var(--color-text-secondary)',
        }}
      >
        satellite
      </span>
    </button>
  );
};

export default LayerButton;
