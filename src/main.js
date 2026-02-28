import './style.css';
import { init as initSettings } from './ui/settings.js';
import { init as initOnboarding } from './ui/onboarding.js';
import { init as initNav } from './ui/nav.js';
import { init as initMap, addMarker, updateMarker, removeMarker } from './map/map.js';
import { init as initSaved, render as renderSaved, refresh as refreshSaved } from './ui/saved.js';
import { init as initPinEditor, openCreate, openEdit } from './ui/pin-editor.js';
import { init as initPinInfo, open as openPinInfo } from './ui/pin-info.js';

document.addEventListener('DOMContentLoaded', () => {
  initSettings();
  initNav();
  initSaved();
  initPinEditor();
  initPinInfo();

  const showingOnboarding = initOnboarding();

  if (!showingOnboarding) {
    initMap();
    renderSaved();
  }

  window.addEventListener('onboardingComplete', () => {
    initMap();
    renderSaved();
  });

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
});
