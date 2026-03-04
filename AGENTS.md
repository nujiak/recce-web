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
It is built with SolidJS + TypeScript + Tailwind CSS v4 + Vite and outputs a fully static
`dist/` folder suitable for any HTTP server.

**Key constraints:**

- Output must be a static site — no server-side rendering, no backend
- Must work on mobile browsers and desktop browsers (adaptive/responsive UI)
- Offline-first via a PWA service worker
- SolidJS signals/context for all state; no imperative DOM manipulation

---

## Architecture

### Stack

| Concern     | Choice                    | Reason                                              |
| ----------- | ------------------------- | --------------------------------------------------- |
| Framework   | SolidJS + TypeScript      | Fine-grained reactivity; strict types               |
| Styling     | Tailwind CSS v4           | CSS-var-native theming; no class bloat              |
| Build       | Vite                      | Fast HMR, static `dist/` output, good CI story      |
| Map         | MapLibre GL JS            | Vector tiles; free; GeoJSON layer model             |
| Map tiles   | OpenFreeMap               | No API key needed                                   |
| Database    | Dexie (IndexedDB)         | Typed, promise-based; `Table<Pin>` / `Table<Track>` |
| Coordinates | proj4js + custom parsers  | Handles all 6 coordinate systems                    |
| Compression | pako (zlib)               | Share-code compression                              |
| Font        | Geist Mono (Google Fonts) | Monospace; good for coordinate display              |

### File Layout

```
recce-web/
├── src/
│   ├── index.html          # App shell
│   ├── main.js             # Entry point; wires modules together
│   ├── style.css           # Global styles + CSS variables
│   ├── db/
│   │   └── db.js           # Dexie schema & migrations
│   ├── coords/
│   │   ├── index.js        # CoordinateTransformer (unified API)
│   │   ├── wgs84.js
│   │   ├── utm.js
│   │   ├── mgrs.js
│   │   ├── bng.js
│   │   ├── qth.js
│   │   └── kertau.js
│   ├── map/
│   │   ├── map.js          # MapLibre setup, crosshair, coord display
│   │   ├── markers.js      # Pin marker rendering
│   │   └── tracks.js       # Track (polyline/polygon) rendering
│   ├── ui/
│   │   ├── nav.js          # Bottom nav + Toolbox modal
│   │   ├── saved.js        # Saved screen (pins & tracks list)
│   │   ├── pin-editor.js   # Pin create/edit sheet
│   │   ├── track-editor.js # Track create/edit sheet
│   │   ├── pin-info.js     # Pin detail modal
│   │   ├── track-info.js   # Track detail modal
│   │   ├── gps.js          # GPS + compass Toolbox panel
│   │   ├── ruler.js        # Ruler Toolbox panel
│   │   ├── settings.js     # Settings panel
│   │   └── onboarding.js   # First-launch onboarding flow
│   └── share/
│       └── share.js        # Share-code encode/decode
├── public/
│   ├── manifest.json       # PWA manifest
│   └── sw.js               # Service worker
├── AGENTS.md
├── README.md
└── package.json
```

### State Model

All app state lives in memory (JS objects) and is persisted to IndexedDB via Dexie.
Preferences are stored in `localStorage`. There is no reactive framework; DOM is updated
imperatively by the module that owns the relevant section of the UI.

**Pin:**

```js
{
  (id, // auto-increment integer
    createdAt, // ms timestamp
    name, // string, max 20 chars
    lat, // WGS84 decimal degrees
    lng, // WGS84 decimal degrees
    color, // 'red' | 'orange' | 'green' | 'azure' | 'violet'
    group, // string (empty string = ungrouped)
    description); // string
}
```

**Track** (replaces "Chain" from the Android app — an ordered sequence of geographic nodes):

```js
{
  (id,
    createdAt,
    name, // string, max 20 chars
    nodes, // Array<{ lat, lng, name? }>  — name marks a named waypoint/checkpoint
    isCyclical, // boolean — false = open path, true = closed area/polygon
    color, // 'red' | 'orange' | 'green' | 'azure' | 'violet'
    group, // string
    description); // string
}
```

**Preferences** (`localStorage` key `recce_prefs`):

```js
{
  (coordinateSystem, // 'WGS84' | 'UTM' | 'MGRS' | 'BNG' | 'QTH' | 'KERTAU'
    angleUnit, // 'degrees' | 'mils'
    lengthUnit, // 'metric' | 'imperial' | 'nautical'
    theme, // 'light' | 'dark' | 'system'
    onboardingDone); // boolean
}
```

### Navigation Model

| Surface           | Mobile                                     | Desktop                                       |
| ----------------- | ------------------------------------------ | --------------------------------------------- |
| **Map** (default) | Full screen                                | Left pane (flexible width)                    |
| **Saved**         | Full screen, tab-switched                  | Right pane (fixed width, scrollable)          |
| **Tools**         | Third bottom-nav tab → modal grid launcher | Icon row pinned below Saved panel (accordion) |

Map/Saved/Tools toggle is a three-item bottom tab bar on mobile. On desktop the two content
panes (Map + Saved) sit side-by-side via CSS Grid; a Tools icon row is pinned below the
Saved panel and expands an accordion panel inline — no modal is used on desktop.

**Mobile Tools modal — two-view pattern:**

1. **Grid view** (default when tab is tapped): 3 large icon cards — GPS/Compass, Ruler,
   Settings. Tapping a card slides in the tool view.
2. **Tool view**: replaces the grid with the selected panel; a `←` back button in the
   modal header returns to the grid. The modal-level close button dismisses entirely.

**Desktop Tools accordion:**

- Three icon buttons pinned at the bottom of the Saved panel column.
- Clicking an icon expands its panel below the icons; clicking the same icon (or another)
  collapses/switches. State tracked as `activeDesktopTool: string | null` in `nav.js`.

---

## Feature Specifications

### Map Screen

| Element                             | Behaviour                                                                                                                                               |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Full-screen MapLibre map            | Default view on launch                                                                                                                                  |
| Crosshair                           | Fixed centre reticle; SVG with white fill and dark gray outline for visibility on all map backgrounds; coordinate display updates on every `move` event |
| Coordinate display                  | Shows crosshair position in the active coordinate system; tap/click to copy to clipboard                                                                |
| Live measurement overlay            | Distance and bearing from current GPS location to crosshair (shown when GPS is active)                                                                  |
| Compass button                      | Shows current bearing; click resets map rotation to north                                                                                               |
| Location button                     | Centres map on current GPS position; long-press also resets rotation                                                                                    |
| Add Pin button (`add_location_alt`) | Opens pin editor pre-filled with crosshair coordinates; lives in `.coord-actions` toolbar                                                               |
| Go To button (`near_me`)            | Opens coordinate input → flies map to entered position; lives in `.coord-actions` toolbar                                                               |
| Start Track button                  | Starts track plotting mode; lives in `.coord-actions` toolbar; disabled while plotting is active                                                        |

