import { Component, Show, createSignal } from 'solid-js';
import { useUI } from '../../context/UIContext';
import { usePrefs } from '../../context/PrefsContext';
import { CoordinateTransformer, SYSTEM_NAMES } from '../../coords/index';
import { showToast } from '../ui/Toast';
import Button from '../ui/Button';
import TextField from '../ui/TextField';
import Popover_ from '../ui/Popover';
import Needle from '../ui/Needle';
import { copyToClipboard } from '../../utils/clipboard';
import { gpsPosition } from '../../stores/gps';
import {
  haversineDistance,
  calculateBearing,
  formatDistance,
  formatBearing,
  parseBearing,
} from '../../utils/geo';
import type { LocationMode, TrackNode } from '../../types';

interface PlotControlsProps {
  center: [number, number]; // [lng, lat]
  plotNodes: TrackNode[];
  onStartPlot: () => void;
  onAddNode: () => void;
  onUndo: () => void;
  onSave: () => void;
  onCancel: () => void;
  isPlotting: boolean;
  locationMode: LocationMode;
  onLocate: () => void;
  bearing: number;
  onResetNorth: () => void;
  onRotateTo: (degrees: number) => void;
  isSatellite: boolean;
  onToggleMapStyle: () => void;
}

// Ghost button base styles as inline style object
const ghostBase = {
  background: 'transparent',
  color: 'var(--color-text)',
  border: 'none',
  'min-height': '48px',
  'min-width': '48px',
  'font-size': '13px',
  'font-weight': '400',
  'letter-spacing': '0.08em',
  'text-transform': 'uppercase' as const,
  'border-radius': '0px',
  cursor: 'pointer',
  transition: 'background 75ms linear, color 75ms linear',
  display: 'inline-flex',
  'align-items': 'center',
  'justify-content': 'center',
  gap: '4px',
  padding: '0 12px',
  'font-family': 'inherit',
};

