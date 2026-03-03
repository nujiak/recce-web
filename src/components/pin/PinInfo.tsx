import { Component, For, Show, createEffect, onCleanup } from 'solid-js';
import { useUI } from '../../context/UIContext';
import { CoordinateTransformer, SYSTEMS } from '../../coords/index';
import { showToast } from '../Toast';
import type { CoordinateSystem } from '../../types';

const PinInfo: Component = () => {
  const { viewingPin, setViewingPin, setEditingPin } = useUI();

  createEffect(() => {
    if (!viewingPin()) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setViewingPin(null); }
    window.addEventListener('keydown', onKey);
    onCleanup(() => window.removeEventListener('keydown', onKey));
  });

  function openInMaps() {
    const p = viewingPin();
    if (!p) return;
    const url = `geo:${p.lat},${p.lng}?q=${p.lat},${p.lng}`;
    window.open(url, '_blank');
  }

  function openEdit() {
    const p = viewingPin();
    setViewingPin(null);
    setEditingPin(p);
  }

  return (
    <Show when={viewingPin()}>
      <div
        onClick={() => setViewingPin(null)}
        style={{ position: 'fixed', inset: 0, background: 'var(--color-overlay)', 'z-index': '40' }}
      />

      <div
        role="dialog"
        aria-label={`Pin: ${viewingPin()?.name}`}
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
            <h2 style={{ 'font-size': '1rem', 'font-weight': '700' }}>{viewingPin()?.name}</h2>
            <button aria-label="Close" onClick={() => setViewingPin(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: '4px' }}>✕</button>
          </div>

          {/* All coordinate systems */}
          <div style={{ display: 'flex', 'flex-direction': 'column', gap: '6px' }}>
            <For each={SYSTEMS}>
              {(sys: CoordinateSystem) => {
                const p = viewingPin();
                if (!p) return null;
                const display = CoordinateTransformer.toDisplay(p.lat, p.lng, sys);
                if (!display) return null;
                return (
                  <button
                    aria-label={`Copy ${sys} coordinate`}
                    onClick={() => {
                      navigator.clipboard.writeText(display).catch(() => {});
                      showToast(`Copied ${sys}`, 'success');
                    }}
                    style={{ display: 'flex', 'flex-direction': 'column', 'align-items': 'flex-start', padding: '8px 10px', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', 'border-radius': 'var(--radius-sm)', cursor: 'pointer', gap: '2px', width: '100%' }}
                  >
                    <span style={{ 'font-size': '0.625rem', color: 'var(--color-text-muted)' }}>{sys}</span>
                    <span style={{ 'font-size': '0.8rem', color: 'var(--color-text)' }}>{display}</span>
                  </button>
                );
              }}
            </For>
          </div>

          {viewingPin()?.group && (
            <div style={{ 'font-size': '0.75rem', color: 'var(--color-text-secondary)' }}>Group: {viewingPin()?.group}</div>
          )}
          {viewingPin()?.description && (
            <div style={{ 'font-size': '0.875rem' }}>{viewingPin()?.description}</div>
          )}

          <div style={{ display: 'flex', gap: '8px', 'margin-top': '4px' }}>
            <button onClick={openInMaps} style={{ flex: 1, padding: '9px', background: 'none', border: '1px solid var(--color-border)', 'border-radius': 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-text)', 'font-family': 'inherit', 'font-size': '0.875rem' }}>
              Open in Maps
            </button>
            <button onClick={openEdit} style={{ flex: 1, padding: '9px', background: 'var(--color-accent)', border: 'none', 'border-radius': 'var(--radius-md)', cursor: 'pointer', color: 'oklch(0.1 0 0)', 'font-family': 'inherit', 'font-size': '0.875rem', 'font-weight': '600' }}>
              Edit
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default PinInfo;
