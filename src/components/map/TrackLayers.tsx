import { Component, createEffect, onMount, onCleanup } from 'solid-js';
import maplibregl from 'maplibre-gl';
import { useUI } from '../../context/UIContext';
import { getTrackBounds } from '../../utils/geo';
import type { Track, TrackNode, PinColor } from '../../types';
import { PIN_COLOR_HEX } from '../../utils/colors';

const SRC_TRACKS = 'ts-tracks';
const SRC_CHECKPOINTS = 'ts-checkpoints';
const SRC_TEMP = 'ts-temp';
const SRC_PREVIEW = 'ts-preview';
const LAYER_FILL = 'tl-fill';
const LAYER_LINE = 'tl-line';
const LAYER_CHECKPOINTS = 'tl-checkpoints';
const LAYER_TEMP = 'tl-temp';
const LAYER_PREVIEW = 'tl-preview';

interface TrackLayersProps {
  map: maplibregl.Map;
  tracks: Track[];
  plotNodes: TrackNode[];
  plotColor: PinColor;
}

type GeoFeature = GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>;

function addTrackSourcesAndLayers(map: maplibregl.Map) {
  if (!map.getSource(SRC_TRACKS)) {
    map.addSource(SRC_TRACKS, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
  }
  if (!map.getSource(SRC_CHECKPOINTS)) {
    map.addSource(SRC_CHECKPOINTS, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
  }
  if (!map.getSource(SRC_TEMP)) {
    map.addSource(SRC_TEMP, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  }
  if (!map.getSource(SRC_PREVIEW)) {
    map.addSource(SRC_PREVIEW, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
  }

  if (!map.getLayer(LAYER_FILL)) {
    map.addLayer({
      id: LAYER_FILL,
      type: 'fill',
      source: SRC_TRACKS,
      filter: ['==', '$type', 'Polygon'],
      paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.25 },
    });
  }
  if (!map.getLayer(LAYER_LINE)) {
    map.addLayer({
      id: LAYER_LINE,
      type: 'line',
      source: SRC_TRACKS,
      paint: { 'line-color': ['get', 'color'], 'line-width': 3, 'line-opacity': 0.9 },
    });
  }
  if (!map.getLayer(LAYER_CHECKPOINTS)) {
    map.addLayer({
      id: LAYER_CHECKPOINTS,
      type: 'symbol',
      source: SRC_CHECKPOINTS,
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 11,
        'text-anchor': 'bottom',
        'text-offset': [0, -0.5],
      },
      paint: { 'text-color': '#fff', 'text-halo-color': '#000', 'text-halo-width': 2 },
    });
  }
  if (!map.getLayer(LAYER_TEMP)) {
    map.addLayer({
      id: LAYER_TEMP,
      type: 'line',
      source: SRC_TEMP,
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 3,
        'line-dasharray': [4, 3],
        'line-opacity': 0.9,
      },
    });
  }
  if (!map.getLayer(LAYER_PREVIEW)) {
    map.addLayer({
      id: LAYER_PREVIEW,
      type: 'line',
      source: SRC_PREVIEW,
      paint: { 'line-color': ['get', 'color'], 'line-width': 2, 'line-opacity': 0.4 },
    });
  }
}

function tracksToGeoJSON(tracks: Track[]) {
  const features: GeoFeature[] = tracks.flatMap((t) => {
    const color = PIN_COLOR_HEX[t.color] ?? PIN_COLOR_HEX.red;
    if (t.nodes.length < 2) return [] as GeoFeature[];
    const coords = t.nodes.map((n) => [n.lng, n.lat]);
    if (t.isCyclical && t.nodes.length >= 3) {
      return [
        {
          type: 'Feature' as const,
          properties: { id: t.id, name: t.name, color, isCyclical: true },
          geometry: { type: 'Polygon' as const, coordinates: [[...coords, coords[0]]] },
        },
      ] as GeoFeature[];
    }
    return [
      {
        type: 'Feature' as const,
        properties: { id: t.id, name: t.name, color, isCyclical: false },
        geometry: { type: 'LineString' as const, coordinates: coords },
      },
    ] as GeoFeature[];
  });
  return { type: 'FeatureCollection' as const, features } as GeoJSON.FeatureCollection;
}

function checkpointsToGeoJSON(tracks: Track[]) {
  const features = tracks.flatMap((t) =>
    t.nodes
      .filter((n) => n.name)
      .map((n) => ({
        type: 'Feature' as const,
        properties: { name: n.name },
        geometry: { type: 'Point' as const, coordinates: [n.lng, n.lat] },
      }))
  );
  return { type: 'FeatureCollection' as const, features };
}

function nodesToLineGeoJSON(nodes: TrackNode[], color: string): GeoJSON.FeatureCollection {
  if (nodes.length < 2) return { type: 'FeatureCollection', features: [] };
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { color },
        geometry: { type: 'LineString', coordinates: nodes.map((n) => [n.lng, n.lat]) },
      },
    ],
  };
}

const TrackLayers: Component<TrackLayersProps> = (props) => {
  const { setViewingTrack } = useUI();

  onMount(() => {
    const m = props.map;
    addTrackSourcesAndLayers(m);

    m.on('click', LAYER_LINE, (e) => {
      const id = e.features?.[0]?.properties?.id;
      const track = props.tracks.find((t) => t.id === id);
      if (track) setViewingTrack(track);
    });
    m.on('click', LAYER_FILL, (e) => {
      const id = e.features?.[0]?.properties?.id;
      const track = props.tracks.find((t) => t.id === id);
      if (track) setViewingTrack(track);
    });
    m.on('mouseenter', LAYER_LINE, () => {
      m.getCanvas().style.cursor = 'pointer';
    });
    m.on('mouseleave', LAYER_LINE, () => {
      m.getCanvas().style.cursor = '';
    });
    m.on('mouseenter', LAYER_FILL, () => {
      m.getCanvas().style.cursor = 'pointer';
    });
    m.on('mouseleave', LAYER_FILL, () => {
      m.getCanvas().style.cursor = '';
    });

    m.on('style.load', () => {
      addTrackSourcesAndLayers(m);
    });
  });

  // Update track GeoJSON when tracks change
  createEffect(() => {
    const m = props.map;
    if (!m.getSource(SRC_TRACKS)) return;
    (m.getSource(SRC_TRACKS) as maplibregl.GeoJSONSource).setData(tracksToGeoJSON(props.tracks));
    (m.getSource(SRC_CHECKPOINTS) as maplibregl.GeoJSONSource).setData(
      checkpointsToGeoJSON(props.tracks)
    );
  });

  // Update temp + preview when plot nodes change
  createEffect(() => {
    const m = props.map;
    if (!m.getSource(SRC_TEMP)) return;
    const color = PIN_COLOR_HEX[props.plotColor] ?? PIN_COLOR_HEX.red;
    (m.getSource(SRC_TEMP) as maplibregl.GeoJSONSource).setData(
      nodesToLineGeoJSON(props.plotNodes, color)
    );
  });

  onCleanup(() => {
    const m = props.map;
    for (const layer of [LAYER_FILL, LAYER_LINE, LAYER_CHECKPOINTS, LAYER_TEMP, LAYER_PREVIEW]) {
      if (m.getLayer(layer)) m.removeLayer(layer);
    }
    for (const src of [SRC_TRACKS, SRC_CHECKPOINTS, SRC_TEMP, SRC_PREVIEW]) {
      if (m.getSource(src)) m.removeSource(src);
    }
  });

  return null;
};

export default TrackLayers;
