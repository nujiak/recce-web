import type { CoordSystem, GeoPoint } from '@/types';

export type { CoordSystem } from '@/types';
import * as wgs84 from './wgs84';
import * as utm from './utm';
import * as mgrs from './mgrs';
import * as bng from './bng';
import * as qth from './qth';
import * as kertau from './kertau';

const systems: Record<
  CoordSystem,
  { format: (lat: number, lng: number) => string | null; parse: (input: string) => GeoPoint | null }
> = {
  WGS84: wgs84,
  UTM: utm,
  MGRS: mgrs,
  BNG: bng,
  QTH: qth,
  KERTAU: kertau,
};

export const CoordinateTransformer = {
  toDisplay(lat: number, lng: number, system: CoordSystem): string | null {
    const module = systems[system];
    if (!module || !module.format) return null;
    return module.format(lat, lng);
  },

  parse(input: string, system: CoordSystem): GeoPoint | null {
    const module = systems[system];
    if (!module || !module.parse) return null;
    return module.parse(input);
  },

  allSystems(lat: number, lng: number): Map<CoordSystem, string> {
    const results = new Map<CoordSystem, string>();
    for (const name of Object.keys(systems) as CoordSystem[]) {
      const display = this.toDisplay(lat, lng, name);
      if (display !== null) {
        results.set(name, display);
      }
    }
    return results;
  },
};

export const SYSTEMS: CoordSystem[] = Object.keys(systems) as CoordSystem[];
