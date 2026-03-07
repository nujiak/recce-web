import { Component } from 'solid-js';
import { usePrefs } from '../../context/PrefsContext';

const LayerButton: Component = () => {
  const [prefs, setPrefs] = usePrefs();
  const isSatellite = () => prefs.mapStyle === 'satellite';

  function handleToggle() {
    setPrefs('mapStyle', isSatellite() ? 'standard' : 'satellite');
  }

  return (
    <button
      aria-label={isSatellite() ? 'Switch to standard map' : 'Switch to satellite map'}
      onClick={handleToggle}
      title={isSatellite() ? 'Switch to standard map' : 'Switch to satellite map'}
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
        {isSatellite() ? 'map' : 'satellite_alt'}
      </span>
    </button>
  );
};

export default LayerButton;
