import type { CoordinateSystem, CoordResult } from '../types';

import * as wgs84 from './wgs84';
import * as mgrs from './mgrs';
import * as qth from './qth';

interface CoordModule {
  format: (lat: number, lng: number) => string | null;
  parse: (input: string) => CoordResult | null;
}

const lightSystems: Partial<Record<CoordinateSystem, CoordModule>> = {
  WGS84: wgs84,
  MGRS: mgrs,
  QTH: qth,
};

async function loadSystem(system: CoordinateSystem): Promise<CoordModule> {
  const existing = lightSystems[system];
  if (existing) return existing;

  switch (system) {
    case 'UTM': {
      const mod = await import('./utm');
      return mod;
    }
    case 'BNG': {
      const mod = await import('./bng');
      return mod;
    }
    case 'KERTAU': {
      const mod = await import('./kertau');
      return mod;
    }
    default:
      throw new Error(`Unknown coordinate system: ${system}`);
  }
}

export const CoordinateTransformer = {
  async toDisplay(lat: number, lng: number, system: CoordinateSystem): Promise<string | null> {
    const module = await loadSystem(system);
    if (!module || !module.format) return null;
    return module.format(lat, lng);
  },

  async parse(input: string, system: CoordinateSystem): Promise<CoordResult | null> {
    const module = await loadSystem(system);
    if (!module || !module.parse) return null;
    return module.parse(input);
  },

  async allSystems(lat: number, lng: number): Promise<Map<CoordinateSystem, string>> {
    const results = new Map<CoordinateSystem, string>();
    for (const name of SYSTEMS) {
      const display = await this.toDisplay(lat, lng, name);
      if (display !== null) {
        results.set(name, display);
      }
    }
    return results;
  },
};

export const SYSTEMS: CoordinateSystem[] = ['WGS84', 'UTM', 'MGRS', 'BNG', 'QTH', 'KERTAU'];

export const SYSTEM_NAMES: Record<CoordinateSystem, string> = {
  WGS84: 'WGS84',
  UTM: 'UTM',
  MGRS: 'MGRS',
  BNG: 'BNG (British National Grid)',
  QTH: 'QTH (Maidenhead)',
  KERTAU: 'RSO Malaya (m)',
};
