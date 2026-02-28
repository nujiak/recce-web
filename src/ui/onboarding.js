import { savePrefs, getPrefs } from './settings.js';

const STEPS = ['welcome', 'preferences', 'done'];

let currentStep = 0;
let onboardingElement = null;
let originalTheme = null;

export function init() {
  const prefs = getPrefs();
  if (prefs.onboardingDone) {
    return false;
  }

  showOnboarding();
  return true;
}

function showOnboarding() {
  originalTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', 'dark');

  const app = document.getElementById('app');
  if (!app) return;

  onboardingElement = document.createElement('div');
  onboardingElement.id = 'onboarding';
  onboardingElement.className = 'onboarding';
  onboardingElement.innerHTML = `
    <div class="onboarding-content">
      <div class="onboarding-step" data-step="welcome">
        <h1 class="onboarding-title">Recce</h1>
        <p class="onboarding-subtitle">A mapping and reconnaissance utility for the browser</p>
        <div class="onboarding-icon">
          <span class="material-symbols-outlined">explore</span>
        </div>
      </div>
      
      <div class="onboarding-step hidden" data-step="preferences">
        <h2 class="onboarding-heading">Preferences</h2>
        <p class="onboarding-desc">Configure your preferred settings</p>
        <div class="onboarding-form">
          <div class="onboarding-field">
            <label for="onboard-coord-system">Coordinate System</label>
            <select id="onboard-coord-system">
              <option value="WGS84">WGS84</option>
              <option value="UTM">UTM</option>
              <option value="MGRS">MGRS</option>
              <option value="BNG">British National Grid</option>
              <option value="QTH">QTH (Maidenhead)</option>
              <option value="KERTAU" selected>Kertau 1948</option>
            </select>
          </div>
          <div class="onboarding-field">
            <label for="onboard-angle-unit">Angle Unit</label>
            <select id="onboard-angle-unit">
              <option value="degrees" selected>Degrees (0-360°)</option>
              <option value="mils">NATO Mils (0-6400)</option>
            </select>
          </div>
          <div class="onboarding-field">
            <label for="onboard-length-unit">Length Unit</label>
            <select id="onboard-length-unit">
              <option value="metric" selected>Metric (m, km)</option>
              <option value="imperial">Imperial (ft, mi)</option>
              <option value="nautical">Nautical (nm)</option>
            </select>
          </div>
          <div class="onboarding-field">
            <label for="onboard-theme">Theme</label>
            <select id="onboard-theme">
              <option value="dark" selected>Dark</option>
              <option value="light">Light</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>
      </div>
      
      <div class="onboarding-step hidden" data-step="done">
        <div class="onboarding-icon">
          <span class="material-symbols-outlined">check_circle</span>
        </div>
        <h2 class="onboarding-heading">You're Ready!</h2>
        <p class="onboarding-desc">Start adding pins and exploring the map</p>
      </div>
      
      <div class="onboarding-nav">
        <div class="onboarding-dots">
          ${STEPS.map((_, i) => `<span class="dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`).join('')}
        </div>
        <div class="onboarding-buttons">
          <button id="onboard-back" class="btn-secondary" style="visibility: hidden;">Back</button>
          <button id="onboard-next" class="btn-primary">Next</button>
        </div>
      </div>
    </div>
  `;

  app.style.display = 'none';
  document.body.appendChild(onboardingElement);

  setupOnboardingEvents();
}

function setupOnboardingEvents() {
  const nextBtn = document.getElementById('onboard-next');
  const backBtn = document.getElementById('onboard-back');

  if (nextBtn) {
    nextBtn.addEventListener('click', handleNext);
  }

  if (backBtn) {
    backBtn.addEventListener('click', handleBack);
  }

  const coordSelect = document.getElementById('onboard-coord-system');
  const angleSelect = document.getElementById('onboard-angle-unit');
  const lengthSelect = document.getElementById('onboard-length-unit');
  const themeSelect = document.getElementById('onboard-theme');

  if (coordSelect) {
    coordSelect.addEventListener('change', () => {
      savePrefs({ coordinateSystem: coordSelect.value });
    });
  }

  if (angleSelect) {
    angleSelect.addEventListener('change', () => {
      savePrefs({ angleUnit: angleSelect.value });
    });
  }

  if (lengthSelect) {
    lengthSelect.addEventListener('change', () => {
      savePrefs({ lengthUnit: lengthSelect.value });
    });
  }

  if (themeSelect) {
    themeSelect.addEventListener('change', () => {
      savePrefs({ theme: themeSelect.value });
      originalTheme = themeSelect.value;
    });
  }
}

function handleNext() {
  if (currentStep === STEPS.length - 1) {
    completeOnboarding();
    return;
  }

  currentStep++;
  updateStep();
}

function handleBack() {
  if (currentStep === 0) return;

  currentStep--;
  updateStep();
}

function updateStep() {
  const steps = onboardingElement.querySelectorAll('.onboarding-step');
  const dots = onboardingElement.querySelectorAll('.dot');
  const backBtn = document.getElementById('onboard-back');
  const nextBtn = document.getElementById('onboard-next');

  steps.forEach((step, i) => {
    step.classList.toggle('hidden', i !== currentStep);
  });

  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === currentStep);
  });

  if (backBtn) {
    backBtn.style.visibility = currentStep === 0 ? 'hidden' : 'visible';
  }

  if (nextBtn) {
    nextBtn.textContent = currentStep === STEPS.length - 1 ? 'Get Started' : 'Next';
  }
}

function completeOnboarding() {
  savePrefs({ onboardingDone: true });

  document.documentElement.setAttribute('data-theme', originalTheme);

  if (onboardingElement) {
    onboardingElement.remove();
    onboardingElement = null;
  }

  const app = document.getElementById('app');
  if (app) {
    app.style.display = '';
  }

  window.dispatchEvent(new CustomEvent('onboardingComplete'));
}
