import { Component } from 'solid-js';

interface CrosshairProps {
  center: [number, number]; // [lng, lat]
}

const Crosshair: Component<CrosshairProps> = (_props) => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        'pointer-events': 'none',
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
      }}
    >
      <img
        src="/icons/crosshair.svg"
        width="24"
        height="24"
        alt=""
        style={{ position: 'absolute' }}
      />
    </div>
  );
};

export default Crosshair;
