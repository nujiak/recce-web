import {
  Component,
  createSignal,
  createResource,
  createEffect,
  onMount,
  onCleanup,
  Show,
} from 'solid-js';
import { createStore } from 'solid-js/store';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getAllPins, getAllTracks } from '../../db/db';
import { usePrefs } from '../../context/PrefsContext';
import { useUI } from '../../context/UIContext';
import { gpsPosition } from '../../stores/gps';
import { setPrefs } from '../../stores/prefs';
import { MapContext } from './MapContext';
import Crosshair from './Crosshair';
import PinMarkers from './PinMarkers';
import TrackLayers from './TrackLayers';
import PlotControls from './PlotControls';
import CompassButton from './CompassButton';
import LocationButton from './LocationButton';
import LayerButton from './LayerButton';
import UserLocationMarker from './UserLocationMarker';
import type { TrackNode, PinColor, MapStyle } from '../../types';
import { PIN_COLOR_HEX } from '../../utils/colors';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '../../utils/constants';
import { getMapStyleDefinition } from '../../utils/mapStyles';

interface PlotState {
  active: boolean;
  nodes: TrackNode[];
  color: PinColor;
}

const MapView: Component = () => {
  let containerRef!: HTMLDivElement;

  const [prefs] = usePrefs();
  const { savedVersion, setEditingTrack } = useUI();
  const [mapInstance, setMapInstance] = createSignal<maplibregl.Map | null>(null);
  const [center, setCenter] = createSignal<[number, number]>(DEFAULT_MAP_CENTER);
  const [bearing, setBearing] = createSignal(0);
  const [isStyleLoaded, setIsStyleLoaded] = createSignal(false);
  const [plotState, setPlotState] = createStore<PlotState>({
    active: false,
    nodes: [],
    color: 'red',
  });

  const [pins] = createResource(savedVersion, getAllPins);
  const [tracks] = createResource(savedVersion, getAllTracks);

  let styleRequestId = 0;
  let styleAbortController: AbortController | null = null;

  async function applyMapStyle(map: maplibregl.Map, mapStyle: MapStyle, preserveView = true) {
    const requestId = ++styleRequestId;
    styleAbortController?.abort();
    const controller = new AbortController();
    styleAbortController = controller;
    setIsStyleLoaded(false);

    const viewState = preserveView
      ? {
          center: map.getCenter(),
          zoom: map.getZoom(),
          bearing: map.getBearing(),
          pitch: map.getPitch(),
        }
      : null;

    try {
      const styleDefinition = await getMapStyleDefinition(mapStyle, controller.signal);

      if (controller.signal.aborted || requestId !== styleRequestId) return;

      const handleStyleLoad = () => {
        map.off('style.load', handleStyleLoad);
        if (requestId !== styleRequestId) return;
        if (viewState) map.jumpTo(viewState);
        setIsStyleLoaded(true);
      };

      map.on('style.load', handleStyleLoad);

      map.setStyle(styleDefinition);

      if (map.isStyleLoaded()) {
        handleStyleLoad();
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error('Failed to apply map style', error);
      setIsStyleLoaded(true);
    }
  }

  onMount(() => {
    const map = new maplibregl.Map({
      container: containerRef,
      style: { version: 8, sources: {}, layers: [] },
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
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
      void applyMapStyle(map, prefs.mapStyle, false);
    });

    // Listen for flyTo events from PlotControls / PinInfo / TrackInfo
    function handleFlyTo(e: Event) {
      const { lat, lng } = (e as CustomEvent).detail;
      map.flyTo({ center: [lng, lat], zoom: 15 });
    }
    function handleFitBounds(e: Event) {
      const { bounds } = (e as CustomEvent<{ bounds: [[number, number], [number, number]] }>)
        .detail;
      map.fitBounds(bounds, { padding: 48, maxZoom: 17 });
    }
    window.addEventListener('mapFlyTo', handleFlyTo);
    window.addEventListener('mapFitBounds', handleFitBounds);

    onCleanup(() => {
      styleAbortController?.abort();
      window.removeEventListener('mapFlyTo', handleFlyTo);
      window.removeEventListener('mapFitBounds', handleFitBounds);
      map.remove();
    });
  });

  createEffect(() => {
    const map = mapInstance();
    const mapStyle = prefs.mapStyle;
    if (!map) return;
    void applyMapStyle(map, mapStyle);
  });

  function updatePreviewLine(map: maplibregl.Map, nodes: TrackNode[], color: PinColor) {
    const src = map.getSource('ts-preview') as maplibregl.GeoJSONSource | undefined;
    if (!src || nodes.length === 0) return;
    const last = nodes[nodes.length - 1];
    const c = map.getCenter();
    const hexColor = PIN_COLOR_HEX[color] ?? PIN_COLOR_HEX.azure;
    src.setData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { color: hexColor },
          geometry: {
            type: 'LineString',
            coordinates: [
              [last.lng, last.lat],
              [c.lng, c.lat],
            ],
          },
        },
      ],
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
    setPlotState('nodes', (n) => [...n, { lat: c.lat, lng: c.lng }]);
  }

  function handleUndo() {
    if (!plotState.active || plotState.nodes.length === 0) return;
    const map = mapInstance();
    setPlotState('nodes', (n) => n.slice(0, -1));
    if (plotState.nodes.length === 0 && map) clearPreviewLine(map);
  }

  function handleSave() {
    if (plotState.nodes.length < 2) return;
    const map = mapInstance();
    if (map) clearPreviewLine(map);
    const nodes = plotState.nodes.map((n) => ({
      lat: n.lat,
      lng: n.lng,
      ...(n.name ? { name: n.name } : {}),
    }));
    setPlotState({ active: false, nodes: [], color: 'red' });
    setEditingTrack({
      id: 0,
      name: '',
      nodes,
      isCyclical: false,
      color: 'azure',
      group: '',
      description: '',
      createdAt: Date.now(),
    });
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

  function handleToggleMapStyle() {
    setPrefs('mapStyle', prefs.mapStyle === 'satellite' ? 'standard' : 'satellite');
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      <Show when={mapInstance()} keyed>
        {(map) => (
          <MapContext.Provider value={map}>
            <Show when={isStyleLoaded()}>
              <UserLocationMarker map={map} />
              <PinMarkers map={map} pins={pins() ?? []} />
              <TrackLayers
                map={map}
                tracks={tracks() ?? []}
                plotNodes={plotState.nodes}
                plotColor={plotState.color}
              />
            </Show>
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
            <CompassButton bearing={bearing()} onReset={() => map.resetNorth()} />
            <LocationButton onLocate={handleLocate} />
            <LayerButton mapStyle={prefs.mapStyle} onToggle={handleToggleMapStyle} />
          </MapContext.Provider>
        )}
      </Show>
    </div>
  );
};

export default MapView;
