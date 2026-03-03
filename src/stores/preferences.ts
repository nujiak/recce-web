import { createSignal, createEffect } from 'solid-js';
import type { Preferences, CoordSystem, AngleUnit, LengthUnit, Theme } from '@/types';

const STORAGE_KEY = 'recce_prefs';

const defaults: Preferences = {
  coordinateSystem: 'WGS84',
  angleUnit: 'degrees',
  lengthUnit: 'metric',
  theme: 'system',
  mapType: 'normal',
  onboardingDone: false,
};

function load(): Preferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
  } catch {
    return defaults;
  }
}

const [prefs, setPrefs] = createSignal<Preferences>(load());

createEffect(() => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs()));
});

export const preferences = {
  get: prefs,
  set: setPrefs,
  coordSystem: () => prefs().coordinateSystem,
  setCoordSystem: (v: CoordSystem) => setPrefs((p) => ({ ...p, coordinateSystem: v })),
  angleUnit: () => prefs().angleUnit,
  setAngleUnit: (v: AngleUnit) => setPrefs((p) => ({ ...p, angleUnit: v })),
  lengthUnit: () => prefs().lengthUnit,
  setLengthUnit: (v: LengthUnit) => setPrefs((p) => ({ ...p, lengthUnit: v })),
  theme: () => prefs().theme,
  setTheme: (v: Theme) => setPrefs((p) => ({ ...p, theme: v })),
  mapType: () => prefs().mapType,
  setMapType: (v: 'normal' | 'satellite') => setPrefs((p) => ({ ...p, mapType: v })),
  onboardingDone: () => prefs().onboardingDone,
  completeOnboarding: () => setPrefs((p) => ({ ...p, onboardingDone: true })),
};
