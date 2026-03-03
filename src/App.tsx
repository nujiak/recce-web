import { createEffect, createSignal, onMount } from 'solid-js';

interface Prefs {
  theme: 'light' | 'dark' | 'system';
  onboardingDone: boolean;
}

const defaultPrefs: Prefs = {
  theme: 'dark',
  onboardingDone: false,
};

function getStoredPrefs(): Prefs {
  try {
    const stored = localStorage.getItem('recce_prefs');
    if (stored) {
      return { ...defaultPrefs, ...JSON.parse(stored) };
    }
  } catch {
    // ignore
  }
  return defaultPrefs;
}

function applyTheme(theme: 'light' | 'dark' | 'system') {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const effectiveTheme = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;
  document.documentElement.setAttribute('data-theme', effectiveTheme);
}

function App() {
  const [prefs] = createSignal<Prefs>(getStoredPrefs());

  onMount(() => {
    applyTheme(prefs().theme);
  });

  createEffect(() => {
    const currentPrefs = prefs();
    try {
      localStorage.setItem('recce_prefs', JSON.stringify(currentPrefs));
    } catch {
      // ignore
    }
    applyTheme(currentPrefs.theme);
  });

  return (
    <div class="app-shell">
      <header class="app-header">
        <h1>Recce</h1>
      </header>
      <main class="app-main">
        <div class="placeholder-content">
          <div class="placeholder-icon">🗺️</div>
          <h2>Migration in Progress</h2>
          <p>The app is being migrated to SolidJS + TypeScript + Tailwind v4.</p>
          <p class="placeholder-hint">Phase 1: Tooling & Scaffold</p>
        </div>
      </main>
    </div>
  );
}

export default App;
