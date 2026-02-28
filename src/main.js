import './style.css';
import { init as initMap } from './map/map.js';
import { init as initNav } from './ui/nav.js';
import { init as initSaved, render as renderSaved } from './ui/saved.js';

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initMap();
  initSaved();
  renderSaved();
});
