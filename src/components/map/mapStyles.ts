import type maplibregl from 'maplibre-gl';
import type { MapStyle } from '../../types';

export const OPEN_FREE_MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

export const HYBRID_SATELLITE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    esriSatellite: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution:
        'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
      maxzoom: 19,
    },
    openfreemap: {
      type: 'vector',
      url: 'https://tiles.openfreemap.org/planet',
      attribution: 'Data &copy; OpenFreeMap contributors',
    },
  },
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  sprite: 'https://tiles.openfreemap.org/sprites/liberty',
  layers: [
    {
      id: 'esri-satellite',
      type: 'raster',
      source: 'esriSatellite',
    },
    {
      id: 'osm-boundaries',
      type: 'line',
      source: 'openfreemap',
      'source-layer': 'boundary',
      paint: {
        'line-color': 'rgba(255,255,255,0.7)',
        'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.3, 10, 1.2],
        'line-dasharray': [4, 2],
      },
    },
    {
      id: 'osm-roads',
      type: 'line',
      source: 'openfreemap',
      'source-layer': 'transportation',
      minzoom: 9,
      paint: {
        'line-color': 'rgba(255,255,255,0.85)',
        'line-width': ['interpolate', ['linear'], ['zoom'], 9, 0.4, 16, 3],
        'line-opacity': 0.75,
      },
    },
    {
      id: 'osm-labels',
      type: 'symbol',
      source: 'openfreemap',
      'source-layer': 'place',
      filter: ['all', ['has', 'name'], ['<=', ['get', 'rank'], 6]],
      layout: {
        'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name']],
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 3, 10, 8, 14, 13, 18],
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': 'rgba(15, 23, 42, 0.9)',
        'text-halo-width': 1.5,
      },
    },
  ],
};

export function getMapStyle(style: MapStyle): string | maplibregl.StyleSpecification {
  return style === 'satellite' ? HYBRID_SATELLITE_STYLE : OPEN_FREE_MAP_STYLE;
}