**Track plotting mode** (active while building a track):

- Tapping the plot node button appends the current crosshair position as a node
- Long-pressing the node button appends the node and prompts for a checkpoint name
- A dashed ghost line extends from the last committed node to the live crosshair position, previewing the next segment
- The committed track preview line uses the track's own colour; the ghost line uses the same colour at reduced opacity (0.4)
- Undo button removes the last node
- Save button opens the track editor; Cancel discards the session

**Map interactions:**

- Click a pin marker → opens Pin Info modal
- Click a track polyline/polygon → opens Track Info modal

### Pin System

**Colours and their semantic intent:**

| Value    | Colour | Intent                 |
| -------- | ------ | ---------------------- |
| `red`    | Red    | Default / attention    |
| `orange` | Orange | Warning / intermediate |
| `green`  | Green  | Safe / completed       |
| `azure`  | Azure  | Water / special        |
| `violet` | Violet | Unique / marked        |

**Pin Editor** (bottom sheet on mobile, centred dialog on desktop):

- Name — required, max 20 chars
- Coordinates — single input field, parsed in the active coordinate system
- Colour — 5-option colour picker
- Group — free text; autocomplete from existing group names; empty = ungrouped
- Description — multiline free text
- Actions: Save (create or update), Delete (edit mode only)

**Pin Info modal:**

- Header: name + colour theming
- Group tag
- Description
- All six coordinate representations shown simultaneously
- Actions: Open in Maps (launches `geo:` URI or Google Maps URL), Map (fly to + close dialog), Edit (opens editor)

### Track System

A **Track** is an ordered list of `{ lat, lng, name? }` nodes rendered on the map.

- `isCyclical = false` → open **Path** (polyline A→B→C)
- `isCyclical = true` → closed **Area** (filled polygon A→B→C→A)

**Calculations:**

- Path: total distance = sum of Haversine distances between consecutive nodes
- Area: perimeter (same as path, plus closing segment) + enclosed area via the
  spherical excess formula or the shoelace formula on projected coordinates

**Named checkpoints:** nodes where `name` is non-empty. Displayed as small labelled
markers on the map and listed in the Track Info modal.

**Track Editor** (same sheet pattern as Pin Editor):

- Name — required, max 20 chars
- Type — Path / Area toggle (`isCyclical`)
- Colour
- Group
- Description
- Actions: Save, Delete (edit mode only)

**Track Info modal:**

- Header: name + colour theming
- Type icon (path vs area)
- Total distance (path) or perimeter + area (area), in user's preferred length unit
- Checkpoint list (named nodes only)
- Group tag, description
- Actions: Map (fit bounds + close), Edit

### Saved Screen

**List cards** display: name, colour indicator, group tag, coordinates in active system.
Track cards additionally show: Path/Area icon, total distance, node count.

**Sort options:** Name A–Z, Name Z–A, Time newest, Time oldest, Group.

**Multi-select mode** (entered via long-press on any card, ~300 ms):

- The long-pressed item is immediately selected as the first item.
- Tapping additional cards selects/deselects them without a full re-render (DOM-only toggle).
- Deselecting the last selected item exits multi-select automatically.
- A "Hold an item to select" hint is shown in the list header.
- Actions: bulk delete, share as a code, or add to Ruler.

**Search:** real-time filter by name or group.

### GPS & Compass Panel (Toolbox)

**Location card:**

- Current position in active coordinate system
- GPS accuracy in metres
- Altitude in metres (or feet when `lengthUnit = 'imperial'`)
- "Copy" button copies coordinates to clipboard

Implementation: `navigator.geolocation.watchPosition` with `enableHighAccuracy: true`.

**Compass card:**

- Azimuth (0–360° or 0–6400 NATO mils depending on `angleUnit`)
- Pitch (forward/backward tilt in degrees)
- Roll (side tilt in degrees)
- Animated needle via CSS `transform: rotate()`

Implementation: `DeviceOrientationEvent` (`webkitCompassHeading` on iOS;
`alpha` on Android with `absolute: true`). Show calibration hint when
`DeviceOrientationEvent.absolute` is `false` or unavailable.

### Ruler Panel (Toolbox)

- Ordered list of measurement points (label + lat/lng)
- Each consecutive pair of points shows: distance (preferred unit) and bearing
  (preferred angle unit), colour-coded by the source pin or track
- Cumulative total distance at the bottom
- Clear All button
- Points held in memory only; reset on page reload
- Populated via "Add to Ruler" in Saved multi-select (pins added individually;
  track nodes added as a contiguous sub-list)

### Settings Panel (Toolbox)

| Setting           | Options                            |
| ----------------- | ---------------------------------- |
| Coordinate system | WGS84, UTM, MGRS, BNG, QTH, Kertau |
| Angle unit        | Degrees, NATO Mils                 |
| Length unit       | Metric, Imperial, Nautical         |
| Theme             | Light, Dark, System                |

Changes apply immediately. Persisted to `localStorage` under key `recce_prefs`.

### Onboarding Flow

Three-step full-screen modal shown on first launch (`onboardingDone` absent or `false`).
Dark theme enforced regardless of system preference during the flow.

1. **Welcome** — app name and brief description
2. **Preferences** — coordinate system, angle unit, length unit, theme selectors
3. **Done** — confirmation; writes `onboardingDone: true`; dismisses to Map screen

### Share Code Format

Codes must survive copy-paste through messaging apps (WhatsApp, Telegram, SMS):

- Alphabet `0-9A-Za-z` only — no `+`, `/`, `=`, or whitespace
- Version prefix `R1` enables future format changes without breaking old clients

**Encoding:**

1. Build `{ pins: [...], tracks: [...] }` with only essential fields
   (omit `id`; keep `createdAt` as the deduplication key)
2. `JSON.stringify` → `pako.deflate` (raw deflate, no zlib header)
3. Encode resulting bytes as Base62 (big-endian, alphabet `0-9A-Za-z`)
4. Prepend `R1`

**Decoding:**

1. Strip `R1` prefix; Base62 decode → byte array
2. `pako.inflate` → JSON string → `JSON.parse`
3. Merge into DB; skip any item whose `createdAt` already exists

