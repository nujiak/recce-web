import { Component, createSignal, onMount, Show } from 'solid-js';
import { gpsPosition, gpsHeading, gpsPitch, gpsRoll, orientationAbsolute } from '../../stores/gps';
import { requestCompassPermission } from '../GpsTracker';
import { usePrefs } from '../../context/PrefsContext';
import { formatDistance, formatBearing } from '../../utils/geo';
import { CoordinateTransformer, SYSTEM_NAMES } from '../../coords/index';
import { copyToClipboard } from '../../utils/clipboard';
import CompassNeedle from './CompassNeedle';

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
          <span
            class="material-symbols-outlined"
            style={{ 'font-size': '16px', color: 'var(--color-accent)' }}
          >
            my_location
          </span>
          <span style={{ 'font-size': '0.875rem', 'font-weight': '600' }}>Location</span>
        </div>

        <Show when={!gpsPosition()}>
          <div style={{ 'font-size': '0.75rem', color: 'var(--color-text-secondary)' }}>
            Acquiring GPS fix…
          </div>
        </Show>

        <Show when={gpsPosition()}>
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
                  <div
                    role="button"
                    aria-label="Copy coordinates"
                    onClick={() => copyToClipboard(coordStr())}
                    style={{
                      'font-size': '0.875rem',
                      'font-variant-numeric': 'tabular-nums',
                      cursor: 'pointer',
                    }}
                  >
                    {coordStr()}
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
                        ? formatDistance(coords().altitude!, prefs.lengthUnit)
                        : '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ 'font-size': '0.75rem', color: 'var(--color-text-muted)' }}>
                      Accuracy
                    </div>
                    <div style={{ 'font-size': '0.875rem' }}>
                      ±{formatDistance(coords().accuracy, prefs.lengthUnit)}
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
          <span
            class="material-symbols-outlined"
            style={{ 'font-size': '16px', color: 'var(--color-accent)' }}
          >
            explore
          </span>
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
                  {gpsHeading() !== null ? formatBearing(gpsHeading()!, prefs.angleUnit) : '--'}
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
