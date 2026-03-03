import {
  type Component,
  createSignal,
  onMount,
  onCleanup,
  Show,
  createEffect,
  For,
} from 'solid-js';
import { preferences } from '@/stores/preferences';
import { mapStore } from '@/stores/map';
import { CoordinateTransformer } from '@/coords';
import { formatBearing, formatDistance } from '@/utils/geo';
import { showToast } from '@/utils/toast';
import { copyToClipboard } from '@/utils/clipboard';

export const GpsPanel: Component = () => {
  const [watchId, setWatchId] = createSignal<number | null>(null);
  const [currentPosition, setCurrentPosition] = createSignal<{ lat: number; lng: number } | null>(
    null
  );
  const [accuracy, setAccuracy] = createSignal<number | null>(null);
  const [altitude, setAltitude] = createSignal<number | null>(null);
  const [gpsStatus, setGpsStatus] = createSignal<'inactive' | 'searching' | 'active' | 'error'>(
    'inactive'
  );

  const [azimuth, setAzimuth] = createSignal<number | null>(null);
  const [pitch, setPitch] = createSignal<number | null>(null);
  const [roll, setRoll] = createSignal<number | null>(null);
  const [compassStatus, setCompassStatus] = createSignal<
    'inactive' | 'active' | 'error' | 'permission'
  >('inactive');
  const [needleRotation, setNeedleRotation] = createSignal(0);

  const coordDisplay = () => {
    const pos = currentPosition();
    if (!pos) return '--';
    return CoordinateTransformer.toDisplay(pos.lat, pos.lng, preferences.coordSystem()) || '--';
  };

  const accuracyDisplay = () => {
    const acc = accuracy();
    if (acc === null) return '--';
    const unit = preferences.lengthUnit();
    if (unit === 'imperial') {
      return `±${Math.round(acc * 3.28084)} ft`;
    }
    return `±${Math.round(acc)} m`;
  };

  const altitudeDisplay = () => {
    const alt = altitude();
    if (alt === null) return '--';
    const unit = preferences.lengthUnit();
    if (unit === 'imperial') {
      return `${Math.round(alt * 3.28084)} ft`;
    }
    return `${Math.round(alt)} m`;
  };

  const azimuthDisplay = () => {
    const az = azimuth();
    if (az === null) return '--';
    return formatBearing(az, preferences.angleUnit());
  };

  const handleCopyCoord = async () => {
    const pos = currentPosition();
    if (!pos) return;
    try {
      await copyToClipboard(coordDisplay());
      showToast('Coordinates copied', 'success');
    } catch {
      showToast('Failed to copy', 'error');
    }
  };

  const startGPS = () => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      return;
    }

    setGpsStatus('searching');
    const id = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setAccuracy(position.coords.accuracy);
        setAltitude(position.coords.altitude);
        setGpsStatus('active');

        mapStore.setGpsPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        mapStore.setGpsAccuracy(position.coords.accuracy);
      },
      () => setGpsStatus('error'),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 30000 }
    );
    setWatchId(id);
  };

  const stopGPS = () => {
    const id = watchId();
    if (id !== null) {
      navigator.geolocation.clearWatch(id);
      setWatchId(null);
    }
    setGpsStatus('inactive');
    setCurrentPosition(null);
    setAccuracy(null);
    setAltitude(null);
  };

  const handleOrientation = (event: DeviceOrientationEvent) => {
    let az: number | null = null;
    if ((event as any).webkitCompassHeading !== undefined) {
      az = (event as any).webkitCompassHeading;
    } else if (event.alpha !== null && event.absolute) {
      az = 360 - event.alpha;
    } else if (event.alpha !== null) {
      az = 360 - event.alpha;
    }

    if (az !== null) {
      let delta = az - (needleRotation() % 360);
      while (delta > 180) delta -= 360;
      while (delta < -180) delta += 360;
      setNeedleRotation((prev) => prev + delta);
      setAzimuth(((az % 360) + 360) % 360);
    }

    if (event.beta !== null) setPitch(event.beta);
    if (event.gamma !== null) setRoll(event.gamma);
    setCompassStatus('active');
  };

  const requestCompassPermission = async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation, true);
          setCompassStatus('active');
        } else {
          setCompassStatus('error');
        }
      } catch {
        setCompassStatus('error');
      }
    }
  };

  const startCompass = () => {
    if (!window.DeviceOrientationEvent) {
      setCompassStatus('error');
      return;
    }

    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      setCompassStatus('permission');
    } else {
      window.addEventListener('deviceorientation', handleOrientation, true);
      setCompassStatus('active');
    }
  };

  onMount(() => {
    startGPS();
    startCompass();
  });

  onCleanup(() => {
    stopGPS();
    window.removeEventListener('deviceorientation', handleOrientation, true);
  });

  const generateGradations = () => {
    const cardinal = ['N', 'E', 'S', 'W'];
    const intermediate = ['NE', 'SE', 'SW', 'NW'];
    const items: { deg: number; label: string; cls: string }[] = [];

    for (let deg = 0; deg < 360; deg += 15) {
      const isCardinal = deg % 90 === 0;
      const isIntermediate = deg % 45 === 0 && !isCardinal;
      let label = '';
      let cls = 'compass-mark--tick';

      if (isCardinal) {
        label = cardinal[deg / 90];
        cls = 'compass-mark--cardinal';
      } else if (isIntermediate) {
        label = intermediate[(deg - 45) / 90];
        cls = 'compass-mark--intermediate';
      }
      items.push({ deg, label, cls });
    }
    return items;
  };

  return (
    <div class="space-y-4">
      <h3 class="flex items-center gap-2 text-lg font-semibold">
        <span class="material-symbols-outlined">satellite_alt</span>
        GPS
      </h3>

      <div class="rounded-lg bg-surface-hover p-4 space-y-3">
        <div class="flex justify-between items-center">
          <span class="font-medium">Location</span>
          <span
            class={`text-sm ${
              gpsStatus() === 'active'
                ? 'text-green-500'
                : gpsStatus() === 'error'
                  ? 'text-red-500'
                  : 'text-secondary'
            }`}
          >
            {gpsStatus() === 'inactive'
              ? 'Inactive'
              : gpsStatus() === 'searching'
                ? 'Searching...'
                : gpsStatus() === 'error'
                  ? 'Error'
                  : 'Active'}
          </span>
        </div>

        <div
          class="font-mono text-sm cursor-pointer hover:text-primary transition-colors"
          onClick={handleCopyCoord}
        >
          {coordDisplay()}
        </div>

        <div class="flex gap-4 text-sm text-secondary">
          <div>
            <span class="block">Altitude</span>
            <span class="font-mono">{altitudeDisplay()}</span>
          </div>
          <div>
            <span class="block">Accuracy</span>
            <span class="font-mono">{accuracyDisplay()}</span>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-surface-hover p-4 space-y-3">
        <div class="flex justify-between items-center">
          <span class="font-medium">Compass</span>
          <span
            class={`text-sm ${
              compassStatus() === 'active'
                ? 'text-green-500'
                : compassStatus() === 'error'
                  ? 'text-red-500'
                  : 'text-secondary'
            }`}
          >
            {compassStatus() === 'inactive'
              ? 'Inactive'
              : compassStatus() === 'permission'
                ? 'Tap to enable'
                : compassStatus() === 'error'
                  ? 'Error'
                  : 'Active'}
          </span>
        </div>

        <Show when={compassStatus() === 'permission'}>
          <button
            class="w-full py-2 rounded-lg bg-primary text-white"
            onClick={requestCompassPermission}
          >
            Enable Compass
          </button>
        </Show>

        <Show when={compassStatus() === 'active'}>
          <div class="flex justify-center">
            <div class="relative w-32 h-32">
              <svg viewBox="0 0 100 100" class="w-full h-full">
                <circle
                  cx="50"
                  cy="50"
                  r="48"
                  fill="none"
                  stroke="var(--color-border)"
                  stroke-width="1"
                />
                <For each={generateGradations()}>
                  {(item) => (
                    <g transform={`rotate(${item.deg} 50 50)`}>
                      <line
                        x1="50"
                        y1="4"
                        x2="50"
                        y2={item.cls === 'compass-mark--tick' ? 8 : 12}
                        stroke={
                          item.cls === 'compass-mark--cardinal'
                            ? 'var(--color-text)'
                            : 'var(--color-secondary)'
                        }
                        stroke-width={item.cls === 'compass-mark--cardinal' ? 2 : 1}
                      />
                    </g>
                  )}
                </For>
              </svg>
              <div
                class="absolute inset-0 flex items-center justify-center"
                style={{ transform: `rotate(${-needleRotation()}deg)` }}
              >
                <div class="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-red-500" />
              </div>
            </div>
          </div>

          <div class="flex justify-around text-sm">
            <div class="text-center">
              <span class="block text-secondary">Azimuth</span>
              <span class="font-mono">{azimuthDisplay()}</span>
            </div>
            <div class="text-center">
              <span class="block text-secondary">Pitch</span>
              <span class="font-mono">{pitch() !== null ? `${pitch()!.toFixed(1)}°` : '--'}</span>
            </div>
            <div class="text-center">
              <span class="block text-secondary">Roll</span>
              <span class="font-mono">{roll() !== null ? `${roll()!.toFixed(1)}°` : '--'}</span>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
};
