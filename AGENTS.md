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

# Architecture

Recce Web is a static web app built with SolidJS, TypeScript, and Tailwind CSS.

## Tech Stack

| Concern   | Technology           |
| --------- | -------------------- |
| Build     | Vite                 |
| Framework | SolidJS              |
| Language  | TypeScript (.tsx)    |
| Styling   | Tailwind CSS         |
| State     | Solid signals/stores |
| Map       | MapLibre GL JS       |
| Database  | Dexie (IndexedDB)    |

## Project Structure

```
src/
├── components/          # Solid UI components
│   ├── layout/          # App layout, navigation, modals
│   ├── map/             # Map view, markers, tracks layer
│   ├── pins/            # Pin cards, editor, info modals
│   ├── tracks/          # Track cards, editor, info modals
│   ├── saved/           # Saved items list
│   ├── tools/           # GPS, Ruler, Settings panels
│   └── onboarding/      # Onboarding flow
├── stores/              # Solid state stores
│   ├── preferences.ts   # User preferences (theme, units, etc.)
│   ├── pins.ts          # Pins store
│   ├── tracks.ts        # Tracks store
│   ├── map.ts           # Map state (center, zoom, GPS)
│   └── ui.ts            # UI state (screen, modals, selection)
├── lib/                 # Pure TS utilities
│   ├── geo.ts           # Haversine, bearing, distance calculations
│   ├── clipboard.ts     # Clipboard utilities
│   ├── toast.ts         # Toast notification helper
│   └── swipe.ts         # Touch gesture detection
├── coords/              # Coordinate system transformations
│   ├── index.ts         # CoordinateTransformer class
│   ├── wgs84.ts
│   ├── utm.ts
│   ├── mgrs.ts
│   ├── bng.ts
│   ├── qth.ts
│   └── kertau.ts
├── db/
│   └── db.ts            # Dexie database setup
├── types/
│   └── index.ts         # TypeScript type definitions
├── styles/
│   └── tailwind.css     # Tailwind entry with CSS variables
├── main.tsx             # App entry point
└── index.html           # HTML template
```

## Key Patterns

### State Management

Use SolidJS stores for global state:

```tsx
import { preferences } from '@/stores/preferences';
import { pinsStore } from '@/stores/pins';

// Read state
const coordSystem = preferences.coordSystem();

// Update state
preferences.setCoordSystem('UTM');
await pinsStore.add({
  name: 'New Pin',
  lat: 51.5,
  lng: -0.1,
  color: 'green',
  group: '',
  description: '',
});
```

### Coordinate Systems

All coordinates are stored as WGS84 (lat/lng). Use CoordinateTransformer for display:

```tsx
import { CoordinateTransformer } from '@/coords';

const display = CoordinateTransformer.toDisplay(lat, lng, 'UTM');
const parsed = CoordinateTransformer.parse('51°30′N 0°10′W', 'WGS84');
```

### Styling

Use Tailwind utility classes with CSS variables for theming:

```tsx
<div class="flex items-center gap-2 p-3 rounded-lg bg-surface hover:bg-surface-hover">
  <span class="text-primary">Accent text</span>
</div>
```

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run typecheck    # TypeScript check
npm run lint         # ESLint check
```

## PWA

The app is a PWA with offline support via service worker. Map tiles are cached for offline use.

---

## Original Project Overview

Recce Web is a static web app rewrite of the Recce Android mapping/reconnaissance utility.
It outputs a fully static `dist/` folder suitable for any HTTP server.

**Key constraints:**

- Output must be a static site — no server-side rendering, no backend
- Must work on mobile browsers and desktop browsers (adaptive/responsive UI)
- Offline-first via a PWA service worker
- MapLibre GL JS for mapping
- Dexie (IndexedDB) for local persistence
