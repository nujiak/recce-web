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
    const ios = e as any;
    if (ios.webkitCompassHeading !== undefined) {
      setGpsHeading(ios.webkitCompassHeading);
      setOrientationAbsolute(true);
    } else if (e.absolute && e.alpha !== null) {
      setGpsHeading((360 - e.alpha) % 360);
      setOrientationAbsolute(true);
    } else {
      return;
    }
    if (e.beta !== null) setGpsPitch(e.beta);
    if (e.gamma !== null) setGpsRoll(e.gamma);
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
