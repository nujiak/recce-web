import * as wgs84 from './wgs84.js';
import * as utm from './utm.js';
import * as mgrs from './mgrs.js';
import * as bng from './bng.js';
import * as qth from './qth.js';
import * as kertau from './kertau.js';

const systems = {
  WGS84: wgs84,
  UTM: utm,
  MGRS: mgrs,
  BNG: bng,
  QTH: qth,
  KERTAU: kertau,
};

export const CoordinateTransformer = {
  toDisplay(lat, lng, system) {
    const module = systems[system];
    if (!module || !module.format) return null;
    return module.format(lat, lng);
  },

  parse(input, system) {
    const module = systems[system];
    if (!module || !module.parse) return null;
    return module.parse(input);
  },

  allSystems(lat, lng) {
    const results = new Map();
    for (const name of Object.keys(systems)) {
      const display = this.toDisplay(lat, lng, name);
      if (display !== null) {
        results.set(name, display);
      }
    }
    return results;
  },
};

export const SYSTEMS = Object.keys(systems);
