import { Component, createSignal, createEffect } from 'solid-js';
import { gpsHeading } from '../../stores/gps';
import Needle from '../ui/Needle';

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
    <div
      style={{
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
      }}
    >
      {/* Gradation marks */}
      {marks.map(({ deg, isCardinal, isIntermediate, label }) => (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            display: 'flex',
            'flex-direction': 'column',
            'align-items': 'center',
            'transform-origin': 'center center',
            transform: `translateX(-50%) translateY(-50%) rotate(${deg}deg) translateY(-85px)`,
          }}
        >
          <span
            style={{
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
            }}
          />
          {label && (
            <span
              style={{
                'font-size': isCardinal ? '13px' : '11px',
                'font-weight': isCardinal ? '700' : '500',
                color: isCardinal ? 'var(--color-text)' : 'var(--color-text-secondary)',
                'margin-top': '2px',
                'white-space': 'nowrap',
              }}
            >
              {label}
            </span>
          )}
        </div>
      ))}

      {/* Needle */}
      <Needle
        style={{
          transform: needleTransform(),
          transition: 'transform 0.15s ease-out',
        }}
      />
    </div>
  );
};

export default CompassNeedle;