**Size estimate:** 5 pins ≈ 150–200 characters; 20 pins ≈ 400–600 characters.

---

## Coordinate Systems

All internal storage uses WGS84 (lat/lng). Conversion happens at display time and on
user input. All six systems share a unified API in `src/coords/index.js`:

```js
// Convert WGS84 → display string in the given system
CoordinateTransformer.toDisplay(lat, lng, system); // → string | null

// Parse a user-input string in the given system → { lat, lng } or null
CoordinateTransformer.parse(input, system); // → { lat, lng } | null

// Get display strings for all systems at once (for Pin Info modal)
CoordinateTransformer.allSystems(lat, lng); // → Map<system, string>
```

---

### WGS84

**Display format:** `1.35210° N 103.81980° E`

**Input — two accepted formats:**

```
Format 1 (cardinal suffix):   "1.3521° N 103.8198° E"   or  "1.3521 N 103.8198 E"
Format 2 (signed decimal):    "1.3521 103.8198"          or  "-1.3521 -103.8198"
```

**Regex patterns:**

```
// Format 1
/^\s*([0-9.,]+)\s*°?\s*([NSns])\s*([0-9.,]+)\s*°?\s*([EWew])\s*$/

// Format 2
/^\s*([-+0-9.,]+)\s*°?\s+([-+0-9.,]+)\s*°?\s*$/
```

**Valid range:** lat −90 to +90, lng −180 to +180.

---

### UTM (Universal Transverse Mercator)

**Display format:** `48N 0361234 0149234` (zone + band + 7-digit easting + 7-digit northing)

**Input regex:** `/^(\d{1,2})([NSns])(\d{1,14})$/` (spaces stripped before matching)

**Input examples:** `48N361234149234` · `48N 361234 149234` · `48n 361234 149234`

**Zone calculation:** `zone = floor((lng + 180) / 6) + 1` (1–60)

**Band:** `lat >= 0` → `N`; `lat < 0` → `S`

**EPSG codes:** Northern `zone + 32600`; Southern `zone + 32700`

**Projection constants:**

```
k0 = 0.9996
False easting        = 500 000 m
False northing North = 0 m
False northing South = 10 000 000 m
```

**WGS84 ellipsoid constants used throughout UTM/MGRS:**

```
a  = 6 378 137.0 m          (semi-major axis)
f  = 1 / 298.257223563      (flattening)
b  = a × (1 − f)            (semi-minor axis)
e² = 2f − f²                (first eccentricity squared)
```

**WGS84 → UTM (Transverse Mercator forward):**

```
latRad = lat × π/180
lngRad = lng × π/180
cm     = centralMeridian × π/180   // centralMeridian = (zone−1)×6 − 180 + 3

N = a / sqrt(1 − e²·sin²(latRad))
T = tan²(latRad)
C = (e²/(1−e²)) · cos²(latRad)
A = (lngRad − cm) · cos(latRad)
M = a · (latRad − e²/2·sin(2·latRad)
         + e⁴/24·sin(4·latRad)·(3−4(1−e²))·...  // standard meridional arc

easting  = k0·N·(A + (1−T+C)·A³/6 + (5−18T+T²+72C−58e²)·A⁵/120) + 500000
northing = k0·(M + N·tan(latRad)·(A²/2 + (5−T+9C+4C²)·A⁴/24
                                        + (61−58T+T²+600C−330e²)·A⁶/720))
// Add 10 000 000 to northing for southern band
```

**UTM → WGS84 (reverse):**

```
// Remove false offsets
x = easting − 500000
y = northing  (subtract 10 000 000 first for southern band)

M  = y / k0
mu = M / (a · (1 − e²/4 − e⁴/64 − e⁶/256))

e1 = (1 − √(1−e²)) / (1 + √(1−e²))

// Footpoint latitude series
φ1 = mu
   + (3e1/2 − 27e1³/32)          · sin(2·mu)
   + (21e1²/16 − 55e1⁴/32)       · sin(4·mu)
   + (151e1³/96)                  · sin(6·mu)
   + (1097e1⁴/512)                · sin(8·mu)

N1 = a / √(1 − e²·sin²(φ1))
T1 = tan²(φ1)
C1 = (e²/(1−e²)) · cos²(φ1)
D  = x / (N1 · k0)

// Final latitude
lat = φ1 − (N1·tan(φ1)/k0) · (
        D²/2
      − (5 + 3T1 + 10C1 − 4C1² − 9e²) · D⁴/24
      + (61 + 90T1 + 298C1 + 45T1² − 252e² − 3C1²) · D⁶/720
      )

// Longitude
lng = centralMeridian + (
        D
      − (1 + 2T1 + C1) · D³/6
      + (5 − 2C1 + 28T1 − 3C1² + 8e² + 24T1²) · D⁵/120
      ) / cos(φ1)
```

**Valid range:** lat −80° to +84°.

---

### MGRS (Military Grid Reference System)

Derived from UTM. Adds a latitude band letter and a 100 km grid-square designator.

**Display format:** `48PWW 12345 67890`

- `48` = UTM zone, `P` = MGRS latitude band, `WW` = 100 km square (column + row letters)
- `12345` / `67890` = easting / northing within the 100 km square (5 digits = 1 m precision)

**Input regex:** `/^(\d{1,2})(\w{3})(\d{1,12})$/` (spaces stripped, uppercased)

**Precision levels:**

| Digit pairs   | Precision |
| ------------- | --------- |
| 1 (2 digits)  | 10 km     |
| 2 (4 digits)  | 1 km      |
| 3 (6 digits)  | 100 m     |
| 4 (8 digits)  | 10 m      |
| 5 (10 digits) | 1 m       |

**Latitude band letters** (C–X, skipping I and O):

| Latitude   | Band | Latitude | Band |
| ---------- | ---- | -------- | ---- |
| −80 to −72 | C    | 0 to 8   | N    |
| −72 to −64 | D    | 8 to 16  | P    |
| −64 to −56 | E    | 16 to 24 | Q    |
| −56 to −48 | F    | 24 to 32 | R    |
| −48 to −40 | G    | 32 to 40 | S    |
| −40 to −32 | H    | 40 to 48 | T    |
| −32 to −24 | J    | 48 to 56 | U    |
| −24 to −16 | K    | 56 to 64 | V    |
| −16 to −8  | L    | 64 to 72 | W    |
| −8 to 0    | M    | 72 to 84 | X    |

`index = min(floor((lat + 80) / 8), 19)`; band = `'CDEFGHJKLMNPQRSTUVWX'[index]`

**100 km column letters** (by `zone % 3`):

