import type { CoordResult } from '../types';

export function format(lat: number, lng: number): string {
  let lngShift = lng + 180;
  let latShift = lat + 90;

  const fieldFirst = getUppercaseLetter(Math.floor(lngShift / 20));
  const fieldSecond = getUppercaseLetter(Math.floor(latShift / 10));

  lngShift %= 20;
  latShift %= 10;

  const squareFirst = Math.floor(lngShift / 2).toString();
  const squareSecond = Math.floor(latShift).toString();

  lngShift %= 2;
  latShift %= 1;

  const subsquareFirst = getLowercaseLetter(Math.floor(lngShift * 12));
  const subsquareSecond = getLowercaseLetter(Math.floor(latShift * 24));

  lngShift %= 1 / 12;
  latShift %= 1 / 24;

  const extendedFirst = Math.floor(lngShift * 120).toString();
  const extendedSecond = Math.floor(latShift * 240).toString();

  return `${fieldFirst}${fieldSecond}${squareFirst}${squareSecond}${subsquareFirst}${subsquareSecond}${extendedFirst}${extendedSecond}`;
}

export function parse(input: string): CoordResult | null {
  const cleaned = input.trim().toUpperCase();

  if (!/^[A-R]{2}([0-9]{2}([A-X]{2}([0-9]{2})?)?)?$/.test(cleaned)) {
    return null;
  }

  const field = [cleaned[0], cleaned[1]];
  let square = ['0', '0'];
  let subsquare = ['A', 'A'];
  let extended = ['0', '0'];

  if (cleaned.length >= 4) {
    square = [cleaned[2], cleaned[3]];
  }
  if (cleaned.length >= 6) {
    subsquare = [cleaned[4].toUpperCase(), cleaned[5].toUpperCase()];
  }
  if (cleaned.length >= 8) {
    extended = [cleaned[6], cleaned[7]];
  }

  let lng = 20 * getIndex(field[0]);
  let lat = 10 * getIndex(field[1]);

  lng += 2 * parseInt(square[0]);
  lat += 1 * parseInt(square[1]);

  lng += (1 / 12) * getIndex(subsquare[0]);
  lat += (1 / 24) * getIndex(subsquare[1]);

  lng += (1 / 120) * parseInt(extended[0]);
  lat += (1 / 240) * parseInt(extended[1]);

  lng += 1 / 240 / 2;
  lat += 1 / 480 / 2;

  lng -= 180;
  lat -= 90;

  return { lat, lng };
}

function getUppercaseLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

function getLowercaseLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

function getIndex(letter: string): number {
  return letter.charCodeAt(0) - 65;
}
