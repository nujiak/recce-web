import { Component } from 'solid-js';
import { usePrefs } from '../../context/PrefsContext';
import { CoordinateTransformer } from '../../coords/index';
import { calculateTotalDistance, formatDistance } from '../../utils/geo';
import type { Track } from '../../types';
import { PIN_COLOR_CSS } from '../../utils/colors';

interface TrackCardProps {
  track: Track;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onInfo: () => void;
  onPointerDown: (e: PointerEvent) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
}

const TrackCard: Component<TrackCardProps> = (props) => {
  const [prefs] = usePrefs();

  const totalDistance = () => calculateTotalDistance(props.track.nodes, props.track.isCyclical);

  const firstCoord = () => {
    const n = props.track.nodes[0];
    if (!n) return '';
    return CoordinateTransformer.toDisplay(n.lat, n.lng, prefs.coordinateSystem) ?? '';
  };

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
      {/* Color chip + type indicator */}
      <div
        style={{
          display: 'flex',
          'flex-direction': 'column',
          'align-items': 'center',
          gap: '3px',
          'flex-shrink': '0',
        }}
      >
        <div
          style={{
            width: '12px',
            height: '12px',
            'border-radius': props.track.isCyclical ? '50%' : '2px',
            background: PIN_COLOR_CSS[props.track.color] ?? 'var(--color-text-muted)',
          }}
        />
      </div>

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
          {props.track.name}
        </div>
        <div
          style={{
            'font-size': '0.75rem',
            color: 'var(--color-text-secondary)',
            'margin-top': '2px',
          }}
        >
          {props.track.nodes.length} pts · {formatDistance(totalDistance(), prefs.lengthUnit)}
          {props.track.isCyclical ? ' · Area' : ''}
        </div>
        {firstCoord() && (
          <div
            style={{
              'font-size': '0.625rem',
              color: 'var(--color-text-muted)',
              'margin-top': '2px',
              overflow: 'hidden',
              'text-overflow': 'ellipsis',
              'white-space': 'nowrap',
            }}
          >
            {firstCoord()}
          </div>
        )}
      </div>

      <button
        aria-label={`Edit ${props.track.name}`}
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

export default TrackCard;