```
zone % 3 === 1: A B C D E F G H
zone % 3 === 2: J K L M N P Q R
zone % 3 === 0: S T U V W X Y Z
```

`columnIndex = floor(easting / 100000) − 1` (0-based into the array above)

**100 km row letters** (by `zone % 2`, repeating every 2 000 000 m northing):

```
zone % 2 === 1: A B C D E F G H J K L M N P Q R S T U V
zone % 2 === 0: F G H J K L M N P Q R S T U V A B C D E
```

`rowIndex = floor((northing % 2000000) / 100000)`

**Y-band disambiguation** (when converting MGRS → UTM, multiple northing offsets are
possible; try each and accept the one whose derived MGRS band matches):

```js
const Y_BANDS = {
  C: [1, 0],
  D: [1, 0],
  E: [1],
  F: [2, 1],
  G: [2],
  H: [3, 2],
  J: [3],
  K: [4, 3],
  L: [4],
  M: [4, 4],
  N: [0],
  P: [0],
  Q: [0, 1],
  R: [1],
  S: [1, 2],
  T: [2],
  U: [2, 3],
  V: [3],
  W: [3, 4],
  X: [3, 4],
};
// utmNorthing = 2000000 × yBand + preliminaryNorthing
```

**Valid range:** lat −80° to +84°.

---

### BNG (British National Grid)

**EPSG:** 27700

**Proj4 string:**

```
+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000
+ellps=airy +towgs84=446.448,-125.157,542.06,0.1502,0.247,0.8421,-20.4894
+units=m +no_defs
```

Use `proj4(wgs84, bngProj, [lng, lat])` and its inverse. Do not implement the
Transverse Mercator manually for BNG.

**Display format:** `TQ 12345 67890`

- Two letters = 500 km major square + 100 km minor square
- 5-digit easting + 5-digit northing within the 100 km square

**Input regex:** `/^([JHONST])([A-HJ-Z])(\d{1,12})$/` (spaces stripped, uppercased)

**Major letters** (500 km squares, valid set: H J N O S T):

```
      0 km    500 km   1000 km  (Easting)
0 km    S        N        H
500 km  T        O        J
```

Easting offsets from major letter: `T, O, J → +500 000 m`; `S, N, H → +0 m`

Northing offsets from major letter: `H, J → +1 000 000 m`; `N, O → +500 000 m`; `S, T → +0 m`

**Minor letters** (100 km squares within the 500 km major square):

```
     0    100   200   300   400  (km easting within 500 km major)
400  A     B     C     D     E
300  F     G     H     J     K
200  L     M     N     O     P
100  Q     R     S     T     U
  0  V     W     X     Y     Z
(km northing within 500 km major)
```

Easting offsets from minor letter:
`A/F/L/Q/V = 0`; `B/G/M/R/W = +100 000 m`; `C/H/N/S/X = +200 000 m`;
`D/J/O/T/Y = +300 000 m`; `E/K/P/U/Z = +400 000 m`

Northing offsets from minor letter:
`A–E = +400 000 m`; `F–K = +300 000 m`; `L–P = +200 000 m`;
`Q–U = +100 000 m`; `V–Z = +0 m`

**Valid range:** easting 0–700 000 m, northing 0–1 250 000 m (Great Britain mainland).

---

### QTH (Maidenhead Locator)

**Display format:** `OK21ab12` (8 characters = ~500 m precision)

**Input regex:** `/^[A-Ra-r]{2}([0-9]{2}([A-Xa-x]{2}([0-9]{2})?)?)?$/`
(accepts 2, 4, 6, or 8 characters)

**Precision:**

| Length  | Precision                      |
| ------- | ------------------------------ |
| 2 chars | ±10° lat, ±20° lng (~1 200 km) |
| 4 chars | ±1° lat, ±2° lng (~120 km)     |
| 6 chars | ±2.5′ lat, ±5′ lng (~5 km)     |
| 8 chars | ±15″ lat, ±30″ lng (~500 m)    |

**WGS84 → QTH algorithm:**

```js
let lng = coord.lng + 180; // shift to 0–360
let lat = coord.lat + 90; // shift to 0–180

// Field (20° × 10°)  — uppercase letters A–R
field[0] = charFromIndex(floor(lng / 20));
field[1] = charFromIndex(floor(lat / 10));
lng %= 20;
lat %= 10;

// Square (2° × 1°) — digits 0–9
square[0] = floor(lng / 2);
square[1] = floor(lat);
lng %= 2;
lat %= 1;

// Subsquare (1/12° × 1/24°) — lowercase letters a–x
subsquare[0] = lowercaseFromIndex(floor(lng * 12));
subsquare[1] = lowercaseFromIndex(floor(lat * 24));
lng %= 1 / 12;
lat %= 1 / 24;

// Extended square (1/120° × 1/240°) — digits 0–9
extended[0] = floor(lng * 120);
extended[1] = floor(lat * 240);
```

**QTH → WGS84:** reverse the above, summing contributions from each level present.
Use the centre of each cell (add half the cell size) for the most accurate point.

**Valid range:** global (all latitudes and longitudes).

---

### Kertau 1948 (SVY21)

Covers Peninsular Malaysia and Singapore.

**Proj4 string:**

```
+proj=omerc +lat_0=4 +lonc=102.25 +alpha=323.0257905 +k=0.99984
+x_0=804670.24 +y_0=0 +no_uoff +gamma=323.1301023611111
+a=6377295.664 +b=6356094.667915204 +units=m +no_defs +towgs84=-11,851,5
```

Use `proj4(wgs84, kertauProj, [lng, lat])` and its inverse.

**Display format:** `804670 149234` (easting space northing, integer metres)

**Input:** two integers separated by space, comma, or semicolon.

**Valid geographic bounds:**

- Latitude 1.12° N to 6.72° N
- Longitude 99.59° E to 104.60° E

Return `null` for coordinates outside these bounds.

---

## CSS Conventions

- Use CSS custom properties for all colours and spacing; defined in `:root`
- Dark/light theme toggled by `data-theme` attribute on `<html>`; never hardcode hex/oklch colours
- Mobile-first breakpoints: base styles for narrow viewports; `@media (min-width: 768px)` for desktop
- BEM-style class names: `.pin-card`, `.pin-card__name`, `.pin-card--selected`

---

## Coding Conventions

- ES modules (`import`/`export`); no CommonJS
- Prefer `const`; use `let` only when reassignment is necessary
- DOM queries cached at module initialisation; never query the DOM in a hot loop
- Async DB operations always `await`ed; never fire-and-forget
- Functions named in `camelCase`; CSS classes and HTML ids in `kebab-case`
- Each UI module exports an `init()` function called from `main.js`

