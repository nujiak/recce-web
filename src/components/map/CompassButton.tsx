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
      <span
        class="material-symbols-outlined"
        style={{
          'font-size': '22px',
          color: '#e53935',
          transform: `rotate(${-props.bearing}deg)`,
          transition: 'transform 0.2s',
          display: 'block',
        }}
      >
        navigation
      </span>
    </button>
  );
};

export default CompassButton;
