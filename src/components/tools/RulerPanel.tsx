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
        padding: '16px',
        display: 'flex',
        'flex-direction': 'column',
        gap: '12px',
        height: '100%',
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
          <span class="material-symbols-outlined" style={{ 'font-size': '2rem' }}>
            straighten
          </span>
          <span style={{ 'font-size': '0.875rem' }}>No points yet</span>
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
                    background: 'var(--color-bg-secondary)',
                    'border-radius': 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      'border-radius': '50%',
                      background: 'var(--color-accent)',
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'center',
                      'font-size': '0.625rem',
                      color: 'oklch(0.1 0 0)',
                      'font-weight': '700',
                      'flex-shrink': '0',
                    }}
                  >
                    {i() + 1}
                  </div>
                  <div style={{ flex: 1, 'min-width': '0' }}>
                    <div
                      style={{
                        'font-size': '0.875rem',
                        overflow: 'hidden',
                        'text-overflow': 'ellipsis',
                        'white-space': 'nowrap',
                      }}
                    >
                      {point.name || `Point ${i() + 1}`}
                    </div>
                    <div
                      style={{
                        'font-size': '0.625rem',
                        color: 'var(--color-text-muted)',
                        'font-variant-numeric': 'tabular-nums',
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
                    <span
                      class="material-symbols-outlined"
                      style={{ 'font-size': '14px', 'flex-shrink': '0' }}
                    >
                      arrow_downward
                    </span>
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
          <span style={{ 'font-size': '0.75rem', color: 'var(--color-text-muted)' }}>
            Total distance
          </span>
          <span
            style={{
              'font-size': '0.875rem',
              'font-weight': '600',
              'font-variant-numeric': 'tabular-nums',
            }}
          >
            {formatDistance(totalDistance(), prefs.lengthUnit)}
          </span>
        </div>
      </Show>
    </div>
  );
};

export default RulerPanel;
