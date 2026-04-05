export type PinColor = 'red' | 'orange' | 'green' | 'azure' | 'violet';
export type CoordinateSystem = 'WGS84' | 'UTM' | 'MGRS' | 'BNG' | 'QTH' | 'KERTAU';
export type AngleUnit = 'degrees' | 'mils';
export type LengthUnit = 'metric' | 'imperial' | 'nautical';
export type Theme = 'light' | 'dark' | 'system';
export type MapStyle = 'default' | 'satellite';

export interface TrackNode {
  lat: number;
  lng: number;
  name?: string;
}

export interface Pin {
  id: number;
  createdAt: number;
  name: string;
  lat: number;
  lng: number;
  color: PinColor;
  group: string;
  description: string;
}

export interface Track {
  id: number;
  createdAt: number;
  name: string;
  nodes: TrackNode[];
  isCyclical: boolean;
  color: PinColor;
  group: string;
  description: string;
}

export interface Prefs {
  coordinateSystem: CoordinateSystem;
  angleUnit: AngleUnit;
  lengthUnit: LengthUnit;
  theme: Theme;
  mapStyle: MapStyle;
  onboardingDone: boolean;
  followPitch: boolean;
}

export interface CoordResult {
  lat: number;
  lng: number;
}

export type ToastType = 'success' | 'error' | 'info';
