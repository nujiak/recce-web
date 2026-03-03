import { type Component } from 'solid-js';
import { preferences } from '@/stores/preferences';
import { CoordinateTransformer } from '@/coords';
import { mapStore } from '@/stores/map';
import { showToast } from '@/lib/toast';

export const Crosshair: Component = () => {
  const coordDisplay = () => {
    const center = mapStore.center();
    const system = preferences.coordSystem();
    return CoordinateTransformer.toDisplay(center.lat, center.lng, system);
  };

  const handleCopy = async () => {
    const text = coordDisplay();
    if (text) {
      try {
        await navigator.clipboard.writeText(text);
        showToast('Coordinates copied', 'success');
      } catch {
        showToast('Failed to copy', 'error');
      }
    }
  };

  return (
    <div class="absolute inset-0 pointer-events-none flex items-center justify-center">
      <div class="text-secondary opacity-50">
        <span class="material-symbols-outlined text-3xl">add</span>
      </div>
      <div class="absolute bottom-4 left-4 right-4 text-center">
        <button
          type="button"
          class="inline-block bg-surface/90 backdrop-blur px-3 py-1 rounded-full text-sm font-mono pointer-events-auto hover:bg-surface-hover transition-colors"
          onClick={handleCopy}
        >
          {coordDisplay()}
        </button>
      </div>
    </div>
  );
};
