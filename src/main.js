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

document.addEventListener('DOMContentLoaded', () => {
  // Initialize toast system
  initToast();

  initSettings();
  initNav();
  initSaved();
  initPinEditor();
  initPinInfo();
  initTrackEditor();
  initTrackInfo();
  initGPS();
  initRuler();

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
