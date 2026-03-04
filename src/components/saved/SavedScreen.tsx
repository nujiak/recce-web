import { Component, createResource, createSignal, createMemo, For, Show } from 'solid-js';
import { getAllPins, getAllTracks, deletePin, deleteTrack } from '../../db/db';
import { encode } from '../../share/share';
import { decode } from '../../share/share';
import { addPin, addTrack } from '../../db/db';
import { showToast } from '../Toast';
import { useUI } from '../../context/UIContext';
import { addToRuler } from '../../stores/ruler';
import PinCard from './PinCard';
import TrackCard from './TrackCard';
import type { Pin, Track } from '../../types';

type SortMode = 'name-asc' | 'name-desc' | 'date-new' | 'date-old' | 'color';

const SavedScreen: Component = () => {
  const {
    setEditingPin,
    setViewingPin,
    setEditingTrack,
    setViewingTrack,
    savedVersion,
    setActiveTool,
  } = useUI();
  const [pins, { refetch: refetchPins }] = createResource(savedVersion, getAllPins);
  const [tracks, { refetch: refetchTracks }] = createResource(savedVersion, getAllTracks);
  const [search, setSearch] = createSignal('');
  const [sortMode, setSortMode] = createSignal<SortMode>('date-new');
  const [selected, setSelected] = createSignal<Set<string>>(new Set());
  const [multiSelect, setMultiSelect] = createSignal(false);
  const [showImport, setShowImport] = createSignal(false);
  const [importCode, setImportCode] = createSignal('');

  let longPressTimer: ReturnType<typeof setTimeout> | null = null;
  let longPressFired = false;

  const refetch = () => {
    refetchPins();
    refetchTracks();
  };

  function sortItems<T extends { name: string; createdAt: number; color: string }>(
    items: T[]
  ): T[] {
    const mode = sortMode();
    return [...items].sort((a, b) => {
      if (mode === 'name-asc') return a.name.localeCompare(b.name);
      if (mode === 'name-desc') return b.name.localeCompare(a.name);
      if (mode === 'date-new') return b.createdAt - a.createdAt;
      if (mode === 'date-old') return a.createdAt - b.createdAt;
      if (mode === 'color') return a.color.localeCompare(b.color);
      return 0;
    });
  }

  const filteredPins = createMemo(() => {
    const q = search().toLowerCase();
    const all = pins() ?? [];
    return sortItems(
      all.filter((p) => p.name.toLowerCase().includes(q) || p.group.toLowerCase().includes(q))
    );
  });

  const filteredTracks = createMemo(() => {
    const q = search().toLowerCase();
    const all = tracks() ?? [];
    return sortItems(
      all.filter((t) => t.name.toLowerCase().includes(q) || t.group.toLowerCase().includes(q))
    );
  });

  function startLongPress(key: string) {
    longPressFired = false;
    longPressTimer = setTimeout(() => {
      longPressFired = true;
      longPressTimer = null;
      setMultiSelect(true);
      toggleSelect(key);
    }, 300);
  }

  function cancelLongPress() {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }

  function toggleSelect(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      if (next.size === 0) setMultiSelect(false);
      return next;
    });
  }

  function handleCardClick(key: string) {
    if (longPressFired) {
      longPressFired = false;
      return;
    }
    if (multiSelect()) toggleSelect(key);
  }

  async function bulkDelete() {
    for (const key of selected()) {
      const [type, idStr] = key.split(':');
      const id = parseInt(idStr);
      if (type === 'pin') await deletePin(id);
      else if (type === 'track') await deleteTrack(id);
    }
    setSelected(new Set<string>());
    setMultiSelect(false);
    refetch();
    showToast('Deleted', 'success');
  }

  function shareSelected() {
    const sel = selected();
    const selPins = (pins() ?? []).filter((p) => sel.has(`pin:${p.id}`));
    const selTracks = (tracks() ?? []).filter((t) => sel.has(`track:${t.id}`));
    const code = encode(selPins, selTracks);
    navigator.clipboard.writeText(code).catch(() => {});
    showToast(`Share code: ${code.slice(0, 20)}…`, 'info', 5000);
  }

  function addSelectedToRuler() {
    const sel = selected();
    const selPins = (pins() ?? []).filter((p) => sel.has(`pin:${p.id}`));
    const selTracks = (tracks() ?? []).filter((t) => sel.has(`track:${t.id}`));
    const points = [
      ...selPins.map((p) => ({ name: p.name, lat: p.lat, lng: p.lng })),
      ...selTracks
        .filter((t) => t.nodes.length > 0)
        .map((t) => ({ name: t.name, lat: t.nodes[0].lat, lng: t.nodes[0].lng })),
    ];
    if (points.length === 0) return;
    addToRuler(points);
    setSelected(new Set<string>());
    setMultiSelect(false);
    setActiveTool('ruler');
    showToast(`Added ${points.length} point(s) to Ruler`, 'success');
  }

  async function importItems() {
    const result = decode(importCode().trim());
    if (!result) {
      showToast('Invalid share code', 'error');
      return;
    }
    const existing = new Set([...(pins() ?? []).map((p) => p.name + p.lat + p.lng)]);
    let added = 0;
    for (const p of result.pins) {
      if (!existing.has(p.name + p.lat + p.lng)) {
        await addPin({ ...p, createdAt: p.createdAt || Date.now() });
        added++;
      }
    }
    for (const t of result.tracks) {
      await addTrack({ ...t, createdAt: t.createdAt || Date.now() });
      added++;
    }
    refetch();
    setShowImport(false);
    setImportCode('');
    showToast(`Imported ${added} item(s)`, 'success');
  }

  const totalCount = () => (pins()?.length ?? 0) + (tracks()?.length ?? 0);

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        'flex-direction': 'column',
        background: 'var(--color-bg)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          'border-bottom': '1px solid var(--color-border)',
          background: 'var(--color-bg-secondary)',
          display: 'flex',
          'flex-direction': 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
          <input
            type="search"
            name="saved-search"
            placeholder="Search…"
            value={search()}
            onInput={(e) => setSearch(e.currentTarget.value)}
            style={{
              flex: 1,
              'min-width': '0',
              background: 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-border)',
              'border-radius': 'var(--radius-sm)',
              padding: '6px 10px',
              color: 'var(--color-text)',
              'font-family': 'inherit',
              'font-size': '0.875rem',
            }}
          />
          <button
            aria-label="New pin"
            onClick={() =>
              setEditingPin({
                name: '',
                lat: 0,
                lng: 0,
                color: 'red',
                group: '',
                description: '',
                createdAt: Date.now(),
              } as Pin)
            }
            style={{
              background: 'var(--color-accent)',
              border: 'none',
              'border-radius': 'var(--radius-sm)',
              padding: '6px 10px',
              cursor: 'pointer',
              color: 'oklch(0.1 0 0)',
              'font-size': '0.75rem',
              'font-family': 'inherit',
              'font-weight': '600',
            }}
          >
            +
          </button>
          <button
            aria-label="Import share code"
            onClick={() => setShowImport((v) => !v)}
            style={{
              background: 'none',
              border: '1px solid var(--color-border)',
              'border-radius': 'var(--radius-sm)',
              padding: '6px 10px',
              cursor: 'pointer',
              color: 'var(--color-text)',
              'font-size': '0.75rem',
              'font-family': 'inherit',
            }}
          >
            Import
          </button>
        </div>

        <div style={{ display: 'flex', gap: '6px', 'align-items': 'center' }}>
          <span style={{ 'font-size': '0.625rem', color: 'var(--color-text-muted)' }}>Sort:</span>
          {(['date-new', 'date-old', 'name-asc', 'name-desc', 'color'] as SortMode[]).map(
            (mode) => (
              <button
                onClick={() => setSortMode(mode)}
                style={{
                  padding: '2px 6px',
                  'border-radius': 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  background:
                    sortMode() === mode ? 'var(--color-accent-bg)' : 'var(--color-bg-tertiary)',
                  color:
                    sortMode() === mode ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                  'font-size': '0.625rem',
                  cursor: 'pointer',
                  'font-family': 'inherit',
                }}
              >
                {mode === 'date-new'
                  ? 'Newest'
                  : mode === 'date-old'
                    ? 'Oldest'
                    : mode === 'name-asc'
                      ? 'A→Z'
                      : mode === 'name-desc'
                        ? 'Z→A'
                        : 'Color'}
              </button>
            )
          )}
        </div>

        {/* Import input */}
        <Show when={showImport()}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              name="import-code"
              placeholder="Paste share code…"
              value={importCode()}
              onInput={(e) => setImportCode(e.currentTarget.value)}
              style={{
                flex: 1,
                background: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-border)',
                'border-radius': 'var(--radius-sm)',
                padding: '6px 10px',
                color: 'var(--color-text)',
                'font-family': 'inherit',
                'font-size': '0.875rem',
              }}
            />
            <button
              onClick={importItems}
              style={{
                background: 'var(--color-accent)',
                border: 'none',
                'border-radius': 'var(--radius-sm)',
                padding: '6px 12px',
                cursor: 'pointer',
                color: 'oklch(0.1 0 0)',
                'font-family': 'inherit',
                'font-size': '0.75rem',
                'font-weight': '600',
              }}
            >
              Import
            </button>
          </div>
        </Show>
      </div>

      {/* Multi-select actions — grid trick for slide-in/out animation */}
      <div
        style={{
          display: 'grid',
          'grid-template-rows': multiSelect() ? '1fr' : '0fr',
          transition: 'grid-template-rows 0.2s ease',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          <div
            style={{
              padding: '8px 16px',
              background: 'var(--color-accent-bg)',
              'border-bottom': '1px solid var(--color-accent-border)',
              display: 'flex',
              gap: '8px',
              'align-items': 'center',
            }}
          >
            <span style={{ 'font-size': '0.75rem', color: 'var(--color-accent)', flex: 1 }}>
              {selected().size} selected
            </span>
            {/* Share */}
            <button
              aria-label="Share selected"
              onClick={shareSelected}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-accent)',
                padding: '4px',
                display: 'flex',
                'align-items': 'center',
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>
            {/* Add to Ruler */}
            <button
              aria-label="Add to ruler"
              onClick={addSelectedToRuler}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-accent)',
                padding: '4px',
                display: 'flex',
                'align-items': 'center',
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="2" y="10" width="20" height="5" rx="1" />
                <line x1="6" y1="10" x2="6" y2="7" />
                <line x1="10" y1="10" x2="10" y2="8" />
                <line x1="14" y1="10" x2="14" y2="8" />
                <line x1="18" y1="10" x2="18" y2="7" />
              </svg>
            </button>
            {/* Delete */}
            <button
              aria-label="Delete selected"
              onClick={bulkDelete}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-danger)',
                padding: '4px',
                display: 'flex',
                'align-items': 'center',
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </button>
            {/* Cancel */}
            <button
              aria-label="Cancel selection"
              onClick={() => {
                setSelected(new Set<string>());
                setMultiSelect(false);
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
                padding: '4px',
                display: 'flex',
                'align-items': 'center',
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div
        style={{
          flex: 1,
          'overflow-y': 'auto',
          padding: '12px 16px',
          display: 'flex',
          'flex-direction': 'column',
          gap: '8px',
        }}
      >
        <Show when={totalCount() === 0}>
          <div
            style={{
              display: 'flex',
              'flex-direction': 'column',
              'align-items': 'center',
              'justify-content': 'center',
              height: '200px',
              color: 'var(--color-text-muted)',
              gap: '12px',
            }}
          >
            <img
              src="/icons/empty-state.svg"
              width="96"
              height="96"
              alt=""
              style={{ opacity: 0.5 }}
            />
            <span style={{ 'font-size': '0.875rem' }}>No pins yet</span>
          </div>
        </Show>

        <For each={filteredPins()}>
          {(pin) => {
            const key = `pin:${pin.id}`;
            return (
              <PinCard
                pin={pin}
                selected={selected().has(key)}
                onSelect={() => toggleSelect(key)}
                onEdit={() => setEditingPin(pin)}
                onInfo={() => {
                  if (multiSelect()) handleCardClick(key);
                  else setViewingPin(pin);
                }}
                onPointerDown={(e) => {
                  if (!multiSelect()) startLongPress(key);
                }}
                onPointerUp={cancelLongPress}
                onPointerCancel={cancelLongPress}
              />
            );
          }}
        </For>

        <For each={filteredTracks()}>
          {(track) => {
            const key = `track:${track.id}`;
            return (
              <TrackCard
                track={track}
                selected={selected().has(key)}
                onSelect={() => toggleSelect(key)}
                onEdit={() => setEditingTrack(track)}
                onInfo={() => {
                  if (multiSelect()) handleCardClick(key);
                  else setViewingTrack(track);
                }}
                onPointerDown={(e) => {
                  if (!multiSelect()) startLongPress(key);
                }}
                onPointerUp={cancelLongPress}
                onPointerCancel={cancelLongPress}
              />
            );
          }}
        </For>
      </div>
    </div>
  );
};

export default SavedScreen;
