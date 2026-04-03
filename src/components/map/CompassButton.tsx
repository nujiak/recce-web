import { Component, Show, createSignal, onMount } from 'solid-js';
import { usePrefs } from '../../context/PrefsContext';
import { formatBearing, parseBearing } from '../../utils/geo';
import Needle from '../ui/Needle';

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

  function handleClick() {
    if (props.bearing === 0) {
      setShowDialog(true);
      setInput('');
      setError(false);
    } else {
      props.onReset();
    }
  }

  function handleSubmit() {
    const deg = parseBearing(input(), prefs.angleUnit);
    if (deg === null) {
      setError(true);
      return;
    }
    props.onRotateTo(deg);
    setShowDialog(false);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') setShowDialog(false);
  }

  return (
    <>
      <button
        aria-label="Reset map north"
        onClick={handleClick}
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          height: '40px',
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          'border-radius': '20px',
          cursor: 'pointer',
          display: 'grid',
          'grid-template-columns': props.bearing !== 0 ? '64px 24px' : '0px 24px',
          'align-items': 'center',
          padding: '0 8px',
          'box-shadow': '0 2px 4px rgba(0,0,0,0.2)',
          'z-index': '10',
          transition: 'grid-template-columns 0.3s ease',
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            'font-size': '0.7rem',
            'font-weight': '600',
            color: 'var(--color-text)',
            'white-space': 'nowrap',
            'min-width': '0',
            overflow: 'hidden',
          }}
        >
          {inverseBearing()}
        </span>
        <div
          style={{
            position: 'relative',
            width: '24px',
            height: '24px',
            'flex-shrink': '0',
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
          }}
        >
          <Needle
            showLabel={false}
            style={{
              position: 'absolute',
              height: '22px',
              'aspect-ratio': '1 / 1',
              transform: `rotate(${-props.bearing}deg)`,
            }}
          />
        </div>
      </button>

      <Show when={showDialog()}>
        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            'z-index': '20',
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            'border-radius': 'var(--radius-md)',
            padding: '12px',
            display: 'flex',
            gap: '8px',
            'min-width': '200px',
            'box-shadow': '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          <input
            aria-label="Rotate to bearing"
            placeholder={`Bearing (${prefs.angleUnit === 'mils' ? '0-6400' : '0-360'})`}
            value={input()}
            ref={(el) => {
              onMount(() => {
                el.focus();
              });
            }}
            onInput={(e) => {
              setInput(e.currentTarget.value);
              setError(false);
            }}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              background: error() ? 'rgba(255,0,0,0.1)' : 'var(--color-bg-tertiary)',
              border: `1px solid ${error() ? 'var(--color-danger)' : 'var(--color-border)'}`,
              'border-radius': 'var(--radius-sm)',
              padding: '6px 10px',
              color: 'var(--color-text)',
              'font-family': 'inherit',
              'font-size': '0.875rem',
            }}
          />
          <button
            onClick={handleSubmit}
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: '4px',
              padding: '7px 12px',
              background: 'var(--color-accent)',
              border: '1px solid var(--color-border)',
              'border-radius': 'var(--radius-md)',
              cursor: 'pointer',
              color: 'oklch(0.1 0 0)',
              'font-size': '0.8rem',
              'font-family': 'inherit',
              'font-weight': '500',
              'box-shadow': '0 2px 4px rgba(0,0,0,0.25)',
              'white-space': 'nowrap',
            }}
          >
            Go
          </button>
          <button
            onClick={() => setShowDialog(false)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              padding: '4px',
            }}
          >
            ✕
          </button>
        </div>
      </Show>
    </>
  );
};

export default CompassButton;
