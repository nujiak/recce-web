import type { CoordinateSystem, CoordResult } from '../types';

import * as wgs84 from './wgs84';
import * as utm from './utm';
import * as mgrs from './mgrs';
import * as bng from './bng';
import * as qth from './qth';
import * as kertau from './kertau';

interface CoordModule {
  format: (lat: number, lng: number) => string | null;
  parse: (input: string) => CoordResult | null;
}

const systems: Record<CoordinateSystem, CoordModule> = {
  WGS84: wgs84,
  UTM: utm,
  MGRS: mgrs,
  BNG: bng,
  QTH: qth,
  KERTAU: kertau,
};

export const CoordinateTransformer = {
  toDisplay(lat: number, lng: number, system: CoordinateSystem): string | null {
    const module = systems[system];
    if (!module || !module.format) return null;
    return module.format(lat, lng);
  },

  parse(input: string, system: CoordinateSystem): CoordResult | null {
    const module = systems[system];
    if (!module || !module.parse) return null;
    return module.parse(input);
  },

  allSystems(lat: number, lng: number): Map<CoordinateSystem, string> {
    const results = new Map<CoordinateSystem, string>();
    for (const name of Object.keys(systems) as CoordinateSystem[]) {
      const display = this.toDisplay(lat, lng, name);
      if (display !== null) {
        results.set(name, display);
      }
    }
    return results;
  },
};

export const SYSTEMS: CoordinateSystem[] = Object.keys(systems) as CoordinateSystem[];

export const SYSTEM_NAMES: Record<CoordinateSystem, string> = {
  WGS84: 'WGS84',
  UTM: 'UTM',
  MGRS: 'MGRS',
  BNG: 'BNG (British National Grid)',
  QTH: 'QTH (Maidenhead)',
  KERTAU: 'RSO Malaya (m)',
};
