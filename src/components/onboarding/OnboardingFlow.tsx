import { Component, createSignal, For } from 'solid-js';
import { usePrefs } from '../../context/PrefsContext';
import { SYSTEM_NAMES } from '../../coords/index';
import type { AngleUnit, CoordinateSystem, LengthUnit, Theme } from '../../types';
import { ANGLE_UNIT_OPTIONS } from '../../types';
import Dialog from '../ui/Dialog';
import Select from '../ui/Select';
import Button from '../ui/Button';

const coordOptions = [
  { value: 'WGS84', label: SYSTEM_NAMES.WGS84 },
  { value: 'UTM', label: SYSTEM_NAMES.UTM },
  { value: 'MGRS', label: SYSTEM_NAMES.MGRS },
  { value: 'BNG', label: SYSTEM_NAMES.BNG },
  { value: 'QTH', label: SYSTEM_NAMES.QTH },
  { value: 'KERTAU', label: SYSTEM_NAMES.KERTAU },
];

const lengthOptions = [
  { value: 'metric', label: 'Metric (km / m)' },
  { value: 'imperial', label: 'Imperial (mi / ft)' },
  { value: 'nautical', label: 'Nautical (nm)' },
];

const themeOptions = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System default' },
];

const OnboardingFlow: Component = () => {
  const [prefs, setPrefs] = usePrefs();
  const [step, setStep] = createSignal(0);

  const configSteps = [
    {
      title: 'Welcome to recce',
      description: 'A mapping and reconnaissance tool for the field.',
      content: (
        <Select
          label="Coordinate System"
          value={prefs.coordinateSystem}
          onChange={(v) => setPrefs('coordinateSystem', v as CoordinateSystem)}
          options={coordOptions}
        />
      ),
    },
    {
      title: 'Units',
      description: 'Choose your preferred measurement units.',
      content: (
        <Select
          label="Distance"
          value={prefs.lengthUnit}
          onChange={(v) => setPrefs('lengthUnit', v as LengthUnit)}
          options={lengthOptions}
        />
      ),
    },
    {
      title: 'Angles',
      description: 'Choose your preferred angle unit for bearings.',
      content: (
        <Select
          label="Angle Unit"
          value={prefs.angleUnit}
          onChange={(v) => setPrefs('angleUnit', v as AngleUnit)}
          options={ANGLE_UNIT_OPTIONS}
        />
      ),
    },
    {
      title: 'Appearance',
      description: 'Choose your preferred theme.',
      content: (
        <Select
          label="Theme"
          value={prefs.theme}
          onChange={(v) => setPrefs('theme', v as Theme)}
          options={themeOptions}
        />
      ),
    },
  ];

  const current = () => configSteps[step()];
  const isLast = () => step() === configSteps.length - 1;

  const finish = () => setPrefs('onboardingDone', true);

  return (
    <Dialog open onOpenChange={() => {}} title={current().title} preventClose>
      <div style={{ display: 'flex', 'flex-direction': 'column', gap: '20px' }}>
        <div style={{ display: 'flex', gap: '6px', 'justify-content': 'center' }}>
          <For each={configSteps}>
            {(_, i) => (
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  'border-radius': '50%',
                  background: i() === step() ? 'var(--color-accent)' : 'var(--color-border)',
                  transition: 'background 0.2s',
                }}
              />
            )}
          </For>
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
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)} style={{ flex: 1 }}>
              Back
            </Button>
          )}
          <Button
            onClick={() => (isLast() ? finish() : setStep((s) => s + 1))}
            style={{ flex: step() > 0 ? 2 : 1 }}
          >
            {isLast() ? 'Get Started' : 'Next'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default OnboardingFlow;
