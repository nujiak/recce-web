import type { LngLatLike } from 'maplibre-gl';

export interface MapOptions {
  container: HTMLElement;
  style?: string;
  center?: LngLatLike;
  zoom?: number;
  bearing?: number;
  pitch?: number;
}

export interface MapInstanceState {
  center: { lat: number; lng: number };
  zoom: number;
  bearing: number;
}

export interface MarkerClickEvent {
  pinId: number;
  originalEvent: MouseEvent;
}

export interface TrackClickEvent {
  trackId: number;
  originalEvent: MouseEvent;
}
