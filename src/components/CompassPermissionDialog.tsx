import { Component } from 'solid-js';
import Dialog from './ui/Dialog';
import Button from './ui/Button';
import Icon from './ui/Icon';
import type { IconName } from './ui/Icon';
import { requestCompassPermission } from './GpsTracker';

interface Props {
  open: boolean;
  onClose: () => void;
}

const CompassPermissionDialog: Component<Props> = (props) => {
  async function handleAllow() {
    await requestCompassPermission();
    props.onClose();
  }

  return (
    <Dialog open={props.open} onOpenChange={(o) => !o && props.onClose()} title="Compass Access">
      <div style={{ display: 'flex', 'flex-direction': 'column', gap: '16px' }}>
        <div
          style={{
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            width: '56px',
            height: '56px',
            'border-radius': '50%',
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            margin: '0 auto',
          }}
        >
          <Icon name="explore" size={28} style={{ color: 'var(--color-accent)' }} />
        </div>

        <p style={{ 'font-size': '0.875rem', color: 'var(--color-text-secondary)', margin: '0' }}>
          Recce uses your device compass for:
        </p>

        <ul
          style={{
            margin: '0',
            padding: '0',
            'list-style': 'none',
            display: 'flex',
            'flex-direction': 'column',
            gap: '10px',
          }}
        >
          {(
            [
              ['near_me', 'Rotating the map to match your heading'],
              ['explore', 'Showing live azimuth, pitch, and roll in the GPS panel'],
              ['location_on', 'Orienting the directional arc on your location marker'],
            ] as [IconName, string][]
          ).map(([icon, text]) => (
            <li style={{ display: 'flex', 'align-items': 'flex-start', gap: '10px' }}>
              <Icon
                name={icon}
                size={18}
                style={{ color: 'var(--color-accent)', 'margin-top': '1px' }}
              />
              <span style={{ 'font-size': '0.875rem', color: 'var(--color-text)' }}>{text}</span>
            </li>
          ))}
        </ul>

        <p style={{ 'font-size': '0.75rem', color: 'var(--color-text-muted)', margin: '0' }}>
          Your heading data is never stored or transmitted.
        </p>

        <div style={{ display: 'flex', 'flex-direction': 'column', gap: '8px' }}>
          <Button onClick={handleAllow} style={{ width: '100%' }}>
            Allow Compass
          </Button>
          <Button variant="ghost" onClick={props.onClose} style={{ width: '100%' }}>
            Not Now
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default CompassPermissionDialog;
