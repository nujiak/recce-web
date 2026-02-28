import './style.css';
import { init as initSettings } from './ui/settings.js';
import { init as initNav } from './ui/nav.js';
import { init as initMap } from './map/map.js';
import { init as initSaved, render as renderSaved } from './ui/saved.js';

document.addEventListener('DOMContentLoaded', () => {
  initSettings();
  initNav();
  initMap();
  initSaved();
  renderSaved();
});
