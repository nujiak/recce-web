import { Component } from 'solid-js';

interface CompassButtonProps {
  bearing: number;
  onReset: () => void;
}

const CompassButton: Component<CompassButtonProps> = (props) => {
  return (
    <button
      aria-label="Reset map north"
      onClick={props.onReset}
      style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        width: '40px',
        height: '40px',
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        'border-radius': '50%',
        cursor: 'pointer',
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        'box-shadow': '0 2px 4px rgba(0,0,0,0.2)',
        'z-index': '10',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '20px',
          height: '28px',
          transform: `rotate(${-props.bearing}deg)`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '8px',
            height: '50%',
            background: '#e53935',
            'clip-path': 'polygon(50% 0%, 100% 100%, 0% 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '8px',
            height: '50%',
            background: '#9e9e9e',
            'clip-path': 'polygon(0% 0%, 100% 0%, 50% 100%)',
          }}
        />
      </div>
    </button>
  );
};

export default CompassButton;
