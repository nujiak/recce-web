import { createContext, useContext, createSignal, ParentComponent } from 'solid-js';

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
}

const UIContext = createContext<UIContextValue>({} as UIContextValue);

export const UIProvider: ParentComponent = (props) => {
  const [activeNav, setActiveNav] = createSignal<NavTab>('map');
  const [activeModal, setActiveModal] = createSignal<string | null>(null);
  const [activeTool, setActiveTool] = createSignal<string | null>(null);
  const [isMultiSelect, setIsMultiSelect] = createSignal(false);

  return (
    <UIContext.Provider value={{
      activeNav, setActiveNav,
      activeModal, setActiveModal,
      activeTool, setActiveTool,
      isMultiSelect, setIsMultiSelect,
    }}>
      {props.children}
    </UIContext.Provider>
  );
};

export function useUI(): UIContextValue {
  return useContext(UIContext);
}
