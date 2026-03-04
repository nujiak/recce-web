import { Component, Show, createSignal } from 'solid-js';
import { useUI } from '../../context/UIContext';
import { usePrefs } from '../../context/PrefsContext';
import { CoordinateTransformer } from '../../coords/index';
import { showToast } from '../Toast';
import type { TrackNode, PinColor, Pin } from '../../types';

interface PlotControlsProps {
  center: [number, number]; // [lng, lat]
  plotNodes: TrackNode[];
  onStartPlot: () => void;
  onAddNode: () => void;
  onUndo: () => void;
  onSave: () => void;
  onCancel: () => void;
  isPlotting: boolean;
}

const PlotControls: Component<PlotControlsProps> = (props) => {
  const { setEditingPin, bumpSavedVersion } = useUI();
  const [prefs] = usePrefs();
  const [showGoto, setShowGoto] = createSignal(false);
  const [gotoInput, setGotoInput] = createSignal('');
  const [gotoError, setGotoError] = createSignal(false);
  const [confirmingCancel, setConfirmingCancel] = createSignal(false);

  function handleCancel() {
    if (props.plotNodes.length >= 3) {
      setConfirmingCancel(true);
    } else {
      props.onCancel();
    }
  }

  let mapRef: maplibregl.Map | undefined;

  function handleAddPin() {
    const [lng, lat] = props.center;
    const coordStr = CoordinateTransformer.toDisplay(lat, lng, prefs.coordinateSystem) ?? '';
    setEditingPin({
      name: '',
      lat,
      lng,
      color: 'red',
      group: '',
      description: '',
      createdAt: Date.now(),
    } as Pin);
  }

  function handleGotoSubmit() {
    const raw = gotoInput().trim();
    if (!raw) return;
    const parsed = CoordinateTransformer.parse(raw, prefs.coordinateSystem);
    if (!parsed) {
      setGotoError(true);
      setTimeout(() => setGotoError(false), 1000);
      return;
    }
    setShowGoto(false);
    setGotoInput('');
    // Dispatch fly-to via window event (map instance is in parent)
    window.dispatchEvent(new CustomEvent('mapFlyTo', { detail: { lat: parsed.lat, lng: parsed.lng } }));
  }

  return (
    <>
      {/* Bottom toolbar */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '8px',
        'z-index': '10',
      }}>
        <Show when={!props.isPlotting}>
          <button
            aria-label="Add pin at crosshair"
            onClick={handleAddPin}
            style={btnStyle('var(--color-accent)')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Add Pin
          </button>
          <button
            aria-label="Go to coordinate"
            onClick={() => setShowGoto(v => !v)}
            style={btnStyle('var(--color-bg-secondary)')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
            Go To
          </button>
          <button
            aria-label="Start track plotting"
            onClick={props.onStartPlot}
            style={btnStyle('var(--color-bg-secondary)')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            Track
          </button>
        </Show>

        <Show when={props.isPlotting}>
          <div style={{ display: 'flex', gap: '6px', background: 'var(--color-bg-secondary)', 'border-radius': '8px', padding: '6px', border: '1px solid var(--color-border)', 'align-items': 'center' }}>
            <Show when={confirmingCancel()} fallback={
              <>
                <span style={{ 'font-size': '0.75rem', color: 'var(--color-text-secondary)', padding: '0 6px' }}>
                  {props.plotNodes.length} node{props.plotNodes.length !== 1 ? 's' : ''}
                </span>
                <button aria-label="Add node" onClick={props.onAddNode} style={btnStyle('var(--color-accent)')}>+ Node</button>
                <button aria-label="Undo last node" onClick={props.onUndo} disabled={props.plotNodes.length === 0} style={btnStyle('var(--color-bg-tertiary)')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
                  </svg>
                </button>
                <button aria-label="Save track" onClick={props.onSave} disabled={props.plotNodes.length < 2} style={btnStyle('var(--color-accent)')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                  </svg>
                </button>
                <button aria-label="Cancel plotting" onClick={handleCancel} style={{ ...btnStyle('var(--color-danger)'), border: 'none', color: '#fff' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </>
            }>
              <span style={{ 'font-size': '0.75rem', color: 'var(--color-text-secondary)', padding: '0 4px' }}>Discard track?</span>
              <button onClick={() => { setConfirmingCancel(false); props.onCancel(); }} style={{ ...btnStyle('var(--color-danger)'), border: 'none', color: '#fff' }}>Discard</button>
              <button onClick={() => setConfirmingCancel(false)} style={btnStyle('var(--color-bg-tertiary)')}>Keep</button>
            </Show>
          </div>
        </Show>
      </div>

      {/* Go To dialog */}
      <Show when={showGoto()}>
        <div style={{ position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)', 'z-index': '10', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', 'border-radius': 'var(--radius-md)', padding: '12px', display: 'flex', gap: '8px', 'min-width': '280px' }}>
          <input
            aria-label="Goto coordinate input"
            placeholder={`${prefs.coordinateSystem} coordinate`}
            value={gotoInput()}
            onInput={e => { setGotoInput(e.currentTarget.value); setGotoError(false); }}
            onKeyDown={e => { if (e.key === 'Enter') handleGotoSubmit(); if (e.key === 'Escape') setShowGoto(false); }}
            style={{ flex: 1, background: gotoError() ? 'rgba(255,0,0,0.1)' : 'var(--color-bg-tertiary)', border: `1px solid ${gotoError() ? 'var(--color-danger)' : 'var(--color-border)'}`, 'border-radius': 'var(--radius-sm)', padding: '6px 10px', color: 'var(--color-text)', 'font-family': 'inherit', 'font-size': '0.875rem' }}
          />
          <button onClick={handleGotoSubmit} style={btnStyle('var(--color-accent)')}>Go</button>
          <button onClick={() => setShowGoto(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: '4px' }}>✕</button>
        </div>
      </Show>
    </>
  );
};

function btnStyle(bg: string) {
  return {
    display: 'flex',
    'align-items': 'center',
    gap: '4px',
    padding: '7px 12px',
    background: bg,
    border: '1px solid var(--color-border)',
    'border-radius': 'var(--radius-md)',
    cursor: 'pointer',
    color: bg === 'var(--color-accent)' ? 'oklch(0.1 0 0)' : 'var(--color-text)',
    'font-size': '0.8rem',
    'font-family': 'inherit',
    'font-weight': '500',
    'box-shadow': '0 2px 4px rgba(0,0,0,0.25)',
    'white-space': 'nowrap',
  } as const;
}

export default PlotControls;