---

## CI / Build

```bash
npm install
npm run build   # outputs dist/
npm run dev     # local dev server with HMR
```

```bash
npx serve dist
# or
python3 -m http.server --directory dist
```

||||||| 120907a

- No jQuery; use modern vanilla DOM APIs

---

## Architecture

### Stack

| Concern     | Choice                    | Reason                                         |
| ----------- | ------------------------- | ---------------------------------------------- |
| Build       | Vite                      | Fast HMR, static `dist/` output, good CI story |
| Map         | MapLibre GL JS            | Already integrated; vector tiles; free         |
| Map tiles   | OpenFreeMap               | No API key needed                              |
| Database    | Dexie (IndexedDB)         | Already integrated; typed, promise-based       |
| Coordinates | proj4js + custom parsers  | Already integrated; handles all 6 systems      |
| Compression | pako (zlib)               | Share-code compression                         |
| Icons       | Material Symbols (CDN)    | Already in use                                 |
| Font        | Geist Mono (Google Fonts) | Already in use                                 |

### File Layout

```
recce-web/
├── src/
│   ├── index.html          # App shell
│   ├── main.js             # Entry point; wires modules together
│   ├── style.css           # Global styles + CSS variables
│   ├── db/
│   │   └── db.js           # Dexie schema & migrations
│   ├── coords/
│   │   ├── index.js        # CoordinateTransformer (unified API)
│   │   ├── wgs84.js
│   │   ├── utm.js
│   │   ├── mgrs.js
│   │   ├── bng.js
│   │   ├── qth.js
│   │   └── kertau.js
│   ├── map/
│   │   ├── map.js          # MapLibre setup, crosshair, coord display
│   │   ├── markers.js      # Pin marker rendering
│   │   └── tracks.js       # Track (polyline/polygon) rendering
│   ├── ui/
│   │   ├── nav.js          # Bottom nav + Toolbox modal
│   │   ├── saved.js        # Saved screen (pins & tracks list)
│   │   ├── pin-editor.js   # Pin create/edit sheet
│   │   ├── track-editor.js # Track create/edit sheet
│   │   ├── pin-info.js     # Pin detail modal
│   │   ├── track-info.js   # Track detail modal
│   │   ├── gps.js          # GPS + compass Toolbox panel
│   │   ├── ruler.js        # Ruler Toolbox panel
│   │   ├── settings.js     # Settings panel
│   │   └── onboarding.js   # First-launch onboarding flow
│   └── share/
│       └── share.js        # Share-code encode/decode
├── public/
│   ├── manifest.json       # PWA manifest
│   └── sw.js               # Service worker
├── AGENTS.md
├── README.md
└── package.json
```

### State Model

All app state lives in memory (JS objects) and is persisted to IndexedDB via Dexie.
Preferences are stored in `localStorage`. There is no reactive framework; DOM is updated
imperatively by the module that owns the relevant section of the UI.

**Pin:**

```js
{
  (id, // auto-increment integer
    createdAt, // ms timestamp
    name, // string, max 20 chars
    lat, // WGS84 decimal degrees
    lng, // WGS84 decimal degrees
    color, // 'red' | 'orange' | 'green' | 'azure' | 'violet'
    group, // string (empty string = ungrouped)
    description); // string
}
```

**Track** (replaces "Chain" from the Android app — an ordered sequence of geographic nodes):

```js
{
  (id,
    createdAt,
    name, // string, max 20 chars
    nodes, // Array<{ lat, lng, name? }>  — name marks a named waypoint/checkpoint
    isCyclical, // boolean — false = open path, true = closed area/polygon
    color, // 'red' | 'orange' | 'green' | 'azure' | 'violet'
    group, // string
    description); // string
}
```

**Preferences** (`localStorage` key `recce_prefs`):

```js
{
  (coordinateSystem, // 'WGS84' | 'UTM' | 'MGRS' | 'BNG' | 'QTH' | 'KERTAU'
    angleUnit, // 'degrees' | 'mils'
    lengthUnit, // 'metric' | 'imperial' | 'nautical'
    theme, // 'light' | 'dark' | 'system'
    onboardingDone); // boolean
}
```

### Navigation Model

| Surface           | Mobile                                     | Desktop                                       |
| ----------------- | ------------------------------------------ | --------------------------------------------- |
| **Map** (default) | Full screen                                | Left pane (flexible width)                    |
| **Saved**         | Full screen, tab-switched                  | Right pane (fixed width, scrollable)          |
| **Tools**         | Third bottom-nav tab → modal grid launcher | Icon row pinned below Saved panel (accordion) |

Map/Saved/Tools toggle is a three-item bottom tab bar on mobile. On desktop the two content
panes (Map + Saved) sit side-by-side via CSS Grid; a Tools icon row is pinned below the
Saved panel and expands an accordion panel inline — no modal is used on desktop.

**Mobile Tools modal — two-view pattern:**

1. **Grid view** (default when tab is tapped): 3 large icon cards — GPS/Compass, Ruler,
   Settings. Tapping a card slides in the tool view.
2. **Tool view**: replaces the grid with the selected panel; a `←` back button in the
   modal header returns to the grid. The modal-level close button dismisses entirely.

**Desktop Tools accordion:**

- Three icon buttons pinned at the bottom of the Saved panel column.
- Clicking an icon expands its panel below the icons; clicking the same icon (or another)
  collapses/switches. State tracked as `activeDesktopTool: string | null` in `nav.js`.

---

## Feature Specifications

### Map Screen

| Element                             | Behaviour                                                                                                                                               |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Full-screen MapLibre map            | Default view on launch                                                                                                                                  |
| Crosshair                           | Fixed centre reticle; SVG with white fill and dark gray outline for visibility on all map backgrounds; coordinate display updates on every `move` event |
| Coordinate display                  | Shows crosshair position in the active coordinate system; tap/click to copy to clipboard                                                                |
| Live measurement overlay            | Distance and bearing from current GPS location to crosshair (shown when GPS is active)                                                                  |
| Compass button                      | Shows current bearing; click resets map rotation to north                                                                                               |
| Location button                     | Centres map on current GPS position; long-press also resets rotation                                                                                    |
| Add Pin button (`add_location_alt`) | Opens pin editor pre-filled with crosshair coordinates; lives in `.coord-actions` toolbar                                                               |
| Go To button (`near_me`)            | Opens coordinate input → flies map to entered position; lives in `.coord-actions` toolbar                                                               |
| Start Track button                  | Starts track plotting mode; lives in `.coord-actions` toolbar; disabled while plotting is active                                                        |

