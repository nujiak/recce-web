import { createEffect, Show } from 'solid-js';
import { PrefsProvider, usePrefs } from './context/PrefsContext';
import { UIProvider, useUI } from './context/UIContext';
import AppShell from './components/layout/AppShell';
import ToolboxModal from './components/nav/ToolboxModal';
import OnboardingFlow from './components/onboarding/OnboardingFlow';
import SavedScreen from './components/saved/SavedScreen';
import MapView from './components/map/MapView';
import PinEditor from './components/pin/PinEditor';
import PinInfo from './components/pin/PinInfo';
import TrackEditor from './components/track/TrackEditor';
import TrackInfo from './components/track/TrackInfo';
import Toast from './components/Toast';

function applyTheme(theme: string) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const effective = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;
  document.documentElement.setAttribute('data-theme', effective);
}

function AppInner() {
  const [prefs] = usePrefs();
  const { activeNav, bumpSavedVersion } = useUI();

  createEffect(() => {
    applyTheme(prefs.theme);
  });

  return (
    <>
      <Show when={!prefs.onboardingDone}>
        <OnboardingFlow />
      </Show>

      <AppShell>
        {/* Map — always mounted to avoid reinitialisation on tab switch */}
        <MapView />

        {/* Saved screen (mobile) — absolute overlay above map */}
        <Show when={activeNav() === 'saved'}>
          <div style={{ position: 'absolute', inset: '0', background: 'var(--color-bg)', 'z-index': '20', overflow: 'hidden' }}>
            <SavedScreen />
          </div>
        </Show>

        {/* Tools modal (mobile) */}
        <ToolboxModal />
      </AppShell>

      {/* Pin / Track editors & info modals */}
      <PinEditor onSaved={bumpSavedVersion} />
      <PinInfo />
      <TrackEditor onSaved={bumpSavedVersion} />
      <TrackInfo />

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
