import { createEffect, createSignal, Show } from 'solid-js';
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
import { ToastRegion, showToastWithAction } from './components/ui/Toast';
import GpsTracker from './components/GpsTracker';
import PwaInstallDialog from './components/PwaInstallDialog';
import CompassPermissionDialog from './components/CompassPermissionDialog';
import { canInstallPWA, isFirefoxAndroid, isRunningAsPWA, promptPWAInstall } from './utils/pwa';

function applyTheme(theme: string) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const effective = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;
  document.documentElement.setAttribute('data-theme', effective);
}

function AppInner() {
  const [prefs] = usePrefs();
  const { activeNav, bumpSavedVersion } = useUI();
  const [firefoxDialogOpen, setFirefoxDialogOpen] = createSignal(false);
  const [compassDialogOpen, setCompassDialogOpen] = createSignal(false);

  createEffect(() => {
    applyTheme(prefs.theme);
  });

  // Show the compass permission dialog once per session, after onboarding is complete.
  // iOS requires an explicit user-gesture permission call; this gives up-front context
  // before the system prompt fires. Non-iOS devices never see this dialog.
  let compassPromptShown = false;
  createEffect(() => {
    if (!prefs.onboardingDone || compassPromptShown) return;
    const doe = DeviceOrientationEvent as any;
    if (typeof doe.requestPermission !== 'function') return;
    compassPromptShown = true;
    setCompassDialogOpen(true);
  });

  // Show the install prompt once, after onboarding is complete.
  let pwaPromptShown = false;
  createEffect(() => {
    if (!prefs.onboardingDone || pwaPromptShown || isRunningAsPWA()) return;
    pwaPromptShown = true;

    if (isFirefoxAndroid()) {
      // Firefox can't use beforeinstallprompt — show the toast but have the
      // action open the manual-instructions dialog instead.
      showToastWithAction(
        'Install Recce for offline use',
        {
          label: 'Install',
          onClick: (toastId) => {
            import('@kobalte/core').then(({ Toast }) => Toast.toaster.dismiss(toastId));
            setFirefoxDialogOpen(true);
          },
        },
        'info',
        10000
      );
      return;
    }

    // Chromium: wait briefly for beforeinstallprompt to fire after mount.
    setTimeout(() => {
      if (!canInstallPWA()) return;
      showToastWithAction(
        'Install Recce for offline use',
        {
          label: 'Install',
          onClick: async (toastId) => {
            const { Toast } = await import('@kobalte/core');
            Toast.toaster.dismiss(toastId);
            await promptPWAInstall();
          },
        },
        'info',
        10000
      );
    }, 500);
  });

  return (
    <>
      <GpsTracker />
      <Show when={!prefs.onboardingDone}>
        <OnboardingFlow />
      </Show>
      <PwaInstallDialog open={firefoxDialogOpen()} onClose={() => setFirefoxDialogOpen(false)} />
      <CompassPermissionDialog
        open={compassDialogOpen()}
        onClose={() => setCompassDialogOpen(false)}
      />

      <AppShell>
        {/* Map — always mounted to avoid reinitialisation on tab switch */}
        <MapView />

        {/* Saved screen (mobile) — absolute overlay above map */}
        <Show when={activeNav() === 'saved'}>
          <div
            style={{
              position: 'absolute',
              inset: '0',
              background: 'var(--color-bg)',
              'z-index': '20',
              overflow: 'hidden',
            }}
          >
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

      <ToastRegion />
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
