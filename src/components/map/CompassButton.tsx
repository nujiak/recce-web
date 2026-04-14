import { Component, createSignal } from 'solid-js';
import { usePrefs } from '../../context/PrefsContext';
import { formatBearing, parseBearing } from '../../utils/geo';
import Needle from '../ui/Needle';
import Popover from '../ui/Popover';
import TextField from '../ui/TextField';
import Button from '../ui/Button';

interface CompassButtonProps {
  bearing: number;
  onReset: () => void;
  onRotateTo: (degrees: number) => void;
}

const CompassButton: Component<CompassButtonProps> = (props) => {
  const [prefs] = usePrefs();
  const [showDialog, setShowDialog] = createSignal(false);
  const [input, setInput] = createSignal('');
  const [error, setError] = createSignal(false);

  const inverseBearing = () => {
    const normalized = ((props.bearing % 360) + 360) % 360;
    return formatBearing(normalized, prefs.angleUnit);
  };

  function handleOpenChange(open: boolean) {
    if (open && props.bearing !== 0) {
      props.onReset();
      return;
    }
    if (open) {
      setInput('');
      setError(false);
    }
    setShowDialog(open);
  }

  function handleSubmit(e?: Event) {
    e?.preventDefault();
    const deg = parseBearing(input(), prefs.angleUnit);
    if (deg === null) {
      setError(true);
      return;
    }
    props.onRotateTo(deg);
    setShowDialog(false);
  }

  return (
    <div style={{ position: 'absolute', top: '16px', right: '16px', 'z-index': '10' }}>
      <style>{`
        .compass-input-error .ui-tf-input {
          background: rgba(255,0,0,0.1);
          border-color: var(--color-danger);
        }
      `}</style>
      <Popover
        open={showDialog()}
        onOpenChange={handleOpenChange}
        trigger={
          <div
            style={{
              'box-sizing': 'border-box',
              width: props.bearing !== 0 ? '128px' : '48px',
              height: '48px',
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              'border-radius': '0px',
              cursor: 'pointer',
              display: 'flex',
              'align-items': 'center',
              'box-shadow': '0 2px 4px rgba(0,0,0,0.2)',
              overflow: 'hidden',
              transition: 'width 0.3s ease',
            }}
          >
            <span
              style={{
                'font-size': '13px',
                color: 'var(--color-text)',
                'white-space': 'nowrap',
                overflow: 'hidden',
                width: props.bearing !== 0 ? '80px' : '0px',
                'text-align': 'center',
                'padding-left': props.bearing !== 0 ? '8px' : '0px',
                transition: 'width 0.3s ease, padding-left 0.3s ease',
              }}
            >
              {inverseBearing()}
            </span>
            <div
              style={{
                width: '46px',
                height: '46px',
                'flex-shrink': '0',
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
              }}
            >
              <Needle
                showLabel={false}
                style={{
                  height: '22px',
                  'aspect-ratio': '1 / 1',
                  transform: `rotate(${-props.bearing}deg)`,
                }}
              />
            </div>
          </div>
        }
        placement="bottom-end"
      >
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', gap: '8px', 'align-items': 'center' }}
        >
          <TextField
            value={input()}
            onChange={(v) => {
              setInput(v);
              setError(false);
            }}
            placeholder={`Bearing (${prefs.angleUnit === 'mils' ? '0-6400' : '0-360'})`}
            class={error() ? 'compass-input-error' : ''}
          />
          <Button type="submit" size="sm">
            Go
          </Button>
          <Button variant="icon" size="sm" onClick={() => setShowDialog(false)} aria-label="Close">
            ✕
          </Button>
        </form>
      </Popover>
    </div>
  );
};

export default CompassButton;
