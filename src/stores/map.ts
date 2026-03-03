import { createSignal, createMemo } from 'solid-js';
import type { GeoPoint } from '@/types';

const [center, setCenter] = createSignal<GeoPoint>({ lat: 0, lng: 0 });
const [zoom, setZoom] = createSignal(2);
const [bearing, setBearing] = createSignal(0);
const [gpsPosition, setGpsPosition] = createSignal<GeoPoint | null>(null);
const [gpsAccuracy, setGpsAccuracy] = createSignal<number | null>(null);
const [isTracking, setIsTracking] = createSignal(false);

export const mapStore = {
  center,
  setCenter,
  zoom,
  setZoom,
  bearing,
  setBearing,
  gpsPosition,
  setGpsPosition,
  gpsAccuracy,
  setGpsAccuracy,
  isTracking,
  setIsTracking,

  hasGps: createMemo(() => gpsPosition() !== null),
};