**Track plotting mode** (active while building a track):

- Tapping the plot node button appends the current crosshair position as a node
- Long-pressing the node button appends the node and prompts for a checkpoint name
- A dashed ghost line extends from the last committed node to the live crosshair position, previewing the next segment
- The committed track preview line uses the track's own colour; the ghost line uses the same colour at reduced opacity (0.4)
- Undo button removes the last node
- Save button opens the track editor; Cancel discards the session

**Map interactions:**

- Click a pin marker → opens Pin Info modal
- Click a track polyline/polygon → opens Track Info modal

### Pin System

**Colours and their semantic intent:**

| Value    | Colour | Intent                 |
| -------- | ------ | ---------------------- |
| `red`    | Red    | Default / attention    |
| `orange` | Orange | Warning / intermediate |
| `green`  | Green  | Safe / completed       |
| `azure`  | Azure  | Water / special        |
| `violet` | Violet | Unique / marked        |

**Pin Editor** (bottom sheet on mobile, centred dialog on desktop):

- Name — required, max 20 chars
- Coordinates — single input field, parsed in the active coordinate system
- Colour — 5-option colour picker
- Group — free text; autocomplete from existing group names; empty = ungrouped
- Description — multiline free text
- Actions: Save (create or update), Delete (edit mode only)

**Pin Info modal:**

- Header: name + colour theming
- Group tag
- Description
- All six coordinate representations shown simultaneously
- Actions: Open in Maps (launches `geo:` URI or Google Maps URL), Map (fly to + close dialog), Edit (opens editor)

### Track System

A **Track** is an ordered list of `{ lat, lng, name? }` nodes rendered on the map.

- `isCyclical = false` → open **Path** (polyline A→B→C)
- `isCyclical = true` → closed **Area** (filled polygon A→B→C→A)

**Calculations:**

- Path: total distance = sum of Haversine distances between consecutive nodes
- Area: perimeter (same as path, plus closing segment) + enclosed area via the
  spherical excess formula or the shoelace formula on projected coordinates

**Named checkpoints:** nodes where `name` is non-empty. Displayed as small labelled
markers on the map and listed in the Track Info modal.

**Track Editor** (same sheet pattern as Pin Editor):

- Name — required, max 20 chars
- Type — Path / Area toggle (`isCyclical`)
- Colour
- Group
- Description
- Actions: Save, Delete (edit mode only)

**Track Info modal:**

- Header: name + colour theming
- Type icon (path vs area)
- Total distance (path) or perimeter + area (area), in user's preferred length unit
- Checkpoint list (named nodes only)
- Group tag, description
- Actions: Map (fit bounds + close), Edit

### Saved Screen

**List cards** display: name, colour indicator, group tag, coordinates in active system.
Track cards additionally show: Path/Area icon, total distance, node count.

**Sort options:** Name A–Z, Name Z–A, Time newest, Time oldest, Group.

**Multi-select mode** (entered via long-press on any card, ~300 ms):

- The long-pressed item is immediately selected as the first item.
- Tapping additional cards selects/deselects them without a full re-render (DOM-only toggle).
- Deselecting the last selected item exits multi-select automatically.
- A "Hold an item to select" hint is shown in the list header.
- Actions: bulk delete, share as a code, or add to Ruler.

**Search:** real-time filter by name or group.

### GPS & Compass Panel (Toolbox)

**Location card:**

- Current position in active coordinate system
- GPS accuracy in metres
- Altitude in metres (or feet when `lengthUnit = 'imperial'`)
- "Copy" button copies coordinates to clipboard

Implementation: `navigator.geolocation.watchPosition` with `enableHighAccuracy: true`.

**Compass card:**

- Azimuth (0–360° or 0–6400 NATO mils depending on `angleUnit`)
- Pitch (forward/backward tilt in degrees)
- Roll (side tilt in degrees)
- Animated needle via CSS `transform: rotate()`

Implementation: `DeviceOrientationEvent` (`webkitCompassHeading` on iOS;
`alpha` on Android with `absolute: true`). Show calibration hint when
`DeviceOrientationEvent.absolute` is `false` or unavailable.

### Ruler Panel (Toolbox)

- Ordered list of measurement points (label + lat/lng)
- Each consecutive pair of points shows: distance (preferred unit) and bearing
  (preferred angle unit), colour-coded by the source pin or track
- Cumulative total distance at the bottom
- Clear All button
- Points held in memory only; reset on page reload
- Populated via "Add to Ruler" in Saved multi-select (pins added individually;
  track nodes added as a contiguous sub-list)

### Settings Panel (Toolbox)

| Setting           | Options                            |
| ----------------- | ---------------------------------- |
| Coordinate system | WGS84, UTM, MGRS, BNG, QTH, Kertau |
| Angle unit        | Degrees, NATO Mils                 |
| Length unit       | Metric, Imperial, Nautical         |
| Theme             | Light, Dark, System                |

Changes apply immediately. Persisted to `localStorage` under key `recce_prefs`.

### Onboarding Flow

Three-step full-screen modal shown on first launch (`onboardingDone` absent or `false`).
Dark theme enforced regardless of system preference during the flow.

1. **Welcome** — app name and brief description
2. **Preferences** — coordinate system, angle unit, length unit, theme selectors
3. **Done** — confirmation; writes `onboardingDone: true`; dismisses to Map screen

### Share Code Format

Codes must survive copy-paste through messaging apps (WhatsApp, Telegram, SMS):

- Alphabet `0-9A-Za-z` only — no `+`, `/`, `=`, or whitespace
- Version prefix `R1` enables future format changes without breaking old clients

**Encoding:**

1. Build `{ pins: [...], tracks: [...] }` with only essential fields
   (omit `id`; keep `createdAt` as the deduplication key)
2. `JSON.stringify` → `pako.deflate` (raw deflate, no zlib header)
3. Encode resulting bytes as Base62 (big-endian, alphabet `0-9A-Za-z`)
4. Prepend `R1`

**Decoding:**

1. Strip `R1` prefix; Base62 decode → byte array
2. `pako.inflate` → JSON string → `JSON.parse`
3. Merge into DB; skip any item whose `createdAt` already exists

**Size estimate:** 5 pins ≈ 150–200 characters; 20 pins ≈ 400–600 characters.

---

## Coordinate Systems

All internal storage uses WGS84 (lat/lng). Conversion happens at display time and on
user input. All six systems share a unified API in `src/coords/index.js`:

