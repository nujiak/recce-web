import { type Component, type JSX, Show } from 'solid-js';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import type { IconName } from '../ui/Icon';

interface ToolPanelShellProps {
  title: string;
  icon?: IconName;
  actions?: JSX.Element;      // e.g. Ruler "Clear All" button
  children: JSX.Element;
  onClose?: () => void;       // Back button shown when provided (mobile)
}

const ToolPanelShell: Component<ToolPanelShellProps> = (props) => {
  return (
    <div class="tool-panel-shell" style={{ display: 'flex', 'flex-direction': 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        'align-items': 'center',
        gap: '8px',
        padding: '12px 16px',
        'border-bottom': '1px solid var(--color-border)',
        background: 'var(--color-bg-secondary)',
        'flex-shrink': 0,
      }}>
        <Show when={props.onClose}>
          <Button variant="icon" aria-label="Back" onClick={props.onClose!}>
            <Icon name="arrow_back" size={20} />
          </Button>
        </Show>
        <Show when={props.icon}>
          <Icon name={props.icon!} size={20} />
        </Show>
        <span style={{ 'font-size': '0.875rem', 'font-weight': 500, flex: 1 }}>{props.title}</span>
        <Show when={props.actions}>
          <div style={{ display: 'flex', gap: '8px' }}>{props.actions}</div>
        </Show>
      </div>

      {/* Body */}
      <div style={{ flex: 1, 'overflow-y': 'auto', 'min-height': 0 }}>
        <div style={{ padding: '16px', display: 'flex', 'flex-direction': 'column', gap: '16px' }}>
          {props.children}
        </div>
      </div>
    </div>
  );
};

export default ToolPanelShell;
