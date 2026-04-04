/**
 * PWA install prompt utilities.
 *
 * The browser fires `beforeinstallprompt` when the app is installable but not
 * yet running in standalone mode. We capture it here so any component can
 * trigger the native install flow without worrying about timing.
 */

import { createSignal } from 'solid-js';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const [installPrompt, setInstallPrompt] = createSignal<BeforeInstallPromptEvent | null>(null);

/** True when the browser has indicated the app can be installed. */
export const canInstallPWA = () => installPrompt() !== null;

/** True when the app is already running as an installed PWA. */
export const isRunningAsPWA = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  // iOS Safari
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

/**
 * True on Firefox for Android.
 * Firefox does not fire `beforeinstallprompt`, so we use UA sniffing to detect
 * it and show manual installation instructions instead.
 */
export const isFirefoxAndroid = () =>
  /Firefox\/\d+/.test(navigator.userAgent) && /Android/.test(navigator.userAgent);

/**
 * Trigger the browser's native install prompt.
 * Resolves to the user's choice, or `null` if no prompt is available.
 */
export async function promptPWAInstall(): Promise<'accepted' | 'dismissed' | null> {
  const evt = installPrompt();
  if (!evt) return null;
  await evt.prompt();
  const { outcome } = await evt.userChoice;
  // The prompt can only be used once; clear it.
  setInstallPrompt(null);
  return outcome;
}

// Listen as early as possible so we never miss the event.
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  setInstallPrompt(e as BeforeInstallPromptEvent);
});

// Clear the prompt once the app has been installed.
window.addEventListener('appinstalled', () => {
  setInstallPrompt(null);
});
