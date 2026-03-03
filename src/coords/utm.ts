import type { CoordResult } from '../types';

interface UTMResult {
  Easting: number;
  Northing: number;
  ZoneNumber: number;
  ZoneLetter: string;
}

interface LatLngResult {
  lat: number;
  lng: number;
}

// utm-latlng has incorrect type declarations (capitalised method names); use import + cast
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import UTMLatLngClass from 'utm-latlng';
const utmConverter = new UTMLatLngClass() as unknown as {
  convertLatLngToUtm(lat: number, lng: number, precision: number): UTMResult | string;
  convertUtmToLatLng(e: number, n: number, zone: number, letter: string): LatLngResult | string;
};

export function format(lat: number, lng: number): string | null {
  if (lat < -80 || lat > 84) return null;
  const result = utmConverter.convertLatLngToUtm(lat, lng, 6);
  if (typeof result === 'string') return null;

  const { Easting, Northing, ZoneNumber, ZoneLetter } = result;
  const zoneStr = ZoneNumber.toString().padStart(2, '0');
  const eastingStr = Math.round(Easting).toString().padStart(7, '0');
  const northingStr = Math.round(Northing).toString().padStart(7, '0');
  return `${zoneStr}${ZoneLetter} ${eastingStr} ${northingStr}`;
}

export function parse(input: string): CoordResult | null {
  const match = /^\s*(\d{1,2})\s*([A-Z])\s+(\d+)\s+(\d+)\s*$/i.exec(input);
  if (!match) return null;

  const zone = parseInt(match[1]);
  const letter = match[2].toUpperCase();
  const easting = parseInt(match[3]);
  const northing = parseInt(match[4]);

  if (zone < 1 || zone > 60) return null;

  return toWGS84(zone, letter, easting, northing);
}

export function toWGS84(
  zone: number,
  band: string,
  easting: number,
  northing: number,
): CoordResult | null {
  const result = utmConverter.convertUtmToLatLng(easting, northing, zone, band);
  if (typeof result === 'string') return null;
  const { lat, lng } = result;
  if (lat < -80 || lat > 84) return null;
  return { lat, lng };
}
