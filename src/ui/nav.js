let currentTab = 'map';
let toolboxOpen = false;
let activeToolPanel = null;
let activeDesktopTool = null;
let accordionHeight = null;

const TOOL_TITLES = {
  gps: 'GPS / Compass',
  ruler: 'Ruler',
  settings: 'Settings',
};

export function init() {
  setupTabs();
  setupToolbox();
  setupDesktopTools();
  setupAccordionResize();
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
  if (tab === 'tools') {
    openToolbox();
    return;
  }

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
  const backdrop = document.getElementById('toolbox-backdrop');
  const closeBtn = document.getElementById('toolbox-close');
  const backBtn = document.getElementById('toolbox-back');
  const gridCards = document.querySelectorAll('.toolbox-grid-card');

  if (backdrop) {
    backdrop.addEventListener('click', closeToolbox);
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeToolbox);
  }

  if (backBtn) {
    backBtn.addEventListener('click', showToolGrid);
  }

  gridCards.forEach((card) => {
    card.addEventListener('click', () => {
      const tool = card.dataset.tool;
      showToolPanel(tool);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toolboxOpen) {
      closeToolbox();
    }
  });
}

function setupDesktopTools() {
  const desktopToolBtns = document.querySelectorAll('.desktop-tools-btn');
  desktopToolBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tool = btn.dataset.tool;
      toggleDesktopTool(tool);
    });
  });
}

function returnPanelToToolbox(panel) {
  const toolboxContent = document.querySelector('.toolbox-content');
  if (toolboxContent && panel) {
    toolboxContent.appendChild(panel);
  }
}

function toggleDesktopTool(tool) {
  const accordion = document.getElementById('desktop-tools-accordion');
  const toolBtns = document.querySelectorAll('.desktop-tools-btn');

  if (activeDesktopTool === tool) {
    const panel = document.getElementById(`${tool}-panel`);
    activeDesktopTool = null;
    returnPanelToToolbox(panel);
    if (accordion) accordion.classList.remove('open');
    toolBtns.forEach((btn) => btn.classList.remove('active'));
  } else {
    const panel = document.getElementById(`${tool}-panel`);
    if (activeDesktopTool) {
      const prevPanel = document.getElementById(`${activeDesktopTool}-panel`);
      returnPanelToToolbox(prevPanel);
    }
    activeDesktopTool = tool;
    if (accordion && panel) {
      const content = document.getElementById('desktop-tools-content');
      if (content) {
        content.appendChild(panel);
        panel.style.display = 'block';
      }
      if (!accordionHeight) {
        const parent = accordion.parentElement;
        if (parent) {
          accordionHeight = Math.floor(parent.offsetHeight * 0.5);
        }
      }
      accordion.style.height = `${accordionHeight}px`;
      accordion.classList.add('open');
      setupAccordionResize();
    }
    toolBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tool === tool);
    });
  }
}

function setupAccordionResize() {
  const handle = document.querySelector('.accordion-resize-handle');
  const accordion = document.getElementById('desktop-tools-accordion');
  if (!handle || !accordion) return;

  let isDragging = false;
  let startY = 0;
  let startHeight = 0;

  handle.addEventListener('pointerdown', (e) => {
    isDragging = true;
    startY = e.clientY;
    startHeight = accordion.offsetHeight;
    handle.setPointerCapture(e.pointerId);
  });

  handle.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const delta = startY - e.clientY;
    const newHeight = Math.max(
      100,
      Math.min(startHeight + delta, accordion.parentElement.offsetHeight * 0.8)
    );
    accordion.style.height = `${newHeight}px`;
    accordionHeight = newHeight;
  });

  handle.addEventListener('pointerup', (e) => {
    isDragging = false;
    handle.releasePointerCapture(e.pointerId);
  });
}

function openToolbox() {
  toolboxOpen = true;
  showToolGrid();
  const modal = document.getElementById('toolbox-modal');
  const backdrop = document.getElementById('toolbox-backdrop');
  if (modal) modal.classList.add('open');
  if (backdrop) backdrop.classList.add('open');
}

function closeToolbox() {
  toolboxOpen = false;
  activeToolPanel = null;
  const modal = document.getElementById('toolbox-modal');
  const backdrop = document.getElementById('toolbox-backdrop');
  if (modal) modal.classList.remove('open');
  if (backdrop) backdrop.classList.remove('open');
}

function showToolGrid() {
  activeToolPanel = null;
  const grid = document.getElementById('toolbox-grid');
  const panels = document.querySelectorAll('.toolbox-panel');
  const backBtn = document.getElementById('toolbox-back');
  const title = document.getElementById('toolbox-title');

  if (grid) grid.style.display = 'grid';
  panels.forEach((panel) => (panel.style.display = 'none'));
  if (backBtn) backBtn.style.display = 'none';
  if (title) title.textContent = 'Tools';
}

function showToolPanel(name) {
  activeToolPanel = name;
  const grid = document.getElementById('toolbox-grid');
  const panels = document.querySelectorAll('.toolbox-panel');
  const targetPanel = document.getElementById(`${name}-panel`);
  const backBtn = document.getElementById('toolbox-back');
  const title = document.getElementById('toolbox-title');

  if (grid) grid.style.display = 'none';
  panels.forEach((panel) => (panel.style.display = 'none'));
  if (targetPanel) targetPanel.style.display = 'block';
  if (backBtn) backBtn.style.display = 'flex';
  if (title) title.textContent = TOOL_TITLES[name] || 'Tools';
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

export function openToolPanel(name) {
  openToolbox();
  showToolPanel(name);
}

export function openDesktopTool(name) {
  toggleDesktopTool(name);
}
