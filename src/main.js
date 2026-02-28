import './style.css';
import { init as initSettings } from './ui/settings.js';
import { init as initOnboarding } from './ui/onboarding.js';
import { init as initNav } from './ui/nav.js';
import {
  init as initMap,
  addMarker,
  updateMarker,
  removeMarker,
  addTrack,
  updateTrack,
  removeTrack,
} from './map/map.js';
import { init as initSaved, render as renderSaved, refresh as refreshSaved } from './ui/saved.js';
import { init as initPinEditor, openCreate, openEdit } from './ui/pin-editor.js';
import { init as initPinInfo, open as openPinInfo } from './ui/pin-info.js';
import {
  init as initTrackEditor,
  openCreate as openTrackCreate,
  openEdit as openTrackEdit,
} from './ui/track-editor.js';
import { init as initTrackInfo, open as openTrackInfo } from './ui/track-info.js';
import { init as initGPS } from './ui/gps.js';
import { init as initRuler } from './ui/ruler.js';
import { initToast } from './utils/toast.js';
import { initKeyboardNavigation } from './utils/keyboard.js';
import { enableSwipeToDismissMultiple } from './utils/swipe.js';

// PWA Install prompt
let deferredInstallPrompt = null;

function initInstallPrompt() {
  const installBanner = document.getElementById('install-banner');
  const installAccept = document.getElementById('install-accept');
  const installDismiss = document.getElementById('install-dismiss');

  if (!installBanner || !installAccept || !installDismiss) return;

  // Check if already dismissed in this session or permanently
  const dismissed = localStorage.getItem('recce_install_dismissed');
  if (dismissed === 'permanent') return;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    installBanner.style.display = 'flex';
  });

  installAccept.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;

    installBanner.style.display = 'none';
    const result = await deferredInstallPrompt.prompt();

    if (result.outcome === 'accepted') {
      localStorage.setItem('recce_install_dismissed', 'permanent');
    }

    deferredInstallPrompt = null;
  });

  installDismiss.addEventListener('click', () => {
    installBanner.style.display = 'none';
    // Remember dismissal for this session
    sessionStorage.setItem('recce_install_dismissed', 'true');
  });

  // Handle successful installation
  window.addEventListener('appinstalled', () => {
    installBanner.style.display = 'none';
    localStorage.setItem('recce_install_dismissed', 'permanent');
    deferredInstallPrompt = null;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize toast system
  initToast();

  // Initialize keyboard navigation (global Escape handler + focus trap)
  initKeyboardNavigation();

  initSettings();
  initNav();
  initSaved();
  initPinEditor();
  initPinInfo();
  initTrackEditor();
  initTrackInfo();
  initGPS();
  initRuler();
  initInstallPrompt();

  // Enable swipe-to-dismiss for all bottom sheets
  enableSwipeToDismissMultiple([
    {
      sheet: document.getElementById('pin-editor'),
      backdrop: document.getElementById('pin-editor-backdrop'),
      onDismiss: () => {
        const dialog = document.getElementById('pin-editor');
        if (dialog?.classList.contains('open')) {
          dialog.classList.remove('open');
          document.getElementById('pin-editor-backdrop')?.classList.remove('open');
        }
      },
    },
    {
      sheet: document.getElementById('track-editor'),
      backdrop: document.getElementById('track-editor-backdrop'),
      onDismiss: () => {
        const dialog = document.getElementById('track-editor');
        if (dialog?.classList.contains('open')) {
          dialog.classList.remove('open');
          document.getElementById('track-editor-backdrop')?.classList.remove('open');
        }
      },
    },
  ]);

  const showingOnboarding = initOnboarding();

  if (!showingOnboarding) {
    initMap();
    renderSaved();
  }

  window.addEventListener('onboardingComplete', () => {
    initMap();
    renderSaved();
  });

  // Pin events
  window.addEventListener('openPinEditor', (e) => {
    const { lat, lng } = e.detail;
    openCreate(lat, lng, async (pin, wasEdit, isDeleted) => {
      if (isDeleted) {
        removeMarker(pin.id);
      } else if (wasEdit) {
        updateMarker(pin);
      } else {
        addMarker(pin);
      }
      await refreshSaved();
    });
  });

  window.addEventListener('pinClicked', (e) => {
    const { pin } = e.detail;
    openPinInfo(pin, (pinToEdit) => {
      openEdit(pinToEdit, async (updatedPin, wasEdit, isDeleted) => {
        if (isDeleted) {
          removeMarker(updatedPin.id);
        } else {
          updateMarker(updatedPin);
        }
        await refreshSaved();
      });
    });
  });

  window.addEventListener('pinCardClicked', (e) => {
    const { pin } = e.detail;
    openPinInfo(pin, (pinToEdit) => {
      openEdit(pinToEdit, async (updatedPin, wasEdit, isDeleted) => {
        if (isDeleted) {
          removeMarker(updatedPin.id);
        } else {
          updateMarker(updatedPin);
        }
        await refreshSaved();
      });
    });
  });

  // Track events
  window.addEventListener('openTrackEditor', (e) => {
    const { nodes } = e.detail;
    openTrackCreate(nodes, async (track, wasEdit, isDeleted) => {
      if (isDeleted) {
        removeTrack(track.id);
      } else if (wasEdit) {
        updateTrack(track);
      } else {
        addTrack(track);
      }
      await refreshSaved();
    });
  });

  window.addEventListener('trackClicked', (e) => {
    const { track } = e.detail;
    openTrackInfo(track, (trackToEdit) => {
      openTrackEdit(trackToEdit, async (updatedTrack, wasEdit, isDeleted) => {
        if (isDeleted) {
          removeTrack(updatedTrack.id);
        } else {
          updateTrack(updatedTrack);
        }
        await refreshSaved();
      });
    });
  });

  window.addEventListener('trackCardClicked', (e) => {
    const { track } = e.detail;
    openTrackInfo(track, (trackToEdit) => {
      openTrackEdit(trackToEdit, async (updatedTrack, wasEdit, isDeleted) => {
        if (isDeleted) {
          removeTrack(updatedTrack.id);
        } else {
          updateTrack(updatedTrack);
        }
        await refreshSaved();
      });
    });
  });

  // Import event - reload map markers and tracks
  window.addEventListener('dataImported', async () => {
    // Dispatch events to reload map
    window.dispatchEvent(new CustomEvent('reloadMapData'));
  });
});
