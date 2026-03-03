import { createContext, useContext } from 'solid-js';
import type maplibregl from 'maplibre-gl';

export const MapContext = createContext<maplibregl.Map | null>(null);
export const useMap = () => useContext(MapContext)!;
