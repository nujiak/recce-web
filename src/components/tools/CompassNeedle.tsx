import { Component, createSignal, createEffect } from 'solid-js';
import { gpsHeading } from '../../stores/gps';

const CARDINALS = ['N', 'E', 'S', 'W'];
const INTERMEDIATES = ['NE', 'SE', 'SW', 'NW'];

const marks = Array.from({ length: 24 }, (_, i) => {
  const deg = i * 15;
  const isCardinal = deg % 90 === 0;
  const isIntermediate = deg % 45 === 0 && !isCardinal;
  const label = isCardinal
    ? CARDINALS[deg / 90]
    : isIntermediate
    ? INTERMEDIATES[(deg - 45) / 90]
    : '';
  return { deg, isCardinal, isIntermediate, label };
});

const CompassNeedle: Component = () => {
  let unboundedRotation = 0;
  const [needleTransform, setNeedleTransform] = createSignal('rotate(0deg)');

  createEffect(() => {
    const h = gpsHeading();
    if (h === null) return;

    // Take shortest path to avoid 360→0 spinning
    let delta = h - (unboundedRotation % 360);
    while (delta > 180) delta -= 360;
    while (delta < -180) delta += 360;
    unboundedRotation += delta;

    // Negative: needle points toward North as heading increases clockwise
    setNeedleTransform(`rotate(${-unboundedRotation}deg)`);
  });

  return (
    <div style={{
      width: '100%',
      'max-width': '200px',
      'aspect-ratio': '1',
      'border-radius': '50%',
      background: 'var(--color-bg-tertiary)',
      border: '2px solid var(--color-border)',
      position: 'relative',
      display: 'flex',
      'align-items': 'center',
      'justify-content': 'center',
    }}>
      {/* Gradation marks */}
      {marks.map(({ deg, isCardinal, isIntermediate, label }) => (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          display: 'flex',
          'flex-direction': 'column',
          'align-items': 'center',
          'transform-origin': 'center center',
          transform: `translateX(-50%) translateY(-50%) rotate(${deg}deg) translateY(-85px)`,
        }}>
          <span style={{
            display: 'block',
            width: '2px',
            height: isCardinal ? '14px' : isIntermediate ? '12px' : '10px',
            background: isCardinal
              ? 'var(--color-text)'
              : isIntermediate
              ? 'var(--color-text-secondary)'
              : 'var(--color-border)',
            'border-radius': '1px',
            'flex-shrink': '0',
          }} />
          {label && (
            <span style={{
              'font-size': isCardinal ? '0.7rem' : '0.55rem',
              'font-weight': isCardinal ? '700' : '500',
              color: isCardinal ? 'var(--color-text)' : 'var(--color-text-secondary)',
              'margin-top': '2px',
              'white-space': 'nowrap',
            }}>
              {label}
            </span>
          )}
        </div>
      ))}

      {/* Needle */}
      <div style={{
        position: 'relative',
        height: '80%',
        'aspect-ratio': '1 / 3',
        transform: needleTransform(),
        transition: 'transform 0.15s ease-out',
      }}>
        {/* North half (red) */}
        <div style={{
          position: 'absolute',
          top: '0',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '33.33%',
          height: '50%',
          background: 'var(--color-danger)',
          'clip-path': 'polygon(50% 0%, 100% 100%, 0% 100%)',
        }} />
        {/* N label */}
        <span style={{
          position: 'absolute',
          top: '25%',
          left: '50%',
          transform: 'translateX(-50%)',
          'font-size': '0.7rem',
          'font-weight': '700',
          color: '#fff',
          'z-index': '1',
          'pointer-events': 'none',
        }}>N</span>
        {/* South half (gray) */}
        <div style={{
          position: 'absolute',
          bottom: '0',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '33.33%',
          height: '50%',
          background: 'var(--color-text-muted)',
          'clip-path': 'polygon(0% 0%, 100% 0%, 50% 100%)',
        }} />
      </div>
    </div>
  );
};

export default CompassNeedle;
