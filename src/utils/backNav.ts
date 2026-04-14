/**
 * createBackNav — generic History API back-navigation interceptor.
 *
 * Maintains a single "sentinel" entry on the history stack while any
 * interceptable layer is open. When the user presses back the sentinel is
 * popped (not the real page), `closeTopmost()` fires, and the sentinel is
 * re-pushed if further layers remain.
 *
 * Usage
 * -----
 * Call inside a SolidJS component (onMount / onCleanup are used internally):
 *
 *   createBackNav(() => [
 *     { isOpen: markerPickerOpen,          close: () => setMarkerPickerOpen(false) },
 *     { isOpen: () => !!viewingPin(),       close: () => setViewingPin(null) },
 *     // … highest priority first
 *   ]);
 *
 * The `layers` accessor is re-evaluated reactively so you can derive entries
 * from signals. Layer priority is determined by array index (0 = highest).
 *
 * Onboarding guard
 * ----------------
 * Pass `canClose` to block dismissal while a condition is false (e.g. during
 * onboarding). The sentinel is still maintained, but `closeTopmost` is skipped.
 *
 *   createBackNav(() => [...], { canClose: () => prefs.onboardingDone });
 */

import { createEffect, onCleanup, onMount } from 'solid-js';

export interface BackNavLayer {
  /** Reactive getter — return true when this layer is open. */
  isOpen: () => boolean;
  /** Imperatively close this layer. */
  close: () => void;
}

interface BackNavOptions {
  /**
   * When this returns false, back-presses are absorbed without closing
   * anything (sentinel is re-pushed immediately). Defaults to always true.
   */
  canClose?: () => boolean;
}

export function createBackNav(layers: () => BackNavLayer[], options: BackNavOptions = {}): void {
  const { canClose = () => true } = options;

  let sentinelActive = false;
  let ignoreNextPopstate = false;

  const anyOpen = () => layers().some((l) => l.isOpen());

  const pushSentinel = () => {
    history.pushState({ backNav: true }, '');
    sentinelActive = true;
  };

  const popSentinel = () => {
    ignoreNextPopstate = true;
    sentinelActive = false;
    history.back();
  };

  const closeTopmost = () => {
    const open = layers().find((l) => l.isOpen());
    open?.close();
  };

  onMount(() => {
    // Neutralise any sentinel left by a previous session.
    if (history.state?.backNav) {
      history.replaceState(null, '');
    }

    const onPopstate = () => {
      if (ignoreNextPopstate) {
        ignoreNextPopstate = false;
        return;
      }

      sentinelActive = false;

      if (!canClose()) {
        // Blocked (e.g. onboarding) — re-push without closing.
        pushSentinel();
        return;
      }

      closeTopmost();

      if (anyOpen()) {
        pushSentinel();
      }
    };

    window.addEventListener('popstate', onPopstate);
    onCleanup(() => window.removeEventListener('popstate', onPopstate));
  });

  // Reactively maintain the sentinel for the programmatic-close path.
  createEffect(() => {
    const open = anyOpen();
    if (open && !sentinelActive) {
      pushSentinel();
    } else if (!open && sentinelActive) {
      popSentinel();
    }
  });
}
