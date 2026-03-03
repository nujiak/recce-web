# AGENTS.md — Recce Web

## Core Rules

- IMPORTANT: Never commit without explicit permission
- IMPORTANT: Never commit directly on main/master; create a branch first
- IMPORTANT: Never force push to main/master
- IMPORTANT: Never commit secrets, credentials, or .env files
- Explain why, not what (commits, PRs, comments)
- Prefer existing files and patterns over new ones

## LLM Behaviour

- Reply succinctly; minimise verbosity and file reads
- Use @file references; run single tests, not full suites
- Course-correct early to avoid context pollution

## Git Practices

- Short commit messages; break into atomic commits
- Run lint/typecheck before committing; stage only relevant files
- Branch naming: `type/description` (e.g. `feature/track-creation`, `fix/coord-display`)
- Verify author before amending; never amend pushed commits

## Pull Requests

- Explain context/motivation; describe solution approach
- Use section names: Summary, Changes, Motivation, Testing

---

# Migration Plan: Vanilla JS → SolidJS + TypeScript + Tailwind CSS

## Overview

This document outlines a phased migration from the current vanilla JS + CSS architecture to a modern stack using SolidJS (reactive UI), TypeScript (type safety), and Tailwind CSS (utility-first styling).

**Approach:** Incremental migration with working builds after each phase.

**Target Stack:**
| Concern | Current | Target |
| ----------- | -------------------- | ------------------------- |
| Build | Vite | Vite (unchanged) |
| Framework | Vanilla JS | SolidJS |
| Language | JavaScript | TypeScript (.tsx) |
| Styling | Custom CSS + vars | Tailwind CSS |
| State | Imperative DOM | Solid signals/stores |
| Map | MapLibre GL JS | Solid-MapLibre or wrapper |
| Database | Dexie | Dexie (unchanged) |

---

## Phase 0: Project Setup

**Branch:** `migration/setup`

**Goal:** Add TypeScript, SolidJS, and Tailwind to the build without breaking existing code.

### 0.1 Install Dependencies

```bash
# SolidJS core
npm install solid-js

# SolidJS Vite plugin
npm install -D vite-plugin-solid

# TypeScript
npm install -D typescript @types/node

# Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Type definitions for existing deps
npm install -D @types/proj4
```

### 0.2 Configure TypeScript

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "preserve",
    "jsxImportSource": "solid-js",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "paths": {
      "@/*": ["./src/*"]
    },
    "baseUrl": "."
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules", "dist"]
}
```

### 0.3 Configure Vite for Solid

Update `vite.config.js` → `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import { resolve } from 'path';

