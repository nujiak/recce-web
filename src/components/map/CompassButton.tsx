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
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        style={{ transform: `rotate(${-props.bearing}deg)`, transition: 'transform 0.2s' }}
      >
        {/* North (red) */}
        <polygon points="12,2 9,12 12,10 15,12" fill="#e53935" />
        {/* South (gray) */}
        <polygon points="12,22 9,12 12,14 15,12" fill="#888" />
      </svg>
    </button>
  );
};

export default CompassButton;