const PlotControls: Component<PlotControlsProps> = (props) => {
  const { setEditingPin } = useUI();
  const [prefs] = usePrefs();
  const [showGoto, setShowGoto] = createSignal(false);
  const [gotoInput, setGotoInput] = createSignal('');
  const [gotoError, setGotoError] = createSignal(false);
  const [confirmingCancel, setConfirmingCancel] = createSignal(false);

  // Compass popover state
  const [showCompass, setShowCompass] = createSignal(false);
  const [compassInput, setCompassInput] = createSignal('');
  const [compassError, setCompassError] = createSignal(false);

  const coordDisplay = () => {
    const [lng, lat] = props.center;
    return CoordinateTransformer.toDisplay(lat, lng, prefs.coordinateSystem) ?? '';
  };

  const gpsOverlay = () => {
    const pos = gpsPosition();
    if (!pos) return null;
    if (props.locationMode === 'following' || props.locationMode === 'following-bearing')
      return null;
    const [lng, lat] = props.center;
    const dist = haversineDistance(pos.latitude, pos.longitude, lat, lng);
    const bearing = calculateBearing(pos.latitude, pos.longitude, lat, lng);
    return {
      distance: formatDistance(dist, prefs.lengthUnit),
      bearing: formatBearing(bearing, prefs.angleUnit),
      rawDistance: dist,
    };
  };

  const normalizedBearing = () => ((props.bearing % 360) + 360) % 360;
  const bearingLabel = () => {
    const b = normalizedBearing();
    if (b < 0.05) return 'NORTH';
    return formatBearing(b, prefs.angleUnit);
  };

  function copyCoord() {
    const text = coordDisplay();
    if (!text) return;
    copyToClipboard(text);
    showToast('Coordinates copied', 'success');
  }

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
      markerType: 'pin',
      bearing: 0,
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

  function handleCompassOpenChange(open: boolean) {
    if (open && normalizedBearing() >= 0.05) {
      // Bearing is non-zero: reset north immediately instead of opening popover
      props.onResetNorth();
      return;
    }
    if (open) {
      setCompassInput('');
      setCompassError(false);
    }
    setShowCompass(open);
  }

  function handleCompassSubmit(e?: Event) {
    e?.preventDefault();
    const deg = parseBearing(compassInput(), prefs.angleUnit);
    if (deg === null) {
      setCompassError(true);
      return;
    }
    props.onRotateTo(deg);
    setShowCompass(false);
  }

  const isFollowing = () =>
    props.locationMode === 'following' || props.locationMode === 'following-bearing';

  return (
    <>
      {/* GPS distance/bearing panel — top-centre, visible only when relevant */}
      <Show when={gpsOverlay()}>
        {(overlay) => (
          <Show when={overlay().rawDistance >= 0.1}>
            <div
              style={{
                position: 'absolute',
                top: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
                'z-index': '10',
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                padding: '6px 14px',
                display: 'flex',
                gap: '12px',
                'align-items': 'center',
                'white-space': 'nowrap',
                'pointer-events': 'none',
              }}
            >
              <span
                style={{
                  'font-size': '10px',
                  color: 'var(--color-text-muted)',
                  'letter-spacing': '0.08em',
                  'text-transform': 'uppercase',
                }}
              >
                DIST
              </span>
              <span
                style={{
                  'font-size': '13px',
                  'font-weight': '500',
                  color: 'var(--color-text)',
                  'letter-spacing': '0.04em',
                  display: 'inline-block',
                  'min-width': '8ch',
                  'text-align': 'right',
                }}
              >
                {overlay().distance}
              </span>
              <span
                style={{
                  'font-size': '10px',
                  color: 'var(--color-border)',
                  'letter-spacing': '0.08em',
                }}
              >
                ·
              </span>
              <span
                style={{
                  'font-size': '10px',
                  color: 'var(--color-text-muted)',
                  'letter-spacing': '0.08em',
                  'text-transform': 'uppercase',
                }}
              >
                BRG
              </span>
              <span
                style={{
                  'font-size': '13px',
                  'font-weight': '500',
                  color: 'var(--color-text)',
                  'letter-spacing': '0.04em',
                  display: 'inline-block',
                  'min-width': '7ch',
                  'text-align': 'right',
                }}
              >
                {overlay().bearing}
              </span>
            </div>
          </Show>
        )}
      </Show>

      {/* Two-row instrument bar anchored to map bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          right: '16px',
          'z-index': '10',
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Plot row — only visible when plotting */}
        <Show when={props.isPlotting}>
          <div
            style={{
              display: 'flex',
              'align-items': 'stretch',
              'border-bottom': '1px solid var(--color-border)',
              opacity: '1',
              transition: 'opacity 75ms linear',
            }}
          >
            <Show
              when={!confirmingCancel()}
              fallback={
                /* Discard confirmation inline */
                <div
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'center',
                    flex: '1',
                    gap: '0',
                  }}
                >
                  <span
                    style={{
                      flex: '1',
                      'text-align': 'center',
                      'font-size': '10px',
                      color: 'var(--color-text-muted)',
                      'letter-spacing': '0.08em',
                      'text-transform': 'uppercase',
                      padding: '0 12px',
                    }}
                  >
                    DISCARD TRACK?
                  </span>
                  <button
                    style={{
                      ...ghostBase,
                      color: 'var(--color-danger)',
                      'border-left': '1px solid var(--color-border)',
                    }}
                    onClick={() => {
                      setConfirmingCancel(false);
                      props.onCancel();
                    }}
                  >
                    DISCARD
                  </button>
                  <button
                    style={{
                      ...ghostBase,
                      'border-left': '1px solid var(--color-border)',
                    }}
                    onClick={() => setConfirmingCancel(false)}
                  >
                    KEEP
                  </button>
                </div>
              }
            >
              {/* Normal plot row */}
              <button
                aria-label="Undo last node"
                style={{
                  ...ghostBase,
                  opacity: props.plotNodes.length === 0 ? '0.3' : '1',
                  'pointer-events': props.plotNodes.length === 0 ? 'none' : 'auto',
                }}
                onClick={props.onUndo}
              >
                <span class="material-symbols-outlined" style={{ 'font-size': '16px' }}>
                  undo
                </span>
                UNDO
              </button>

              <span
                style={{
                  flex: '1',
                  'text-align': 'center',
                  'font-size': '10px',
                  color: 'var(--color-text-muted)',
                  'letter-spacing': '0.08em',
                  'text-transform': 'uppercase',
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                }}
              >
                {props.plotNodes.length} NODE{props.plotNodes.length !== 1 ? 'S' : ''}
              </span>

              <button
                aria-label="Add node at crosshair"
                style={{
                  ...ghostBase,
                  'border-left': '1px solid var(--color-border)',
                }}
                onClick={props.onAddNode}
              >
                <span class="material-symbols-outlined" style={{ 'font-size': '16px' }}>
                  add
                </span>
                NODE
              </button>

              <button
                aria-label="Save track"
                style={{
                  ...ghostBase,
                  'border-left': '1px solid var(--color-border)',
                  opacity: props.plotNodes.length < 2 ? '0.3' : '1',
                  'pointer-events': props.plotNodes.length < 2 ? 'none' : 'auto',
                }}
                onClick={props.onSave}
              >
                <span class="material-symbols-outlined" style={{ 'font-size': '16px' }}>
                  check
                </span>
                SAVE
              </button>

              <button
                aria-label="Cancel plotting"
                style={{
                  ...ghostBase,
                  'border-left': '1px solid var(--color-border)',
                  color: 'var(--color-danger)',
                }}
                onClick={handleCancel}
              >
                <span class="material-symbols-outlined" style={{ 'font-size': '16px' }}>
                  close
                </span>
                CANCEL
              </button>
            </Show>
          </div>
        </Show>

        {/* Top row — always visible */}
        <div
          style={{
            display: 'flex',
            'align-items': 'stretch',
            'border-bottom': '1px solid var(--color-border)',
          }}
        >
          {/* Left: coordinate display */}
          <button
            aria-label="Copy coordinates"
            onClick={copyCoord}
            style={{
              flex: '1',
              'min-width': '0',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 12px',
              'text-align': 'left',
              'font-family': 'inherit',
              transition: 'background 75ms linear',
              display: 'flex',
              'flex-direction': 'column',
              gap: '2px',
              'justify-content': 'center',
            }}
          >
            <span
              style={{
                'font-size': '10px',
                color: 'var(--color-text-muted)',
                'letter-spacing': '0.08em',
                'text-transform': 'uppercase',
                'white-space': 'nowrap',
              }}
            >
              {SYSTEM_NAMES[prefs.coordinateSystem]}
            </span>
            <span
              style={{
                'font-size': '15px',
                'font-weight': '500',
                color: 'var(--color-text)',
                'letter-spacing': '0.02em',
                'white-space': 'nowrap',
                overflow: 'hidden',
                'text-overflow': 'ellipsis',
              }}
            >
              {coordDisplay()}
            </span>
          </button>

          {/* Right: GO TO, + PIN, TRACK buttons */}
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
              <button
                aria-label="Go to coordinate"
                style={{
                  ...ghostBase,
                  'border-left': '1px solid var(--color-border)',
                  'flex-shrink': '0',
                  'min-width': '48px',
                  padding: '0',
                }}
              >
                <span class="material-symbols-outlined" style={{ 'font-size': '18px' }}>
                  near_me
                </span>
              </button>
            }
            placement="top-end"
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
                  class={gotoError() ? 'goto-tf-error' : ''}
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

          <button
            aria-label="Add pin at crosshair"
            style={{
              ...ghostBase,
              'border-left': '1px solid var(--color-border)',
              'flex-shrink': '0',
              'min-width': '48px',
              padding: '0',
              opacity: props.isPlotting ? '0.3' : '1',
              'pointer-events': props.isPlotting ? 'none' : 'auto',
            }}
            onClick={handleAddPin}
          >
            <span class="material-symbols-outlined" style={{ 'font-size': '18px' }}>
              add_location
            </span>
          </button>

          <button
            aria-label="Start track plotting"
            style={{
              ...ghostBase,
              'border-left': '1px solid var(--color-border)',
              'flex-shrink': '0',
              'min-width': '48px',
              padding: '0',
              opacity: props.isPlotting ? '0.3' : '1',
              'pointer-events': props.isPlotting ? 'none' : 'auto',
            }}
            onClick={props.onStartPlot}
          >
            <span class="material-symbols-outlined" style={{ 'font-size': '18px' }}>
              route
            </span>
          </button>
        </div>

        {/* Bottom row — always visible */}
        <div
          class="bottom-row"
          style={{
            display: 'grid',
            'grid-template-columns': '1fr 1fr 1fr',
            'align-items': 'stretch',
          }}
        >
          {/* MAP STYLE */}
          <button
            aria-label={props.isSatellite ? 'Satellite map active' : 'Default map active'}
            style={{
              ...ghostBase,
              flex: '1 1 0',
              'min-width': '0',
              overflow: 'hidden',
              'flex-direction': 'column',
              gap: '2px',
              padding: '8px 4px',
              ...(props.isSatellite
                ? { background: 'var(--color-accent-bg)', color: 'var(--color-accent)' }
                : {}),
            }}
            onClick={props.onToggleMapStyle}
          >
            <span class="material-symbols-outlined" style={{ 'font-size': '18px' }}>
              {props.isSatellite ? 'satellite_alt' : 'map'}
            </span>
            <span style={{ 'font-size': '10px', 'letter-spacing': '0.08em' }}>
              {props.isSatellite ? 'SATELLITE' : 'DEFAULT'}
            </span>
          </button>

          {/* NORTH / compass */}
          <div
            class="bottom-row-compass"
            style={{
              flex: '1 1 0',
              'min-width': '0',
              display: 'flex',
              'border-left': '1px solid var(--color-border)',
            }}
          >
            <Popover_
              open={showCompass()}
              onOpenChange={handleCompassOpenChange}
              trigger={
                <button
                  aria-label={
                    normalizedBearing() >= 0.05
                      ? `Bearing ${bearingLabel()}, click to reset north`
                      : 'Set map bearing'
                  }
                  style={{
                    ...ghostBase,
                    flex: '1 1 0',
                    width: '100%',
                    'min-width': '0',
                    overflow: 'hidden',
                    'flex-direction': 'column',
                    gap: '2px',
                    padding: '8px 4px',
                    ...(normalizedBearing() >= 0.05 ? { color: 'var(--color-accent)' } : {}),
                  }}
                >
                  <Needle
                    showLabel={false}
                    style={{
                      height: '20px',
                      'aspect-ratio': '1 / 1',
                      transform: `rotate(${-props.bearing}deg)`,
                    }}
                  />
                  <span
                    style={{
                      'font-size': '10px',
                      'letter-spacing': '0.08em',
                      'white-space': 'nowrap',
                      overflow: 'hidden',
                      'text-overflow': 'ellipsis',
                      'max-width': '100%',
                    }}
                  >
                    {bearingLabel()}
                  </span>
                </button>
              }
              placement="top"
            >
              <form
                onSubmit={handleCompassSubmit}
                style={{ display: 'flex', gap: '8px', 'align-items': 'center' }}
              >
                <TextField
                  value={compassInput()}
                  onChange={(v) => {
                    setCompassInput(v);
                    setCompassError(false);
                  }}
                  placeholder={`Bearing (${prefs.angleUnit === 'mils' ? '0–6400' : '0–360'})`}
                  class={compassError() ? 'compass-input-error' : ''}
                />
                <Button type="submit" size="sm">
                  Go
                </Button>
                <Button
                  variant="icon"
                  size="sm"
                  onClick={() => setShowCompass(false)}
                  aria-label="Close"
                >
                  ✕
                </Button>
              </form>
            </Popover_>
          </div>

          {/* LOCATION */}
          <button
            aria-label="Center on GPS location"
            style={{
              ...ghostBase,
              flex: '1 1 0',
              'min-width': '0',
              overflow: 'hidden',
              'flex-direction': 'column',
              gap: '2px',
              padding: '8px 4px',
              'border-left': '1px solid var(--color-border)',
              ...(props.locationMode === 'unavailable'
                ? { opacity: '0.3', 'pointer-events': 'none' }
                : {}),
              ...(isFollowing()
                ? { background: 'var(--color-accent-bg)', color: 'var(--color-accent)' }
                : {}),
            }}
            onClick={props.onLocate}
          >
            <span class="material-symbols-outlined" style={{ 'font-size': '18px' }}>
              {props.locationMode === 'following-bearing' ? 'explore' : 'my_location'}
            </span>
            <span style={{ 'font-size': '10px', 'letter-spacing': '0.08em' }}>
              {props.locationMode === 'following-bearing'
                ? 'HEADING'
                : props.locationMode === 'following'
                  ? 'FOLLOW'
                  : 'LOCATION'}
            </span>
          </button>
        </div>
      </div>

      <style>{`
        .bottom-row-compass > .ui-popover-trigger {
          width: 100%;
        }
        /* Equal-width bottom row: border-box so 1px borders don't shrink flex items */
        .bottom-row > * {
          box-sizing: border-box;
        }
        .goto-tf-error .ui-tf-input {
          background: rgba(255,0,0,0.1);
          border-color: var(--color-danger);
        }
        .compass-input-error .ui-tf-input {
          background: rgba(255,0,0,0.1);
          border-color: var(--color-danger);
        }

      `}</style>
    </>
  );
};

export default PlotControls;
