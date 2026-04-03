import { Component, createResource, createSignal, createMemo, For, Show } from 'solid-js';
import { getAllPins, getAllTracks, deletePin, deleteTrack, addPin, addTrack } from '../../db/db';
import { encode, decode } from '../../share/share';
import { showToast } from '../ui/Toast';
import { useUI } from '../../context/UIContext';
import { addToRuler } from '../../stores/ruler';
import PinCard from './PinCard';
import TrackCard from './TrackCard';
import type { Pin, Track } from '../../types';
import { DropdownMenu } from '@kobalte/core/dropdown-menu';
import TextField from '../ui/TextField';
import Button from '../ui/Button';

type SortMode = 'name-asc' | 'name-desc' | 'date-new' | 'date-old' | 'color';

const sortOptions = [
  { value: 'date-new', label: 'Newest' },
  { value: 'date-old', label: 'Oldest' },
  { value: 'name-asc', label: 'A→Z' },
  { value: 'name-desc', label: 'Z→A' },
  { value: 'color', label: 'Color' },
] as const;

const sortIcons: Record<SortMode, string> = {
  'date-new': 'schedule',
  'date-old': 'history',
  'name-asc': 'sort_by_alpha',
  'name-desc': 'sort_by_alpha',
  color: 'palette',
};

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
    const existingPinTimestamps = new Set((pins() ?? []).map((p) => p.createdAt));
    const existingTrackTimestamps = new Set((tracks() ?? []).map((t) => t.createdAt));
    let added = 0;
    for (const p of result.pins) {
      if (!existingPinTimestamps.has(p.createdAt)) {
        await addPin({ ...p });
        added++;
      }
    }
    for (const t of result.tracks) {
      if (!existingTrackTimestamps.has(t.createdAt)) {
        await addTrack({ ...t });
        added++;
      }
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
          <TextField type="search" placeholder="Search…" value={search()} onChange={setSearch} />
          <Button
            variant="primary"
            size="sm"
            aria-label="New pin"
            onClick={() =>
              setEditingPin({
                id: 0,
                name: '',
                lat: 0,
                lng: 0,
                color: 'red',
                group: '',
                description: '',
                createdAt: Date.now(),
              })
            }
          >
            +
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Import share code"
            onClick={() => setShowImport((v) => !v)}
          >
            Import
          </Button>
        </div>

        <div style={{ display: 'flex', 'align-items': 'center' }}>
          <style>{`
            .sort-menu-trigger {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 32px;
              height: 32px;
              background: transparent;
              border: none;
              border-radius: var(--radius-md);
              color: var(--color-text-secondary);
              cursor: pointer;
              outline: none;
            }
            .sort-menu-trigger:hover {
              background: var(--color-bg-secondary);
              color: var(--color-text);
            }
            .sort-menu-trigger:focus-visible {
              box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-accent) 40%, transparent);
            }
            .sort-menu-trigger[data-expanded] {
              background: var(--color-bg-secondary);
              color: var(--color-accent);
            }
            .sort-menu-trigger-icon {
              font-family: 'Material Symbols Outlined', sans-serif;
              font-size: 20px;
              line-height: 1;
              user-select: none;
            }
            .sort-menu-content {
              background: var(--color-bg);
              border: 1px solid var(--color-border);
              border-radius: var(--radius-md);
              box-shadow: 0 4px 16px rgba(0,0,0,0.2);
              z-index: 200;
              padding: 0.25rem;
              outline: none;
              min-width: 130px;
              animation: sort-menu-in 0.12s ease-out;
            }
            .sort-menu-content[data-closed] {
              animation: sort-menu-out 0.1s ease-in;
            }
            .sort-menu-item {
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 0.4rem 0.625rem;
              border-radius: var(--radius-sm);
              font-size: 0.8125rem;
              color: var(--color-text);
              cursor: pointer;
              outline: none;
            }
            .sort-menu-item:hover,
            .sort-menu-item[data-highlighted] {
              background: var(--color-bg-secondary);
            }
            .sort-menu-item[data-checked] {
              color: var(--color-accent);
            }
            .sort-menu-item-icon {
              font-family: 'Material Symbols Outlined', sans-serif;
              font-size: 16px;
              line-height: 1;
              color: var(--color-text-secondary);
              flex-shrink: 0;
            }
            .sort-menu-item[data-checked] .sort-menu-item-icon {
              color: var(--color-accent);
            }
            .sort-menu-item-indicator {
              font-family: 'Material Symbols Outlined', sans-serif;
              font-size: 14px;
              color: var(--color-accent);
              visibility: hidden;
              margin-left: auto;
            }
            .sort-menu-item[data-checked] .sort-menu-item-indicator {
              visibility: visible;
            }
            @keyframes sort-menu-in {
              from { opacity: 0; transform: translateY(-4px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes sort-menu-out {
              from { opacity: 1; transform: translateY(0); }
              to { opacity: 0; transform: translateY(-4px); }
            }
          `}</style>
          <DropdownMenu>
            <DropdownMenu.Trigger
              class="sort-menu-trigger"
              aria-label={`Sort: ${sortOptions.find((o) => o.value === sortMode())?.label}`}
            >
              <span class="sort-menu-trigger-icon">{sortIcons[sortMode()]}</span>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content class="sort-menu-content">
                <DropdownMenu.RadioGroup
                  value={sortMode()}
                  onChange={(v) => setSortMode(v as SortMode)}
                >
                  <For each={sortOptions}>
                    {(option) => (
                      <DropdownMenu.RadioItem class="sort-menu-item" value={option.value}>
                        <span class="sort-menu-item-icon">
                          {sortIcons[option.value as SortMode]}
                        </span>
                        {option.label}
                        <DropdownMenu.ItemIndicator class="sort-menu-item-indicator" forceMount>
                          check
                        </DropdownMenu.ItemIndicator>
                      </DropdownMenu.RadioItem>
                    )}
                  </For>
                </DropdownMenu.RadioGroup>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu>
        </div>

        <Show when={showImport()}>
          <div style={{ display: 'flex', gap: '8px', 'align-items': 'center' }}>
            <TextField
              placeholder="Paste share code…"
              value={importCode()}
              onChange={setImportCode}
            />
            <Button variant="primary" size="sm" onClick={importItems}>
              Import
            </Button>
          </div>
        </Show>
      </div>

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
            <Button variant="icon" size="sm" aria-label="Share selected" onClick={shareSelected}>
              <span class="material-symbols-outlined" style={{ 'font-size': '18px' }}>
                share
              </span>
            </Button>
            <Button variant="icon" size="sm" aria-label="Add to ruler" onClick={addSelectedToRuler}>
              <span class="material-symbols-outlined" style={{ 'font-size': '18px' }}>
                straighten
              </span>
            </Button>
            <Button variant="icon" size="sm" aria-label="Delete selected" onClick={bulkDelete}>
              <span
                class="material-symbols-outlined"
                style={{ 'font-size': '18px', color: 'var(--color-danger)' }}
              >
                delete
              </span>
            </Button>
            <Button
              variant="icon"
              size="sm"
              aria-label="Cancel selection"
              onClick={() => {
                setSelected(new Set<string>());
                setMultiSelect(false);
              }}
            >
              <span
                class="material-symbols-outlined"
                style={{ 'font-size': '18px', color: 'var(--color-text-secondary)' }}
              >
                close
              </span>
            </Button>
          </div>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          'overflow-y': 'auto',
          'scrollbar-gutter': 'stable',
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
