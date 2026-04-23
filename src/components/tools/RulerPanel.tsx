import { Component, For, Show } from 'solid-js';
import { rulerPoints, clearRuler } from '../../stores/ruler';
import { usePrefs } from '../../context/PrefsContext';
import {
  haversineDistance,
  calculateBearing,
  formatDistance,
  formatBearing,
} from '../../utils/geo';
import Button from '../ui/Button';
import Icon from '../ui/Icon';

const RulerPanel: Component = () => {
  const [prefs] = usePrefs();
  const points = rulerPoints;

  const totalDistance = () => {
    const pts = points();
    if (pts.length < 2) return 0;
    let total = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      total += haversineDistance(pts[i].lat, pts[i].lng, pts[i + 1].lat, pts[i + 1].lng);
    }
    return total;
  };

  return (
    <div
      style={{
        display: 'flex',
        'flex-direction': 'column',
        height: '100%',
        'box-sizing': 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Panel header */}
      <div
        class="panel-header"
        style={{
          'font-size': '11px',
          'letter-spacing': '0.10em',
          'text-transform': 'uppercase',
          color: 'var(--color-text-secondary)',
          padding: '6px 12px 6px 9px',
          'border-bottom': '1px solid var(--color-border)',
          background: 'var(--color-bg-secondary)',
          'flex-shrink': '0',
        }}
      >
        RULER
      </div>
      <div
        style={{
          padding: '16px',
          display: 'flex',
          'flex-direction': 'column',
          gap: '12px',
          flex: '1',
          'box-sizing': 'border-box',
          'overflow-y': 'auto',
        }}
      >
        {/* Clear All button — header-level, only when there are points */}
        <Show when={points().length > 0}>
          <div style={{ display: 'flex', 'justify-content': 'flex-end' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearRuler}
              style={{
                border: '1px solid var(--color-danger)',
                color: 'var(--color-danger)',
              }}
            >
              Clear All
            </Button>
          </div>
        </Show>

        {/* Empty state */}
        <Show when={points().length === 0}>
          <div
            style={{
              display: 'flex',
              'flex-direction': 'column',
              'align-items': 'center',
              'justify-content': 'center',
              flex: 1,
              color: 'var(--color-text-muted)',
              gap: '8px',
            }}
          >
            <Icon name="straighten" size={32} />
            <span style={{ 'font-size': '0.875rem', 'text-transform': 'uppercase' }}>
              No points yet
            </span>
            <span style={{ 'font-size': '0.75rem', 'text-align': 'center' }}>
              Long-press items in Saved and tap "Add to Ruler"
            </span>
          </div>
        </Show>

        {/* Points list */}
        <Show when={points().length > 0}>
          <div
            style={{
              flex: 1,
              'overflow-y': 'auto',
              'scrollbar-gutter': 'stable',
              display: 'flex',
              'flex-direction': 'column',
              gap: '4px',
            }}
          >
            <For each={points()}>
              {(point, i) => (
                <>
                  {/* Point row */}
                  <div
                    style={{
                      display: 'flex',
                      'align-items': 'center',
                      gap: '8px',
                      padding: '8px',
                      'min-height': '48px',
                      background: 'var(--color-bg-secondary)',
                      'border-radius': '0px',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        'border-radius': '0px',
                        background: 'var(--color-accent)',
                        display: 'flex',
                        'align-items': 'center',
                        'justify-content': 'center',
                        'font-size': '11px',
                        color: 'oklch(0.1 0 0)',

                        'flex-shrink': '0',
                      }}
                    >
                      {i() + 1}
                    </div>
                    <div style={{ flex: 1, 'min-width': '0' }}>
                      <div
                        style={{
                          'font-size': '14px',
                          'font-weight': '500',
                          'text-transform': 'uppercase',
                          overflow: 'hidden',
                          'text-overflow': 'ellipsis',
                          'white-space': 'nowrap',
                        }}
                      >
                        {point.name || `Point ${i() + 1}`}
                      </div>
                      <div
                        style={{
                          'font-size': '11px',
                          color: 'var(--color-text-muted)',
                          'font-variant-numeric': 'tabular-nums',
                          'margin-top': '2px',
                        }}
                      >
                        {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
                      </div>
                    </div>
                  </div>

                  {/* Leg row (between consecutive points) */}
                  <Show when={i() < points().length - 1}>
                    <div
                      style={{
                        display: 'flex',
                        'align-items': 'center',
                        gap: '8px',
                        padding: '4px 8px 4px 28px',
                        color: 'var(--color-text-muted)',
                        'font-size': '0.75rem',
                      }}
                    >
                      <Icon name="arrow_downward" size={14} />
                      <span>
                        {formatDistance(
                          haversineDistance(
                            point.lat,
                            point.lng,
                            points()[i() + 1].lat,
                            points()[i() + 1].lng
                          ),
                          prefs.lengthUnit
                        )}
                        {' · '}
                        {formatBearing(
                          calculateBearing(
                            point.lat,
                            point.lng,
                            points()[i() + 1].lat,
                            points()[i() + 1].lng
                          ),
                          prefs.angleUnit
                        )}
                      </span>
                    </div>
                  </Show>
                </>
              )}
            </For>
          </div>

          {/* Total */}
          <div
            style={{
              'border-top': '1px solid var(--color-border)',
              'padding-top': '12px',
              display: 'flex',
              'justify-content': 'space-between',
              'align-items': 'center',
            }}
          >
            <span
              style={{
                'font-size': '10px',
                'text-transform': 'uppercase',
                'letter-spacing': '0.08em',
                color: 'var(--color-text-muted)',
              }}
            >
              Total distance
            </span>
            <span
              style={{
                'font-size': '16px',
                'font-weight': '500',
                'font-variant-numeric': 'tabular-nums',
                'letter-spacing': '0.02em',
              }}
            >
              {formatDistance(totalDistance(), prefs.lengthUnit)}
            </span>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default RulerPanel;
