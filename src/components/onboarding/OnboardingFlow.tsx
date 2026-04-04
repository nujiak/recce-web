import { Component, createSignal, For, Show } from 'solid-js';
import { usePrefs } from '../../context/PrefsContext';
import { SYSTEM_NAMES } from '../../coords/index';
import type { AngleUnit, CoordinateSystem, LengthUnit, Theme } from '../../types';
import Dialog from '../ui/Dialog';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { canInstallPWA, isFirefoxAndroid, isRunningAsPWA, promptPWAInstall } from '../../utils/pwa';

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

const angleOptions = [
  { value: 'degrees', label: 'Degrees (0-360)' },
  { value: 'mils', label: 'NATO Mils (0-6400)' },
];

const themeOptions = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System default' },
];

// Whether to show the PWA install step: Chromium (prompt API) or Firefox
// Android (manual instructions), as long as not already running as PWA.
const showPwaStep = () => !isRunningAsPWA() && (canInstallPWA() || isFirefoxAndroid());

const OnboardingFlow: Component = () => {
  const [prefs, setPrefs] = usePrefs();
  const [step, setStep] = createSignal(0);
  const [installing, setInstalling] = createSignal(false);
  const [pwaInstalled, setPwaInstalled] = createSignal(false);

  const pwaStep = {
    title: 'Install Recce',
    description:
      'Add Recce to your home screen for the best experience: works offline, launches full-screen, and loads instantly.',
    isPwaStep: true as const,
  };

  const configSteps = [
    {
      title: 'Welcome to Recce',
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
          options={angleOptions}
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

  const steps = () => (showPwaStep() ? [pwaStep, ...configSteps] : configSteps);

  const current = () => steps()[step()];
  const isLast = () => step() === steps().length - 1;

  const finish = () => setPrefs('onboardingDone', true);

  const isPwaStepActive = () => 'isPwaStep' in current();

  const handleInstall = async () => {
    setInstalling(true);
    const outcome = await promptPWAInstall();
    setInstalling(false);
    if (outcome === 'accepted') {
      // Show success state instead of advancing — the user needs to know to
      // open the installed app. Config steps still follow so settings are
      // written to localStorage (shared with the PWA via the same origin).
      setPwaInstalled(true);
    } else {
      // Dismissed or unavailable — advance so the user can continue.
      setStep((s) => s + 1);
    }
  };

  return (
    <Dialog open onOpenChange={() => {}} title={current().title} preventClose>
      <div style={{ display: 'flex', 'flex-direction': 'column', gap: '20px' }}>
        <div style={{ display: 'flex', gap: '6px', 'justify-content': 'center' }}>
          <For each={steps()}>
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
          <Show when={!isPwaStepActive()}>
            {(() => {
              const s = current() as (typeof configSteps)[number];
              return s.content;
            })()}
          </Show>
        </div>

        <div style={{ display: 'flex', gap: '12px', 'flex-direction': 'column' }}>
          <Show when={isPwaStepActive() && pwaInstalled()}>
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
                gap: '4px',
              }}
            >
              <span style={{ color: 'var(--color-accent)', 'font-weight': '600' }}>
                Recce is installed!
              </span>
              <span>
                Finish setup here — your settings will be ready when you open the app from your home
                screen.
              </span>
            </div>
          </Show>
          <Show when={isPwaStepActive() && !pwaInstalled() && canInstallPWA()}>
            <Button onClick={handleInstall} disabled={installing()}>
              {installing() ? 'Installing…' : 'Install App'}
            </Button>
          </Show>
          <Show when={isPwaStepActive() && !pwaInstalled() && isFirefoxAndroid()}>
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
                gap: '6px',
              }}
            >
              <span>
                1. Tap the <strong style={{ color: 'var(--color-text)' }}>⋮ menu</strong> in the
                address bar
              </span>
              <span>
                2. Tap <strong style={{ color: 'var(--color-text)' }}>More</strong>
              </span>
              <span>
                3. Tap{' '}
                <strong style={{ color: 'var(--color-text)' }}>Add app to Home Screen</strong>
              </span>
            </div>
          </Show>
          <div style={{ display: 'flex', gap: '12px' }}>
            {step() > 0 && (
              <Button variant="ghost" onClick={() => setStep((s) => s - 1)} style={{ flex: 1 }}>
                Back
              </Button>
            )}
            <Button
              variant={isPwaStepActive() && !pwaInstalled() ? 'ghost' : undefined}
              onClick={() => (isLast() ? finish() : setStep((s) => s + 1))}
              style={{ flex: step() > 0 || (isPwaStepActive() && !pwaInstalled()) ? 2 : 1 }}
            >
              {isLast()
                ? pwaInstalled()
                  ? 'Done — Open from Home Screen'
                  : 'Get Started'
                : isPwaStepActive() && !pwaInstalled()
                  ? 'Skip'
                  : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default OnboardingFlow;
