import { Component, createSignal, Index } from 'solid-js';
import { usePrefs } from '../../context/PrefsContext';
import { SYSTEM_NAMES } from '../../coords/index';
import type { AngleUnit, CoordinateSystem, LengthUnit, Theme } from '../../types';

const OnboardingFlow: Component = () => {
  const [prefs, setPrefs] = usePrefs();
  const [step, setStep] = createSignal(0);

  const steps = [
    {
      title: 'Welcome to Recce',
      description: 'A mapping and reconnaissance tool for the field.',
      content: (
        <div style={{ display: 'flex', 'flex-direction': 'column', gap: '12px' }}>
          <label
            for="onboard-coord"
            style={{ display: 'flex', 'flex-direction': 'column', gap: '4px' }}
          >
            <span style={{ 'font-size': '0.75rem', color: 'var(--color-text-secondary)' }}>
              Coordinate System
            </span>
            <select
              id="onboard-coord"
              name="coordinateSystem"
              value={prefs.coordinateSystem}
              onChange={(e) =>
                setPrefs('coordinateSystem', e.currentTarget.value as CoordinateSystem)
              }
              style={{
                background: 'var(--color-bg-secondary)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
                'border-radius': 'var(--radius-sm)',
                padding: '8px 10px',
              }}
            >
              <option value="WGS84">{SYSTEM_NAMES.WGS84}</option>
              <option value="UTM">{SYSTEM_NAMES.UTM}</option>
              <option value="MGRS">{SYSTEM_NAMES.MGRS}</option>
              <option value="BNG">{SYSTEM_NAMES.BNG}</option>
              <option value="QTH">{SYSTEM_NAMES.QTH}</option>
              <option value="KERTAU">{SYSTEM_NAMES.KERTAU}</option>
            </select>
          </label>
        </div>
      ),
    },
    {
      title: 'Units',
      description: 'Choose your preferred measurement units.',
      content: (
        <div style={{ display: 'flex', 'flex-direction': 'column', gap: '12px' }}>
          <label
            for="onboard-length"
            style={{ display: 'flex', 'flex-direction': 'column', gap: '4px' }}
          >
            <span style={{ 'font-size': '0.75rem', color: 'var(--color-text-secondary)' }}>
              Distance
            </span>
            <select
              id="onboard-length"
              name="lengthUnit"
              value={prefs.lengthUnit}
              onChange={(e) => setPrefs('lengthUnit', e.currentTarget.value as LengthUnit)}
              style={{
                background: 'var(--color-bg-secondary)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
                'border-radius': 'var(--radius-sm)',
                padding: '8px 10px',
              }}
            >
              <option value="metric">Metric (km / m)</option>
              <option value="imperial">Imperial (mi / ft)</option>
              <option value="nautical">Nautical (nm)</option>
            </select>
          </label>
        </div>
      ),
    },
    {
      title: 'Angles',
      description: 'Choose your preferred angle unit for bearings.',
      content: (
        <div style={{ display: 'flex', 'flex-direction': 'column', gap: '12px' }}>
          <label
            for="onboard-angle"
            style={{ display: 'flex', 'flex-direction': 'column', gap: '4px' }}
          >
            <span style={{ 'font-size': '0.75rem', color: 'var(--color-text-secondary)' }}>
              Angle Unit
            </span>
            <select
              id="onboard-angle"
              name="angleUnit"
              value={prefs.angleUnit}
              onChange={(e) => setPrefs('angleUnit', e.currentTarget.value as AngleUnit)}
              style={{
                background: 'var(--color-bg-secondary)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
                'border-radius': 'var(--radius-sm)',
                padding: '8px 10px',
              }}
            >
              <option value="degrees">Degrees (0-360)</option>
              <option value="mils">NATO Mils (0-6400)</option>
            </select>
          </label>
        </div>
      ),
    },
    {
      title: 'Appearance',
      description: 'Choose your preferred theme.',
      content: (
        <div style={{ display: 'flex', 'flex-direction': 'column', gap: '12px' }}>
          <label
            for="onboard-theme"
            style={{ display: 'flex', 'flex-direction': 'column', gap: '4px' }}
          >
            <span style={{ 'font-size': '0.75rem', color: 'var(--color-text-secondary)' }}>
              Theme
            </span>
            <select
              id="onboard-theme"
              name="theme"
              value={prefs.theme}
              onChange={(e) => setPrefs('theme', e.currentTarget.value as Theme)}
              style={{
                background: 'var(--color-bg-secondary)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
                'border-radius': 'var(--radius-sm)',
                padding: '8px 10px',
              }}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="system">System default</option>
            </select>
          </label>
        </div>
      ),
    },
  ];

  const current = () => steps[step()];
  const isLast = () => step() === steps.length - 1;

  const finish = () => setPrefs('onboardingDone', true);

  return (
    <div
      role="dialog"
      aria-label="Welcome to Recce"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--color-bg)',
        'z-index': '100',
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          'max-width': '360px',
          display: 'flex',
          'flex-direction': 'column',
          gap: '24px',
        }}
      >
        {/* Step dots */}
        <div style={{ display: 'flex', gap: '6px', 'justify-content': 'center' }}>
          <Index each={steps}>
            {(_, i) => (
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  'border-radius': '50%',
                  background: i === step() ? 'var(--color-accent)' : 'var(--color-border)',
                }}
              />
            )}
          </Index>
        </div>

        <div>
          {step() === 0 && (
            <img
              src="/icons/onboarding-start.svg"
              width="96"
              height="96"
              alt=""
              style={{
                opacity: 0.9,
                'margin-bottom': '16px',
                'margin-left': 'auto',
                'margin-right': 'auto',
                filter: 'drop-shadow(0 24px 32px rgba(22, 101, 52, 0.6))',
              }}
            />
          )}
          <h1 style={{ 'font-size': '1.25rem', 'font-weight': '700', 'margin-bottom': '6px' }}>
            {current().title}
          </h1>
          <p
            style={{
              'font-size': '0.875rem',
              color: 'var(--color-text-secondary)',
              'margin-bottom': '20px',
            }}
          >
            {current().description}
          </p>
          {current().content}
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          {step() > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              style={{
                flex: 1,
                padding: '10px',
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                'border-radius': 'var(--radius-md)',
                cursor: 'pointer',
                color: 'var(--color-text)',
                'font-family': 'inherit',
                'font-size': '0.875rem',
              }}
            >
              Back
            </button>
          )}
          <button
            onClick={() => (isLast() ? finish() : setStep((s) => s + 1))}
            style={{
              flex: 2,
              padding: '10px',
              background: 'var(--color-accent)',
              border: 'none',
              'border-radius': 'var(--radius-md)',
              cursor: 'pointer',
              color: 'oklch(0.1 0 0)',
              'font-family': 'inherit',
              'font-size': '0.875rem',
              'font-weight': '600',
            }}
          >
            {isLast() ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
