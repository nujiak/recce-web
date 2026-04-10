import { Component, For, Show } from 'solid-js';
import { useUI } from '../../context/UIContext';
import { usePrefs } from '../../context/PrefsContext';
import { calculateTotalDistance, calculateArea, formatDistance, formatArea } from '../../utils/geo';
import Dialog from '../ui/Dialog';
import Button from '../ui/Button';

const TrackInfo: Component = () => {
  const { viewingTrack, setViewingTrack, setEditingTrack, setActiveNav } = useUI();
  const [prefs] = usePrefs();

  function goTo() {
    const t = viewingTrack();
    if (!t || t.nodes.length === 0) return;
    setViewingTrack(null);
    setActiveNav('map');
    if (t.nodes.length === 1) {
      window.dispatchEvent(
        new CustomEvent('mapFlyTo', { detail: { lat: t.nodes[0].lat, lng: t.nodes[0].lng } })
      );
    } else {
      const lats = t.nodes.map((n) => n.lat);
      const lngs = t.nodes.map((n) => n.lng);
      const bounds: [[number, number], [number, number]] = [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ];
      window.dispatchEvent(new CustomEvent('mapFitBounds', { detail: { bounds } }));
    }
  }

  function openEdit() {
    const t = viewingTrack();
    setViewingTrack(null);
    setEditingTrack(t);
  }

  return (
    <Dialog
      open={!!viewingTrack()}
      onOpenChange={(open) => !open && setViewingTrack(null)}
      title={viewingTrack()?.name ?? ''}
    >
      <Show when={viewingTrack()}>
        {(t) => (
          <div
            style={{
              display: 'flex',
              'flex-direction': 'column',
              gap: '12px',
              'margin-top': '0.75rem',
            }}
          >
            <div style={{ display: 'flex', 'flex-direction': 'column', gap: '6px' }}>
              <div
                style={{
                  'font-size': '11px',
                  color: 'var(--color-text-secondary)',
                  'text-transform': 'uppercase',
                  'letter-spacing': '0.04em',
                }}
              >
                {t().isCyclical ? 'Area' : 'Path'}
              </div>
              <div class="readout-grid">
                <span class="readout-label">Distance</span>
                <span class="readout-sep">:</span>
                <span class="readout-value">
                  {formatDistance(
                    calculateTotalDistance(t().nodes, t().isCyclical),
                    prefs.lengthUnit
                  )}
                </span>
                <Show when={t().isCyclical && t().nodes.length >= 3}>
                  <span class="readout-label">Area</span>
                  <span class="readout-sep">:</span>
                  <span class="readout-value">
                    {formatArea(calculateArea(t().nodes), prefs.lengthUnit)}
                  </span>
                </Show>
              </div>
            </div>

            <Show when={t().nodes.some((n) => n.name)}>
              <div style={{ display: 'flex', 'flex-direction': 'column', gap: '4px' }}>
                <span
                  style={{
                    'font-size': '11px',
                    color: 'var(--color-text-secondary)',
                    'text-transform': 'uppercase',
                    'letter-spacing': '0.04em',
                  }}
                >
                  Checkpoints
                </span>
                <For each={t().nodes.filter((n) => n.name)}>
                  {(node) => (
                    <div
                      style={{
                        'font-size': '0.875rem',
                        padding: '4px 8px',
                        background: 'var(--color-bg-tertiary)',
                        'border-radius': '0px',
                      }}
                    >
                      {node.name}
                    </div>
                  )}
                </For>
              </div>
            </Show>

            <Show when={t().group}>
              <div
                style={{
                  'font-size': '11px',
                  color: 'var(--color-text-secondary)',
                  'text-transform': 'uppercase',
                  'letter-spacing': '0.04em',
                }}
              >
                Group: {t().group}
              </div>
            </Show>
            <Show when={t().description}>
              <div style={{ 'font-size': '0.875rem' }}>{t().description}</div>
            </Show>

            <div style={{ display: 'flex', gap: '8px', 'margin-top': '4px' }}>
              <Button variant="ghost" onClick={goTo} style={{ flex: 1 }}>
                Go To
              </Button>
              <Button variant="primary" onClick={openEdit} style={{ flex: 1 }}>
                Edit
              </Button>
            </div>
          </div>
        )}
      </Show>
    </Dialog>
  );
};

export default TrackInfo;