export default defineConfig({
  plugins: [solid()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    target: 'esnext',
  },
});
```

### 0.4 Configure Tailwind

`tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,html}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Map existing CSS vars to Tailwind theme
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        // ... migrate from style.css
      },
      fontFamily: {
        mono: ['Geist Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
```

Create `src/styles/tailwind.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Preserve critical CSS variables during migration */
@layer base {
  :root {
    /* Keep existing vars for gradual migration */
  }
}
```

### 0.5 Update package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext .js,.ts,.tsx"
  }
}
```

### 0.6 ESLint for TypeScript

```bash
npm install -D @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

Update `.eslintrc.cjs` to handle `.ts` and `.tsx` files.

### 0.7 Update Entry Point

Rename `src/main.js` → `src/main.tsx` and update `src/index.html`:

```html
<script type="module" src="/src/main.tsx"></script>
```

### 0.8 Coexistence Strategy

During migration, both old and new code coexist:

```
src/
├── legacy/              # Old JS modules (deprecated)
│   ├── ui/
│   ├── map/
│   └── ...
├── components/          # New Solid components
├── stores/              # Solid stores
├── lib/                 # Pure TS utilities
└── styles/
    ├── tailwind.css     # New Tailwind entry
    └── style.css        # Old styles (deprecated)
```

**Deliverable:** Build succeeds with both old and new code. No runtime changes.

---

## Phase 1: Type Definitions & Core Utilities

**Branch:** `migration/types-utils`

**Goal:** Create TypeScript type definitions and migrate pure utility functions.

### 1.1 Type Definitions

Create `src/types/index.ts`:

```ts
// Domain types
export type PinColor = 'red' | 'orange' | 'green' | 'azure' | 'violet';

export type CoordSystem = 'WGS84' | 'UTM' | 'MGRS' | 'BNG' | 'QTH' | 'KERTAU';

export type AngleUnit = 'degrees' | 'mils';

export type LengthUnit = 'metric' | 'imperial' | 'nautical';

export type Theme = 'light' | 'dark' | 'system';

export interface Pin {
  id: number;
  createdAt: number;
  name: string;
  lat: number;
  lng: number;
  color: PinColor;
  group: string;
  description: string;
}

export interface TrackNode {
  lat: number;
  lng: number;
  name?: string;
}

export interface Track {
  id: number;
  createdAt: number;
  name: string;
  nodes: TrackNode[];
  isCyclical: boolean;
  color: PinColor;
  group: string;
  description: string;
}

export interface Preferences {
  coordinateSystem: CoordSystem;
  angleUnit: AngleUnit;
  lengthUnit: LengthUnit;
  theme: Theme;
  onboardingDone: boolean;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}
```

### 1.2 Migrate Coordinate Modules

Convert each file in `src/coords/` to TypeScript:

```
src/coords/
├── index.ts           # CoordinateTransformer class
├── wgs84.ts
├── utm.ts
├── mgrs.ts
├── bng.ts
├── qth.ts
└── kertau.ts
```

Each module exports typed functions:

```ts
// src/coords/wgs84.ts
import type { GeoPoint } from '@/types';

export function toDisplay(lat: number, lng: number): string;
export function parse(input: string): GeoPoint | null;
```

### 1.3 Migrate Utility Functions

Convert `src/utils/` to TypeScript:

```
src/lib/
├── geo.ts            # Haversine, bearing, distance calculations
├── clipboard.ts      # Clipboard utilities
├── toast.ts          # Toast notification helper
├── keyboard.ts       # Keyboard event helpers
└── swipe.ts          # Touch gesture detection
```

### 1.4 Database Layer

Convert `src/db/db.js` → `src/db/db.ts`:

```ts
import Dexie, { type EntityTable } from 'dexie';
import type { Pin, Track } from '@/types';

const db = new Dexie('RecceDB') as Dexie & {
  pins: EntityTable<Pin, 'id'>;
  tracks: EntityTable<Track, 'id'>;
};

db.version(1).stores({
  pins: '++id, createdAt, name, group',
  tracks: '++id, createdAt, name, group',
});

export { db };
```

**Deliverable:** All utility functions and types in TypeScript. Old JS code still works.

---

## Phase 2: State Layer (Signals & Stores)

**Branch:** `migration/state`

**Goal:** Create reactive state management using SolidJS primitives.

### 2.1 Preferences Store

`src/stores/preferences.ts`:

```ts
import { createSignal, createEffect } from 'solid-js';
import type { Preferences, CoordSystem, AngleUnit, LengthUnit, Theme } from '@/types';

const STORAGE_KEY = 'recce_prefs';

const defaults: Preferences = {
  coordinateSystem: 'WGS84',
  angleUnit: 'degrees',
  lengthUnit: 'metric',
  theme: 'system',
  onboardingDone: false,
};

function load(): Preferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
  } catch {
    return defaults;
  }
}

const [prefs, setPrefs] = createSignal<Preferences>(load());

// Auto-persist
createEffect(() => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs()));
});

export const preferences = {
  get: prefs,
  set: setPrefs,
  coordSystem: () => prefs().coordinateSystem,
  setCoordSystem: (v: CoordSystem) => setPrefs((p) => ({ ...p, coordinateSystem: v })),
  angleUnit: () => prefs().angleUnit,
  setAngleUnit: (v: AngleUnit) => setPrefs((p) => ({ ...p, angleUnit: v })),
  lengthUnit: () => prefs().lengthUnit,
  setLengthUnit: (v: LengthUnit) => setPrefs((p) => ({ ...p, lengthUnit: v })),
  theme: () => prefs().theme,
  setTheme: (v: Theme) => setPrefs((p) => ({ ...p, theme: v })),
  onboardingDone: () => prefs().onboardingDone,
  completeOnboarding: () => setPrefs((p) => ({ ...p, onboardingDone: true })),
};
```

### 2.2 Pins Store

`src/stores/pins.ts`:

```ts
import { createSignal, createMemo, batch } from 'solid-js';
import { db } from '@/db/db';
import type { Pin, PinColor } from '@/types';

