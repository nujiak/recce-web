import proj4 from 'proj4';
import type { GeoPoint } from '@/types';

const KERTAU_PROJ =
  '+proj=omerc +lat_0=4 +lonc=102.25 +alpha=323.0257905 +k=0.99984 +x_0=804670.24 +y_0=0 +no_uoff +gamma=323.1301023611111 +a=6377295.664 +b=6356094.667915204 +units=m +no_defs +towgs84=-11,851,5';

const WGS84_PROJ = 'EPSG:4326';

const KERTAU_BOUNDS = {
  minLat: 1.12,
  maxLat: 6.72,
  minLng: 99.59,
  maxLng: 104.6,
};

export function format(lat: number, lng: number): string | null {
  if (
    lat < KERTAU_BOUNDS.minLat ||
    lat > KERTAU_BOUNDS.maxLat ||
    lng < KERTAU_BOUNDS.minLng ||
    lng > KERTAU_BOUNDS.maxLng
  ) {
    return null;
  }
  const [easting, northing] = proj4(WGS84_PROJ, KERTAU_PROJ, [lng, lat]);
  return `${Math.trunc(easting)} ${Math.trunc(northing)}`;
}

export function parse(input: string): GeoPoint | null {
  const cleaned = input.trim().replace(/[,;]/g, ' ');
  const parts = cleaned.split(/\s+/);
  if (parts.length !== 2) return null;

  const easting = parseFloat(parts[0]);
  const northing = parseFloat(parts[1]);

  if (isNaN(easting) || isNaN(northing)) return null;

  const [lng, lat] = proj4(KERTAU_PROJ, WGS84_PROJ, [easting, northing]);

  if (
    lat < KERTAU_BOUNDS.minLat ||
    lat > KERTAU_BOUNDS.maxLat ||
    lng < KERTAU_BOUNDS.minLng ||
    lng > KERTAU_BOUNDS.maxLng
  ) {
    return null;
  }

  return { lat, lng };
}
