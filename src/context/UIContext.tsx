import { createContext, useContext, createSignal, ParentComponent } from 'solid-js';
import type { Pin, Track } from '../types';

type NavTab = 'map' | 'saved' | 'tools';

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
  // Refetch trigger for Saved list
  savedVersion: () => number;
  bumpSavedVersion: () => void;
}

const UIContext = createContext<UIContextValue>({} as UIContextValue);

export const UIProvider: ParentComponent = (props) => {
  const [activeNav, setActiveNav] = createSignal<NavTab>('map');
  const [activeModal, setActiveModal] = createSignal<string | null>(null);
  const [activeTool, setActiveTool] = createSignal<string | null>(null);
  const [isMultiSelect, setIsMultiSelect] = createSignal(false);
  const [editingPin, setEditingPin] = createSignal<Pin | null>(null);
  const [viewingPin, setViewingPin] = createSignal<Pin | null>(null);
  const [editingTrack, setEditingTrack] = createSignal<Track | null>(null);
  const [viewingTrack, setViewingTrack] = createSignal<Track | null>(null);
  const [savedVersion, setSavedVersion] = createSignal(0);
  const bumpSavedVersion = () => setSavedVersion(v => v + 1);

  return (
    <UIContext.Provider value={{
      activeNav, setActiveNav,
      activeModal, setActiveModal,
      activeTool, setActiveTool,
      isMultiSelect, setIsMultiSelect,
      editingPin, setEditingPin,
      viewingPin, setViewingPin,
      editingTrack, setEditingTrack,
      viewingTrack, setViewingTrack,
      savedVersion, bumpSavedVersion,
    }}>
      {props.children}
    </UIContext.Provider>
  );
};

export function useUI(): UIContextValue {
  return useContext(UIContext);
}
