import { createEffect } from 'solid-js';
import { PrefsProvider, usePrefs } from './context/PrefsContext';
import { UIProvider } from './context/UIContext';
import SettingsPanel from './components/settings/SettingsPanel';
import Toast from './components/Toast';

function applyTheme(theme: string) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const effective = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;
  document.documentElement.setAttribute('data-theme', effective);
}

function AppInner() {
  const [prefs] = usePrefs();

  createEffect(() => {
    applyTheme(prefs.theme);
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
          <p class="placeholder-hint">Phase 3: Global State &amp; Settings</p>
        </div>
        <SettingsPanel />
      </main>
      <Toast />
    </div>
  );
}

function App() {
  return (
    <PrefsProvider>
      <UIProvider>
        <AppInner />
      </UIProvider>
    </PrefsProvider>
  );
}

export default App;
