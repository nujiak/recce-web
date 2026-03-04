import { createStore } from 'solid-js/store';
import type { Prefs } from '../types';

const STORAGE_KEY = 'recce_prefs';

const defaultPrefs: Prefs = {
  coordinateSystem: 'WGS84',
  angleUnit: 'degrees',
  lengthUnit: 'metric',
  theme: 'dark',
  onboardingDone: false,
};

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultPrefs, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return defaultPrefs;
}

const [prefs, setPrefs] = createStore<Prefs>(loadPrefs());

export { prefs, setPrefs, STORAGE_KEY };
