import { Component, createSignal, createResource, onMount, onCleanup, Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getAllPins, getAllTracks } from '../../db/db';
import { useUI } from '../../context/UIContext';
import { gpsPosition } from '../../stores/gps';
import { MapContext } from './MapContext';
import Crosshair from './Crosshair';
import PinMarkers from './PinMarkers';
import TrackLayers from './TrackLayers';
import PlotControls from './PlotControls';
import CompassButton from './CompassButton';
import LocationButton from './LocationButton';
import type { TrackNode, PinColor } from '../../types';

interface PlotState {
  active: boolean;
  nodes: TrackNode[];
  color: PinColor;
}

const MapView: Component = () => {
  let containerRef!: HTMLDivElement;

  const { savedVersion, setEditingTrack } = useUI();
  const [mapInstance, setMapInstance] = createSignal<maplibregl.Map | null>(null);
  const [center, setCenter] = createSignal<[number, number]>([103.795, 1.376]);
  const [bearing, setBearing] = createSignal(0);
  const [plotState, setPlotState] = createStore<PlotState>({ active: false, nodes: [], color: 'red' });

  const [pins] = createResource(savedVersion, getAllPins);
  const [tracks] = createResource(savedVersion, getAllTracks);

  onMount(() => {
    const map = new maplibregl.Map({
      container: containerRef,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [103.795, 1.376],
      zoom: 9.5,
    });

    map.on('move', () => {
      const c = map.getCenter();
      setCenter([c.lng, c.lat]);
      setBearing(map.getBearing());

      // Update preview ghost line during plot mode
      if (plotState.active && plotState.nodes.length > 0) {
        updatePreviewLine(map, plotState.nodes, plotState.color);
      }
    });

    map.on('load', () => {
      setMapInstance(map);
      (window as any).__map = map;
    });

    // Listen for flyTo events from PlotControls
    function handleFlyTo(e: Event) {
      const { lat, lng } = (e as CustomEvent).detail;
      map.flyTo({ center: [lng, lat], zoom: 15 });
    }
    window.addEventListener('mapFlyTo', handleFlyTo);

    onCleanup(() => {
      window.removeEventListener('mapFlyTo', handleFlyTo);
      map.remove();
    });
  });

  function updatePreviewLine(map: maplibregl.Map, nodes: TrackNode[], color: PinColor) {
    const src = map.getSource('ts-preview') as maplibregl.GeoJSONSource | undefined;
    if (!src || nodes.length === 0) return;
    const last = nodes[nodes.length - 1];
    const c = map.getCenter();
    const hexColor = { red: '#e53935', orange: '#fb8c00', green: '#43a047', azure: '#1e88e5', violet: '#8e24aa' }[color] ?? '#1e88e5';
    src.setData({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: { color: hexColor },
        geometry: { type: 'LineString', coordinates: [[last.lng, last.lat], [c.lng, c.lat]] },
      }],
    });
  }

  function clearPreviewLine(map: maplibregl.Map) {
    const src = map.getSource('ts-preview') as maplibregl.GeoJSONSource | undefined;
    src?.setData({ type: 'FeatureCollection', features: [] });
  }

  function handleStartPlot() {
    setPlotState({ active: true, nodes: [], color: 'red' });
  }

  function handleAddNode() {
    const map = mapInstance();
    if (!map || !plotState.active) return;
    const c = map.getCenter();
    setPlotState('nodes', n => [...n, { lat: c.lat, lng: c.lng }]);
  }

  function handleUndo() {
    if (!plotState.active || plotState.nodes.length === 0) return;
    const map = mapInstance();
    setPlotState('nodes', n => n.slice(0, -1));
    if (plotState.nodes.length === 0 && map) clearPreviewLine(map);
  }

  function handleSave() {
    if (plotState.nodes.length < 2) return;
    const map = mapInstance();
    if (map) clearPreviewLine(map);
    const nodes = plotState.nodes.map(n => ({ lat: n.lat, lng: n.lng, ...(n.name ? { name: n.name } : {}) }));
    setPlotState({ active: false, nodes: [], color: 'red' });
    setEditingTrack({
      name: '',
      nodes,
      isCyclical: false,
      color: 'azure',
      group: '',
      description: '',
      createdAt: Date.now(),
    } as any);
  }

  function handleCancel() {
    const map = mapInstance();
    if (map) clearPreviewLine(map);
    setPlotState({ active: false, nodes: [], color: 'red' });
  }

  function handleLocate() {
    const pos = gpsPosition();
    if (!pos) return;
    mapInstance()?.flyTo({ center: [pos.longitude, pos.latitude], zoom: 15 });
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      <Show when={mapInstance()}>
        {(map) => (
          <MapContext.Provider value={map()}>
            <PinMarkers map={map()} pins={pins() ?? []} />
            <TrackLayers
              map={map()}
              tracks={tracks() ?? []}
              plotNodes={plotState.nodes}
              plotColor={plotState.color}
            />
            <Crosshair center={center()} />
            <PlotControls
              center={center()}
              plotNodes={plotState.nodes}
              isPlotting={plotState.active}
              onStartPlot={handleStartPlot}
              onAddNode={handleAddNode}
              onUndo={handleUndo}
              onSave={handleSave}
              onCancel={handleCancel}
            />
            <CompassButton bearing={bearing()} onReset={() => map().resetNorth()} />
            <LocationButton onLocate={handleLocate} />
          </MapContext.Provider>
        )}
      </Show>
    </div>
  );
};

export default MapView;
