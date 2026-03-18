import {
  Component,
  createResource,
  Show,
  createEffect,
  createSignal,
  onCleanup,
  onMount,
} from 'solid-js';
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
import UserLocationMarker from './UserLocationMarker';
import MapStyleToggle from './MapStyleToggle';
import { usePrefs } from '../../context/PrefsContext';
import { mapCenter, setMapCenter } from '../../stores/mapCenter';
import type { TrackNode, PinColor, MapStyle } from '../../types';
import { PIN_COLOR_HEX } from '../../utils/colors';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '../../utils/constants';
import { getMapStyle } from './mapStyles';

const ATTRIBUTION_SELECTOR = '.maplibregl-ctrl-top-right > .maplibregl-ctrl-attrib';

function createNewTrack(nodes: TrackNode[]) {
  return {
    id: 0,
    name: '',
    nodes,
    isCyclical: false,
    color: 'azure' as const,
    group: '',
    description: '',
    createdAt: Date.now(),
  };
}

interface PlotState {
  active: boolean;
  nodes: TrackNode[];
  color: PinColor;
}

const MapView: Component = () => {
  let containerRef!: HTMLDivElement;
  let activeMapStyle: MapStyle = 'default';
  let styleRequestId = 0;

  function collapseAttributionControl() {
    containerRef
      ?.querySelectorAll<HTMLDetailsElement>(`${ATTRIBUTION_SELECTOR}[open]`)
      .forEach((details) => details.removeAttribute('open'));
  }

  function bindAttributionToggle() {
    const details = containerRef?.querySelector<HTMLDetailsElement>(ATTRIBUTION_SELECTOR);
    const summary = details?.querySelector<HTMLElement>('.maplibregl-ctrl-attrib-button');
    if (!details || !summary || details.dataset.recceBound === 'true') return;

    details.dataset.recceBound = 'true';
    summary.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      const nextOpen = !details.open;
      details.open = nextOpen;
    });
  }

  const { savedVersion, setEditingTrack } = useUI();
  const [prefs, setPrefs] = usePrefs();
  const [mapInstance, setMapInstance] = createSignal<maplibregl.Map | null>(null);
  const center = mapCenter;
  const [bearing, setBearing] = createSignal(0);
  const [plotState, setPlotState] = createStore<PlotState>({
    active: false,
    nodes: [],
    color: 'red',
  });

  const [pins] = createResource(savedVersion, getAllPins);
  const [tracks] = createResource(savedVersion, getAllTracks);

  onMount(async () => {
    const initialStyle = await getMapStyle(prefs.mapStyle);
    const map = new maplibregl.Map({
      container: containerRef,
      style: initialStyle,
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
      attributionControl: false,
    });

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'top-right');
    map.on('styledata', collapseAttributionControl);
    map.on('styledata', bindAttributionToggle);
    requestAnimationFrame(() => {
      collapseAttributionControl();
      bindAttributionToggle();
    });

    map.on('move', () => {
      const c = map.getCenter();
      setMapCenter({ lat: c.lat, lng: c.lng });
      setBearing(map.getBearing());

      // Update preview ghost line during plot mode
      if (plotState.active && plotState.nodes.length > 0) {
        updatePreviewLine(map, plotState.nodes, plotState.color);
      }
    });

    map.on('load', () => {
      activeMapStyle = prefs.mapStyle;
      collapseAttributionControl();
      bindAttributionToggle();
      setMapInstance(map);
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
      map.off('styledata', collapseAttributionControl);
      map.off('styledata', bindAttributionToggle);
      window.removeEventListener('mapFlyTo', handleFlyTo);
      window.removeEventListener('mapFitBounds', handleFitBounds);
      map.remove();
    });
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
    setEditingTrack(createNewTrack(nodes));
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
    const nextStyle = prefs.mapStyle === 'satellite' ? 'default' : 'satellite';
    setPrefs('mapStyle', nextStyle);
  }

  createEffect(async () => {
    const map = mapInstance();
    if (!map || activeMapStyle === prefs.mapStyle) return;
    const requestId = ++styleRequestId;
    const nextStyle = prefs.mapStyle;
    const style = await getMapStyle(nextStyle);
    if (requestId !== styleRequestId) return;
    activeMapStyle = nextStyle;
    map.setStyle(style);
  });

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <style>{`
        .maplibregl-ctrl-top-right {
          top: 64px;
          left: 16px;
          right: auto;
          max-width: calc(100% - 16px);
        }

        .maplibregl-ctrl-top-right .maplibregl-ctrl {
          margin: 0;
          float: left;
        }

        .maplibregl-ctrl-attrib {
          max-width: min(360px, calc(100vw - 16px));
          margin: 0;
        }

        .maplibregl-ctrl-attrib.maplibregl-compact {
          display: inline-flex;
          flex-direction: row;
          align-items: flex-start;
          padding: 0;
        }

        .maplibregl-ctrl-attrib-button {
          order: -1;
          flex: 0 0 auto;
          margin-left: 0;
          margin-right: 0;
          position: static;
        }

        .maplibregl-ctrl-attrib-inner {
          order: 1;
          margin-left: 0;
          display: block;
          padding-left: 8px;
          padding-right: 8px;
        }

        .maplibregl-ctrl.maplibregl-ctrl-attrib {
          padding: 0;
        }

        .maplibregl-ctrl-attrib-inner {
          max-width: 100%;
          white-space: normal;
        }
      `}</style>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      <Show when={mapInstance()}>
        {(map) => (
          <MapContext.Provider value={map()}>
            <UserLocationMarker map={map()} />
            <PinMarkers map={map()} pins={pins() ?? []} />
            <TrackLayers
              map={map()}
              tracks={tracks() ?? []}
              plotNodes={plotState.nodes}
              plotColor={plotState.color}
            />
            <Crosshair center={center()} />
            <MapStyleToggle
              isSatellite={prefs.mapStyle === 'satellite'}
              onToggle={handleToggleMapStyle}
            />
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
