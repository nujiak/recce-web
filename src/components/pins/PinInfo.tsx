import { type Component, For, Show } from 'solid-js';
import { Modal } from '@/components/layout/Modal';
import { CoordinateTransformer } from '@/coords';
import { SYSTEMS, type CoordSystem } from '@/coords';
import { showToast } from '@/utils/toast';
import { copyToClipboard } from '@/utils/clipboard';
import type { Pin } from '@/types';

interface PinInfoProps {
  open: boolean;
  onClose: () => void;
  pin?: Pin;
  onEdit?: (pin: Pin) => void;
  onFlyTo?: (lat: number, lng: number) => void;
}

export const PinInfo: Component<PinInfoProps> = (props) => {
  const allCoords = () => {
    if (!props.pin) return [];
    return Array.from(CoordinateTransformer.allSystems(props.pin.lat, props.pin.lng).entries());
  };

  const handleCopy = async (value: string) => {
    try {
      await copyToClipboard(value);
      showToast('Coordinates copied', 'success');
    } catch {
      showToast('Failed to copy', 'error');
    }
  };

  const handleMap = () => {
    if (props.pin) {
      props.onFlyTo?.(props.pin.lat, props.pin.lng);
      props.onClose();
    }
  };

  const handleEdit = () => {
    if (props.pin) {
      props.onEdit?.(props.pin);
      props.onClose();
    }
  };

  const handleOpenMaps = () => {
    if (!props.pin) return;
    const { lat, lng, name } = props.pin;
    const geoUri = `geo:${lat},${lng}?q=${lat},${lng}${name ? ` (${encodeURIComponent(name)})` : ''}`;
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
      window.location.href = geoUri;
    } else {
      window.open(googleMapsUrl, '_blank', 'noopener');
    }
  };

  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={props.pin?.name || 'Pin Info'}
      variant="bottom-sheet"
    >
      <Show when={props.pin}>
        <div class="space-y-4">
          <Show when={props.pin!.group}>
            <div class="text-secondary">{props.pin!.group}</div>
          </Show>

          <Show when={props.pin!.description}>
            <div class="text-secondary text-sm">{props.pin!.description}</div>
          </Show>

          <div class="space-y-2">
            <For each={allCoords()}>
              {([system, display]) => (
                <div
                  class="flex justify-between items-center p-2 rounded-lg bg-surface-hover cursor-pointer hover:bg-surface-hover/80 transition-colors"
                  onClick={() => handleCopy(display)}
                >
                  <span class="text-sm text-secondary">{system}</span>
                  <span class="font-mono text-sm">{display}</span>
                </div>
              )}
            </For>
          </div>

          <div class="flex gap-2 pt-2">
            <button
              class="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-surface-hover hover:bg-surface transition-colors"
              onClick={handleMap}
            >
              <span class="material-symbols-outlined">map</span>
              Map
            </button>
            <button
              class="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-surface-hover hover:bg-surface transition-colors"
              onClick={handleEdit}
            >
              <span class="material-symbols-outlined">edit</span>
              Edit
            </button>
            <button
              class="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-surface-hover hover:bg-surface transition-colors"
              onClick={handleOpenMaps}
            >
              <span class="material-symbols-outlined">open_in_new</span>
              Open
            </button>
          </div>
        </div>
      </Show>
    </Modal>
  );
};
