import { createContext, createEffect, useContext, ParentComponent } from 'solid-js';
import { SetStoreFunction } from 'solid-js/store';
import { prefs, setPrefs, STORAGE_KEY } from '../stores/prefs';
import type { Prefs } from '../types';

type PrefsContextValue = [Prefs, SetStoreFunction<Prefs>];

const PrefsContext = createContext<PrefsContextValue>([prefs, setPrefs]);

export const PrefsProvider: ParentComponent = (props) => {
  createEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // ignore
    }
  });

  return (
    <PrefsContext.Provider value={[prefs, setPrefs]}>
      {props.children}
    </PrefsContext.Provider>
  );
};

export function usePrefs(): PrefsContextValue {
  return useContext(PrefsContext);
}
