export type PinColor = 'red' | 'orange' | 'green' | 'azure' | 'violet';

export type CoordSystem = 'WGS84' | 'UTM' | 'MGRS' | 'BNG' | 'QTH' | 'KERTAU';

export type AngleUnit = 'degrees' | 'mils';

export type LengthUnit = 'metric' | 'imperial' | 'nautical';

export type Theme = 'light' | 'dark' | 'system';

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

export interface TrackNode {
  lat: number;
  lng: number;
  name?: string;
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

export interface Preferences {
  coordinateSystem: CoordSystem;
  angleUnit: AngleUnit;
  lengthUnit: LengthUnit;
  theme: Theme;
  mapType: 'normal' | 'satellite';
  onboardingDone: boolean;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}
