const STORAGE_KEY = 'recce_prefs';

const DEFAULT_PREFS = {
  coordinateSystem: 'KERTAU',
  angleUnit: 'degrees',
  lengthUnit: 'metric',
  theme: 'dark',
  mapType: 'normal',
  onboardingDone: false,
};

let prefs = { ...DEFAULT_PREFS };

export function init() {
  loadPrefs();
  applyPrefs();
  setupSettingsPanel();
}

function loadPrefs() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      prefs = { ...DEFAULT_PREFS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.warn('Failed to load preferences:', e);
  }
}

export function savePrefs(newPrefs) {
  prefs = { ...prefs, ...newPrefs };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.warn('Failed to save preferences:', e);
  }
  applyPrefs();
}

export function getPrefs() {
  return { ...prefs };
}

function applyPrefs() {
  const html = document.documentElement;

  html.setAttribute('data-theme', prefs.theme);
}

function setupSettingsPanel() {
  const panel = document.getElementById('settings-panel');
  if (!panel) return;

  panel.innerHTML = `
    <h3>
      <span class="material-symbols-outlined">settings</span>
      Settings
    </h3>
    <div class="settings-form">
      <div class="setting-row">
        <label for="pref-coord-system">Coordinate System</label>
        <select id="pref-coord-system">
          <option value="WGS84">WGS84</option>
          <option value="UTM">UTM</option>
          <option value="MGRS">MGRS</option>
          <option value="BNG">British National Grid</option>
          <option value="QTH">QTH (Maidenhead)</option>
          <option value="KERTAU">Kertau 1948</option>
        </select>
      </div>
      <div class="setting-row">
        <label for="pref-angle-unit">Angle Unit</label>
        <select id="pref-angle-unit">
          <option value="degrees">Degrees (0-360°)</option>
          <option value="mils">NATO Mils (0-6400)</option>
        </select>
      </div>
      <div class="setting-row">
        <label for="pref-length-unit">Length Unit</label>
        <select id="pref-length-unit">
          <option value="metric">Metric (m, km)</option>
          <option value="imperial">Imperial (ft, mi)</option>
          <option value="nautical">Nautical (nm)</option>
        </select>
      </div>
      <div class="setting-row">
        <label for="pref-theme">Theme</label>
        <select id="pref-theme">
          <option value="dark">Dark</option>
          <option value="light">Light</option>
          <option value="system">System</option>
        </select>
      </div>
    </div>
  `;

  const coordSelect = document.getElementById('pref-coord-system');
  const angleSelect = document.getElementById('pref-angle-unit');
  const lengthSelect = document.getElementById('pref-length-unit');
  const themeSelect = document.getElementById('pref-theme');

  coordSelect.value = prefs.coordinateSystem;
  angleSelect.value = prefs.angleUnit;
  lengthSelect.value = prefs.lengthUnit;
  themeSelect.value = prefs.theme;

  coordSelect.addEventListener('change', () => {
    savePrefs({ coordinateSystem: coordSelect.value });
    window.dispatchEvent(
      new CustomEvent('prefsChanged', {
        detail: { key: 'coordinateSystem', value: coordSelect.value },
      })
    );
  });

  angleSelect.addEventListener('change', () => {
    savePrefs({ angleUnit: angleSelect.value });
    window.dispatchEvent(
      new CustomEvent('prefsChanged', {
        detail: { key: 'angleUnit', value: angleSelect.value },
      })
    );
  });

  lengthSelect.addEventListener('change', () => {
    savePrefs({ lengthUnit: lengthSelect.value });
    window.dispatchEvent(
      new CustomEvent('prefsChanged', {
        detail: { key: 'lengthUnit', value: lengthSelect.value },
      })
    );
  });

  themeSelect.addEventListener('change', () => {
    savePrefs({ theme: themeSelect.value });
    window.dispatchEvent(
      new CustomEvent('prefsChanged', {
        detail: { key: 'theme', value: themeSelect.value },
      })
    );
  });
}

export { prefs };
