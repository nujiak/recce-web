import { Component, createSignal, Show } from 'solid-js';
import { usePrefs } from '../../context/PrefsContext';
import { mapCenter } from '../../stores/mapCenter';
import { CoordinateTransformer } from '../../coords/index';
import {
  haversineDistance,
  calculateBearing,
  formatDistance,
  formatBearing,
} from '../../utils/geo';

const CoaPanel: Component = () => {
  const [prefs] = usePrefs();
  const [toCoordInput, setToCoordInput] = createSignal('');
  const [toCoord, setToCoord] = createSignal<{ lat: number; lng: number } | null>(null);

  const fromCoord = mapCenter;

  const fromDisplay = () => {
    const { lat, lng } = fromCoord();
    return CoordinateTransformer.toDisplay(lat, lng, prefs.coordinateSystem) ?? '';
  };

  const result = () => {
    const to = toCoord();
    if (!to) return null;
    const from = fromCoord();
    const distance = haversineDistance(from.lat, from.lng, to.lat, to.lng);
    const bearing = calculateBearing(from.lat, from.lng, to.lat, to.lng);
    return { distance, bearing };
  };

  function handleParseToCoord() {
    const input = toCoordInput().trim();
    if (!input) return;
    const parsed = CoordinateTransformer.parse(input, prefs.coordinateSystem);
    if (parsed) {
      setToCoord({ lat: parsed.lat, lng: parsed.lng });
    }
  }

  return (
    <div style={{ padding: '16px', display: 'flex', 'flex-direction': 'column', gap: '16px' }}>
      {/* From coordinate */}
      <div
        style={{
          background: 'var(--color-bg-secondary)',
          'border-radius': 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          padding: '12px',
          display: 'flex',
          'flex-direction': 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
          <span
            class="material-symbols-outlined"
            style={{ 'font-size': '16px', color: 'var(--color-accent)' }}
          >
            my_location
          </span>
          <span style={{ 'font-size': '0.875rem', 'font-weight': '600' }}>From (Map Center)</span>
        </div>
        <div style={{ 'font-size': '0.875rem', 'font-variant-numeric': 'tabular-nums' }}>
          {fromDisplay()}
        </div>
      </div>

      {/* To coordinate */}
      <div
        style={{
          background: 'var(--color-bg-secondary)',
          'border-radius': 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          padding: '12px',
          display: 'flex',
          'flex-direction': 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
          <span
            class="material-symbols-outlined"
            style={{ 'font-size': '16px', color: 'var(--color-accent)' }}
          >
            place
          </span>
          <span style={{ 'font-size': '0.875rem', 'font-weight': '600' }}>To</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            aria-label="To coordinate"
            placeholder={`${prefs.coordinateSystem} coordinate`}
            value={toCoordInput()}
            onInput={(e) => setToCoordInput(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleParseToCoord();
            }}
            style={{
              flex: 1,
              background: 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-border)',
              'border-radius': 'var(--radius-sm)',
              padding: '8px',
              color: 'var(--color-text)',
              'font-family': 'inherit',
              'font-size': '0.875rem',
            }}
          />
          <button
            onClick={handleParseToCoord}
            style={{
              background: 'var(--color-accent)',
              border: 'none',
              'border-radius': 'var(--radius-sm)',
              padding: '8px 16px',
              cursor: 'pointer',
              color: 'oklch(0.1 0 0)',
              'font-family': 'inherit',
              'font-size': '0.875rem',
              'font-weight': '600',
            }}
          >
            Set
          </button>
        </div>
        <Show when={toCoord()}>
          {(coord) => (
            <div
              style={{
                'font-size': '0.875rem',
                'font-variant-numeric': 'tabular-nums',
                color: 'var(--color-text-secondary)',
              }}
            >
              {CoordinateTransformer.toDisplay(coord().lat, coord().lng, prefs.coordinateSystem)}
            </div>
          )}
        </Show>
      </div>

      {/* Result */}
      <Show when={result()}>
        {(res) => (
          <div
            style={{
              background: 'var(--color-bg-secondary)',
              'border-radius': 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              padding: '16px',
              display: 'flex',
              'flex-direction': 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
              <span
                class="material-symbols-outlined"
                style={{ 'font-size': '16px', color: 'var(--color-accent)' }}
              >
                near_me
              </span>
              <span style={{ 'font-size': '0.875rem', 'font-weight': '600' }}>Result</span>
            </div>
            <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', 'flex-direction': 'column', gap: '4px' }}>
                <span style={{ 'font-size': '0.75rem', color: 'var(--color-text-muted)' }}>
                  Distance
                </span>
                <span
                  style={{
                    'font-size': '1.25rem',
                    'font-weight': '600',
                    'font-variant-numeric': 'tabular-nums',
                  }}
                >
                  {formatDistance(res().distance, prefs.lengthUnit)}
                </span>
              </div>
              <div style={{ display: 'flex', 'flex-direction': 'column', gap: '4px' }}>
                <span style={{ 'font-size': '0.75rem', color: 'var(--color-text-muted)' }}>
                  Bearing
                </span>
                <span
                  style={{
                    'font-size': '1.25rem',
                    'font-weight': '600',
                    'font-variant-numeric': 'tabular-nums',
                  }}
                >
                  {formatBearing(res().bearing, prefs.angleUnit)}
                </span>
              </div>
            </div>
          </div>
        )}
      </Show>
    </div>
  );
};

export default CoaPanel;
