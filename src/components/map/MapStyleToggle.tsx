import { Component } from 'solid-js';

interface MapStyleToggleProps {
  isSatellite: boolean;
  onToggle: () => void;
}

const MapStyleToggle: Component<MapStyleToggleProps> = (props) => {
  const label = () => (props.isSatellite ? 'Satellite map active' : 'Default map active');
  const icon = () => (props.isSatellite ? 'satellite_alt' : 'map');
  const text = () => (props.isSatellite ? 'Satellite' : 'Default');

  return (
    <button
      type="button"
      aria-label={label()}
      title={text()}
      onClick={props.onToggle}
      style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        display: 'flex',
        'align-items': 'center',
        gap: '8px',
        padding: '0 14px',
        'min-height': '48px',
        'min-width': '48px',
        background: 'var(--color-bg-secondary)',
        color: 'var(--color-text)',
        border: '1px solid var(--color-border)',
        'border-radius': '0px',
        cursor: 'pointer',
        'box-shadow': '0 2px 4px rgba(0,0,0,0.2)',
        'z-index': '10',
        'font-size': '13px',
        'letter-spacing': '0.04em',
        'text-transform': 'uppercase' as const,
        'font-family': 'inherit',
      }}
    >
      <span class="material-symbols-outlined" style={{ 'font-size': '18px' }}>
        {icon()}
      </span>
      <span>{text()}</span>
    </button>
  );
};

export default MapStyleToggle;
