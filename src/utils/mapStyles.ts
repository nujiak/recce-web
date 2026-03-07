import type { StyleSpecification } from 'maplibre-gl';
import type { MapStyle } from '../types';

const OPEN_FREE_MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const SATELLITE_TILE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const SATELLITE_SOURCE_ID = 'esri-world-imagery';

const SATELLITE_ATTRIBUTION =
  'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';

const OVERLAY_LAYER_PATTERNS = [
  /^road_/,
  /^bridge_/,
  /^tunnel_/,
  /^road_shield_/,
  /^label_/,
  /^poi_/,
  /^boundary_/,
  /^water_name_/,
  /^highway-/,
  /^airport$/,
  /^waterway_line_label$/,
];

const REMOVED_LAYER_PATTERNS = [
  /^background$/,
  /^park/,
  /^landuse/,
  /^landcover/,
  /^water$/,
  /^building/,
  /^aeroway/,
  /^natural_earth$/,
];

let standardStylePromise: Promise<StyleSpecification> | null = null;
let satelliteStylePromise: Promise<StyleSpecification> | null = null;

function cacheStylePromise(
  loader: () => Promise<StyleSpecification>,
  assign: (promise: Promise<StyleSpecification> | null) => void
) {
  const promise = loader().catch((error) => {
    assign(null);
    throw error;
  });
  assign(promise);
  return promise;
}

function cloneStyle(style: StyleSpecification): StyleSpecification {
  return structuredClone(style);
}

function shouldKeepOverlayLayer(layerId: string) {
  return OVERLAY_LAYER_PATTERNS.some((pattern) => pattern.test(layerId));
}

function shouldRemoveLayer(layerId: string) {
  return REMOVED_LAYER_PATTERNS.some((pattern) => pattern.test(layerId));
}

async function fetchOpenFreeMapStyle(): Promise<StyleSpecification> {
  const response = await fetch(OPEN_FREE_MAP_STYLE_URL);
  if (!response.ok) {
    throw new Error(`Failed to load map style: ${response.status}`);
  }

  return (await response.json()) as StyleSpecification;
}

async function getStandardStyleDefinition() {
  if (!standardStylePromise) {
    standardStylePromise = cacheStylePromise(fetchOpenFreeMapStyle, (promise) => {
      standardStylePromise = promise;
    });
  }

  return cloneStyle(await standardStylePromise);
}

async function getSatelliteStyleDefinition() {
  if (!satelliteStylePromise) {
    satelliteStylePromise = cacheStylePromise(
      async () => {
        const libertyStyle = await fetchOpenFreeMapStyle();
        const overlayLayers = (libertyStyle.layers ?? []).filter((layer) => {
          if (!layer.id) return false;
          if (shouldRemoveLayer(layer.id)) return false;
          return shouldKeepOverlayLayer(layer.id);
        });

        return {
          version: libertyStyle.version,
          name: 'OpenFreeMap Liberty Satellite Hybrid',
          glyphs: libertyStyle.glyphs,
          sprite: libertyStyle.sprite,
          projection: libertyStyle.projection,
          terrain: libertyStyle.terrain,
          sky: libertyStyle.sky,
          light: libertyStyle.light,
          transition: libertyStyle.transition,
          sources: {
            [SATELLITE_SOURCE_ID]: {
              type: 'raster',
              tiles: [SATELLITE_TILE_URL],
              tileSize: 256,
              attribution: SATELLITE_ATTRIBUTION,
              maxzoom: 19,
            },
            ...libertyStyle.sources,
          },
          layers: [
            {
              id: 'satellite-base',
              type: 'raster',
              source: SATELLITE_SOURCE_ID,
              minzoom: 0,
              maxzoom: 22,
            },
            ...overlayLayers,
          ],
        } satisfies StyleSpecification;
      },
      (promise) => {
        satelliteStylePromise = promise;
      }
    );
  }

  return cloneStyle(await satelliteStylePromise);
}

export function getDefaultMapStyle(): MapStyle {
  return 'satellite';
}

export async function getMapStyleDefinition(mapStyle: MapStyle) {
  if (mapStyle === 'standard') {
    return getStandardStyleDefinition();
  }

  return getSatelliteStyleDefinition();
}
