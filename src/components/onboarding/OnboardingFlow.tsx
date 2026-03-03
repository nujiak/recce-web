import { type Component, createSignal, Show, For } from 'solid-js';
import { preferences } from '@/stores/preferences';
import type { CoordSystem, AngleUnit, LengthUnit, Theme } from '@/types';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const STEPS = ['welcome', 'preferences', 'done'] as const;
type Step = (typeof STEPS)[number];

export const OnboardingFlow: Component<OnboardingFlowProps> = (props) => {
  const [currentStep, setCurrentStep] = createSignal<number>(0);
  const step = () => STEPS[currentStep()];

  const [coordSystem, setCoordSystem] = createSignal<CoordSystem>(preferences.coordSystem());
  const [angleUnit, setAngleUnit] = createSignal<AngleUnit>(preferences.angleUnit());
  const [lengthUnit, setLengthUnit] = createSignal<LengthUnit>(preferences.lengthUnit());
  const [theme, setTheme] = createSignal<Theme>(preferences.theme());

  const handleNext = () => {
    if (currentStep() === STEPS.length - 1) {
      completeOnboarding();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep() > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const completeOnboarding = () => {
    preferences.setCoordSystem(coordSystem());
    preferences.setAngleUnit(angleUnit());
    preferences.setLengthUnit(lengthUnit());
    preferences.setTheme(theme());
    preferences.completeOnboarding();
    document.documentElement.setAttribute('data-theme', theme());
    props.onComplete();
  };

  return (
    <div class="fixed inset-0 bg-surface z-50 flex items-center justify-center">
      <div class="max-w-md w-full p-6 space-y-8">
        <Show when={step() === 'welcome'}>
          <div class="text-center space-y-4">
            <h1 class="text-3xl font-bold">Recce</h1>
            <p class="text-secondary">A mapping and reconnaissance utility for the browser</p>
            <div class="py-8">
              <span class="material-symbols-outlined text-6xl text-primary">explore</span>
            </div>
          </div>
        </Show>

        <Show when={step() === 'preferences'}>
          <div class="space-y-6">
            <div class="text-center space-y-2">
              <h2 class="text-xl font-semibold">Preferences</h2>
              <p class="text-secondary text-sm">Configure your preferred settings</p>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-1">Coordinate System</label>
                <select
                  class="w-full px-3 py-2 rounded-lg bg-surface-hover border border-border focus:border-primary outline-none"
                  value={coordSystem()}
                  onChange={(e) => setCoordSystem(e.currentTarget.value as CoordSystem)}
                >
                  <option value="WGS84">WGS84</option>
                  <option value="UTM">UTM</option>
                  <option value="MGRS">MGRS</option>
                  <option value="BNG">British National Grid</option>
                  <option value="QTH">QTH (Maidenhead)</option>
                  <option value="KERTAU">Kertau 1948</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">Angle Unit</label>
                <select
                  class="w-full px-3 py-2 rounded-lg bg-surface-hover border border-border focus:border-primary outline-none"
                  value={angleUnit()}
                  onChange={(e) => setAngleUnit(e.currentTarget.value as AngleUnit)}
                >
                  <option value="degrees">Degrees (0-360°)</option>
                  <option value="mils">NATO Mils (0-6400)</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">Length Unit</label>
                <select
                  class="w-full px-3 py-2 rounded-lg bg-surface-hover border border-border focus:border-primary outline-none"
                  value={lengthUnit()}
                  onChange={(e) => setLengthUnit(e.currentTarget.value as LengthUnit)}
                >
                  <option value="metric">Metric (m, km)</option>
                  <option value="imperial">Imperial (ft, mi)</option>
                  <option value="nautical">Nautical (nm)</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">Theme</label>
                <select
                  class="w-full px-3 py-2 rounded-lg bg-surface-hover border border-border focus:border-primary outline-none"
                  value={theme()}
                  onChange={(e) => setTheme(e.currentTarget.value as Theme)}
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="system">System</option>
                </select>
              </div>
            </div>
          </div>
        </Show>

        <Show when={step() === 'done'}>
          <div class="text-center space-y-4">
            <div class="py-4">
              <span class="material-symbols-outlined text-6xl text-green-500">check_circle</span>
            </div>
            <h2 class="text-xl font-semibold">You're Ready!</h2>
            <p class="text-secondary">Start adding pins and exploring the map</p>
          </div>
        </Show>

        <div class="space-y-4">
          <div class="flex justify-center gap-2">
            <For each={STEPS}>
              {(_, i) => (
                <div
                  class="w-2 h-2 rounded-full transition-colors"
                  classList={{
                    'bg-primary': currentStep() === i(),
                    'bg-surface-hover': currentStep() !== i(),
                  }}
                />
              )}
            </For>
          </div>

          <div class="flex gap-2">
            <button
              class="px-4 py-2 rounded-lg bg-surface-hover hover:bg-surface-hover/80 transition-colors"
              classList={{ invisible: currentStep() === 0 }}
              onClick={handleBack}
            >
              Back
            </button>
            <div class="flex-1" />
            <button
              class="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
              onClick={handleNext}
            >
              {currentStep() === STEPS.length - 1 ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
