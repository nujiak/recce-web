import { Component, Show, createSignal, type JSX } from 'solid-js';
import { useUI } from '../../context/UIContext';
import { usePrefs } from '../../context/PrefsContext';
import { CoordinateTransformer } from '../../coords/index';
import { showToast } from '../ui/Toast';
import Button from '../ui/Button';
import TextField from '../ui/TextField';
import Popover_ from '../ui/Popover';
import type { TrackNode } from '../../types';

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
  const { setEditingPin } = useUI();
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
    const [lng, lat] = props.center;
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
    window.dispatchEvent(
      new CustomEvent('mapFlyTo', { detail: { lat: parsed.lat, lng: parsed.lng } })
    );
  }

  const toolbarBtnStyle = (bg: string): JSX.CSSProperties => ({
    display: 'inline-flex',
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
  });

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
          <Button
            variant="primary"
            aria-label="Add pin at crosshair"
            onClick={handleAddPin}
            style={toolbarBtnStyle('var(--color-accent)')}
          >
            <span class="material-symbols-outlined" style={{ 'font-size': '18px' }}>
              add_location
            </span>
            Add Pin
          </Button>

          <Popover_
            open={showGoto()}
            onOpenChange={(open) => {
              if (!open) {
                setShowGoto(false);
              } else {
                const [lng, lat] = props.center;
                const coordStr =
                  CoordinateTransformer.toDisplay(lat, lng, prefs.coordinateSystem) ?? '';
                setGotoInput(coordStr);
                setShowGoto(true);
              }
            }}
            trigger={
              <span style={toolbarBtnStyle('var(--color-bg-secondary)')} role="button">
                <span class="material-symbols-outlined" style={{ 'font-size': '18px' }}>
                  near_me
                </span>
                Go To
              </span>
            }
            placement="top"
          >
            <div style={{ display: 'flex', gap: '8px', 'min-width': '280px' }}>
              <div style={{ flex: 1 }}>
                <TextField
                  value={gotoInput()}
                  onChange={(val) => {
                    setGotoInput(val);
                    setGotoError(false);
                  }}
                  placeholder={`${prefs.coordinateSystem} coordinate`}
                  class="goto-tf"
                />
              </div>
              <Button
                variant="primary"
                onClick={handleGotoSubmit}
                size="sm"
                style={{ 'align-self': 'center' }}
              >
                Go
              </Button>
              <Button
                variant="icon"
                onClick={() => setShowGoto(false)}
                size="sm"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <span class="material-symbols-outlined" style={{ 'font-size': '16px' }}>
                  close
                </span>
              </Button>
            </div>
          </Popover_>

          <Button
            variant="primary"
            aria-label="Start track plotting"
            onClick={props.onStartPlot}
            style={toolbarBtnStyle('var(--color-bg-secondary)')}
          >
            <span class="material-symbols-outlined" style={{ 'font-size': '18px' }}>
              route
            </span>
            Track
          </Button>
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
                  <Button
                    variant="primary"
                    aria-label="Add node"
                    onClick={props.onAddNode}
                    style={toolbarBtnStyle('var(--color-accent)')}
                  >
                    + Node
                  </Button>
                  <Button
                    variant="primary"
                    aria-label="Undo last node"
                    onClick={props.onUndo}
                    disabled={props.plotNodes.length === 0}
                    style={toolbarBtnStyle('var(--color-bg-tertiary)')}
                  >
                    <span class="material-symbols-outlined" style={{ 'font-size': '16px' }}>
                      undo
                    </span>
                  </Button>
                  <Button
                    variant="primary"
                    aria-label="Save track"
                    onClick={props.onSave}
                    disabled={props.plotNodes.length < 2}
                    style={toolbarBtnStyle('var(--color-accent)')}
                  >
                    <span class="material-symbols-outlined" style={{ 'font-size': '16px' }}>
                      save
                    </span>
                  </Button>
                  <Button
                    variant="danger"
                    aria-label="Cancel plotting"
                    onClick={handleCancel}
                    style={{ border: 'none' }}
                  >
                    <span class="material-symbols-outlined" style={{ 'font-size': '16px' }}>
                      close
                    </span>
                  </Button>
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
              <Button
                variant="danger"
                onClick={() => {
                  setConfirmingCancel(false);
                  props.onCancel();
                }}
                style={{ border: 'none' }}
              >
                Discard
              </Button>
              <Button
                variant="primary"
                onClick={() => setConfirmingCancel(false)}
                style={toolbarBtnStyle('var(--color-bg-tertiary)')}
              >
                Keep
              </Button>
            </Show>
          </div>
        </Show>
      </div>

      <style>{`
        .goto-tf .ui-tf-input {
          background: ${gotoError() ? 'rgba(255,0,0,0.1)' : 'var(--color-bg-tertiary)'};
          border-color: ${gotoError() ? 'var(--color-danger)' : 'var(--color-border)'};
        }
      `}</style>
    </>
  );
};

export default PlotControls;