```js
// Convert WGS84 → display string in the given system
CoordinateTransformer.toDisplay(lat, lng, system); // → string | null

// Parse a user-input string in the given system → { lat, lng } or null
CoordinateTransformer.parse(input, system); // → { lat, lng } | null

// Get display strings for all systems at once (for Pin Info modal)
CoordinateTransformer.allSystems(lat, lng); // → Map<system, string>
```

---

### WGS84

**Display format:** `1.35210° N 103.81980° E`

**Input — two accepted formats:**

```
Format 1 (cardinal suffix):   "1.3521° N 103.8198° E"   or  "1.3521 N 103.8198 E"
Format 2 (signed decimal):    "1.3521 103.8198"          or  "-1.3521 -103.8198"
```

**Regex patterns:**

```
// Format 1
/^\s*([0-9.,]+)\s*°?\s*([NSns])\s*([0-9.,]+)\s*°?\s*([EWew])\s*$/

// Format 2
/^\s*([-+0-9.,]+)\s*°?\s+([-+0-9.,]+)\s*°?\s*$/
```

**Valid range:** lat −90 to +90, lng −180 to +180.

---

### UTM (Universal Transverse Mercator)

**Display format:** `48N 0361234 0149234` (zone + band + 7-digit easting + 7-digit northing)

**Input regex:** `/^(\d{1,2})([NSns])(\d{1,14})$/` (spaces stripped before matching)

**Input examples:** `48N361234149234` · `48N 361234 149234` · `48n 361234 149234`

**Zone calculation:** `zone = floor((lng + 180) / 6) + 1` (1–60)

**Band:** `lat >= 0` → `N`; `lat < 0` → `S`

**EPSG codes:** Northern `zone + 32600`; Southern `zone + 32700`

**Projection constants:**

```
k0 = 0.9996
False easting        = 500 000 m
False northing North = 0 m
False northing South = 10 000 000 m
```

**WGS84 ellipsoid constants used throughout UTM/MGRS:**

```
a  = 6 378 137.0 m          (semi-major axis)
f  = 1 / 298.257223563      (flattening)
b  = a × (1 − f)            (semi-minor axis)
e² = 2f − f²                (first eccentricity squared)
```

**WGS84 → UTM (Transverse Mercator forward):**

```
latRad = lat × π/180
lngRad = lng × π/180
cm     = centralMeridian × π/180   // centralMeridian = (zone−1)×6 − 180 + 3

N = a / sqrt(1 − e²·sin²(latRad))
T = tan²(latRad)
C = (e²/(1−e²)) · cos²(latRad)
A = (lngRad − cm) · cos(latRad)
M = a · (latRad − e²/2·sin(2·latRad)
         + e⁴/24·sin(4·latRad)·(3−4(1−e²))·...  // standard meridional arc

easting  = k0·N·(A + (1−T+C)·A³/6 + (5−18T+T²+72C−58e²)·A⁵/120) + 500000
northing = k0·(M + N·tan(latRad)·(A²/2 + (5−T+9C+4C²)·A⁴/24
                                        + (61−58T+T²+600C−330e²)·A⁶/720))
// Add 10 000 000 to northing for southern band
```

**UTM → WGS84 (reverse):**

```
// Remove false offsets
x = easting − 500000
y = northing  (subtract 10 000 000 first for southern band)

M  = y / k0
mu = M / (a · (1 − e²/4 − e⁴/64 − e⁶/256))

e1 = (1 − √(1−e²)) / (1 + √(1−e²))

// Footpoint latitude series
φ1 = mu
   + (3e1/2 − 27e1³/32)          · sin(2·mu)
   + (21e1²/16 − 55e1⁴/32)       · sin(4·mu)
   + (151e1³/96)                  · sin(6·mu)
   + (1097e1⁴/512)                · sin(8·mu)

N1 = a / √(1 − e²·sin²(φ1))
T1 = tan²(φ1)
C1 = (e²/(1−e²)) · cos²(φ1)
D  = x / (N1 · k0)

// Final latitude
lat = φ1 − (N1·tan(φ1)/k0) · (
        D²/2
      − (5 + 3T1 + 10C1 − 4C1² − 9e²) · D⁴/24
      + (61 + 90T1 + 298C1 + 45T1² − 252e² − 3C1²) · D⁶/720
      )

// Longitude
lng = centralMeridian + (
        D
      − (1 + 2T1 + C1) · D³/6
      + (5 − 2C1 + 28T1 − 3C1² + 8e² + 24T1²) · D⁵/120
      ) / cos(φ1)
```

**Valid range:** lat −80° to +84°.

---

### MGRS (Military Grid Reference System)

Derived from UTM. Adds a latitude band letter and a 100 km grid-square designator.

**Display format:** `48PWW 12345 67890`

- `48` = UTM zone, `P` = MGRS latitude band, `WW` = 100 km square (column + row letters)
- `12345` / `67890` = easting / northing within the 100 km square (5 digits = 1 m precision)

**Input regex:** `/^(\d{1,2})(\w{3})(\d{1,12})$/` (spaces stripped, uppercased)

**Precision levels:**

| Digit pairs   | Precision |
| ------------- | --------- |
| 1 (2 digits)  | 10 km     |
| 2 (4 digits)  | 1 km      |
| 3 (6 digits)  | 100 m     |
| 4 (8 digits)  | 10 m      |
| 5 (10 digits) | 1 m       |

**Latitude band letters** (C–X, skipping I and O):

| Latitude   | Band | Latitude | Band |
| ---------- | ---- | -------- | ---- |
| −80 to −72 | C    | 0 to 8   | N    |
| −72 to −64 | D    | 8 to 16  | P    |
| −64 to −56 | E    | 16 to 24 | Q    |
| −56 to −48 | F    | 24 to 32 | R    |
| −48 to −40 | G    | 32 to 40 | S    |
| −40 to −32 | H    | 40 to 48 | T    |
| −32 to −24 | J    | 48 to 56 | U    |
| −24 to −16 | K    | 56 to 64 | V    |
| −16 to −8  | L    | 64 to 72 | W    |
| −8 to 0    | M    | 72 to 84 | X    |

`index = min(floor((lat + 80) / 8), 19)`; band = `'CDEFGHJKLMNPQRSTUVWX'[index]`

**100 km column letters** (by `zone % 3`):

```
zone % 3 === 1: A B C D E F G H
zone % 3 === 2: J K L M N P Q R
zone % 3 === 0: S T U V W X Y Z
```

`columnIndex = floor(easting / 100000) − 1` (0-based into the array above)

**100 km row letters** (by `zone % 2`, repeating every 2 000 000 m northing):

