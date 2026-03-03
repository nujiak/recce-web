import { type Component, createEffect, onMount } from 'solid-js';
import type { Map as MapLibreMap, GeoJSONSource } from 'maplibre-gl';
import { tracksStore } from '@/stores/tracks';
import type { Track, PinColor } from '@/types';

const COLOR_MAP: Record<PinColor, string> = {
  red: '#c94444',
  orange: '#d4863b',
  green: '#4a9f5c',
  azure: '#4a8fd4',
  violet: '#8a4ad4',
};

const TRACKS_SOURCE = 'tracks-source';
const TRACKS_LINE_LAYER = 'tracks-line-layer';
const TRACKS_FILL_LAYER = 'tracks-fill-layer';
const CHECKPOINTS_SOURCE = 'checkpoints-source';
const CHECKPOINTS_LAYER = 'checkpoints-layer';

export interface TracksLayerProps {
  map: MapLibreMap;
  onTrackClick?: (track: Track) => void;
}

export const TracksLayer: Component<TracksLayerProps> = (props) => {
  onMount(() => {
    if (!props.map.getSource(TRACKS_SOURCE)) {
      props.map.addSource(TRACKS_SOURCE, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
    }

    if (!props.map.getSource(CHECKPOINTS_SOURCE)) {
      props.map.addSource(CHECKPOINTS_SOURCE, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
    }

    if (!props.map.getLayer(TRACKS_FILL_LAYER)) {
      props.map.addLayer({
        id: TRACKS_FILL_LAYER,
        type: 'fill',
        source: TRACKS_SOURCE,
        filter: ['==', '$type', 'Polygon'],
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': 0.3,
        },
      });
    }

    if (!props.map.getLayer(TRACKS_LINE_LAYER)) {
      props.map.addLayer({
        id: TRACKS_LINE_LAYER,
        type: 'line',
        source: TRACKS_SOURCE,
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 3,
          'line-opacity': 0.9,
        },
      });
    }

    if (!props.map.getLayer(CHECKPOINTS_LAYER)) {
      props.map.addLayer({
        id: CHECKPOINTS_LAYER,
        type: 'symbol',
        source: CHECKPOINTS_SOURCE,
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Noto Sans Regular'],
          'text-size': 12,
          'text-anchor': 'bottom',
          'text-offset': [0, -0.5],
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 2,
        },
      });
    }

    props.map.on('click', TRACKS_LINE_LAYER, (e) => {
      if (e.features && e.features[0]) {
        const trackId = e.features[0].properties?.trackId;
        const track = tracksStore.list().find((t) => t.id === trackId);
        if (track) {
          props.onTrackClick?.(track);
        }
      }
    });

    props.map.on('click', TRACKS_FILL_LAYER, (e) => {
      if (e.features && e.features[0]) {
        const trackId = e.features[0].properties?.trackId;
        const track = tracksStore.list().find((t) => t.id === trackId);
        if (track) {
          props.onTrackClick?.(track);
        }
      }
    });

    props.map.on('mouseenter', TRACKS_LINE_LAYER, () => {
      props.map.getCanvas().style.cursor = 'pointer';
    });

    props.map.on('mouseleave', TRACKS_LINE_LAYER, () => {
      props.map.getCanvas().style.cursor = '';
    });

    props.map.on('mouseenter', TRACKS_FILL_LAYER, () => {
      props.map.getCanvas().style.cursor = 'pointer';
    });

    props.map.on('mouseleave', TRACKS_FILL_LAYER, () => {
      props.map.getCanvas().style.cursor = '';
    });
  });

  createEffect(() => {
    const tracks = tracksStore.list();
    const features: GeoJSON.Feature[] = [];
    const checkpointFeatures: GeoJSON.Feature[] = [];

    for (const track of tracks) {
      const color = COLOR_MAP[track.color] || '#ffffff';

      if (!track.nodes || track.nodes.length < 2) continue;

      const coordinates = track.nodes.map((n) => [n.lng, n.lat]);

      if (track.isCyclical && track.nodes.length >= 3) {
        features.push({
          type: 'Feature',
          properties: { trackId: track.id, color },
          geometry: {
            type: 'Polygon',
            coordinates: [coordinates],
          },
        });
      } else {
        features.push({
          type: 'Feature',
          properties: { trackId: track.id, color },
          geometry: {
            type: 'LineString',
            coordinates,
          },
        });
      }

      for (const node of track.nodes) {
        if (node.name) {
          checkpointFeatures.push({
            type: 'Feature',
            properties: { name: node.name, trackId: track.id },
            geometry: {
              type: 'Point',
              coordinates: [node.lng, node.lat],
            },
          });
        }
      }
    }

    const tracksSource = props.map.getSource(TRACKS_SOURCE) as GeoJSONSource | undefined;
    if (tracksSource) {
      tracksSource.setData({
        type: 'FeatureCollection',
        features,
      });
    }

    const checkpointsSource = props.map.getSource(CHECKPOINTS_SOURCE) as GeoJSONSource | undefined;
    if (checkpointsSource) {
      checkpointsSource.setData({
        type: 'FeatureCollection',
        features: checkpointFeatures,
      });
    }
  });

  return null;
};
