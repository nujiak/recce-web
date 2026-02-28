import './style.css';
import { init as initSettings } from './ui/settings.js';
import { init as initOnboarding } from './ui/onboarding.js';
import { init as initNav } from './ui/nav.js';
import { init as initMap } from './map/map.js';
import { init as initSaved, render as renderSaved } from './ui/saved.js';

document.addEventListener('DOMContentLoaded', () => {
  initSettings();
  initNav();
  initSaved();

  const showingOnboarding = initOnboarding();

  if (!showingOnboarding) {
    initMap();
    renderSaved();
  }

  window.addEventListener('onboardingComplete', () => {
    initMap();
    renderSaved();
  });
});
