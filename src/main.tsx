import { render } from 'solid-js/web';
import { App } from './components/App';
import './styles/tailwind.css';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;
let installTimeout: ReturnType<typeof setTimeout> | null = null;

function showInstallBanner(banner: HTMLElement) {
  if (!banner.querySelector('.install-progress-bar')) {
    const progressContainer = document.createElement('div');
    progressContainer.className = 'install-progress-bar';
    progressContainer.innerHTML = '<div class="install-progress-fill"></div>';
    banner.appendChild(progressContainer);
  }

  const progressFill = banner.querySelector('.install-progress-fill') as HTMLElement | null;
  if (progressFill) {
    progressFill.style.animation = 'none';
    void progressFill.offsetWidth;
    progressFill.style.animation = '';
  }

  banner.classList.add('show');

  installTimeout = setTimeout(() => {
    hideInstallBanner(banner);
    sessionStorage.setItem('recce_install_dismissed', 'true');
  }, 10000);
}

function hideInstallBanner(banner: HTMLElement) {
  if (installTimeout) {
    clearTimeout(installTimeout);
    installTimeout = null;
  }
  banner.classList.remove('show');
}

function initInstallPrompt() {
  const installBanner = document.getElementById('install-banner');
  const installAccept = document.getElementById('install-accept');
  const installDismiss = document.getElementById('install-dismiss');

  if (!installBanner || !installAccept || !installDismiss) return;

  const dismissed = localStorage.getItem('recce_install_dismissed');
  if (dismissed === 'permanent') return;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e as BeforeInstallPromptEvent;
    showInstallBanner(installBanner);
  });

  installAccept.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;

    hideInstallBanner(installBanner);
    const result = await deferredInstallPrompt.prompt();

    if (result.outcome === 'accepted') {
      localStorage.setItem('recce_install_dismissed', 'permanent');
    }

    deferredInstallPrompt = null;
  });

  installDismiss.addEventListener('click', () => {
    hideInstallBanner(installBanner);
    sessionStorage.setItem('recce_install_dismissed', 'true');
  });

  window.addEventListener('appinstalled', () => {
    hideInstallBanner(installBanner);
    localStorage.setItem('recce_install_dismissed', 'permanent');
    deferredInstallPrompt = null;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initInstallPrompt();
});

render(() => <App />, document.getElementById('root')!);
