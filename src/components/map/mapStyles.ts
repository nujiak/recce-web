import type maplibregl from 'maplibre-gl';
import type { MapStyle } from '../../types';
import { getEsriFallbackTileTemplate } from './esriTileFallback';

export const OPEN_FREE_MAP_STYLE = '/map-styles/liberty.json';

const OPEN_FREE_MAP_SOURCE_ID = 'openmaptiles';
const SATELLITE_SOURCE_ID = 'esriSatellite';

type StyleLayer = maplibregl.StyleSpecification['layers'][number];
type RasterSourceSpecification = Extract<
  maplibregl.StyleSpecification['sources'][string],
  { type: 'raster' }
>;

const SATELLITE_SOURCE: RasterSourceSpecification = {
  type: 'raster',
  tiles: [getEsriFallbackTileTemplate()],
  tileSize: 256,
  attribution:
    'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
  minzoom: 0,
  maxzoom: 19,
};

const SOURCE_REMAP: Record<string, string> = {
  [OPEN_FREE_MAP_SOURCE_ID]: OPEN_FREE_MAP_SOURCE_ID,
  ne2_shaded: SATELLITE_SOURCE_ID,
};

function cloneLayer(layer: StyleLayer): StyleLayer {
  return JSON.parse(JSON.stringify(layer)) as StyleLayer;
}

function isBackgroundLayer(layer: StyleLayer): boolean {
  return layer.type === 'background';
}

function isBaseRasterLayer(layer: StyleLayer): boolean {
  return layer.type === 'raster';
}

/**
 * Determines which vector layers to exclude from the hybrid satellite style.
 * Excludes: backgrounds, base rasters, and polygons that should show satellite imagery
 * (land use, buildings, parks, water bodies, waterways) while keeping labels.
 */
function shouldExcludeFromHybrid(layer: StyleLayer): boolean {
  if (isBackgroundLayer(layer) || isBaseRasterLayer(layer)) return true;

  if (!('source-layer' in layer) || typeof layer['source-layer'] !== 'string') return false;

  const excludedSourceLayers = [
    'aeroway',
    'building',
    'landcover',
    'landuse',
    'park',
    'water',
    'waterway',
  ];

  return excludedSourceLayers.includes(layer['source-layer']);
}

function remapLayerSource(layer: StyleLayer): StyleLayer {
  const cloned = cloneLayer(layer);
  if ('source' in cloned && typeof cloned.source === 'string' && SOURCE_REMAP[cloned.source]) {
    cloned.source = SOURCE_REMAP[cloned.source];
  }
  return cloned;
}

function buildHybridStyle(
  openFreeMapStyle: maplibregl.StyleSpecification
): maplibregl.StyleSpecification {
  return {
    ...openFreeMapStyle,
    sources: {
      ...openFreeMapStyle.sources,
      [SATELLITE_SOURCE_ID]: SATELLITE_SOURCE,
    },
    layers: buildHybridLayers(openFreeMapStyle.layers),
  };
}

function buildHybridLayers(baseLayers: StyleLayer[]): StyleLayer[] {
  const satelliteLayer: StyleLayer = {
    id: 'esri-satellite',
    type: 'raster',
    source: SATELLITE_SOURCE_ID,
  };

  return [
    satelliteLayer,
    ...baseLayers.filter((layer) => !shouldExcludeFromHybrid(layer)).map(remapLayerSource),
  ];
}

let hybridSatelliteStylePromise: Promise<maplibregl.StyleSpecification> | null = null;

async function fetchOpenFreeMapStyle(): Promise<maplibregl.StyleSpecification> {
  const response = await fetch(OPEN_FREE_MAP_STYLE);
  if (!response.ok) {
    throw new Error(`Failed to load OpenFreeMap style: ${response.status}`);
  }
  return (await response.json()) as maplibregl.StyleSpecification;
}

export async function getMapStyle(
  style: MapStyle
): Promise<string | maplibregl.StyleSpecification> {
  if (style === 'default') return OPEN_FREE_MAP_STYLE;

  if (!hybridSatelliteStylePromise) {
    hybridSatelliteStylePromise = fetchOpenFreeMapStyle().then(buildHybridStyle);
  }

  return hybridSatelliteStylePromise;
}
