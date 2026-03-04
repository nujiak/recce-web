import { Component } from 'solid-js';
import { usePrefs } from '../../context/PrefsContext';
import { CoordinateTransformer } from '../../coords/index';
import { haversineDistance } from '../../utils/geo';
import type { Track } from '../../types';

const COLOR_MAP: Record<string, string> = {
  red: 'var(--color-red)',
  orange: 'var(--color-orange)',
  green: 'var(--color-green)',
  azure: 'var(--color-azure)',
  violet: 'var(--color-violet)',
};

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

function formatDistance(meters: number, unit: string): string {
  if (unit === 'imperial') {
    const miles = meters / 1609.344;
    return miles >= 0.1 ? `${miles.toFixed(2)} mi` : `${Math.round(meters * 3.281)} ft`;
  }
  if (unit === 'nautical') {
    return `${(meters / 1852).toFixed(2)} nm`;
  }
  return meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${Math.round(meters)} m`;
}

const TrackCard: Component<TrackCardProps> = (props) => {
  const [prefs] = usePrefs();

  const totalDistance = () => {
    const nodes = props.track.nodes;
    if (nodes.length < 2) return 0;
    let d = 0;
    for (let i = 1; i < nodes.length; i++) {
      d += haversineDistance(nodes[i - 1].lat, nodes[i - 1].lng, nodes[i].lat, nodes[i].lng);
    }
    if (props.track.isCyclical && nodes.length > 2) {
      d += haversineDistance(
        nodes[nodes.length - 1].lat,
        nodes[nodes.length - 1].lng,
        nodes[0].lat,
        nodes[0].lng
      );
    }
    return d;
  };

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
            background: COLOR_MAP[props.track.color] ?? 'var(--color-text-muted)',
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
