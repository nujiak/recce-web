import { createSignal } from 'solid-js';

type Screen = 'map' | 'saved' | 'tools';
type Tool = 'gps' | 'ruler' | 'settings' | null;

const [screen, setScreen] = createSignal<Screen>('map');
const [activeTool, setActiveTool] = createSignal<Tool>(null);
const [isMobile, setIsMobile] = createSignal(window.innerWidth < 768);
const [selectedPinIds, setSelectedPinIds] = createSignal<Set<number>>(new Set());
const [selectedTrackIds, setSelectedTrackIds] = createSignal<Set<number>>(new Set());

window.addEventListener('resize', () => {
  setIsMobile(window.innerWidth < 768);
});

export const uiStore = {
  screen,
  setScreen,
  activeTool,
  setActiveTool,
  isMobile,
  selectedPinIds,
  selectedTrackIds,

  togglePinSelection: (id: number) => {
    setSelectedPinIds((s) => {
      const next = new Set(s);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  },

  clearSelection: () => {
    setSelectedPinIds(new Set<number>());
    setSelectedTrackIds(new Set<number>());
  },

  hasSelection: () => selectedPinIds().size > 0 || selectedTrackIds().size > 0,
};