const [pins, setPins] = createSignal<Pin[]>([]);
const [loading, setLoading] = createSignal(true);

// Load on init
db.pins.toArray().then((data) => {
  batch(() => {
    setPins(data);
    setLoading(false);
  });
});

export const pinsStore = {
  list: pins,
  loading,

  async add(pin: Omit<Pin, 'id' | 'createdAt'>): Promise<Pin> {
    const newPin: Pin = {
      ...pin,
      id: await db.pins.add(pin as Pin),
      createdAt: Date.now(),
    };
    setPins((p) => [...p, newPin]);
    return newPin;
  },

  async update(id: number, updates: Partial<Pin>): Promise<void> {
    await db.pins.update(id, updates);
    setPins((p) => p.map((pin) => (pin.id === id ? { ...pin, ...updates } : pin)));
  },

  async delete(id: number): Promise<void> {
    await db.pins.delete(id);
    setPins((p) => p.filter((pin) => pin.id !== id));
  },

  async deleteMany(ids: number[]): Promise<void> {
    await db.pins.bulkDelete(ids);
    setPins((p) => p.filter((pin) => !ids.includes(pin.id)));
  },

  byId: (id: number) => createMemo(() => pins().find((p) => p.id === id)),
  byGroup: (group: string) => createMemo(() => pins().filter((p) => p.group === group)),
};
```

### 2.3 Tracks Store

`src/stores/tracks.ts`:

```ts
import { createSignal, createMemo, batch } from 'solid-js';
import { db } from '@/db/db';
import type { Track, TrackNode } from '@/types';

const [tracks, setTracks] = createSignal<Track[]>([]);
const [loading, setLoading] = createSignal(true);

db.tracks.toArray().then((data) => {
  batch(() => {
    setTracks(data);
    setLoading(false);
  });
});

export const tracksStore = {
  list: tracks,
  loading,

  async add(track: Omit<Track, 'id' | 'createdAt'>): Promise<Track> {
    const newTrack: Track = {
      ...track,
      id: await db.tracks.add(track as Track),
      createdAt: Date.now(),
    };
    setTracks((t) => [...t, newTrack]);
    return newTrack;
  },

  async update(id: number, updates: Partial<Track>): Promise<void> {
    await db.tracks.update(id, updates);
    setTracks((t) => t.map((track) => (track.id === id ? { ...track, ...updates } : track)));
  },

  async delete(id: number): Promise<void> {
    await db.tracks.delete(id);
    setTracks((t) => t.filter((track) => track.id !== id));
  },

  byId: (id: number) => createMemo(() => tracks().find((t) => t.id === id)),
};
```

### 2.4 Map State Store

`src/stores/map.ts`:

```ts
import { createSignal, createMemo } from 'solid-js';
import type { GeoPoint } from '@/types';

const [center, setCenter] = createSignal<GeoPoint>({ lat: 0, lng: 0 });
const [zoom, setZoom] = createSignal(2);
const [bearing, setBearing] = createSignal(0);
const [gpsPosition, setGpsPosition] = createSignal<GeoPoint | null>(null);
const [gpsAccuracy, setGpsAccuracy] = createSignal<number | null>(null);
const [isTracking, setIsTracking] = createSignal(false);

export const mapStore = {
  center,
  setCenter,
  zoom,
  setZoom,
  bearing,
  setBearing,
  gpsPosition,
  setGpsPosition,
  gpsAccuracy,
  setGpsAccuracy,
  isTracking,
  setIsTracking,

  // Derived
  hasGps: createMemo(() => gpsPosition() !== null),
};
```

### 2.5 UI State Store

`src/stores/ui.ts`:

```ts
import { createSignal } from 'solid-js';

type Screen = 'map' | 'saved' | 'tools';
type Tool = 'gps' | 'ruler' | 'settings' | null;

const [screen, setScreen] = createSignal<Screen>('map');
const [activeTool, setActiveTool] = createSignal<Tool>(null);
const [isMobile, setIsMobile] = createSignal(window.innerWidth < 768);
const [selectedPinIds, setSelectedPinIds] = createSignal<Set<number>>(new Set());
const [selectedTrackIds, setSelectedTrackIds] = createSignal<Set<number>>(new Set());

