import { Component } from 'solid-js';

interface MapStyleToggleProps {
  isSatellite: boolean;
  onToggle: () => void;
}

const MapStyleToggle: Component<MapStyleToggleProps> = (props) => {
  return (
    <button
      type="button"
      aria-label={props.isSatellite ? 'Satellite map active' : 'Default map active'}
      onClick={props.onToggle}
      style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        display: 'flex',
        'align-items': 'center',
        gap: '8px',
        padding: '0 14px',
        height: '40px',
        background: 'rgba(15, 23, 42, 0.86)',
        color: '#f8fafc',
        border: '1px solid rgba(148, 163, 184, 0.4)',
        'border-radius': '999px',
        cursor: 'pointer',
        'box-shadow': '0 8px 20px rgba(15, 23, 42, 0.22)',
        'backdrop-filter': 'blur(10px)',
        'z-index': '10',
        'font-size': '0.8125rem',
        'font-weight': '700',
        'letter-spacing': '0.02em',
      }}
    >
      <span class="material-symbols-outlined" style={{ 'font-size': '18px' }}>
        {props.isSatellite ? 'satellite_alt' : 'map'}
      </span>
      <span>{props.isSatellite ? 'Satellite' : 'Default'}</span>
    </button>
  );
};

export default MapStyleToggle;
