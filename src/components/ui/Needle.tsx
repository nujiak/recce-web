import { Component } from 'solid-js';

interface NeedleProps {
  showLabel?: boolean;
  style?: Record<string, string | number>;
}

const Needle: Component<NeedleProps> = (props) => {
  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        'aspect-ratio': '1 / 3',
        ...props.style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '0',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '33.33%',
          height: '50%',
          background: 'var(--color-danger)',
          'clip-path': 'polygon(50% 0%, 100% 100%, 0% 100%)',
        }}
      />
      {props.showLabel !== false && (
        <span
          style={{
            position: 'absolute',
            top: '25%',
            left: '50%',
            transform: 'translateX(-50%)',
            'font-size': '11px',

            color: '#fff',
            'z-index': '1',
            'pointer-events': 'none',
          }}
        >
          N
        </span>
      )}
      <div
        style={{
          position: 'absolute',
          bottom: '0',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '33.33%',
          height: '50%',
          background: 'var(--color-text-muted)',
          'clip-path': 'polygon(0% 0%, 100% 0%, 50% 100%)',
        }}
      />
    </div>
  );
};

export default Needle;
