import { Component, Show, createSignal, onMount } from 'solid-js';
import { useUI } from '../../context/UIContext';
import { usePrefs } from '../../context/PrefsContext';
import { CoordinateTransformer } from '../../coords/index';
import { showToast } from '../Toast';
import type { TrackNode, Pin } from '../../types';

interface PlotControlsProps {
  center: { lat: number; lng: number };
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

  function handleAddPin() {
    const { lat, lng } = props.center;
    setEditingPin({
      id: 0,
      name: '',
      lat,
      lng,
      color: 'red',
      group: '',
      description: '',
      createdAt: Date.now(),
    });
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
    window.dispatchEvent(
      new CustomEvent('mapFlyTo', { detail: { lat: parsed.lat, lng: parsed.lng } })
    );
  }

  return (
    <>
      {/* Bottom toolbar */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '8px',
          'z-index': '10',
        }}
      >
        <Show when={!props.isPlotting}>
          <button
            aria-label="Add pin at crosshair"
            onClick={handleAddPin}
            style={btnStyle('var(--color-accent)')}
          >
            <span class="material-symbols-outlined" style={{ 'font-size': '18px' }}>
              add_location
            </span>
            Add Pin
          </button>
          <button
            aria-label="Go to coordinate"
            onClick={() => {
              const { lat, lng } = props.center;
              const coordStr =
                CoordinateTransformer.toDisplay(lat, lng, prefs.coordinateSystem) ?? '';
              setGotoInput(coordStr);
              setShowGoto((v) => !v);
            }}
            style={btnStyle('var(--color-bg-secondary)')}
          >
            <span class="material-symbols-outlined" style={{ 'font-size': '18px' }}>
              near_me
            </span>
            Go To
          </button>
          <button
            aria-label="Start track plotting"
            onClick={props.onStartPlot}
            style={btnStyle('var(--color-bg-secondary)')}
          >
            <span class="material-symbols-outlined" style={{ 'font-size': '18px' }}>
              route
            </span>
            Track
          </button>
        </Show>

        <Show when={props.isPlotting}>
          <div
            style={{
              display: 'flex',
              gap: '6px',
              background: 'var(--color-bg-secondary)',
              'border-radius': '8px',
              padding: '6px',
              border: '1px solid var(--color-border)',
              'align-items': 'center',
            }}
          >
            <Show
              when={confirmingCancel()}
              fallback={
                <>
                  <span
                    style={{
                      'font-size': '0.75rem',
                      color: 'var(--color-text-secondary)',
                      padding: '0 6px',
                    }}
                  >
                    {props.plotNodes.length} node{props.plotNodes.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    aria-label="Add node"
                    onClick={props.onAddNode}
                    style={btnStyle('var(--color-accent)')}
                  >
                    + Node
                  </button>
                  <button
                    aria-label="Undo last node"
                    onClick={props.onUndo}
                    disabled={props.plotNodes.length === 0}
                    style={btnStyle('var(--color-bg-tertiary)')}
                  >
                    <span class="material-symbols-outlined" style={{ 'font-size': '16px' }}>
                      undo
                    </span>
                  </button>
                  <button
                    aria-label="Save track"
                    onClick={props.onSave}
                    disabled={props.plotNodes.length < 2}
                    style={btnStyle('var(--color-accent)')}
                  >
                    <span class="material-symbols-outlined" style={{ 'font-size': '16px' }}>
                      save
                    </span>
                  </button>
                  <button
                    aria-label="Cancel plotting"
                    onClick={handleCancel}
                    style={{ ...btnStyle('var(--color-danger)'), border: 'none', color: '#fff' }}
                  >
                    <span class="material-symbols-outlined" style={{ 'font-size': '16px' }}>
                      close
                    </span>
                  </button>
                </>
              }
            >
              <span
                style={{
                  'font-size': '0.75rem',
                  color: 'var(--color-text-secondary)',
                  padding: '0 4px',
                }}
              >
                Discard track?
              </span>
              <button
                onClick={() => {
                  setConfirmingCancel(false);
                  props.onCancel();
                }}
                style={{ ...btnStyle('var(--color-danger)'), border: 'none', color: '#fff' }}
              >
                Discard
              </button>
              <button
                onClick={() => setConfirmingCancel(false)}
                style={btnStyle('var(--color-bg-tertiary)')}
              >
                Keep
              </button>
            </Show>
          </div>
        </Show>
      </div>

      {/* Go To dialog */}
      <Show when={showGoto()}>
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            'z-index': '10',
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            'border-radius': 'var(--radius-md)',
            padding: '12px',
            display: 'flex',
            gap: '8px',
            'min-width': '280px',
          }}
        >
          <input
            aria-label="Goto coordinate input"
            placeholder={`${prefs.coordinateSystem} coordinate`}
            value={gotoInput()}
            ref={(el) => {
              onMount(() => {
                el.focus();
                el.select();
              });
            }}
            onInput={(e) => {
              setGotoInput(e.currentTarget.value);
              setGotoError(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleGotoSubmit();
              if (e.key === 'Escape') setShowGoto(false);
            }}
            style={{
              flex: 1,
              background: gotoError() ? 'rgba(255,0,0,0.1)' : 'var(--color-bg-tertiary)',
              border: `1px solid ${gotoError() ? 'var(--color-danger)' : 'var(--color-border)'}`,
              'border-radius': 'var(--radius-sm)',
              padding: '6px 10px',
              color: 'var(--color-text)',
              'font-family': 'inherit',
              'font-size': '0.875rem',
            }}
          />
          <button onClick={handleGotoSubmit} style={btnStyle('var(--color-accent)')}>
            Go
          </button>
          <button
            onClick={() => setShowGoto(false)}
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
