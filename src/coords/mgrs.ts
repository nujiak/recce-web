import * as utm from './utm';
import type { CoordResult } from '../types';

const BANDS = 'CDEFGHJKLMNPQRSTUVWX';

const COLUMN_LETTERS: string[][] = [
  ['S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
  ['J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R'],
];

const ROW_LETTERS: string[][] = [
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

const Y_BANDS: Record<string, number[]> = {
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

export function format(lat: number, lng: number): string | null {
  if (lat < -80 || lat > 84) return null;

  const zone = Math.floor((lng + 180) / 6) + 1;
  const bandIndex = Math.min(Math.floor((lat + 80) / 8), 19);
  const band = BANDS[bandIndex];

  const utmStr = utm.format(lat, lng);
  if (!utmStr) return null;

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

export function parse(input: string): CoordResult | null {
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

function parseUTM(
  zone: number,
  band: string,
  easting: number,
  northing: number
): CoordResult | null {
  return utm.toWGS84(zone, band, easting, northing);
}
