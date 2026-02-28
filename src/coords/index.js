import * as kertau from './kertau.js';

const systems = {
  WGS84: null,
  UTM: null,
  MGRS: null,
  BNG: null,
  QTH: null,
  KERTAU: kertau,
};

export const CoordinateTransformer = {
  toDisplay(lat, lng, system) {
    if (system === 'WGS84') {
      const latDir = lat >= 0 ? 'N' : 'S';
      const lngDir = lng >= 0 ? 'E' : 'W';
      return `${Math.abs(lat).toFixed(5)}° ${latDir} ${Math.abs(lng).toFixed(5)}° ${lngDir}`;
    }
    const module = systems[system];
    if (!module || !module.format) return null;
    return module.format(lat, lng);
  },

  parse(input, system) {
    if (system === 'WGS84') {
      const regex1 = /^\s*([0-9.,]+)\s*°?\s*([NSns])\s*([0-9.,]+)\s*°?\s*([EWew])\s*$/;
      const regex2 = /^\s*([-+0-9.,]+)\s*°?\s+([-+0-9.,]+)\s*°?\s*$/;

      const match1 = regex1.exec(input);
      if (match1) {
        let lat = parseFloat(match1[1].replace(',', '.'));
        let lng = parseFloat(match1[3].replace(',', '.'));
        if (isNaN(lat) || isNaN(lng)) return null;
        lat = match1[2].toUpperCase() === 'S' ? -lat : lat;
        lng = match1[4].toUpperCase() === 'W' ? -lng : lng;
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
        return { lat, lng };
      }

      const match2 = regex2.exec(input);
      if (match2) {
        const lat = parseFloat(match2[1].replace(',', '.'));
        const lng = parseFloat(match2[2].replace(',', '.'));
        if (isNaN(lat) || isNaN(lng)) return null;
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
        return { lat, lng };
      }

      return null;
    }

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
