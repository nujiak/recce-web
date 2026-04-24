import { Component, createResource, createSignal, onMount, Show } from 'solid-js';
import { gpsPosition, gpsHeading, gpsPitch, gpsRoll, orientationAbsolute } from '../../stores/gps';
import { requestCompassPermission } from '../GpsTracker';
import { usePrefs } from '../../context/PrefsContext';
import { formatDistance, formatBearing } from '../../utils/geo';
import { CoordinateTransformer, SYSTEM_NAMES } from '../../coords/index';
import { copyToClipboard } from '../../utils/clipboard';
import CompassNeedle from './CompassNeedle';
import Button from '../ui/Button';

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

  const [coordStr] = createResource(
    () => {
      const pos = gpsPosition();
      if (!pos) return null;
      return [pos.latitude, pos.longitude, prefs.coordinateSystem] as const;
    },
    async (args) => {
      if (!args) return '';
      const [lat, lng, system] = args;
      return (await CoordinateTransformer.toDisplay(lat, lng, system)) ?? '';
    }
  );

  return (
    <div
      style={{
        padding: '16px',
        display: 'flex',
        'flex-direction': 'column',
        gap: '16px',
        'overflow-y': 'auto',
      }}
    >
      {/* Location card */}
      <div
        style={{
          background: 'var(--color-bg-secondary)',
          'border-radius': '0px',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}
      >
        <div
          class="panel-header"
          style={{
            'font-size': '11px',
            'letter-spacing': '0.10em',
            'text-transform': 'uppercase',
            color: 'var(--color-text-secondary)',
            padding: '6px 12px 6px 9px',
            'border-bottom': '1px solid var(--color-border)',
          }}
        >
          LOCATION
        </div>

        <div style={{ padding: '16px', display: 'flex', 'flex-direction': 'column', gap: '10px' }}>
          <Show when={!gpsPosition()}>
            <div
              style={{
                'font-size': '0.75rem',
                color: 'var(--color-text-secondary)',
                'text-transform': 'uppercase',
              }}
            >
              Acquiring GPS fix…
            </div>
          </Show>

          <Show when={gpsPosition()}>
            {(coords) => (
                <div style={{ display: 'flex', 'flex-direction': 'column', gap: '8px' }}>
                  {/* Coordinates */}
                  <div>
                    <div
                      style={{
                        'font-size': '10px',
                        'font-weight': '400',
                        color: 'var(--color-text-muted)',
                        'margin-bottom': '4px',
                        'text-transform': 'uppercase',
                        'letter-spacing': '0.08em',
                      }}
                    >
                      {SYSTEM_NAMES[prefs.coordinateSystem]}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Copy coordinates"
                      onClick={() => {
                        const text = coordStr();
                        if (text) copyToClipboard(text);
                      }}
                      style={{
                        'font-size': '15px',
                        'font-weight': '500',
                        'letter-spacing': '0.02em',
                        'font-variant-numeric': 'tabular-nums',
                        border: 'none',
                        'border-radius': '0',
                        padding: '0',
                        'justify-content': 'flex-start',
                        'min-height': 'unset',
                      }}
                    >
                      {coordStr()}
                    </Button>
                  </div>
                  {/* Altitude + Accuracy readout */}
                  <div class="readout-grid">
                    <span class="readout-label">Altitude</span>
                    <span class="readout-sep">:</span>
                    <span class="readout-value">
                      {coords().altitude !== null
                        ? formatDistance(coords().altitude!, prefs.lengthUnit)
                        : '—'}
                    </span>
                    <span class="readout-label">Accuracy</span>
                    <span class="readout-sep">:</span>
                    <span class="readout-value">
                      ±{formatDistance(coords().accuracy, prefs.lengthUnit)}
                    </span>
                  </div>
                </div>
            )}
          </Show>
        </div>
      </div>

      {/* Compass card */}
      <div
        style={{
          background: 'var(--color-bg-secondary)',
          'border-radius': '0px',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}
      >
        <div
          class="panel-header"
          style={{
            'font-size': '11px',
            'letter-spacing': '0.10em',
            'text-transform': 'uppercase',
            color: 'var(--color-text-secondary)',
            padding: '6px 12px 6px 9px',
            'border-bottom': '1px solid var(--color-border)',
          }}
        >
          COMPASS
        </div>

        <div style={{ padding: '16px', display: 'flex', 'flex-direction': 'column', gap: '12px' }}>
          <Show when={iosPrompt()}>
            <Button variant="primary" onClick={handleEnableCompass}>
              Enable Compass
            </Button>
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
                <div style={{ display: 'flex', 'flex-direction': 'column', gap: '4px' }}>
                  <span
                    style={{
                      'font-size': '10px',
                      'text-transform': 'uppercase',
                      'letter-spacing': '0.08em',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    Azimuth
                  </span>
                  <span
                    style={{
                      'font-size': '16px',
                      'font-weight': '500',
                      'font-variant-numeric': 'tabular-nums',
                      'letter-spacing': '0.02em',
                    }}
                  >
                    {gpsHeading() !== null ? formatBearing(gpsHeading()!, prefs.angleUnit) : '--'}
                  </span>
                </div>
                <div style={{ display: 'flex', 'flex-direction': 'column', gap: '4px' }}>
                  <span
                    style={{
                      'font-size': '10px',
                      'text-transform': 'uppercase',
                      'letter-spacing': '0.08em',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    Pitch
                  </span>
                  <span
                    style={{
                      'font-size': '16px',
                      'font-weight': '500',
                      'font-variant-numeric': 'tabular-nums',
                      'letter-spacing': '0.02em',
                    }}
                  >
                    {gpsPitch() !== null ? `${gpsPitch()!.toFixed(1)}°` : '--'}
                  </span>
                </div>
                <div style={{ display: 'flex', 'flex-direction': 'column', gap: '4px' }}>
                  <span
                    style={{
                      'font-size': '10px',
                      'text-transform': 'uppercase',
                      'letter-spacing': '0.08em',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    Roll
                  </span>
                  <span
                    style={{
                      'font-size': '16px',
                      'font-weight': '500',
                      'font-variant-numeric': 'tabular-nums',
                      'letter-spacing': '0.02em',
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
    </div>
  );
};

export default GpsPanel;
