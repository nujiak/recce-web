import { Component, createSignal, onMount, Show } from 'solid-js';
import { gpsPosition, gpsHeading, gpsPitch, gpsRoll, orientationAbsolute } from '../../stores/gps';
import { requestCompassPermission } from '../GpsTracker';
import { usePrefs } from '../../context/PrefsContext';
import { formatDistance, formatBearing } from '../../utils/geo';
import { CoordinateTransformer, SYSTEM_NAMES } from '../../coords/index';
import CompassNeedle from './CompassNeedle';

function copyText(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

const GpsPanel: Component = () => {
  const [prefs] = usePrefs();
  const [iosPrompt, setIosPrompt] = createSignal(false);

  onMount(() => {
    const doe = DeviceOrientationEvent as any;
    if (typeof doe.requestPermission === 'function') {
      setIosPrompt(true);
    }
  });

  async function handleEnableCompass() {
    const granted = await requestCompassPermission();
    if (granted) {
      setIosPrompt(false);
    }
  }

  const pos = () => gpsPosition();
  const lengthUnit = () => prefs.lengthUnit ?? 'metric';
  const angleUnit = () => prefs.angleUnit ?? 'degrees';

  return (
    <div style={{ padding: '16px', display: 'flex', 'flex-direction': 'column', gap: '16px' }}>
      {/* Location card */}
      <div
        style={{
          background: 'var(--color-bg-secondary)',
          'border-radius': 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          padding: '16px',
          display: 'flex',
          'flex-direction': 'column',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-accent)"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="4" />
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
          </svg>
          <span style={{ 'font-size': '0.875rem', 'font-weight': '600' }}>Location</span>
        </div>

        <Show when={!pos()}>
          <div style={{ 'font-size': '0.75rem', color: 'var(--color-text-secondary)' }}>
            Acquiring GPS fix…
          </div>
        </Show>

        <Show when={pos()}>
          {(coords) => {
            const coordStr = () =>
              CoordinateTransformer.toDisplay(
                coords().latitude,
                coords().longitude,
                prefs.coordinateSystem
              ) ?? '';
            return (
              <div style={{ display: 'flex', 'flex-direction': 'column', gap: '8px' }}>
                {/* Coordinates */}
                <div>
                  <div
                    style={{
                      'font-size': '0.75rem',
                      color: 'var(--color-text-muted)',
                      'margin-bottom': '2px',
                    }}
                  >
                    Coordinates ({SYSTEM_NAMES[prefs.coordinateSystem]})
                  </div>
                  <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
                    <div
                      style={{
                        'font-size': '0.875rem',
                        'font-variant-numeric': 'tabular-nums',
                        flex: 1,
                      }}
                    >
                      {coordStr()}
                    </div>
                    <button
                      aria-label="Copy coordinates"
                      onClick={() => copyText(coordStr())}
                      style={{
                        background: 'none',
                        border: '1px solid var(--color-border)',
                        'border-radius': 'var(--radius-sm)',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        color: 'var(--color-text-secondary)',
                        'font-size': '0.75rem',
                        'font-family': 'inherit',
                        'flex-shrink': '0',
                      }}
                    >
                      Copy
                    </button>
                  </div>
                </div>
                {/* Altitude + Accuracy */}
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div>
                    <div style={{ 'font-size': '0.75rem', color: 'var(--color-text-muted)' }}>
                      Altitude
                    </div>
                    <div style={{ 'font-size': '0.875rem' }}>
                      {coords().altitude !== null
                        ? formatDistance(coords().altitude!, lengthUnit())
                        : '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ 'font-size': '0.75rem', color: 'var(--color-text-muted)' }}>
                      Accuracy
                    </div>
                    <div style={{ 'font-size': '0.875rem' }}>
                      ±{formatDistance(coords().accuracy, lengthUnit())}
                    </div>
                  </div>
                </div>
              </div>
            );
          }}
        </Show>
      </div>

      {/* Compass card */}
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
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-accent)"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10" />
            <polygon points="12,2 10,12 12,10 14,12" fill="var(--color-accent)" stroke="none" />
          </svg>
          <span style={{ 'font-size': '0.875rem', 'font-weight': '600' }}>Compass</span>
        </div>

        <Show when={iosPrompt()}>
          <button
            onClick={handleEnableCompass}
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
            Enable Compass
          </button>
        </Show>

        <Show when={!iosPrompt()}>
          <div
            style={{
              display: 'flex',
              'flex-direction': 'column',
              'align-items': 'center',
              gap: '12px',
            }}
          >
            <CompassNeedle />
            {/* Azimuth / Pitch / Roll values */}
            <div
              style={{
                display: 'grid',
                'grid-template-columns': 'repeat(3, 1fr)',
                gap: '12px',
                width: '100%',
                'text-align': 'center',
              }}
            >
              <div style={{ display: 'flex', 'flex-direction': 'column', gap: '2px' }}>
                <span
                  style={{
                    'font-size': '0.75rem',
                    'font-weight': '600',
                    'text-transform': 'uppercase',
                    'letter-spacing': '0.5px',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  Azimuth
                </span>
                <span
                  style={{
                    'font-size': '1.1rem',
                    'font-weight': '600',
                    'font-variant-numeric': 'tabular-nums',
                  }}
                >
                  {gpsHeading() !== null ? formatBearing(gpsHeading()!, angleUnit()) : '--'}
                </span>
              </div>
              <div style={{ display: 'flex', 'flex-direction': 'column', gap: '2px' }}>
                <span
                  style={{
                    'font-size': '0.75rem',
                    'font-weight': '600',
                    'text-transform': 'uppercase',
                    'letter-spacing': '0.5px',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  Pitch
                </span>
                <span
                  style={{
                    'font-size': '1.1rem',
                    'font-weight': '600',
                    'font-variant-numeric': 'tabular-nums',
                  }}
                >
                  {gpsPitch() !== null ? `${gpsPitch()!.toFixed(1)}°` : '--'}
                </span>
              </div>
              <div style={{ display: 'flex', 'flex-direction': 'column', gap: '2px' }}>
                <span
                  style={{
                    'font-size': '0.75rem',
                    'font-weight': '600',
                    'text-transform': 'uppercase',
                    'letter-spacing': '0.5px',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  Roll
                </span>
                <span
                  style={{
                    'font-size': '1.1rem',
                    'font-weight': '600',
                    'font-variant-numeric': 'tabular-nums',
                  }}
                >
                  {gpsRoll() !== null ? `${gpsRoll()!.toFixed(1)}°` : '--'}
                </span>
              </div>
            </div>
            <Show when={!orientationAbsolute()}>
              <p
                style={{
                  'font-size': '0.75rem',
                  color: 'var(--color-text-muted)',
                  'font-style': 'italic',
                  'text-align': 'center',
                  margin: '0',
                }}
              >
                Rotate device to calibrate compass
              </p>
            </Show>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default GpsPanel;
