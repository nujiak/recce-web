import { createSignal } from 'solid-js';

export interface RulerPoint {
  name: string;
  lat: number;
  lng: number;
}

export const [rulerPoints, setRulerPoints] = createSignal<RulerPoint[]>([]);

export function addToRuler(points: RulerPoint[]) {
  setRulerPoints(prev => [...prev, ...points]);
}

export function clearRuler() {
  setRulerPoints([]);
}