// Responsive listener
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
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  },

  clearSelection: () => {
    setSelectedPinIds(new Set());
    setSelectedTrackIds(new Set());
  },

  hasSelection: () => selectedPinIds().size > 0 || selectedTrackIds().size > 0,
};
```

**Deliverable:** All app state in reactive SolidJS stores. Old code can read from stores but updates go through new stores.

---

## Phase 3: UI Components (Incremental)

**Branch per component:** `migration/component-<name>`

**Goal:** Migrate UI modules to Solid components one by one.

### 3.1 Component Structure

```
src/components/
├── layout/
│   ├── App.tsx           # Root app layout
│   ├── BottomNav.tsx     # Mobile bottom navigation
│   ├── DesktopLayout.tsx # Desktop two-pane layout
│   └── Modal.tsx         # Reusable modal/sheet
├── map/
│   ├── MapView.tsx       # MapLibre wrapper
│   ├── Crosshair.tsx     # Center crosshair overlay
│   ├── CoordDisplay.tsx  # Coordinate readout
│   └── MapControls.tsx   # Compass, location buttons
├── pins/
│   ├── PinCard.tsx       # List item
│   ├── PinEditor.tsx     # Create/edit sheet
│   ├── PinInfo.tsx       # Detail modal
│   └── ColorPicker.tsx   # Color selector
├── tracks/
│   ├── TrackCard.tsx
│   ├── TrackEditor.tsx
│   ├── TrackInfo.tsx
│   └── TrackPlotter.tsx  # Track plotting mode
├── saved/
│   ├── SavedList.tsx     # Pins & tracks list
│   ├── SearchBar.tsx
│   └── MultiSelectActions.tsx
├── tools/
│   ├── ToolGrid.tsx      # Mobile tool grid
│   ├── GpsPanel.tsx
│   ├── RulerPanel.tsx
│   └── SettingsPanel.tsx
└── onboarding/
    └── OnboardingFlow.tsx
```

### 3.2 Migration Order

Migrate in dependency order (leaf components first):

1. **Leaf components (no children):**
   - `ColorPicker.tsx`
   - `SearchBar.tsx`
   - `CoordDisplay.tsx`
   - `Crosshair.tsx`

2. **Card components:**
   - `PinCard.tsx`
   - `TrackCard.tsx`

3. **Modal/Sheet components:**
   - `Modal.tsx`
   - `PinEditor.tsx`
   - `TrackEditor.tsx`
   - `PinInfo.tsx`
   - `TrackInfo.tsx`

4. **Panel components:**
   - `GpsPanel.tsx`
   - `RulerPanel.tsx`
   - `SettingsPanel.tsx`

5. **List/container components:**
   - `SavedList.tsx`
   - `ToolGrid.tsx`

6. **Layout components:**
   - `BottomNav.tsx`
   - `DesktopLayout.tsx`
   - `MapView.tsx`

7. **Root:**
   - `App.tsx`
   - `OnboardingFlow.tsx`

### 3.3 Component Template

Each Solid component follows this pattern:

```tsx
// src/components/pins/PinCard.tsx
import { type Component, Show, For } from 'solid-js';
import type { Pin } from '@/types';
import { preferences } from '@/stores/preferences';
import { CoordinateTransformer } from '@/coords';

interface PinCardProps {
  pin: Pin;
  selected?: boolean;
  onSelect?: () => void;
  onClick?: () => void;
}

export const PinCard: Component<PinCardProps> = (props) => {
  const coordDisplay = () => {
    const { lat, lng } = props.pin;
    const system = preferences.coordSystem();
    return CoordinateTransformer.toDisplay(lat, lng, system);
  };

  return (
    <div
      class="flex items-center gap-3 p-3 rounded-lg bg-surface cursor-pointer hover:bg-surface-hover transition-colors"
      classList={{ 'ring-2 ring-primary': props.selected }}
      onClick={props.onClick}
    >
      <div class={`w-3 h-3 rounded-full bg-pin-${props.pin.color}`} />
      <div class="flex-1 min-w-0">
        <div class="font-medium truncate">{props.pin.name}</div>
        <Show when={props.pin.group}>
          <div class="text-sm text-secondary truncate">{props.pin.group}</div>
        </Show>
      </div>
      <div class="text-xs text-secondary font-mono">{coordDisplay()}</div>
    </div>
  );
};
```

### 3.4 Modal/Sheet Component

```tsx
// src/components/layout/Modal.tsx
import { type Component, JSX, Show, createEffect, onCleanup } from 'solid-js';
import { uiStore } from '@/stores/ui';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: JSX.Element;
  variant?: 'center' | 'bottom-sheet';
}

