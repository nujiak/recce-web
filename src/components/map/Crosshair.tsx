import { Component, Show } from 'solid-js';
import { usePrefs } from '../../context/PrefsContext';
import { CoordinateTransformer } from '../../coords/index';
import { showToast } from '../Toast';
import { gpsPosition } from '../../stores/gps';
import { haversineDistance, calculateBearing, formatDistance, formatBearing } from '../../utils/geo';

interface CrosshairProps {
  center: [number, number]; // [lng, lat]
}

const Crosshair: Component<CrosshairProps> = (props) => {
  const [prefs] = usePrefs();

  const coordDisplay = () => {
    const [lng, lat] = props.center;
    return CoordinateTransformer.toDisplay(lat, lng, prefs.coordinateSystem) ?? '';
  };

  const gpsOverlay = () => {
    const pos = gpsPosition();
    if (!pos) return null;
    const [lng, lat] = props.center;
    const dist = haversineDistance(pos.latitude, pos.longitude, lat, lng);
    const bearing = calculateBearing(pos.latitude, pos.longitude, lat, lng);
    return {
      distance: formatDistance(dist, prefs.lengthUnit),
      bearing: formatBearing(bearing, prefs.angleUnit),
    };
  };

  function copyCoord() {
    const text = coordDisplay();
    if (!text) return;
    navigator.clipboard.writeText(text).catch(() => {});
    showToast('Coordinates copied', 'success');
  }

  return (
    <div style={{ position: 'absolute', inset: 0, 'pointer-events': 'none', display: 'flex', 'align-items': 'center', 'justify-content': 'center' }}>
      {/* Crosshair SVG */}
      <svg width="40" height="40" viewBox="0 0 40 40" style={{ position: 'absolute' }}>
        <line x1="20" y1="4" x2="20" y2="16" stroke="white" stroke-width="2" />
        <line x1="20" y1="24" x2="20" y2="36" stroke="white" stroke-width="2" />
        <line x1="4" y1="20" x2="16" y2="20" stroke="white" stroke-width="2" />
        <line x1="24" y1="20" x2="36" y2="20" stroke="white" stroke-width="2" />
        <circle cx="20" cy="20" r="3" fill="none" stroke="white" stroke-width="1.5" />
        {/* Dark outline for visibility */}
        <line x1="20" y1="4" x2="20" y2="16" stroke="#333" stroke-width="0.5" />
        <line x1="20" y1="24" x2="20" y2="36" stroke="#333" stroke-width="0.5" />
        <line x1="4" y1="20" x2="16" y2="20" stroke="#333" stroke-width="0.5" />
        <line x1="24" y1="20" x2="36" y2="20" stroke="#333" stroke-width="0.5" />
      </svg>

      {/* Coord display — below crosshair */}
      <button
        aria-label="Copy coordinates"
        onClick={copyCoord}
        style={{
          position: 'absolute',
          top: 'calc(50% + 28px)',
          'pointer-events': 'auto',
          background: 'rgba(0,0,0,0.65)',
          color: '#fff',
          border: 'none',
          'border-radius': '4px',
          padding: '3px 8px',
          'font-size': '0.75rem',
          cursor: 'pointer',
          'font-family': 'inherit',
          'white-space': 'nowrap',
        }}
      >
        {coordDisplay()}
      </button>

      {/* GPS overlay */}
      <Show when={gpsOverlay()}>
        {(overlay) => (
          <div style={{
            position: 'absolute',
            top: 'calc(50% + 56px)',
            background: 'rgba(0,0,0,0.55)',
            color: 'var(--color-accent)',
            'border-radius': '4px',
            padding: '2px 8px',
            'font-size': '0.7rem',
            'white-space': 'nowrap',
          }}>
            {overlay().distance} · {overlay().bearing}
          </div>
        )}
      </Show>
    </div>
  );
};

export default Crosshair;
