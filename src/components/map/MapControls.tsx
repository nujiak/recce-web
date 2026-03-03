import { type Component, Show } from 'solid-js';
import { mapStore } from '@/stores/map';
import type { Map as MapLibreMap } from 'maplibre-gl';

export interface MapControlsProps {
  map?: MapLibreMap;
}

export const MapControls: Component<MapControlsProps> = (props) => {
  const handleCompassClick = () => {
    if (props.map) {
      props.map.setBearing(0);
    }
  };

  const handleLocationClick = () => {
    if (props.map) {
      props.map.jumpTo({ center: [103.795, 1.376], zoom: 9.5 });
    }
  };

  return (
    <div class="absolute top-4 left-4 flex flex-col gap-2 pointer-events-auto">
      <Show when={mapStore.bearing() !== 0}>
        <button
          type="button"
          class="w-10 h-10 bg-surface/90 backdrop-blur rounded-full shadow-lg flex items-center justify-center hover:bg-surface-hover transition-colors"
          onClick={handleCompassClick}
          title="Reset bearing"
        >
          <span
            class="material-symbols-outlined"
            style={{ transform: `rotate(${-mapStore.bearing()}deg)` }}
          >
            compass_calibration
          </span>
        </button>
      </Show>
      <button
        type="button"
        class="w-10 h-10 bg-surface/90 backdrop-blur rounded-full shadow-lg flex items-center justify-center hover:bg-surface-hover transition-colors"
        onClick={handleLocationClick}
        title="Go to default location"
      >
        <span class="material-symbols-outlined">explore</span>
      </button>
    </div>
  );
};