```
zone % 2 === 1: A B C D E F G H J K L M N P Q R S T U V
zone % 2 === 0: F G H J K L M N P Q R S T U V A B C D E
```

`rowIndex = floor((northing % 2000000) / 100000)`

**Y-band disambiguation** (when converting MGRS → UTM, multiple northing offsets are
possible; try each and accept the one whose derived MGRS band matches):

```js
const Y_BANDS = {
  C: [1, 0],
  D: [1, 0],
  E: [1],
  F: [2, 1],
  G: [2],
  H: [3, 2],
  J: [3],
  K: [4, 3],
  L: [4],
  M: [4, 4],
  N: [0],
  P: [0],
  Q: [0, 1],
  R: [1],
  S: [1, 2],
  T: [2],
  U: [2, 3],
  V: [3],
  W: [3, 4],
  X: [3, 4],
};
// utmNorthing = 2000000 × yBand + preliminaryNorthing
```

**Valid range:** lat −80° to +84°.

---

### BNG (British National Grid)

**EPSG:** 27700

**Proj4 string:**

```
+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000
+ellps=airy +towgs84=446.448,-125.157,542.06,0.1502,0.247,0.8421,-20.4894
+units=m +no_defs
```

Use `proj4(wgs84, bngProj, [lng, lat])` and its inverse. Do not implement the
Transverse Mercator manually for BNG.

**Display format:** `TQ 12345 67890`

- Two letters = 500 km major square + 100 km minor square
- 5-digit easting + 5-digit northing within the 100 km square

**Input regex:** `/^([JHONST])([A-HJ-Z])(\d{1,12})$/` (spaces stripped, uppercased)

**Major letters** (500 km squares, valid set: H J N O S T):

```
      0 km    500 km   1000 km  (Easting)
0 km    S        N        H
500 km  T        O        J
```

Easting offsets from major letter: `T, O, J → +500 000 m`; `S, N, H → +0 m`

Northing offsets from major letter: `H, J → +1 000 000 m`; `N, O → +500 000 m`; `S, T → +0 m`

**Minor letters** (100 km squares within the 500 km major square):

```
     0    100   200   300   400  (km easting within 500 km major)
400  A     B     C     D     E
300  F     G     H     J     K
200  L     M     N     O     P
100  Q     R     S     T     U
  0  V     W     X     Y     Z
(km northing within 500 km major)
```

Easting offsets from minor letter:
`A/F/L/Q/V = 0`; `B/G/M/R/W = +100 000 m`; `C/H/N/S/X = +200 000 m`;
`D/J/O/T/Y = +300 000 m`; `E/K/P/U/Z = +400 000 m`

Northing offsets from minor letter:
`A–E = +400 000 m`; `F–K = +300 000 m`; `L–P = +200 000 m`;
`Q–U = +100 000 m`; `V–Z = +0 m`

**Valid range:** easting 0–700 000 m, northing 0–1 250 000 m (Great Britain mainland).

---

### QTH (Maidenhead Locator)

**Display format:** `OK21ab12` (8 characters = ~500 m precision)

**Input regex:** `/^[A-Ra-r]{2}([0-9]{2}([A-Xa-x]{2}([0-9]{2})?)?)?$/`
(accepts 2, 4, 6, or 8 characters)

**Precision:**

| Length  | Precision                      |
| ------- | ------------------------------ |
| 2 chars | ±10° lat, ±20° lng (~1 200 km) |
| 4 chars | ±1° lat, ±2° lng (~120 km)     |
| 6 chars | ±2.5′ lat, ±5′ lng (~5 km)     |
| 8 chars | ±15″ lat, ±30″ lng (~500 m)    |

**WGS84 → QTH algorithm:**

```js
let lng = coord.lng + 180; // shift to 0–360
let lat = coord.lat + 90; // shift to 0–180

// Field (20° × 10°)  — uppercase letters A–R
field[0] = charFromIndex(floor(lng / 20));
field[1] = charFromIndex(floor(lat / 10));
lng %= 20;
lat %= 10;

// Square (2° × 1°) — digits 0–9
square[0] = floor(lng / 2);
square[1] = floor(lat);
lng %= 2;
lat %= 1;

// Subsquare (1/12° × 1/24°) — lowercase letters a–x
subsquare[0] = lowercaseFromIndex(floor(lng * 12));
subsquare[1] = lowercaseFromIndex(floor(lat * 24));
lng %= 1 / 12;
lat %= 1 / 24;

// Extended square (1/120° × 1/240°) — digits 0–9
extended[0] = floor(lng * 120);
extended[1] = floor(lat * 240);
```

**QTH → WGS84:** reverse the above, summing contributions from each level present.
Use the centre of each cell (add half the cell size) for the most accurate point.

**Valid range:** global (all latitudes and longitudes).

---

### Kertau 1948 (SVY21)

Covers Peninsular Malaysia and Singapore.

**Proj4 string:**

```
+proj=omerc +lat_0=4 +lonc=102.25 +alpha=323.0257905 +k=0.99984
+x_0=804670.24 +y_0=0 +no_uoff +gamma=323.1301023611111
+a=6377295.664 +b=6356094.667915204 +units=m +no_defs +towgs84=-11,851,5
```

Use `proj4(wgs84, kertauProj, [lng, lat])` and its inverse.

**Display format:** `804670 149234` (easting space northing, integer metres)

**Input:** two integers separated by space, comma, or semicolon.

**Valid geographic bounds:**

- Latitude 1.12° N to 6.72° N
- Longitude 99.59° E to 104.60° E

Return `null` for coordinates outside these bounds.

---

## CSS Conventions

- Use CSS custom properties for all colours and spacing; defined in `:root`
- Dark/light theme toggled by `data-theme` attribute on `<html>`; never hardcode hex/oklch colours
- Mobile-first breakpoints: base styles for narrow viewports; `@media (min-width: 768px)` for desktop
- BEM-style class names: `.pin-card`, `.pin-card__name`, `.pin-card--selected`

---

## Coding Conventions

- ES modules (`import`/`export`); no CommonJS
- Prefer `const`; use `let` only when reassignment is necessary
- DOM queries cached at module initialisation; never query the DOM in a hot loop
- Async DB operations always `await`ed; never fire-and-forget
- Functions named in `camelCase`; CSS classes and HTML ids in `kebab-case`
- Each UI module exports an `init()` function called from `main.js`

---

## CI / Build

```bash
npm install
npm run build   # outputs dist/
npm run dev     # local dev server with HMR
```

```bash
npx serve dist
# or
python3 -m http.server --directory dist
```

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

---
