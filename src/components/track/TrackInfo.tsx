import { Component, For, Show, createEffect, onCleanup } from 'solid-js';
import { useUI } from '../../context/UIContext';
import { usePrefs } from '../../context/PrefsContext';
import { haversineDistance } from '../../utils/geo';
import type { TrackNode } from '../../types';

function formatDistance(meters: number, unit: string): string {
  if (unit === 'imperial') {
    const miles = meters / 1609.344;
    return miles >= 0.1 ? `${miles.toFixed(2)} mi` : `${Math.round(meters * 3.281)} ft`;
  }
  if (unit === 'nautical') return `${(meters / 1852).toFixed(2)} nm`;
  return meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${Math.round(meters)} m`;
}

function calcPerimeter(nodes: TrackNode[], cyclical: boolean): number {
  if (nodes.length < 2) return 0;
  let d = 0;
  for (let i = 1; i < nodes.length; i++) {
    d += haversineDistance(nodes[i - 1].lat, nodes[i - 1].lng, nodes[i].lat, nodes[i].lng);
  }
  if (cyclical && nodes.length > 2) {
    d += haversineDistance(nodes[nodes.length - 1].lat, nodes[nodes.length - 1].lng, nodes[0].lat, nodes[0].lng);
  }
  return d;
}

// Shoelace formula on lat/lng (approximate area in m²)
function calcArea(nodes: TrackNode[]): number {
  if (nodes.length < 3) return 0;
  const R = 6371000;
  let area = 0;
  const n = nodes.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const latI = nodes[i].lat * Math.PI / 180;
    const latJ = nodes[j].lat * Math.PI / 180;
    const lngI = nodes[i].lng * Math.PI / 180;
    const lngJ = nodes[j].lng * Math.PI / 180;
    area += (lngJ - lngI) * (2 + Math.sin(latI) + Math.sin(latJ));
  }
  return Math.abs(area) * R * R / 2;
}

function formatArea(m2: number, unit: string): string {
  if (unit === 'imperial') {
    const acres = m2 / 4046.856;
    return acres >= 0.5 ? `${acres.toFixed(2)} ac` : `${Math.round(m2 * 10.764)} ft²`;
  }
  if (unit === 'nautical') {
    return `${(m2 / 1852 / 1852).toFixed(4)} nmi²`;
  }
  return m2 >= 1e6 ? `${(m2 / 1e6).toFixed(3)} km²` : `${Math.round(m2)} m²`;
}

const TrackInfo: Component = () => {
  const { viewingTrack, setViewingTrack, setEditingTrack } = useUI();

  createEffect(() => {
    if (!viewingTrack()) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setViewingTrack(null); }
    window.addEventListener('keydown', onKey);
    onCleanup(() => window.removeEventListener('keydown', onKey));
  });
  const [prefs] = usePrefs();

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
          bottom: 0, left: 0, right: 0,
          'border-radius': 'var(--radius-xl) var(--radius-xl) 0 0',
          'max-height': '80vh',
          overflow: 'auto',
        }}
      >
        <div style={{ padding: '20px', display: 'flex', 'flex-direction': 'column', gap: '12px' }}>
          <div style={{ display: 'flex', 'align-items': 'center', 'justify-content': 'space-between' }}>
            <h2 style={{ 'font-size': '1rem', 'font-weight': '700' }}>{viewingTrack()?.name}</h2>
            <button aria-label="Close" onClick={() => setViewingTrack(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: '4px' }}>✕</button>
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
                    <span>Distance: {formatDistance(calcPerimeter(t().nodes, t().isCyclical), prefs.lengthUnit)}</span>
                    <Show when={t().isCyclical && t().nodes.length >= 3}>
                      <span style={{ 'margin-left': '12px' }}>
                        Area: {formatArea(calcArea(t().nodes), prefs.lengthUnit)}
                      </span>
                    </Show>
                  </>
                )}
              </Show>
            </div>
          </div>

          {/* Named checkpoints */}
          <Show when={(viewingTrack()?.nodes ?? []).some(n => n.name)}>
            <div style={{ display: 'flex', 'flex-direction': 'column', gap: '4px' }}>
              <span style={{ 'font-size': '0.75rem', color: 'var(--color-text-secondary)' }}>Checkpoints</span>
              <For each={(viewingTrack()?.nodes ?? []).filter(n => n.name)}>
                {(node) => (
                  <div style={{ 'font-size': '0.875rem', padding: '4px 8px', background: 'var(--color-bg-tertiary)', 'border-radius': 'var(--radius-sm)' }}>
                    {node.name}
                  </div>
                )}
              </For>
            </div>
          </Show>

          {viewingTrack()?.group && (
            <div style={{ 'font-size': '0.75rem', color: 'var(--color-text-secondary)' }}>Group: {viewingTrack()?.group}</div>
          )}
          {viewingTrack()?.description && (
            <div style={{ 'font-size': '0.875rem' }}>{viewingTrack()?.description}</div>
          )}

          <div style={{ display: 'flex', gap: '8px', 'margin-top': '4px' }}>
            <button onClick={openEdit} style={{ flex: 1, padding: '9px', background: 'var(--color-accent)', border: 'none', 'border-radius': 'var(--radius-md)', cursor: 'pointer', color: 'oklch(0.1 0 0)', 'font-family': 'inherit', 'font-size': '0.875rem', 'font-weight': '600' }}>
              Edit
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default TrackInfo;
