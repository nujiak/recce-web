import { Component } from 'solid-js';
import { gpsHeading } from '../../stores/gps';

const CompassNeedle: Component = () => {
  const heading = () => gpsHeading() ?? 0;

  return (
    <div style={{ display: 'flex', 'flex-direction': 'column', 'align-items': 'center', gap: '4px' }}>
      <svg
        width="80"
        height="80"
        viewBox="0 0 100 100"
        style={{ transform: `rotate(${heading()}deg)`, transition: 'transform 0.3s ease-out' }}
        aria-label={`Compass heading ${Math.round(heading())}°`}
      >
        {/* North (red) */}
        <polygon points="50,5 42,50 50,44 58,50" fill="#e53935" />
        {/* South (gray) */}
        <polygon points="50,95 42,50 50,56 58,50" fill="#888" />
        {/* Center dot */}
        <circle cx="50" cy="50" r="4" fill="var(--color-text-secondary)" />
      </svg>
      <span style={{ 'font-size': '0.75rem', color: 'var(--color-text-secondary)', 'font-variant-numeric': 'tabular-nums' }}>
        {Math.round(heading())}°
      </span>
    </div>
  );
};

export default CompassNeedle;
