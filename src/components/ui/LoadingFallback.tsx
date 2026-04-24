import type { Component } from 'solid-js';

const LoadingFallback: Component = () => (
  <div
    style={{
      display: 'flex',
      'align-items': 'center',
      'justify-content': 'center',
      width: '100%',
      height: '100%',
      'background-color': 'var(--color-bg)',
    }}
  >
    <span
      style={{
        color: 'var(--color-text-muted)',
        'font-size': '12px',
        'letter-spacing': '0.08em',
        'text-transform': 'uppercase',
      }}
    >
      LOADING...
    </span>
  </div>
);

export default LoadingFallback;
