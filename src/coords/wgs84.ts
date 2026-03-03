import type { GeoPoint } from '@/types';

export function format(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(5)}° ${latDir} ${Math.abs(lng).toFixed(5)}° ${lngDir}`;
}

export function parse(input: string): GeoPoint | null {
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
