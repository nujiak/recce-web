import { Component, onMount, onCleanup, createSignal } from 'solid-js';
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
  const [iosPrompt, setIosPrompt] = createSignal(false);
  let watchId: number | null = null;

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
      setOrientationAbsolute(true);
    } else if (e.absolute && e.alpha !== null) {
      heading = (360 - e.alpha) % 360;
      setOrientationAbsolute(true);
    } else {
      return;
    }

    const beta = e.beta ?? 0;
    const gamma = e.gamma ?? 0;

    switch (screenAngle) {
      case 90:
        setGpsHeading((heading + 90) % 360);
        setGpsPitch(-gamma);
        setGpsRoll(beta);
        break;
      case 270:
        setGpsHeading((heading - 90 + 360) % 360);
        setGpsPitch(gamma);
        setGpsRoll(-beta);
        break;
      case 180:
        setGpsHeading((heading + 180) % 360);
        setGpsPitch(-beta);
        setGpsRoll(-gamma);
        break;
      default:
        setGpsHeading(heading);
        setGpsPitch(beta);
        setGpsRoll(gamma);
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
          setIosPrompt(false);
        }
      } catch {}
    }
  }

  onMount(() => {
    startWatch();

    const doe = DeviceOrientationEvent as any;
    if (typeof doe.requestPermission === 'function') {
      setIosPrompt(true);
    } else {
      window.addEventListener('deviceorientationabsolute', handleOrientation as any, true);
      window.addEventListener('deviceorientation', handleOrientation as any, true);
    }
  });

  onCleanup(() => {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
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
