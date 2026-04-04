import { Component } from 'solid-js';
import Dialog from './ui/Dialog';
import Button from './ui/Button';

interface Props {
  open: boolean;
  onClose: () => void;
}

const PwaInstallDialog: Component<Props> = (props) => (
  <Dialog
    open={props.open}
    onOpenChange={(o) => {
      if (!o) props.onClose();
    }}
    title="Install Recce"
  >
    <div style={{ display: 'flex', 'flex-direction': 'column', gap: '16px' }}>
      <p style={{ 'font-size': '0.875rem', color: 'var(--color-text-secondary)', margin: '0' }}>
        Add Recce to your home screen for offline access and a full-screen experience.
      </p>
      <div
        style={{
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          'border-radius': '8px',
          padding: '0.75rem',
          'font-size': '0.8125rem',
          color: 'var(--color-text-secondary)',
          display: 'flex',
          'flex-direction': 'column',
          gap: '8px',
        }}
      >
        <span>
          1. Tap the <strong style={{ color: 'var(--color-text)' }}>⋮ menu</strong> in the address
          bar
        </span>
        <span>
          2. Tap <strong style={{ color: 'var(--color-text)' }}>More</strong>
        </span>
        <span>
          3. Tap <strong style={{ color: 'var(--color-text)' }}>Add app to Home Screen</strong>
        </span>
      </div>
      <Button onClick={props.onClose}>Done</Button>
    </div>
  </Dialog>
);

export default PwaInstallDialog;
