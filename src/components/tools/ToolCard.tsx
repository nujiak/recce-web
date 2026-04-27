import { type Component, type JSX } from 'solid-js';

export const ToolCard: Component<{ children: JSX.Element }> = (props) => (
  <div style={{
    background: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border)',
    'border-radius': '0px',
    overflow: 'hidden',
  }}>
    {props.children}
  </div>
);

export const SectionHeader: Component<{ label: string }> = (props) => (
  <div class="panel-header" style={{
    'font-size': '11px',
    'letter-spacing': '0.10em',
    'text-transform': 'uppercase',
    color: 'var(--color-text-secondary)',
    padding: '6px 12px 6px 9px',
    'border-bottom': '1px solid var(--color-border)',
    background: 'var(--color-bg-secondary)',
  }}>
    {props.label}
  </div>
);

export const RowDivider = () => (
  <div style={{ height: '1px', background: 'var(--color-border-subtle)', margin: '0 14px' }} />
);
