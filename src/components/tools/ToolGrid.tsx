import { type Component, Show } from 'solid-js';
import { uiStore } from '@/stores/ui';

interface ToolGridProps {
  onSelectTool?: (tool: 'gps' | 'ruler' | 'settings') => void;
  onClose?: () => void;
}

export const ToolGrid: Component<ToolGridProps> = (props) => {
  const tools = [
    { id: 'gps' as const, icon: 'satellite_alt', label: 'GPS / Compass' },
    { id: 'ruler' as const, icon: 'straighten', label: 'Ruler' },
    { id: 'settings' as const, icon: 'settings', label: 'Settings' },
  ];

  return (
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">Tools</h3>
        <Show when={props.onClose}>
          <button class="p-2 rounded-lg hover:bg-surface-hover" onClick={props.onClose}>
            <span class="material-symbols-outlined">close</span>
          </button>
        </Show>
      </div>

      <div class="grid grid-cols-2 gap-3">
        {tools.map((tool) => (
          <button
            class="flex flex-col items-center gap-2 p-4 rounded-xl bg-surface-hover hover:bg-surface-hover/80 transition-colors"
            onClick={() => props.onSelectTool?.(tool.id)}
          >
            <span class="material-symbols-outlined text-3xl">{tool.icon}</span>
            <span class="text-sm">{tool.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
