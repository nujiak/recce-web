import { createEffect, createSignal, lazy, Show, Suspense } from 'solid-js';
import { PrefsProvider, usePrefs } from './context/PrefsContext';
import { UIProvider, useUI } from './context/UIContext';
import { createBackNav } from './utils/backNav';
import AppShell from './components/layout/AppShell';
import { ToastRegion, showToastWithAction } from './components/ui/Toast';
import GpsTracker from './components/GpsTracker';
import PwaInstallDialog from './components/PwaInstallDialog';
import CompassPermissionDialog from './components/CompassPermissionDialog';
import LoadingFallback from './components/ui/LoadingFallback';
import { canInstallPWA, isFirefoxAndroid, isRunningAsPWA, promptPWAInstall } from './utils/pwa';
import { DESKTOP_BREAKPOINT } from './utils/constants';

const MapView = lazy(() => import('./components/map/MapView'));
const OnboardingFlow = lazy(() => import('./components/onboarding/OnboardingFlow'));
const SavedScreen = lazy(() => import('./components/saved/SavedScreen'));
const PinEditor = lazy(() => import('./components/pin/PinEditor'));
const PinInfo = lazy(() => import('./components/pin/PinInfo'));
const TrackEditor = lazy(() => import('./components/track/TrackEditor'));
const TrackInfo = lazy(() => import('./components/track/TrackInfo'));
const ToolboxModal = lazy(() => import('./components/nav/ToolboxModal'));

function applyTheme(theme: string) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const effective = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;
  document.documentElement.setAttribute('data-theme', effective);
}

function AppInner() {
  const [prefs] = usePrefs();
  const {
    activeNav,
    setActiveNav,
    activeTool,
    setActiveTool,
    editingPin,
    setEditingPin,
    viewingPin,
    setViewingPin,
    markerPickerOpen,
    setMarkerPickerOpen,
    editingTrack,
    setEditingTrack,
    viewingTrack,
    setViewingTrack,
    bumpSavedVersion,
  } = useUI();
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

  // ---------- Back-navigation via History API sentinel ----------
  // Priority-ordered layers: index 0 is closed first on back press.
  // To add a new interceptable overlay, append an entry here.
  const isMobile = () => window.innerWidth < DESKTOP_BREAKPOINT;

  createBackNav(
    () => [
      { isOpen: markerPickerOpen, close: () => setMarkerPickerOpen(false) },
      { isOpen: () => !!viewingPin(), close: () => setViewingPin(null) },
      { isOpen: () => !!editingPin(), close: () => setEditingPin(null) },
      { isOpen: () => !!viewingTrack(), close: () => setViewingTrack(null) },
      { isOpen: () => !!editingTrack(), close: () => setEditingTrack(null) },
      { isOpen: compassDialogOpen, close: () => setCompassDialogOpen(false) },
      { isOpen: firefoxDialogOpen, close: () => setFirefoxDialogOpen(false) },
      // Mobile-only: tool panel → tools grid → map tab
      {
        isOpen: () => isMobile() && activeNav() === 'tools' && activeTool() !== null,
        close: () => setActiveTool(null),
      },
      {
        isOpen: () => isMobile() && (activeNav() === 'tools' || activeNav() === 'saved'),
        close: () => setActiveNav('map'),
      },
    ],
    { canClose: () => prefs.onboardingDone }
  );
  // ---------- End back-navigation ----------

  return (
    <>
      <GpsTracker />
      <Suspense fallback={null}>
        <Show when={!prefs.onboardingDone}>
          <OnboardingFlow />
        </Show>
      </Suspense>
      <PwaInstallDialog open={firefoxDialogOpen()} onClose={() => setFirefoxDialogOpen(false)} />
      <CompassPermissionDialog
        open={compassDialogOpen()}
        onClose={() => setCompassDialogOpen(false)}
      />

      <AppShell>
        {/* Map — always mounted to avoid reinitialisation on tab switch */}
        <Suspense fallback={<LoadingFallback />}>
          <MapView />
        </Suspense>

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
            <Suspense fallback={<LoadingFallback />}>
              <SavedScreen />
            </Suspense>
          </div>
        </Show>

        {/* Tools modal (mobile) */}
        <Suspense fallback={null}>
          <ToolboxModal />
        </Suspense>
      </AppShell>

      {/* Pin / Track editors & info modals */}
      <Suspense fallback={null}>
        <PinEditor onSaved={bumpSavedVersion} />
      </Suspense>
      <Suspense fallback={null}>
        <PinInfo />
      </Suspense>
      <Suspense fallback={null}>
        <TrackEditor onSaved={bumpSavedVersion} />
      </Suspense>
      <Suspense fallback={null}>
        <TrackInfo />
      </Suspense>

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
