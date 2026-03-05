import { Component } from 'solid-js';
import { usePrefs } from '../../context/PrefsContext';
import { CoordinateTransformer } from '../../coords/index';
import type { Pin } from '../../types';
import { PIN_COLOR_CSS } from '../../utils/colors';

interface PinCardProps {
  pin: Pin;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onInfo: () => void;
  onPointerDown: (e: PointerEvent) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
}

const PinCard: Component<PinCardProps> = (props) => {
  const [prefs] = usePrefs();
  const coordDisplay = () =>
    CoordinateTransformer.toDisplay(props.pin.lat, props.pin.lng, prefs.coordinateSystem) ?? '';

  return (
    <div
      role="listitem"
      onPointerDown={props.onPointerDown}
      onPointerUp={props.onPointerUp}
      onPointerCancel={props.onPointerCancel}
      onClick={props.onInfo}
      style={{
        display: 'flex',
        'align-items': 'center',
        gap: '12px',
        padding: '12px 16px',
        background: props.selected ? 'var(--color-accent-bg)' : 'var(--color-bg-secondary)',
        border: `1px solid ${props.selected ? 'var(--color-accent-border)' : 'var(--color-border)'}`,
        'border-radius': 'var(--radius-md)',
        cursor: 'pointer',
        'user-select': 'none',
      }}
    >
      {/* Color chip */}
      <div
        style={{
          width: '12px',
          height: '12px',
          'border-radius': '50%',
          background: PIN_COLOR_CSS[props.pin.color] ?? 'var(--color-text-muted)',
          'flex-shrink': '0',
        }}
      />

      <div style={{ flex: 1, 'min-width': 0 }}>
        <div
          style={{
            'font-size': '0.875rem',
            'font-weight': '600',
            overflow: 'hidden',
            'text-overflow': 'ellipsis',
            'white-space': 'nowrap',
          }}
        >
          {props.pin.name}
        </div>
        <div
          style={{
            'font-size': '0.75rem',
            color: 'var(--color-text-secondary)',
            'margin-top': '2px',
            overflow: 'hidden',
            'text-overflow': 'ellipsis',
            'white-space': 'nowrap',
          }}
        >
          {coordDisplay()}
        </div>
        {props.pin.group && (
          <div
            style={{
              'font-size': '0.625rem',
              color: 'var(--color-text-muted)',
              'margin-top': '2px',
            }}
          >
            {props.pin.group}
          </div>
        )}
      </div>

      <button
        aria-label={`Edit ${props.pin.name}`}
        onClick={(e) => {
          e.stopPropagation();
          props.onEdit();
        }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--color-text-secondary)',
          padding: '4px',
          'flex-shrink': '0',
        }}
      >
        <span class="material-symbols-outlined" style={{ 'font-size': '16px' }}>
          edit
        </span>
      </button>
    </div>
  );
};

export default PinCard;
