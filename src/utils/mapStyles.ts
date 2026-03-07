import type { StyleSpecification } from 'maplibre-gl';
import type { MapStyle } from '../types';

export const LIBERTY_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
export const SATELLITE_SOURCE_ID = 'esri-world-imagery';

const SATELLITE_TILES = [
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
];

const OVERLAY_LAYER_PREFIXES = [
  'road_',
  'bridge_',
  'tunnel_',
  'highway-',
  'road_shield_',
  'label_',
  'poi_',
  'water_name_',
  'boundary_',
] as const;

const REMOVED_LAYER_PREFIXES = ['park', 'landuse', 'landcover', 'building', 'aeroway'] as const;

const REMOVED_LAYER_IDS = new Set(['background', 'natural_earth', 'water']);
const KEPT_LAYER_IDS = new Set(['airport', 'waterway_line_label']);

export type MapStyleDefinition = string | Promise<StyleSpecification>;

export function getMapStyleDefinition(
  mapStyle: MapStyle,
  signal?: AbortSignal
): MapStyleDefinition {
  return mapStyle === 'standard' ? LIBERTY_STYLE_URL : getHybridSatelliteStyle(signal);
}

export async function fetchLibertyStyle(signal?: AbortSignal): Promise<StyleSpecification> {
  const response = await fetch(LIBERTY_STYLE_URL, { signal });

  if (!response.ok) {
    throw new Error(`Failed to load liberty map style: ${response.status}`);
  }

  return (await response.json()) as StyleSpecification;
}

export async function getHybridSatelliteStyle(signal?: AbortSignal): Promise<StyleSpecification> {
  const libertyStyle = await fetchLibertyStyle(signal);

  return buildHybridSatelliteStyle(libertyStyle);
}

export function isHybridSatelliteStyle(mapStyle: MapStyle): boolean {
  return mapStyle === 'satellite';
}

export function buildHybridSatelliteStyle(libertyStyle: StyleSpecification): StyleSpecification {
  return {
    ...libertyStyle,
    sources: {
      [SATELLITE_SOURCE_ID]: {
        type: 'raster',
        tiles: SATELLITE_TILES,
        tileSize: 256,
        attribution:
          'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      },
      ...libertyStyle.sources,
    },
    layers: [
      {
        id: SATELLITE_SOURCE_ID,
        type: 'raster',
        source: SATELLITE_SOURCE_ID,
      },
      ...libertyStyle.layers.filter((layer) => shouldKeepOverlayLayer(layer.id)),
    ],
  };
}

function shouldKeepOverlayLayer(layerId: string): boolean {
  if (KEPT_LAYER_IDS.has(layerId)) return true;
  if (REMOVED_LAYER_IDS.has(layerId)) return false;

  if (OVERLAY_LAYER_PREFIXES.some((prefix) => layerId.startsWith(prefix))) {
    return true;
  }

  return !REMOVED_LAYER_PREFIXES.some((prefix) => layerId.startsWith(prefix));
}
