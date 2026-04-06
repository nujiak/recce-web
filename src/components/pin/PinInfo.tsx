import { Component, For, Show } from 'solid-js';
import { useUI } from '../../context/UIContext';
import { CoordinateTransformer, SYSTEMS, SYSTEM_NAMES } from '../../coords/index';
import { showToast } from '../ui/Toast';
import { copyToClipboard } from '../../utils/clipboard';
import Dialog from '../ui/Dialog';
import Button from '../ui/Button';
import type { CoordinateSystem } from '../../types';

const PinInfo: Component = () => {
  const { viewingPin, setViewingPin, setEditingPin, setActiveNav } = useUI();

  function openInMaps() {
    const p = viewingPin();
    if (!p) return;
    const url = `geo:${p.lat},${p.lng}?q=${p.lat},${p.lng}`;
    window.open(url, '_blank');
  }

  function goTo() {
    const p = viewingPin();
    if (!p) return;
    setViewingPin(null);
    setActiveNav('map');
    const bearing = p.markerType === 'arrow' ? p.bearing : undefined;
    window.dispatchEvent(
      new CustomEvent('mapFlyTo', { detail: { lat: p.lat, lng: p.lng, bearing } })
    );
  }

  function openEdit() {
    const p = viewingPin();
    setViewingPin(null);
    setEditingPin(p);
  }

  return (
    <Dialog
      open={!!viewingPin()}
      onOpenChange={(open) => {
        if (!open) setViewingPin(null);
      }}
      title={viewingPin()?.name ?? ''}
    >
      <div style={{ display: 'flex', 'flex-direction': 'column', gap: '12px' }}>
        <div style={{ display: 'flex', 'flex-direction': 'column', gap: '6px' }}>
          <For each={SYSTEMS}>
            {(sys: CoordinateSystem) => {
              const p = viewingPin();
              if (!p) return null;
              const display = CoordinateTransformer.toDisplay(p.lat, p.lng, sys);
              if (!display) return null;
              return (
                <div
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'space-between',
                    gap: '8px',
                    padding: '8px 10px',
                    background: 'var(--color-bg-tertiary)',
                    border: '1px solid var(--color-border)',
                    'border-radius': 'var(--radius-sm)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      'flex-direction': 'column',
                      gap: '2px',
                      'min-width': '0',
                      flex: 1,
                    }}
                  >
                    <span style={{ 'font-size': '0.625rem', color: 'var(--color-text-muted)' }}>
                      {SYSTEM_NAMES[sys]}
                    </span>
                    <span
                      style={{
                        'font-size': '0.8rem',
                        color: 'var(--color-text)',
                        'word-break': 'break-all',
                      }}
                    >
                      {display}
                    </span>
                  </div>
                  <Button
                    variant="icon"
                    size="sm"
                    aria-label={`Copy ${SYSTEM_NAMES[sys]} coordinate`}
                    onClick={() => {
                      copyToClipboard(display);
                      showToast(`Copied ${SYSTEM_NAMES[sys]}`, 'success');
                    }}
                    style={{ flex: 'none' }}
                  >
                    <span class="material-symbols-outlined" style={{ 'font-size': '16px' }}>
                      content_copy
                    </span>
                  </Button>
                </div>
              );
            }}
          </For>
        </div>

        <Show when={viewingPin()?.group}>
          <div style={{ 'font-size': '0.75rem', color: 'var(--color-text-secondary)' }}>
            Group: {viewingPin()?.group}
          </div>
        </Show>
        <Show when={viewingPin()?.description}>
          <div style={{ 'font-size': '0.875rem' }}>{viewingPin()?.description}</div>
        </Show>

        <div style={{ display: 'flex', gap: '8px', 'margin-top': '4px' }}>
          <Button variant="ghost" onClick={openInMaps} style={{ flex: 1 }}>
            Open in Maps
          </Button>
          <Button variant="ghost" onClick={goTo} style={{ flex: 1 }}>
            Go To
          </Button>
          <Button variant="primary" onClick={openEdit} style={{ flex: 1 }}>
            Edit
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default PinInfo;
