import { getTrackBounds } from '../utils/geo.js';

let map = null;
let tracks = [];

// Source and layer names
const TRACKS_SOURCE = 'tracks-source';
const TRACKS_LINE_LAYER = 'tracks-line-layer';
const TRACKS_FILL_LAYER = 'tracks-fill-layer';
const CHECKPOINTS_SOURCE = 'checkpoints-source';
const CHECKPOINTS_LAYER = 'checkpoints-layer';
const TEMP_TRACK_SOURCE = 'temp-track-source';
const TEMP_TRACK_LAYER = 'temp-track-layer';
const PREVIEW_SOURCE = 'preview-track-source';
const PREVIEW_LAYER = 'preview-track-layer';

export function init(mapInstance) {
  map = mapInstance;

  // Add sources
  map.addSource(TRACKS_SOURCE, {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });

  map.addSource(CHECKPOINTS_SOURCE, {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });

  map.addSource(TEMP_TRACK_SOURCE, {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });

  // Add fill layer for areas (polygons) - render first
  map.addLayer({
    id: TRACKS_FILL_LAYER,
    type: 'fill',
    source: TRACKS_SOURCE,
    filter: ['==', '$type', 'Polygon'],
    paint: {
      'fill-color': ['get', 'color'],
      'fill-opacity': 0.3,
    },
  });

  // Add line layer for paths and area borders
  map.addLayer({
    id: TRACKS_LINE_LAYER,
    type: 'line',
    source: TRACKS_SOURCE,
    paint: {
      'line-color': ['get', 'color'],
      'line-width': 3,
      'line-opacity': 0.9,
    },
  });

  // Add checkpoint labels
  map.addLayer({
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

  // Add temp track layer for plotting preview
  map.addLayer({
    id: TEMP_TRACK_LAYER,
    type: 'line',
    source: TEMP_TRACK_SOURCE,
    paint: {
      'line-color': ['get', 'color'],
      'line-width': 3,
      'line-dasharray': [4, 3],
      'line-opacity': 0.8,
    },
  });

  map.addSource(PREVIEW_SOURCE, {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });

  map.addLayer({
    id: PREVIEW_LAYER,
    type: 'line',
    source: PREVIEW_SOURCE,
    paint: {
      'line-color': ['get', 'color'],
      'line-width': 3,
      'line-dasharray': [4, 3],
      'line-opacity': 0.4,
    },
  });

  // Handle clicks on tracks
  map.on('click', TRACKS_LINE_LAYER, (e) => {
    if (e.features && e.features[0]) {
      const trackId = e.features[0].properties.trackId;
      const track = tracks.find((t) => t.id === trackId);
      if (track) {
        window.dispatchEvent(new CustomEvent('trackClicked', { detail: { track } }));
      }
    }
  });

  map.on('click', TRACKS_FILL_LAYER, (e) => {
    if (e.features && e.features[0]) {
      const trackId = e.features[0].properties.trackId;
      const track = tracks.find((t) => t.id === trackId);
      if (track) {
        window.dispatchEvent(new CustomEvent('trackClicked', { detail: { track } }));
      }
    }
  });

  // Change cursor on hover
  map.on('mouseenter', TRACKS_LINE_LAYER, () => {
    map.getCanvas().style.cursor = 'pointer';
  });

  map.on('mouseleave', TRACKS_LINE_LAYER, () => {
    map.getCanvas().style.cursor = '';
  });

  map.on('mouseenter', TRACKS_FILL_LAYER, () => {
    map.getCanvas().style.cursor = 'pointer';
  });

  map.on('mouseleave', TRACKS_FILL_LAYER, () => {
    map.getCanvas().style.cursor = '';
  });
}

export async function loadTracks() {
  const { getAllTracks } = await import('../db/db.js');
  tracks = await getAllTracks();
  renderTracks();
}

export function renderTracks() {
  if (!map) return;

  const features = [];
  const checkpointFeatures = [];

  // Color mapping
  const colorMap = {
    red: '#c94444',
    orange: '#d4863b',
    green: '#4a9f5c',
    azure: '#4a8fd4',
    violet: '#8a4ad4',
  };

  for (const track of tracks) {
    const color = colorMap[track.color] || '#ffffff';

    if (!track.nodes || track.nodes.length < 2) continue;

    const coordinates = track.nodes.map((n) => [n.lng, n.lat]);

    if (track.isCyclical && track.nodes.length >= 3) {
      // Polygon for cyclical tracks
      features.push({
        type: 'Feature',
        properties: {
          trackId: track.id,
          color,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [coordinates],
        },
      });
    } else {
      // LineString for paths
      features.push({
        type: 'Feature',
        properties: {
          trackId: track.id,
          color,
        },
        geometry: {
          type: 'LineString',
          coordinates,
        },
      });
    }

    // Add checkpoint markers
    for (const node of track.nodes) {
      if (node.name) {
        checkpointFeatures.push({
          type: 'Feature',
          properties: {
            name: node.name,
            trackId: track.id,
          },
          geometry: {
            type: 'Point',
            coordinates: [node.lng, node.lat],
          },
        });
      }
    }
  }

  map.getSource(TRACKS_SOURCE)?.setData({
    type: 'FeatureCollection',
    features,
  });

  map.getSource(CHECKPOINTS_SOURCE)?.setData({
    type: 'FeatureCollection',
    features: checkpointFeatures,
  });
}

export function addTrack(track) {
  tracks.push(track);
  renderTracks();
}

export function updateTrack(updatedTrack) {
  const index = tracks.findIndex((t) => t.id === updatedTrack.id);
  if (index !== -1) {
    tracks[index] = updatedTrack;
    renderTracks();
  }
}

export function removeTrack(trackId) {
  tracks = tracks.filter((t) => t.id !== trackId);
  renderTracks();
}

export function updateTempTrack(nodes, isCyclical, color) {
  if (!map || !nodes || nodes.length < 2) return;

  const colorMap = {
    red: '#c94444',
    orange: '#d4863b',
    green: '#4a9f5c',
    azure: '#4a8fd4',
    violet: '#8a4ad4',
  };

  const coordinates = nodes.map((n) => [n.lng, n.lat]);

  let geometry;
  if (isCyclical && nodes.length >= 3) {
    coordinates.push(coordinates[0]); // Close the polygon
    geometry = {
      type: 'LineString',
      coordinates,
    };
  } else {
    geometry = {
      type: 'LineString',
      coordinates,
    };
  }

  map.getSource(TEMP_TRACK_SOURCE)?.setData({
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          color: colorMap[color] || '#ffffff',
        },
        geometry,
      },
    ],
  });
}

