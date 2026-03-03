import { createEffect, Show } from 'solid-js';
import { PrefsProvider, usePrefs } from './context/PrefsContext';
import { UIProvider, useUI } from './context/UIContext';
import AppShell from './components/layout/AppShell';
import ToolboxModal from './components/nav/ToolboxModal';
import OnboardingFlow from './components/onboarding/OnboardingFlow';
import Toast from './components/Toast';

function applyTheme(theme: string) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const effective = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;
  document.documentElement.setAttribute('data-theme', effective);
}

function AppInner() {
  const [prefs] = usePrefs();
  const { activeNav } = useUI();

  createEffect(() => {
    applyTheme(prefs.theme);
  });

  return (
    <>
      <Show when={!prefs.onboardingDone}>
        <OnboardingFlow />
      </Show>

      <AppShell>
        {/* Map placeholder (Phase 7) */}
        <Show when={activeNav() === 'map'}>
          <div
            style={{
              height: '100%',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              'flex-direction': 'column',
              gap: '8px',
              color: 'var(--color-text-secondary)',
            }}
          >
            <span style={{ 'font-size': '2rem' }}>🗺️</span>
            <span style={{ 'font-size': '0.875rem' }}>Map (Phase 7)</span>
          </div>
        </Show>

        {/* Saved placeholder (Phase 5) */}
        <Show when={activeNav() === 'saved'}>
          <div
            id="saved-panel"
            style={{
              height: '100%',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              'flex-direction': 'column',
              gap: '8px',
              color: 'var(--color-text-secondary)',
            }}
          >
            <span style={{ 'font-size': '2rem' }}>🔖</span>
            <span style={{ 'font-size': '0.875rem' }}>Saved (Phase 5)</span>
          </div>
        </Show>

        {/* Tools modal (mobile) */}
        <ToolboxModal />
      </AppShell>

      <Toast />
    </>
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
