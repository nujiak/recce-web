import { Component, onMount, onCleanup } from 'solid-js';
import {
  gpsPosition,
  setGpsPosition,
  gpsHeading,
  setGpsHeading,
  gpsPitch,
  setGpsPitch,
  gpsRoll,
  setGpsRoll,
  orientationAbsolute,
  setOrientationAbsolute,
} from '../stores/gps';

const GpsTracker: Component = () => {
  let watchId: number | null = null;
  // Pending orientation data — overwritten on every sensor event, flushed on rAF
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

  function startWatch() {
    if (!navigator.geolocation) return;
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsPosition(pos.coords);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 2000 }
    );
  }

  function handleOrientation(e: DeviceOrientationEvent) {
    const screenAngle = screen.orientation?.angle ?? 0;

    const ios = e as any;
    let heading: number;
    if (ios.webkitCompassHeading !== undefined) {
      heading = ios.webkitCompassHeading;
      pendingAbsolute = true;
    } else if (e.absolute && e.alpha !== null) {
      heading = (360 - e.alpha) % 360;
      pendingAbsolute = true;
    } else {
      return;
    }

    const beta = e.beta ?? 0;
    const gamma = e.gamma ?? 0;

    // Accumulate latest values; the rAF below will commit them at display rate
    switch (screenAngle) {
      case 90:
        pendingHeading = (heading + 90) % 360;
        pendingPitch = -gamma;
        pendingRoll = beta;
        break;
      case 270:
        pendingHeading = (heading - 90 + 360) % 360;
        pendingPitch = gamma;
        pendingRoll = -beta;
        break;
      case 180:
        pendingHeading = (heading + 180) % 360;
        pendingPitch = -beta;
        pendingRoll = -gamma;
        break;
      default:
        pendingHeading = heading;
        pendingPitch = beta;
        pendingRoll = gamma;
    }

    // Schedule a single flush per animation frame — drops intermediate readings
    if (rafId === null) {
      rafId = requestAnimationFrame(flushOrientation);
    }
  }

  async function requestOrientationPermission() {
    const doe = DeviceOrientationEvent as any;
    if (typeof doe.requestPermission === 'function') {
      try {
        const perm = await doe.requestPermission();
        if (perm === 'granted') {
          window.addEventListener('deviceorientationabsolute', handleOrientation as any, true);
          window.addEventListener('deviceorientation', handleOrientation as any, true);
        }
      } catch {}
    }
  }

  onMount(() => {
    startWatch();

    const doe = DeviceOrientationEvent as any;
    if (typeof doe.requestPermission !== 'function') {
      window.addEventListener('deviceorientationabsolute', handleOrientation as any, true);
      window.addEventListener('deviceorientation', handleOrientation as any, true);
    }
  });

  onCleanup(() => {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    if (rafId !== null) cancelAnimationFrame(rafId);
    window.removeEventListener('deviceorientationabsolute', handleOrientation as any, true);
    window.removeEventListener('deviceorientation', handleOrientation as any, true);
  });

  return null;
};

export const requestCompassPermission = async (): Promise<boolean> => {
  const doe = DeviceOrientationEvent as any;
  if (typeof doe.requestPermission === 'function') {
    try {
      const perm = await doe.requestPermission();
      return perm === 'granted';
    } catch {
      return false;
    }
  }
  return true;
};

export default GpsTracker;