export function clearTempTrack() {
  if (!map) return;

  map.getSource(TEMP_TRACK_SOURCE)?.setData({
    type: 'FeatureCollection',
    features: [],
  });
}

export function updatePreviewLine(lastNode, cursorLatLng, color) {
  if (!map || !lastNode || !cursorLatLng) return;

  const colorMap = {
    red: '#c94444',
    orange: '#d4863b',
    green: '#4a9f5c',
    azure: '#4a8fd4',
    violet: '#8a4ad4',
  };

  map.getSource(PREVIEW_SOURCE)?.setData({
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          color: colorMap[color] || '#ffffff',
        },
        geometry: {
          type: 'LineString',
          coordinates: [
            [lastNode.lng, lastNode.lat],
            [cursorLatLng.lng, cursorLatLng.lat],
          ],
        },
      },
    ],
  });
}

export function clearPreviewLine() {
  if (!map) return;

  map.getSource(PREVIEW_SOURCE)?.setData({
    type: 'FeatureCollection',
    features: [],
  });
}

export function fitToTrack(track) {
  if (!map || !track.nodes || track.nodes.length < 1) return;

  const bounds = getTrackBounds(track.nodes);
  if (bounds) {
    map.fitBounds(bounds, { padding: 50 });
  }
}

export function getTracks() {
  return tracks;
}
