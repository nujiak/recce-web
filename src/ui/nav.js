let currentTab = 'map';
let toolboxOpen = false;

export function init() {
  setupTabs();
  setupToolbox();
  applyInitialLayout();
}

function setupTabs() {
  const tabButtons = document.querySelectorAll('.nav-tab');
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      switchTab(tab);
    });
  });
}

export function switchTab(tab) {
  currentTab = tab;

  const tabButtons = document.querySelectorAll('.nav-tab');
  tabButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });

  const mapSurface = document.getElementById('map-surface');
  const savedSurface = document.getElementById('saved-surface');

  if (mapSurface && savedSurface) {
    mapSurface.classList.toggle('hidden', tab !== 'map');
    savedSurface.classList.toggle('hidden', tab !== 'saved');
  }
}

function setupToolbox() {
  const fab = document.getElementById('toolbox-fab');
  const backdrop = document.getElementById('toolbox-backdrop');
  const closeBtn = document.getElementById('toolbox-close');

  if (fab) {
    fab.addEventListener('click', openToolbox);
  }

  if (backdrop) {
    backdrop.addEventListener('click', closeToolbox);
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeToolbox);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toolboxOpen) {
      closeToolbox();
    }
  });
}

function openToolbox() {
  toolboxOpen = true;
  const modal = document.getElementById('toolbox-modal');
  const backdrop = document.getElementById('toolbox-backdrop');
  if (modal) modal.classList.add('open');
  if (backdrop) backdrop.classList.add('open');
}

function closeToolbox() {
  toolboxOpen = false;
  const modal = document.getElementById('toolbox-modal');
  const backdrop = document.getElementById('toolbox-backdrop');
  if (modal) modal.classList.remove('open');
  if (backdrop) backdrop.classList.remove('open');
}

function applyInitialLayout() {
  const savedSurface = document.getElementById('saved-surface');
  const mapSurface = document.getElementById('map-surface');
  if (savedSurface) savedSurface.classList.add('hidden');
  if (mapSurface) mapSurface.classList.remove('hidden');
}

export function getCurrentTab() {
  return currentTab;
}