export const Modal: Component<ModalProps> = (props) => {
  let modalRef: HTMLDivElement | undefined;

  createEffect(() => {
    if (props.open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  });

  onCleanup(() => {
    document.body.style.overflow = '';
  });

  const containerClass = () =>
    props.variant === 'bottom-sheet' && uiStore.isMobile()
      ? 'fixed inset-x-0 bottom-0 rounded-t-2xl max-h-[85vh] overflow-auto'
      : 'fixed inset-0 flex items-center justify-center p-4';

  return (
    <Show when={props.open}>
      <div class="fixed inset-0 z-50">
        {/* Backdrop */}
        <div class="absolute inset-0 bg-black/50" onClick={props.onClose} />

        {/* Content */}
        <div ref={modalRef} class={`${containerClass()} bg-surface shadow-xl`}>
          <Show when={props.title}>
            <div class="flex items-center justify-between p-4 border-b border-border">
              <h2 class="text-lg font-semibold">{props.title}</h2>
              <button class="p-2 hover:bg-surface-hover rounded-full" onClick={props.onClose}>
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
          </Show>
          <div class="p-4">{props.children}</div>
        </div>
      </div>
    </Show>
  );
};
```

**Deliverable:** Each component migrated, tested in isolation, then integrated.

---

## Phase 4: Map Integration

**Branch:** `migration/map`

**Goal:** Integrate MapLibre GL JS with SolidJS reactivity.

### 4.1 Options

**Option A: Solid-MapLibre (if mature)**

```bash
npm install solid-maplibre
```

**Option B: Custom wrapper** (recommended for control)

### 4.2 MapLibre Wrapper Component

```tsx
// src/components/map/MapView.tsx
import { type Component, onMount, onCleanup, createEffect } from 'solid-js';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { mapStore } from '@/stores/map';

export const MapView: Component = () => {
  let container: HTMLDivElement | undefined;
  let map: maplibregl.Map | undefined;

  onMount(() => {
    if (!container) return;

    map = new maplibregl.Map({
      container,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [mapStore.center().lng, mapStore.center().lat],
      zoom: mapStore.zoom(),
    });

    map.on('move', () => {
      const center = map!.getCenter();
      mapStore.setCenter({ lat: center.lat, lng: center.lng });
      mapStore.setZoom(map!.getZoom());
      mapStore.setBearing(map!.getBearing());
    });
  });

  onCleanup(() => {
    map?.remove();
  });

  // React to store changes
  createEffect(() => {
    const pos = mapStore.gpsPosition();
    if (pos && map) {
      // Update GPS marker
    }
  });

  return <div ref={container} class="absolute inset-0" />;
};
```

### 4.3 Markers & Tracks as Solid Components

```tsx
// src/components/map/Markers.tsx
import { type Component, For, onMount, onCleanup } from 'solid-js';
import maplibregl from 'maplibre-gl';
import { pinsStore } from '@/stores/pins';

interface MarkersProps {
  map: maplibregl.Map;
}

export const Markers: Component<MarkersProps> = (props) => {
  const markers = new Map<number, maplibregl.Marker>();

  createEffect(() => {
    const pins = pinsStore.list();

    // Add new markers
    for (const pin of pins) {
      if (!markers.has(pin.id)) {
        const el = document.createElement('div');
        el.className = `marker marker-${pin.color}`;
        el.innerHTML = '<span class="material-symbols-outlined">location_on</span>';

        const marker = new maplibregl.Marker(el).setLngLat([pin.lng, pin.lat]).addTo(props.map);

        markers.set(pin.id, marker);
      } else {
        // Update existing
        markers.get(pin.id)!.setLngLat([pin.lng, pin.lat]);
      }
    }

    // Remove deleted
    for (const [id, marker] of markers) {
      if (!pins.find((p) => p.id === id)) {
        marker.remove();
        markers.delete(id);
      }
    }
  });

  onCleanup(() => {
    for (const marker of markers.values()) {
      marker.remove();
    }
  });

  return null;
};
```

**Deliverable:** Map fully reactive with Solid state. Click events flow through stores.

---

## Phase 5: Final Integration & Cleanup

**Branch:** `migration/cleanup`

**Goal:** Remove legacy code, finalize architecture.

### 5.1 Cleanup Tasks

1. Delete `src/legacy/` directory
2. Delete `src/style.css`
3. Remove all JS files (only TS/TSX remain)
4. Update imports across codebase
5. Remove deprecated packages from `package.json`

### 5.2 Final Directory Structure

```
src/
├── components/          # Solid UI components
│   ├── layout/
│   ├── map/
│   ├── pins/
│   ├── tracks/
│   ├── saved/
│   ├── tools/
│   └── onboarding/
├── stores/              # Solid state stores
│   ├── preferences.ts
│   ├── pins.ts
│   ├── tracks.ts
│   ├── map.ts
│   └── ui.ts
├── lib/                 # Pure TS utilities
│   ├── geo.ts
│   ├── clipboard.ts
│   ├── toast.ts
│   └── swipe.ts
├── coords/              # Coordinate systems
│   ├── index.ts
│   ├── wgs84.ts
│   ├── utm.ts
│   ├── mgrs.ts
│   ├── bng.ts
│   ├── qth.ts
│   └── kertau.ts
├── db/
│   └── db.ts            # Dexie database
├── types/
│   └── index.ts         # TypeScript types
├── styles/
│   └── tailwind.css     # Tailwind entry
├── main.tsx             # App entry point
└── index.html
```

### 5.3 Update AGENTS.md

After migration, this file should be updated to reflect the new architecture.

---

## Testing Checklist

After each phase:

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] `npm run dev` loads app
- [ ] Mobile viewport works (<768px)
- [ ] Desktop viewport works (≥768px)
- [ ] Dark theme applies correctly
- [ ] PWA service worker still functions
- [ ] IndexedDB data persists
- [ ] Map renders and responds to input

---

## Tailwind Theme Mapping

Migrate CSS custom properties to Tailwind theme:

| CSS Variable             | Tailwind Class   |
| ------------------------ | ---------------- |
| `--color-primary`        | `primary`        |
| `--color-secondary`      | `secondary`      |
| `--color-surface`        | `surface`        |
| `--color-surface-hover`  | `surface-hover`  |
| `--color-border`         | `border`         |
| `--color-text`           | `text`           |
| `--color-text-secondary` | `text-secondary` |
| `--color-pin-red`        | `pin-red`        |
| `--color-pin-orange`     | `pin-orange`     |
| `--color-pin-green`      | `pin-green`      |
| `--color-pin-azure`      | `pin-azure`      |
| `--color-pin-violet`     | `pin-violet`     |

---

## Rollback Plan

Each phase creates a merge commit to main. To rollback:

1. `git revert --no-commit <merge-commit>`
2. Test the revert locally
3. Push the revert commit

Or maintain a `migration-backup` branch at the pre-migration state.

---

## Estimated Timeline

| Phase | Duration | Dependencies |
| ----- | -------- | ------------ |
| 0     | 1-2 days | None         |
| 1     | 2-3 days | Phase 0      |
| 2     | 2-3 days | Phase 1      |
| 3     | 5-7 days | Phase 2      |
| 4     | 2-3 days | Phase 3      |
| 5     | 1-2 days | Phase 4      |

**Total:** 13-20 days for full migration

---

## Original Project Overview (Reference)

Recce Web is a static web app rewrite of the Recce Android mapping/reconnaissance utility.
It outputs a fully static `dist/` folder suitable for any HTTP server.

**Key constraints:**

- Output must be a static site — no server-side rendering, no backend
- Must work on mobile browsers and desktop browsers (adaptive/responsive UI)
- Offline-first via a PWA service worker
- MapLibre GL JS for mapping
- Dexie (IndexedDB) for local persistence

---

## Chrome MCP Testing

All UI-related changes and integration tests must be verified using Chrome MCP tools.

**Prerequisites:**

- Start the dev server: `npm run dev`
- Ensure the app is accessible at `http://localhost:5173`

**Testing Requirements:**

- Test all UI changes in both mobile and desktop viewports
- For changes targeting one viewport, test the other viewport for regression
- Use `chrome-devtools_take_snapshot` to verify element presence and structure
- Use `chrome-devtools_take_screenshot` for visual verification
- Use `chrome-devtools_evaluate_script` for runtime state checks

**Viewport Testing:**

- Mobile: width < 768px (default viewport)
- Desktop: width >= 768px (use `chrome-devtools_resize_page` or `chrome-devtools_emulate`)
