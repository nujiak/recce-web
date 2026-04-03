import { Component } from 'solid-js';
import Needle from '../ui/Needle';

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
      <Needle
        style={{
          height: '28px',
          transform: `rotate(${-props.bearing}deg)`,
        }}
      />
    </button>
  );
};

export default CompassButton;
