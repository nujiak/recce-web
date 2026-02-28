const WGS84_A = 6378137.0;
const WGS84_F = 1 / 298.257223563;
const WGS84_E2 = 2 * WGS84_F - WGS84_F * WGS84_F;

const UTM_K0 = 0.9996;
const UTM_FALSE_EASTING = 500000;
const UTM_FALSE_NORTHING_SOUTH = 10000000;

export function format(lat, lng) {
  if (lat < -80 || lat > 84) return null;

  const zone = Math.floor((lng + 180) / 6) + 1;
  const band = lat >= 0 ? 'N' : 'S';

  const centralMeridian = (zone - 1) * 6 - 180 + 3;
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const cmRad = (centralMeridian * Math.PI) / 180;

  const N = WGS84_A / Math.sqrt(1 - WGS84_E2 * Math.sin(latRad) ** 2);
  const T = Math.tan(latRad) ** 2;
  const C = (WGS84_E2 / (1 - WGS84_E2)) * Math.cos(latRad) ** 2;
  const A = (lngRad - cmRad) * Math.cos(latRad);

  const M = calculateM(latRad);

  let easting =
    UTM_K0 *
      N *
      (A +
        ((1 - T + C) * A ** 3) / 6 +
        ((5 - 18 * T + T ** 2 + 72 * C - 58 * WGS84_E2) * A ** 5) / 120) +
    UTM_FALSE_EASTING;

  let northing =
    UTM_K0 *
    (M +
      N *
        Math.tan(latRad) *
        (A ** 2 / 2 +
          ((5 - T + 9 * C + 4 * C ** 2) * A ** 4) / 24 +
          ((61 - 58 * T + T ** 2 + 600 * C - 330 * WGS84_E2) * A ** 6) / 720));

  if (band === 'S') {
    northing += UTM_FALSE_NORTHING_SOUTH;
  }

  const zoneStr = zone.toString().padStart(2, '0');
  const eastingStr = Math.round(easting).toString().padStart(7, '0');
  const northingStr = Math.round(northing).toString().padStart(7, '0');

  return `${zoneStr}${band} ${eastingStr} ${northingStr}`;
}

function calculateM(latRad) {
  const e4 = WGS84_E2 ** 2;
  const e6 = WGS84_E2 ** 3;
  return (
    WGS84_A *
    (latRad -
      (WGS84_E2 / 2) * Math.sin(2 * latRad) +
      (e4 / 24) * Math.sin(4 * latRad) * (3 - 4 * (1 - WGS84_E2)) +
      (e6 / 720) * Math.sin(6 * latRad) * (27 - 48 * (1 - WGS84_E2) + 24 * (1 - WGS84_E2) ** 2))
  );
}

export function parse(input) {
  const cleaned = input.replace(/\s/g, '');
  const match = /^(\d{1,2})([NSns])(\d{1,14})$/.exec(cleaned);

  if (!match) return null;

  const zone = parseInt(match[1]);
  const band = match[2].toUpperCase();
  const digits = match[3];

  if (zone < 1 || zone > 60) return null;

  const halfLen = digits.length / 2;
  if (halfLen < 1 || !Number.isInteger(halfLen)) return null;

  const eastingStr = digits.slice(0, halfLen);
  const northingStr = digits.slice(halfLen);

  const precision = halfLen;
  const multiplier = 10 ** (7 - precision);

  let easting = parseInt(eastingStr) * multiplier + UTM_FALSE_EASTING;
  let northing = parseInt(northingStr) * multiplier;

  if (band === 'S') {
    northing += UTM_FALSE_NORTHING_SOUTH;
  }

  return toWGS84(zone, band, easting, northing);
}

function toWGS84(zone, band, easting, northing) {
  const centralMeridian = (zone - 1) * 6 - 180 + 3;

  const x = easting - UTM_FALSE_EASTING;
  let y = northing;
  if (band === 'S') {
    y -= UTM_FALSE_NORTHING_SOUTH;
  }

  const M = y / UTM_K0;
  const mu = M / (WGS84_A * (1 - WGS84_E2 / 4 - WGS84_E2 ** 2 / 64 - WGS84_E2 ** 3 / 256));

  const e1 = (1 - Math.sqrt(1 - WGS84_E2)) / (1 + Math.sqrt(1 - WGS84_E2));

  let latRad =
    mu +
    ((3 * e1) / 2 - (27 * e1 ** 3) / 32) * Math.sin(2 * mu) +
    ((21 * e1 ** 2) / 16 - (55 * e1 ** 4) / 32) * Math.sin(4 * mu) +
    ((151 * e1 ** 3) / 96) * Math.sin(6 * mu) +
    ((1097 * e1 ** 4) / 512) * Math.sin(8 * mu);

  const N = WGS84_A / Math.sqrt(1 - WGS84_E2 * Math.sin(latRad) ** 2);
  const T = Math.tan(latRad) ** 2;
  const C = (WGS84_E2 / (1 - WGS84_E2)) * Math.cos(latRad) ** 2;
  const D = x / (N * UTM_K0);

  latRad =
    latRad -
    ((N * Math.tan(latRad)) / UTM_K0) *
      (D ** 2 / 2 -
        ((5 + 3 * T + 10 * C - 4 * C ** 2 - 9 * WGS84_E2) * D ** 4) / 24 +
        ((61 + 90 * T + 298 * C + 45 * T ** 2 - 252 * WGS84_E2 - 3 * C ** 2) * D ** 6) / 720);

  const lngRad =
    (centralMeridian * Math.PI) / 180 +
    (D -
      ((1 + 2 * T + C) * D ** 3) / 6 +
      ((5 - 2 * C + 28 * T - 3 * C ** 2 + 8 * WGS84_E2 + 24 * T ** 2) * D ** 5) / 120) /
      Math.cos(latRad);

  const lat = (latRad * 180) / Math.PI;
  const lng = (lngRad * 180) / Math.PI;

  if (lat < -80 || lat > 84) return null;

  return { lat, lng };
}
