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
import { gpsPosition, gpsHeading } from '../../stores/gps';
import { MapContext } from './MapContext';
import Crosshair from './Crosshair';
import PinMarkers from './PinMarkers';
import TrackLayers from './TrackLayers';
import PlotControls from './PlotControls';
import CompassButton from './CompassButton';
import LocationButton, { type LocationMode } from './LocationButton';
import UserLocationMarker from './UserLocationMarker';
import MapStyleToggle from './MapStyleToggle';
import { usePrefs } from '../../context/PrefsContext';
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
  const [center, setCenter] = createSignal<[number, number]>(DEFAULT_MAP_CENTER);
  const [bearing, setBearing] = createSignal(0);
  const [locationMode, setLocationMode] = createSignal<LocationMode>('unavailable');
  // Flag set to true while we are programmatically moving the map so that the
  // movestart/dragstart handlers don't incorrectly drop the follow mode.
  let programmaticMove = false;
  let programmaticMoveTimer: ReturnType<typeof setTimeout> | null = null;
  // Low-pass filtered bearing for smooth follow-bearing animation
  let smoothedBearing: number | null = null;
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
      setCenter([c.lng, c.lat]);
      setBearing(map.getBearing());

      // Update preview ghost line during plot mode
      if (plotState.active && plotState.nodes.length > 0) {
        updatePreviewLine(map, plotState.nodes, plotState.color);
      }
    });

    // Drop follow modes when the user manually moves the map.
    // 'dragstart' covers touch/mouse panning; 'touchstart' on the map canvas
    // covers pinch-zoom and other gestures that don't always fire dragstart.
    function onUserMoveStart() {
      if (programmaticMove) return;
      const mode = locationMode();
      if (mode === 'following' || mode === 'following-bearing') {
        setLocationMode('available');
      }
    }
    map.on('dragstart', onUserMoveStart);
    // Also catch wheel zoom and two-finger gestures – these move the map
    // without a drag. We listen on the canvas element directly.
    map.getCanvas().addEventListener('wheel', onUserMoveStart, { passive: true });
    map.on('touchstart', onUserMoveStart);

    map.on('load', () => {
      activeMapStyle = prefs.mapStyle;
      collapseAttributionControl();
      bindAttributionToggle();
      setMapInstance(map);
    });

    // Listen for flyTo events from PlotControls / PinInfo / TrackInfo
    function handleFlyTo(e: Event) {
      const { lat, lng } = (e as CustomEvent).detail;
      // External flyTo breaks follow mode
      setLocationMode((m) => (m === 'following' || m === 'following-bearing' ? 'available' : m));
      map.flyTo({ center: [lng, lat], zoom: 15 });
    }
    function handleFitBounds(e: Event) {
      const { bounds } = (e as CustomEvent<{ bounds: [[number, number], [number, number]] }>)
        .detail;
      // External fitBounds breaks follow mode
      setLocationMode((m) => (m === 'following' || m === 'following-bearing' ? 'available' : m));
      map.fitBounds(bounds, { padding: 48, maxZoom: 17 });
    }
    window.addEventListener('mapFlyTo', handleFlyTo);
    window.addEventListener('mapFitBounds', handleFitBounds);

    onCleanup(() => {
      map.off('styledata', collapseAttributionControl);
      map.off('styledata', bindAttributionToggle);
      map.off('dragstart', onUserMoveStart);
      map.off('touchstart', onUserMoveStart);
      map.getCanvas().removeEventListener('wheel', onUserMoveStart);
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

  // Keep locationMode in sync when GPS becomes unavailable
  createEffect(() => {
    const pos = gpsPosition();
    if (pos === null) {
      setLocationMode('unavailable');
    } else if (locationMode() === 'unavailable') {
      setLocationMode('available');
    }
  });

  // Follow GPS position
  createEffect(() => {
    const map = mapInstance();
    const pos = gpsPosition();
    const mode = locationMode();
    if (!map || !pos || (mode !== 'following' && mode !== 'following-bearing')) return;
    programmaticMove = true;
    if (programmaticMoveTimer !== null) clearTimeout(programmaticMoveTimer);
    programmaticMoveTimer = setTimeout(() => {
      programmaticMove = false;
      programmaticMoveTimer = null;
    }, 550);
    map.easeTo({ center: [pos.longitude, pos.latitude], duration: 500 });
  });

  // Follow device bearing (rotate map to match device heading)
  // Low-pass filter removes sensor jitter; easeTo animates across a longer
  // window so successive calls glide rather than stutter.
  createEffect(() => {
    const map = mapInstance();
    const heading = gpsHeading();
    const mode = locationMode();
    if (!map || heading === null || mode !== 'following-bearing') {
      // Reset smoother when leaving the mode so the next entry starts fresh
      if (mode !== 'following-bearing') smoothedBearing = null;
      return;
    }

    // Shortest-path low-pass filter on the circular bearing value (alpha = 0.15)
    // This kills high-frequency jitter without adding noticeable lag at 60fps.
    const ALPHA = 0.15;
    if (smoothedBearing === null) {
      smoothedBearing = heading;
    } else {
      let diff = ((heading - smoothedBearing + 540) % 360) - 180;
      smoothedBearing = (smoothedBearing + ALPHA * diff + 360) % 360;
    }

    const EASE_DURATION = 800;
    programmaticMove = true;
    if (programmaticMoveTimer !== null) clearTimeout(programmaticMoveTimer);
    programmaticMoveTimer = setTimeout(() => {
      programmaticMove = false;
      programmaticMoveTimer = null;
    }, EASE_DURATION + 50);

    map.easeTo({ bearing: smoothedBearing, duration: EASE_DURATION, easing: (t) => t });
  });

  function setProgrammaticMove(duration: number) {
    programmaticMove = true;
    if (programmaticMoveTimer !== null) clearTimeout(programmaticMoveTimer);
    programmaticMoveTimer = setTimeout(() => {
      programmaticMove = false;
      programmaticMoveTimer = null;
    }, duration + 50);
  }

  function handleLocate() {
    const pos = gpsPosition();
    if (!pos) return;
    const map = mapInstance();
    const mode = locationMode();
    if (mode === 'available') {
      // Enter follow-location mode: snap to position immediately, then keep following
      setLocationMode('following');
      if (map) {
        setProgrammaticMove(1500);
        map.flyTo({ center: [pos.longitude, pos.latitude], zoom: 15 });
      }
    } else if (mode === 'following') {
      // Escalate to follow-bearing mode; reset smoother so first frame is snap not lerp
      smoothedBearing = null;
      setLocationMode('following-bearing');
    } else if (mode === 'following-bearing') {
      // Third press: exit follow modes entirely, reset map bearing to north
      smoothedBearing = null;
      setLocationMode('available');
      if (map) {
        setProgrammaticMove(500);
        map.easeTo({ bearing: 0, duration: 500 });
      }
    }
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
            <CompassButton
              bearing={bearing()}
              onReset={() => map().resetNorth()}
              onRotateTo={(deg) => map().easeTo({ bearing: deg, duration: 1000 })}
            />
            <LocationButton mode={locationMode()} onLocate={handleLocate} />
          </MapContext.Provider>
        )}
      </Show>
    </div>
  );
};

export default MapView;
