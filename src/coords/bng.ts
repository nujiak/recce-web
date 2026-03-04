import proj4 from 'proj4';
import type { CoordResult } from '../types';

const BNG_PROJ =
  '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.06,0.1502,0.247,0.8421,-20.4894 +units=m +no_defs';
const WGS84_PROJ = 'EPSG:4326';

const MAJOR_EASTING_OFFSET: Record<string, number> = {
  S: 0,
  T: 500000,
  N: 0,
  O: 500000,
  H: 0,
  J: 500000,
};

const MAJOR_NORTHING_OFFSET: Record<string, number> = {
  S: 0,
  T: 0,
  N: 500000,
  O: 500000,
  H: 1000000,
  J: 1000000,
};

const MINOR_EASTING_OFFSET: Record<string, number> = {
  A: 0,
  F: 0,
  L: 0,
  Q: 0,
  V: 0,
  B: 100000,
  G: 100000,
  M: 100000,
  R: 100000,
  W: 100000,
  C: 200000,
  H: 200000,
  N: 200000,
  S: 200000,
  X: 200000,
  D: 300000,
  J: 300000,
  O: 300000,
  T: 300000,
  Y: 300000,
  E: 400000,
  K: 400000,
  P: 400000,
  U: 400000,
  Z: 400000,
};

const MINOR_NORTHING_OFFSET: Record<string, number> = {
  A: 400000,
  B: 400000,
  C: 400000,
  D: 400000,
  E: 400000,
  F: 300000,
  G: 300000,
  H: 300000,
  J: 300000,
  K: 300000,
  L: 200000,
  M: 200000,
  N: 200000,
  O: 200000,
  P: 200000,
  Q: 100000,
  R: 100000,
  S: 100000,
  T: 100000,
  U: 100000,
  V: 0,
  W: 0,
  X: 0,
  Y: 0,
  Z: 0,
};

const VALID_MAJOR = ['H', 'J', 'N', 'O', 'S', 'T'];

export function format(lat: number, lng: number): string | null {
  const [easting, northing] = proj4(WGS84_PROJ, BNG_PROJ, [lng, lat]);

  if (easting < 0 || easting > 700000 || northing < 0 || northing > 1250000) {
    return null;
  }

  const majorNorthingIndex = Math.floor(northing / 500000);
  const majorEastingIndex = Math.floor(easting / 500000);

  const majorLetters: string[][] = [
    ['S', 'T'],
    ['N', 'O'],
    ['H', 'J'],
  ];
  const majorLetter = majorLetters[majorNorthingIndex]?.[majorEastingIndex];
  if (!majorLetter) return null;

  const minorNorthingIndex = Math.floor((northing % 500000) / 100000);
  const minorEastingIndex = Math.floor((easting % 500000) / 100000);

  const minorLetters: string[][] = [
    ['V', 'W', 'X', 'Y', 'Z'],
    ['Q', 'R', 'S', 'T', 'U'],
    ['L', 'M', 'N', 'O', 'P'],
    ['F', 'G', 'H', 'J', 'K'],
    ['A', 'B', 'C', 'D', 'E'],
  ];
  const minorLetter = minorLetters[minorNorthingIndex]?.[minorEastingIndex];
  if (!minorLetter) return null;

  const eastingPart = Math.round(easting % 100000);
  const northingPart = Math.round(northing % 100000);

  const easting5 = eastingPart.toString().padStart(5, '0');
  const northing5 = northingPart.toString().padStart(5, '0');

  return `${majorLetter}${minorLetter} ${easting5} ${northing5}`;
}

export function parse(input: string): CoordResult | null {
  const cleaned = input.replace(/\s/g, '').toUpperCase();
  const match = /^([JHONST])([A-HJ-Z])(\d{1,12})$/.exec(cleaned);

  if (!match) return null;

  const majorLetter = match[1];
  const minorLetter = match[2];
  const digits = match[3];

  if (!VALID_MAJOR.includes(majorLetter)) return null;

  const halfLen = digits.length / 2;
  if (halfLen < 1 || !Number.isInteger(halfLen)) return null;

  const eastingStr = digits.slice(0, halfLen);
  const northingStr = digits.slice(halfLen);

  const precision = halfLen;
  const multiplier = 10 ** (5 - precision);

  const eastingInSquare = parseInt(eastingStr) * multiplier;
  const northingInSquare = parseInt(northingStr) * multiplier;

  const fullEasting =
    (MAJOR_EASTING_OFFSET[majorLetter] ?? -1) +
    (MINOR_EASTING_OFFSET[minorLetter] ?? -1) +
    eastingInSquare;
  const fullNorthing =
    (MAJOR_NORTHING_OFFSET[majorLetter] ?? -1) +
    (MINOR_NORTHING_OFFSET[minorLetter] ?? -1) +
    northingInSquare;

  if (fullEasting < 0 || fullNorthing < 0) return null;

  const [lng, lat] = proj4(BNG_PROJ, WGS84_PROJ, [fullEasting, fullNorthing]);

  return { lat, lng };
}
