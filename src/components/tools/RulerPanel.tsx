import { type Component, createSignal, For, Show } from 'solid-js';
import { preferences } from '@/stores/preferences';
import { haversineDistance, calculateBearing, formatDistance, formatBearing } from '@/utils/geo';

interface RulerPoint {
  label: string;
  lat: number;
  lng: number;
  color: string;
}

const [points, setPoints] = createSignal<RulerPoint[]>([]);

export const rulerStore = {
  addPoint: (point: RulerPoint) => setPoints((prev) => [...prev, point]),
  addPoints: (newPoints: RulerPoint[]) => setPoints((prev) => [...prev, ...newPoints]),
  clearPoints: () => setPoints([]),
  getPoints: () => points(),
};

export const RulerPanel: Component = () => {
  const totalDistance = () => {
    const pts = points();
    let total = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      total += haversineDistance(pts[i].lat, pts[i].lng, pts[i + 1].lat, pts[i + 1].lng);
    }
    return total;
  };

  const handleClear = () => {
    setPoints([]);
  };

  return (
    <div class="space-y-4">
      <h3 class="flex items-center gap-2 text-lg font-semibold">
        <span class="material-symbols-outlined">straighten</span>
        Ruler
      </h3>

      <Show when={points().length === 0}>
        <div class="text-center py-8 text-secondary">
          <span class="material-symbols-outlined text-4xl">straighten</span>
          <p class="mt-2">No points added</p>
          <p class="text-sm">Select items from Saved and tap the ruler button</p>
        </div>
      </Show>

      <Show when={points().length > 0}>
        <div class="space-y-1">
          <For each={points()}>
            {(point, index) => (
              <>
                <div class="flex items-center gap-2 p-2 rounded-lg bg-surface-hover">
                  <div
                    class="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ 'background-color': `var(--color-pin-${point.color})` }}
                  />
                  <span class="truncate text-sm">{point.label}</span>
                </div>
                <Show when={index() < points().length - 1}>
                  {(() => {
                    const nextPoint = points()[index() + 1];
                    const dist = haversineDistance(
                      point.lat,
                      point.lng,
                      nextPoint.lat,
                      nextPoint.lng
                    );
                    const bearing = calculateBearing(
                      point.lat,
                      point.lng,
                      nextPoint.lat,
                      nextPoint.lng
                    );
                    return (
                      <div class="flex justify-around text-xs text-secondary py-1 px-4">
                        <span>{formatDistance(dist, preferences.lengthUnit())}</span>
                        <span>{formatBearing(bearing, preferences.angleUnit())}</span>
                      </div>
                    );
                  })()}
                </Show>
              </>
            )}
          </For>
        </div>

        <div class="flex justify-between items-center p-3 rounded-lg bg-primary/10">
          <span class="font-medium">Total</span>
          <span class="font-mono font-medium">
            {formatDistance(totalDistance(), preferences.lengthUnit())}
          </span>
        </div>

        <button
          class="w-full py-2 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors"
          onClick={handleClear}
        >
          Clear All
        </button>
      </Show>
    </div>
  );
};
