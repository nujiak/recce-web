import { Component, onMount, onCleanup } from 'solid-js';
import {
  setGpsPosition,
  setGpsHeading,
  setGpsPitch,
  setGpsRoll,
  setOrientationAbsolute,
} from '../stores/gps';

// ---------------------------------------------------------------------------
// Module-level orientation state
// Hoisted outside the component so requestCompassPermission (exported below)
// can attach the same handler without duplicating logic or creating closures.
// ---------------------------------------------------------------------------

let pendingHeading: number | null = null;
let pendingPitch: number | null = null;
let pendingRoll: number | null = null;
let pendingAbsolute = false;
let rafId: number | null = null;

function flushOrientation() {
  rafId = null;
  if (pendingHeading !== null) {
    setGpsHeading(pendingHeading);
    pendingHeading = null;
  }
  if (pendingPitch !== null) {
    setGpsPitch(pendingPitch);
    pendingPitch = null;
  }
  if (pendingRoll !== null) {
    setGpsRoll(pendingRoll);
    pendingRoll = null;
  }
  setOrientationAbsolute(pendingAbsolute);
}

function handleOrientation(e: DeviceOrientationEvent) {
  // screen.orientation is unavailable on older iOS Safari (<16.4); fall back to
  // the legacy window.orientation (0 | 90 | -90 | 180) before defaulting to 0.
  const screenAngle = screen.orientation?.angle ?? (window as any).orientation ?? 0;

  const ios = e as any;
  let heading: number;

  // iOS: webkitCompassHeading is already a true-north clockwise bearing.
  if (ios.webkitCompassHeading !== undefined) {
    heading = ios.webkitCompassHeading;
    pendingAbsolute = true;
    // W3C absolute (Android/Chrome): alpha=0 is north, counts CCW → invert.
  } else if (e.absolute && e.alpha !== null) {
    heading = (360 - e.alpha) % 360;
    pendingAbsolute = true;
    // Relative-only event — no magnetometer reference, unusable for compass.
  } else {
    return;
  }

  const beta = e.beta ?? 0;
  const gamma = e.gamma ?? 0;

  // Remap axes to compensate for screen orientation rotation.
  switch (screenAngle) {
    case 90:
    case -270:
      pendingHeading = (heading + 90) % 360;
      pendingPitch = -gamma;
      pendingRoll = beta;
      break;
    case -90:
    case 270:
      pendingHeading = (heading - 90 + 360) % 360;
      pendingPitch = gamma;
      pendingRoll = -beta;
      break;
    case 180:
    case -180:
      pendingHeading = (heading + 180) % 360;
      pendingPitch = -beta;
      pendingRoll = -gamma;
      break;
    default: // Portrait (0°)
      pendingHeading = heading;
      pendingPitch = beta;
      pendingRoll = gamma;
  }

  // Throttle signal updates to display rate — intermediate readings are dropped.
  if (rafId === null) {
    rafId = requestAnimationFrame(flushOrientation);
  }
}

function attachOrientationListeners() {
  window.addEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
  window.addEventListener('deviceorientation', handleOrientation as EventListener, true);
}

// ---------------------------------------------------------------------------
// Public API — called by GpsPanel on iOS after the user taps "Enable Compass"
// ---------------------------------------------------------------------------

export const requestCompassPermission = async (): Promise<boolean> => {
  const doe = DeviceOrientationEvent as any;
  if (typeof doe.requestPermission === 'function') {
    try {
      const perm = await doe.requestPermission();
      if (perm === 'granted') {
        attachOrientationListeners();
      }
      return perm === 'granted';
    } catch {
      return false;
    }
  }
  return true; // Non-iOS: always permitted (listeners attached at mount).
};

// ---------------------------------------------------------------------------
// Component — mounts once at the app root as a background service
// ---------------------------------------------------------------------------

const GpsTracker: Component = () => {
  let watchId: number | null = null;

  onMount(() => {
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => setGpsPosition(pos.coords),
        () => {},
        { enableHighAccuracy: true, maximumAge: 0 }
      );
    }

    // iOS 13+ requires an explicit user-gesture permission call before firing
    // orientation events. GpsPanel drives that flow; we only attach here for
    // platforms that don't gate on a permission prompt.
    if (typeof (DeviceOrientationEvent as any).requestPermission !== 'function') {
      attachOrientationListeners();
    }
  });

  onCleanup(() => {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    if (rafId !== null) cancelAnimationFrame(rafId);
    window.removeEventListener(
      'deviceorientationabsolute',
      handleOrientation as EventListener,
      true
    );
    window.removeEventListener('deviceorientation', handleOrientation as EventListener, true);
  });

  return null;
};

export default GpsTracker;
