import {
  createContext,
  useContext,
  createSignal,
  onMount,
  onCleanup,
  ParentComponent,
} from 'solid-js';
import type { Pin, Track } from '../types';
import { DESKTOP_BREAKPOINT } from '../utils/constants';

type NavTab = 'map' | 'saved' | 'tools';
export type DesktopSection = 'saved' | 'gps' | 'ruler' | 'coa' | 'settings' | null;

interface UIContextValue {
  activeNav: () => NavTab;
  setActiveNav: (tab: NavTab) => void;
  activeModal: () => string | null;
  setActiveModal: (modal: string | null) => void;
  activeTool: () => string | null;
  setActiveTool: (tool: string | null) => void;
  isMultiSelect: () => boolean;
  setIsMultiSelect: (v: boolean) => void;
  // Pin editor/info
  editingPin: () => Pin | null;
  setEditingPin: (p: Pin | null) => void;
  viewingPin: () => Pin | null;
  setViewingPin: (p: Pin | null) => void;
  // Track editor/info
  editingTrack: () => Track | null;
  setEditingTrack: (t: Track | null) => void;
  viewingTrack: () => Track | null;
  setViewingTrack: (t: Track | null) => void;
  // Desktop accordion section
  desktopSection: () => DesktopSection;
  setDesktopSection: (s: DesktopSection) => void;
  // Refetch trigger for Saved list
  savedVersion: () => number;
  bumpSavedVersion: () => void;
}

const UIContext = createContext<UIContextValue>({} as UIContextValue);

export const UIProvider: ParentComponent = (props) => {
  const [activeNav, setActiveNav] = createSignal<NavTab>('map');
  const [desktopSection, setDesktopSection] = createSignal<DesktopSection>('saved');
  const [activeTool, setActiveTool] = createSignal<string | null>(null);

  // Reset mobile-only tabs (saved/tools) when viewport widens to desktop,
  // and open the corresponding desktop accordion section for a seamless transition.
  let wasDesktop = window.innerWidth >= DESKTOP_BREAKPOINT;
  const onResize = () => {
    const desktop = window.innerWidth >= DESKTOP_BREAKPOINT;
    if (desktop && !wasDesktop) {
      const tab = activeNav();
      if (tab === 'saved') {
        setDesktopSection('saved');
        setActiveNav('map');
      } else if (tab === 'tools') {
        const tool = activeTool();
        setDesktopSection(
          tool === 'gps' || tool === 'ruler' || tool === 'coa' || tool === 'settings' ? tool : null
        );
        setActiveNav('map');
      }
    }
    wasDesktop = desktop;
  };
  onMount(() => {
    window.addEventListener('resize', onResize);
    onCleanup(() => window.removeEventListener('resize', onResize));
  });

  const [activeModal, setActiveModal] = createSignal<string | null>(null);
  const [isMultiSelect, setIsMultiSelect] = createSignal(false);
  const [editingPin, setEditingPin] = createSignal<Pin | null>(null);
  const [viewingPin, setViewingPin] = createSignal<Pin | null>(null);
  const [editingTrack, setEditingTrack] = createSignal<Track | null>(null);
  const [viewingTrack, setViewingTrack] = createSignal<Track | null>(null);
  const [savedVersion, setSavedVersion] = createSignal(0);
  const bumpSavedVersion = () => setSavedVersion((v) => v + 1);

  return (
    <UIContext.Provider
      value={{
        activeNav,
        setActiveNav,
        activeModal,
        setActiveModal,
        activeTool,
        setActiveTool,
        desktopSection,
        setDesktopSection,
        isMultiSelect,
        setIsMultiSelect,
        editingPin,
        setEditingPin,
        viewingPin,
        setViewingPin,
        editingTrack,
        setEditingTrack,
        viewingTrack,
        setViewingTrack,
        savedVersion,
        bumpSavedVersion,
      }}
    >
      {props.children}
    </UIContext.Provider>
  );
};

export function useUI(): UIContextValue {
  return useContext(UIContext);
}
