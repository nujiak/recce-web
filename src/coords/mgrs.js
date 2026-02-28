import * as utm from './utm.js';

const BANDS = 'CDEFGHJKLMNPQRSTUVWX';

const COLUMN_LETTERS = [
  ['S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
  ['J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R'],
];

const ROW_LETTERS = [
  [
    'F',
    'G',
    'H',
    'J',
    'K',
    'L',
    'M',
    'N',
    'P',
    'Q',
    'R',
    'S',
    'T',
    'U',
    'V',
    'A',
    'B',
    'C',
    'D',
    'E',
  ],
  [
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'J',
    'K',
    'L',
    'M',
    'N',
    'P',
    'Q',
    'R',
    'S',
    'T',
    'U',
    'V',
  ],
];

const Y_BANDS = {
  C: [1, 0],
  D: [1, 0],
  E: [1],
  F: [2, 1],
  G: [2],
  H: [3, 2],
  J: [3],
  K: [4, 3],
  L: [4],
  M: [4, 4],
  N: [0],
  P: [0],
  Q: [0, 1],
  R: [1],
  S: [1, 2],
  T: [2],
  U: [2, 3],
  V: [3],
  W: [3, 4],
  X: [3, 4],
};

export function format(lat, lng) {
  if (lat < -80 || lat > 84) return null;

  const zone = Math.floor((lng + 180) / 6) + 1;
  const bandIndex = Math.min(Math.floor((lat + 80) / 8), 19);
  const band = BANDS[bandIndex];

  const utmStr = utm.format(lat, lng);
  if (!utmStr) return null;

  // UTM format: "48N 0361234 0149234"
  const utmMatch = /^(\d+)([NS])\s+(\d+)\s+(\d+)$/.exec(utmStr);
  if (!utmMatch) return null;

  const easting = parseInt(utmMatch[3]);
  const northing = parseInt(utmMatch[4]);

  const columnIndex = Math.floor(easting / 100000) - 1;
  const rowIndex = Math.floor((northing % 2000000) / 100000);

  const columnLetter = COLUMN_LETTERS[zone % 3][columnIndex];
  const rowLetter = ROW_LETTERS[zone % 2][rowIndex];

  const eastingPart = Math.round(easting % 100000);
  const northingPart = Math.round(northing % 100000);

  const easting5 = eastingPart.toString().padStart(5, '0');
  const northing5 = northingPart.toString().padStart(5, '0');

  const zoneStr = zone.toString().padStart(2, '0');

  return `${zoneStr}${band}${columnLetter}${rowLetter} ${easting5} ${northing5}`;
}

export function parse(input) {
  const cleaned = input.replace(/\s/g, '').toUpperCase();
  const match = /^(\d{1,2})(\w{3})(\d{1,12})$/.exec(cleaned);

  if (!match) return null;

  const zone = parseInt(match[1]);
  const band = match[2][0];
  const columnLetter = match[2][1];
  const rowLetter = match[2][2];
  const digits = match[3];

  if (zone < 1 || zone > 60) return null;

  const yBands = Y_BANDS[band];
  if (!yBands) return null;

  const columnIndex = COLUMN_LETTERS[zone % 3].indexOf(columnLetter);
  if (columnIndex === -1) return null;

  const rowIndex = ROW_LETTERS[zone % 2].indexOf(rowLetter);
  if (rowIndex === -1) return null;

  const halfLen = digits.length / 2;
  if (halfLen < 1 || !Number.isInteger(halfLen)) return null;

  const eastingStr = digits.slice(0, halfLen);
  const northingStr = digits.slice(halfLen);

  const precision = halfLen;
  const multiplier = 10 ** (5 - precision);

  const eastingInSquare = parseInt(eastingStr) * multiplier;
  const northingInSquare = parseInt(northingStr) * multiplier;

  const utmEasting = (columnIndex + 1) * 100000 + eastingInSquare;
  const yPrelim = rowIndex * 100000 + northingInSquare;

  for (const yBand of yBands) {
    const utmNorthing = 2000000 * yBand + yPrelim;
    const utmBand = 'NPQRSTUVWX'.includes(band) ? 'N' : 'S';

    const result = parseUTM(zone, utmBand, utmEasting, utmNorthing);
    if (result) {
      const derivedBandIndex = Math.min(Math.floor((result.lat + 80) / 8), 19);
      const derivedBand = BANDS[derivedBandIndex];
      if (derivedBand === band) {
        return result;
      }
    }
  }

  return null;
}

function parseUTM(zone, band, easting, northing) {
  const centralMeridian = (zone - 1) * 6 - 180 + 3;

  const x = easting - 500000;
  let y = northing;
  if (band === 'S') {
    y -= 10000000;
  }

  const WGS84_A = 6378137.0;
  const WGS84_F = 1 / 298.257223563;
  const WGS84_E2 = 2 * WGS84_F - WGS84_F * WGS84_F;
  const UTM_K0 = 0.9996;

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
