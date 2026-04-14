import { createEffect, createSignal, onCleanup, onMount, Show } from 'solid-js';
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
import { DESKTOP_BREAKPOINT } from './utils/constants';

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
  // When any overlay is open we push a dummy "sentinel" entry onto the history
  // stack so that the browser back gesture/button pops it instead of leaving
  // the app. On popstate we close the topmost overlay and re-push the sentinel
  // if further overlays remain open. The sentinel is also removed reactively
  // when overlays are closed programmatically (e.g. tapping X or saving).

  const isMobile = () => window.innerWidth < DESKTOP_BREAKPOINT;

  // Ordered list of open states, highest priority first.
  // Returns true when at least one interceptable overlay is open.
  const backNavOpen = () =>
    markerPickerOpen() ||
    !!viewingPin() ||
    !!editingPin() ||
    !!viewingTrack() ||
    !!editingTrack() ||
    compassDialogOpen() ||
    firefoxDialogOpen() ||
    (isMobile() && activeNav() === 'tools' && activeTool() !== null) ||
    (isMobile() && activeNav() === 'tools') ||
    (isMobile() && activeNav() === 'saved');

  // Close only the topmost overlay; leave everything else untouched.
  const closeTopmost = () => {
    if (markerPickerOpen()) {
      setMarkerPickerOpen(false);
      return;
    }
    if (viewingPin()) {
      setViewingPin(null);
      return;
    }
    if (editingPin()) {
      setEditingPin(null);
      return;
    }
    if (viewingTrack()) {
      setViewingTrack(null);
      return;
    }
    if (editingTrack()) {
      setEditingTrack(null);
      return;
    }
    if (compassDialogOpen()) {
      setCompassDialogOpen(false);
      return;
    }
    if (firefoxDialogOpen()) {
      setFirefoxDialogOpen(false);
      return;
    }
    if (isMobile()) {
      if (activeNav() === 'tools' && activeTool() !== null) {
        setActiveTool(null); // tools panel → grid
        return;
      }
      if (activeNav() === 'tools' || activeNav() === 'saved') {
        setActiveNav('map');
        return;
      }
    }
  };

  // sentinelActive tracks whether we have pushed a sentinel entry.
  // ignoreNextPopstate suppresses the handler when we call history.back()
  // ourselves to remove a stale sentinel.
  let sentinelActive = false;
  let ignoreNextPopstate = false;

  const pushSentinel = () => {
    history.pushState({ backNav: true }, '');
    sentinelActive = true;
  };

  const popSentinel = () => {
    ignoreNextPopstate = true;
    sentinelActive = false;
    history.back();
  };

  onMount(() => {
    // Neutralise any leftover sentinel from a previous session so our
    // in-memory sentinelActive flag and history.state stay in sync.
    if (history.state?.backNav) {
      history.replaceState(null, '');
    }

    const onPopstate = () => {
      if (ignoreNextPopstate) {
        ignoreNextPopstate = false;
        return;
      }
      // Sentinel was popped by the user pressing back.
      sentinelActive = false;

      // Onboarding must not be dismissed via back — re-push immediately.
      if (!prefs.onboardingDone) {
        pushSentinel();
        return;
      }

      closeTopmost();

      // If additional overlays are still open, keep the sentinel in place.
      if (backNavOpen()) {
        pushSentinel();
      }
    };

    window.addEventListener('popstate', onPopstate);
    onCleanup(() => window.removeEventListener('popstate', onPopstate));
  });

  // Reactively maintain the sentinel: push when something opens,
  // remove when everything closes (programmatic close path).
  createEffect(() => {
    const open = backNavOpen();
    if (open && !sentinelActive) {
      pushSentinel();
    } else if (!open && sentinelActive) {
      popSentinel();
    }
  });
  // ---------- End back-navigation ----------

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
