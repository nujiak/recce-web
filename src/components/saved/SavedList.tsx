import { type Component, createSignal, createMemo, For, Show, onMount } from 'solid-js';
import { PinCard } from '@/components/pins/PinCard';
import { TrackCard } from '@/components/tracks/TrackCard';
import { pinsStore } from '@/stores/pins';
import { tracksStore } from '@/stores/tracks';
import { preferences } from '@/stores/preferences';
import { uiStore } from '@/stores/ui';
import { rulerStore } from '@/components/tools/RulerPanel';
import { CoordinateTransformer } from '@/coords';
import { showToast } from '@/lib/toast';
import { copyToClipboard } from '@/lib/clipboard';
import type { Pin, Track } from '@/types';

type SortBy = 'newest' | 'oldest' | 'name-az' | 'name-za' | 'group';
type SavedItem = (Pin & { itemType: 'pin' }) | (Track & { itemType: 'track' });

export const SavedList: Component = () => {
  const [sortBy, setSortBy] = createSignal<SortBy>('newest');
  const [searchQuery, setSearchQuery] = createSignal('');
  const [selectedIds, setSelectedIds] = createSignal<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = createSignal(false);

  const combinedItems = createMemo<SavedItem[]>(() => {
    const pins = pinsStore.list();
    const tracks = tracksStore.list();
    return [
      ...pins.map((p) => ({ ...p, itemType: 'pin' as const })),
      ...tracks.map((t) => ({ ...t, itemType: 'track' as const })),
    ];
  });

  const filteredAndSortedItems = createMemo(() => {
    let items = combinedItems();

    const query = searchQuery().toLowerCase();
    if (query) {
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          (item.group && item.group.toLowerCase().includes(query))
      );
    }

    const sort = sortBy();
    const sorted = [...items];
    switch (sort) {
      case 'newest':
        return sorted.sort((a, b) => b.createdAt - a.createdAt);
      case 'oldest':
        return sorted.sort((a, b) => a.createdAt - b.createdAt);
      case 'name-az':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-za':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case 'group':
        return sorted.sort((a, b) => {
          const groupA = a.group || '';
          const groupB = b.group || '';
          return groupA.localeCompare(groupB) || a.name.localeCompare(b.name);
        });
      default:
        return sorted;
    }
  });

  const groupedItems = createMemo(() => {
    if (sortBy() !== 'group') return null;
    const groups = new Map<string, SavedItem[]>();
    for (const item of filteredAndSortedItems()) {
      const group = item.group || 'Ungrouped';
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group)!.push(item);
    }
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  });

  const cycleSort = () => {
    const options: SortBy[] = ['newest', 'oldest', 'name-az', 'name-za', 'group'];
    const messages: Record<SortBy, string> = {
      newest: 'Sorting by Newest',
      oldest: 'Sorting by Oldest',
      'name-az': 'Sorting by Name (A-Z)',
      'name-za': 'Sorting by Name (Z-A)',
      group: 'Sorting by Group',
    };
    const currentIndex = options.indexOf(sortBy());
    const nextSort = options[(currentIndex + 1) % options.length];
    setSortBy(nextSort);
    showToast(messages[nextSort], 'info');
  };

  const toggleSelection = (key: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      if (next.size === 0) {
        setIsMultiSelectMode(false);
      }
      return next;
    });
  };

  const enterMultiSelect = (key: string) => {
    setIsMultiSelectMode(true);
    setSelectedIds(new Set([key]));
    navigator.vibrate?.(30);
  };

  const exitMultiSelect = () => {
    setIsMultiSelectMode(false);
    setSelectedIds(new Set<string>());
  };

  const handleBulkDelete = async () => {
    const ids = selectedIds();
    for (const key of ids) {
      const [type, idStr] = key.split(':');
      const id = parseInt(idStr);
      if (type === 'pin') {
        await pinsStore.delete(id);
      } else if (type === 'track') {
        await tracksStore.delete(id);
      }
    }
    exitMultiSelect();
    showToast('Items deleted', 'success');
  };

  const handleAddToRuler = () => {
    const ids = selectedIds();
    const items: { label: string; lat: number; lng: number; color: string }[] = [];

    for (const key of ids) {
      const [type, idStr] = key.split(':');
      const id = parseInt(idStr);

      if (type === 'pin') {
        const pin = pinsStore.list().find((p) => p.id === id);
        if (pin) {
          items.push({
            label: pin.name,
            lat: pin.lat,
            lng: pin.lng,
            color: pin.color,
          });
        }
      } else if (type === 'track') {
        const track = tracksStore.list().find((t) => t.id === id);
        if (track && track.nodes) {
          track.nodes.forEach((node, index) => {
            const isFirst = index === 0;
            const isLast = index === track.nodes.length - 1;
            const hasName = node.name && node.name.trim();
            let label: string;
            if (hasName) {
              label = node.name!;
            } else if (track.nodes.length === 1) {
              label = track.name;
            } else if (isFirst) {
              label = `${track.name} (start)`;
            } else if (isLast) {
              label = `${track.name} (end)`;
            } else {
              label =
                CoordinateTransformer.toDisplay(node.lat, node.lng, preferences.coordSystem()) ||
                `Point ${index + 1}`;
            }
            items.push({
              label,
              lat: node.lat,
              lng: node.lng,
              color: track.color,
            });
          });
        }
      }
    }

    if (items.length > 0) {
      rulerStore.addPoints(items);
      showToast(`Added ${items.length} point${items.length !== 1 ? 's' : ''} to Ruler`, 'success');
      exitMultiSelect();
    }
  };

  const sortIcon = () => {
    const icons: Record<SortBy, string> = {
      newest: 'arrow_downward',
      oldest: 'arrow_upward',
      'name-az': 'sort_by_alpha',
      'name-za': 'sort_by_alpha',
      group: 'folder',
    };
    return icons[sortBy()];
  };

  const renderCard = (item: SavedItem) => {
    const key = `${item.itemType}:${item.id}`;
    const isSelected = selectedIds().has(key);

    const handleClick = () => {
      if (isMultiSelectMode()) {
        toggleSelection(key);
      } else {
        if (item.itemType === 'pin') {
          window.dispatchEvent(new CustomEvent('pinCardClicked', { detail: { pin: item as Pin } }));
        } else {
          window.dispatchEvent(
            new CustomEvent('trackCardClicked', { detail: { track: item as Track } })
          );
        }
      }
    };

    const handleLongPress = () => {
      if (!isMultiSelectMode()) {
        enterMultiSelect(key);
      }
    };

    return (
      <div class="relative">
        <Show when={isMultiSelectMode()}>
          <input
            type="checkbox"
            class="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4"
            checked={isSelected}
            onChange={() => toggleSelection(key)}
          />
        </Show>
        <div classList={{ 'pl-8': isMultiSelectMode() }}>
          {item.itemType === 'pin' ? (
            <PinCard pin={item as Pin} selected={isSelected} onClick={handleClick} />
          ) : (
            <TrackCard track={item as Track} selected={isSelected} onClick={handleClick} />
          )}
        </div>
      </div>
    );
  };

  return (
    <div class="flex flex-col h-full bg-surface">
      <div class="p-4 border-b border-border space-y-3">
        <div class="flex items-center gap-2">
          <Show when={isMultiSelectMode()}>
            <button class="p-2 rounded-lg hover:bg-surface-hover" onClick={exitMultiSelect}>
              <span class="material-symbols-outlined">close</span>
            </button>
            <span class="font-medium">{selectedIds().size} selected</span>
            <div class="flex-1" />
            <button
              class="p-2 rounded-lg hover:bg-surface-hover"
              onClick={handleAddToRuler}
              disabled={selectedIds().size === 0}
            >
              <span class="material-symbols-outlined">straighten</span>
            </button>
            <button
              class="p-2 rounded-lg hover:bg-surface-hover text-red-500"
              onClick={handleBulkDelete}
              disabled={selectedIds().size === 0}
            >
              <span class="material-symbols-outlined">delete</span>
            </button>
          </Show>
          <Show when={!isMultiSelectMode()}>
            <input
              type="text"
              class="flex-1 px-3 py-2 rounded-lg bg-surface-hover border border-border focus:border-primary outline-none"
              placeholder="Search..."
              value={searchQuery()}
              onInput={(e) => setSearchQuery(e.currentTarget.value)}
            />
            <button
              class="p-2 rounded-lg hover:bg-surface-hover"
              onClick={cycleSort}
              title={`Sort by: ${sortBy()}`}
            >
              <span class="material-symbols-outlined">{sortIcon()}</span>
            </button>
          </Show>
        </div>
      </div>

      <div class="flex-1 overflow-auto p-4 space-y-2">
        <Show when={filteredAndSortedItems().length === 0}>
          <div class="text-center py-8 text-secondary">
            <span class="material-symbols-outlined text-4xl">pin_drop</span>
            <p class="mt-2">{searchQuery() ? 'No matching items' : 'No saved locations'}</p>
            <p class="text-sm">
              {searchQuery() ? 'Try a different search' : 'Add pins or tracks from the map screen'}
            </p>
          </div>
        </Show>

        <Show when={sortBy() === 'group' && groupedItems()}>
          <For each={groupedItems()}>
            {([group, items]) => (
              <>
                <div class="font-medium text-secondary text-sm px-2 py-1">{group}</div>
                <For each={items}>{(item) => renderCard(item)}</For>
              </>
            )}
          </For>
        </Show>

        <Show when={sortBy() !== 'group'}>
          <For each={filteredAndSortedItems()}>{(item) => renderCard(item)}</For>
        </Show>
      </div>
    </div>
  );
};
