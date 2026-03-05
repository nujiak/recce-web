import { Component, For, Show, createEffect, onCleanup } from 'solid-js';
import { useUI } from '../../context/UIContext';
import { usePrefs } from '../../context/PrefsContext';
import { calculateTotalDistance, calculateArea, formatDistance, formatArea } from '../../utils/geo';

const TrackInfo: Component = () => {
  const { viewingTrack, setViewingTrack, setEditingTrack, setActiveNav } = useUI();

  createEffect(() => {
    if (!viewingTrack()) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setViewingTrack(null);
    }
    window.addEventListener('keydown', onKey);
    onCleanup(() => window.removeEventListener('keydown', onKey));
  });
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
    <Show when={viewingTrack()}>
      <div
        onClick={() => setViewingTrack(null)}
        style={{ position: 'fixed', inset: 0, background: 'var(--color-overlay)', 'z-index': '40' }}
      />

      <div
        role="dialog"
        aria-label={`Track: ${viewingTrack()?.name}`}
        style={{
          position: 'fixed',
          'z-index': '50',
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          bottom: 0,
          left: 0,
          right: 0,
          'border-radius': 'var(--radius-xl) var(--radius-xl) 0 0',
          'max-height': '80vh',
          overflow: 'auto',
        }}
      >
        <div style={{ padding: '20px', display: 'flex', 'flex-direction': 'column', gap: '12px' }}>
          <div
            style={{ display: 'flex', 'align-items': 'center', 'justify-content': 'space-between' }}
          >
            <h2 style={{ 'font-size': '1rem', 'font-weight': '700' }}>{viewingTrack()?.name}</h2>
            <button
              aria-label="Close"
              onClick={() => setViewingTrack(null)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
                padding: '4px',
              }}
            >
              ✕
            </button>
          </div>

          {/* Type + measurements */}
          <div style={{ display: 'flex', 'flex-direction': 'column', gap: '6px' }}>
            <div style={{ 'font-size': '0.75rem', color: 'var(--color-text-secondary)' }}>
              {viewingTrack()?.isCyclical ? 'Area' : 'Path'}
            </div>
            <div style={{ 'font-size': '0.875rem' }}>
              <Show when={viewingTrack()}>
                {(t) => (
                  <>
                    <span>
                      Distance:{' '}
                      {formatDistance(
                        calculateTotalDistance(t().nodes, t().isCyclical),
                        prefs.lengthUnit
                      )}
                    </span>
                    <Show when={t().isCyclical && t().nodes.length >= 3}>
                      <span style={{ 'margin-left': '12px' }}>
                        Area: {formatArea(calculateArea(t().nodes), prefs.lengthUnit)}
                      </span>
                    </Show>
                  </>
                )}
              </Show>
            </div>
          </div>

          {/* Named checkpoints */}
          <Show when={(viewingTrack()?.nodes ?? []).some((n) => n.name)}>
            <div style={{ display: 'flex', 'flex-direction': 'column', gap: '4px' }}>
              <span style={{ 'font-size': '0.75rem', color: 'var(--color-text-secondary)' }}>
                Checkpoints
              </span>
              <For each={(viewingTrack()?.nodes ?? []).filter((n) => n.name)}>
                {(node) => (
                  <div
                    style={{
                      'font-size': '0.875rem',
                      padding: '4px 8px',
                      background: 'var(--color-bg-tertiary)',
                      'border-radius': 'var(--radius-sm)',
                    }}
                  >
                    {node.name}
                  </div>
                )}
              </For>
            </div>
          </Show>

          {viewingTrack()?.group && (
            <div style={{ 'font-size': '0.75rem', color: 'var(--color-text-secondary)' }}>
              Group: {viewingTrack()?.group}
            </div>
          )}
          {viewingTrack()?.description && (
            <div style={{ 'font-size': '0.875rem' }}>{viewingTrack()?.description}</div>
          )}

          <div style={{ display: 'flex', gap: '8px', 'margin-top': '4px' }}>
            <button
              onClick={goTo}
              style={{
                flex: 1,
                padding: '9px',
                background: 'none',
                border: '1px solid var(--color-border)',
                'border-radius': 'var(--radius-md)',
                cursor: 'pointer',
                color: 'var(--color-text)',
                'font-family': 'inherit',
                'font-size': '0.875rem',
              }}
            >
              Go To
            </button>
            <button
              onClick={openEdit}
              style={{
                flex: 1,
                padding: '9px',
                background: 'var(--color-accent)',
                border: 'none',
                'border-radius': 'var(--radius-md)',
                cursor: 'pointer',
                color: 'oklch(0.1 0 0)',
                'font-family': 'inherit',
                'font-size': '0.875rem',
                'font-weight': '600',
              }}
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default TrackInfo;
