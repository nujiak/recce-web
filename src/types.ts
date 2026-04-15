export type PinColor = 'red' | 'orange' | 'green' | 'azure' | 'violet';
export type MarkerType = 'pin' | 'arrow';
export type CoordinateSystem = 'WGS84' | 'UTM' | 'MGRS' | 'BNG' | 'QTH' | 'KERTAU';
export type AngleUnit = 'degrees' | 'mils';

export const ANGLE_UNIT_OPTIONS: { value: AngleUnit; label: string }[] = [
  { value: 'degrees', label: 'Degrees (0-360)' },
  { value: 'mils', label: 'NATO Mils (0-6400)' },
];

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
  markerType: MarkerType;
  bearing: number;
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

export type LocationMode = 'unavailable' | 'available' | 'following' | 'following-bearing';
