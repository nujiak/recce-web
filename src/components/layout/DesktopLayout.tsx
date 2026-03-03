import { type Component, Show, createSignal, onMount, onCleanup } from 'solid-js';
import { uiStore } from '@/stores/ui';
import { SavedList } from '@/components/saved/SavedList';
import { ToolGrid } from '@/components/tools/ToolGrid';
import { GpsPanel } from '@/components/tools/GpsPanel';
import { RulerPanel } from '@/components/tools/RulerPanel';
import { SettingsPanel } from '@/components/tools/SettingsPanel';

export const DesktopLayout: Component = () => {
  const [activeTool, setActiveTool] = createSignal<'gps' | 'ruler' | 'settings' | null>(null);
  const [accordionHeight, setAccordionHeight] = createSignal(300);

  const tools = [
    { id: 'gps' as const, icon: 'satellite_alt', label: 'GPS' },
    { id: 'ruler' as const, icon: 'straighten', label: 'Ruler' },
    { id: 'settings' as const, icon: 'settings', label: 'Settings' },
  ];

  const toggleTool = (tool: 'gps' | 'ruler' | 'settings') => {
    setActiveTool((prev) => (prev === tool ? null : tool));
  };

  return (
    <div class="flex h-screen">
      <aside class="w-80 border-r border-border flex flex-col bg-surface">
        <div class="flex-1 overflow-hidden">
          <SavedList />
        </div>

        <div class="border-t border-border">
          <div class="flex border-b border-border">
            {tools.map((tool) => (
              <button
                class="flex-1 flex items-center justify-center gap-1 p-3 transition-colors"
                classList={{
                  'bg-surface-hover': activeTool() === tool.id,
                  'hover:bg-surface-hover': activeTool() !== tool.id,
                }}
                onClick={() => toggleTool(tool.id)}
              >
                <span class="material-symbols-outlined text-xl">{tool.icon}</span>
                <span class="text-sm">{tool.label}</span>
              </button>
            ))}
          </div>

          <Show when={activeTool()}>
            <div
              class="overflow-auto border-t border-border"
              style={{ height: `${accordionHeight()}px` }}
            >
              <div class="p-4">
                <Show when={activeTool() === 'gps'}>
                  <GpsPanel />
                </Show>
                <Show when={activeTool() === 'ruler'}>
                  <RulerPanel />
                </Show>
                <Show when={activeTool() === 'settings'}>
                  <SettingsPanel />
                </Show>
              </div>
            </div>
          </Show>
        </div>
      </aside>

      <main class="flex-1 relative">
        <div class="absolute inset-0 bg-surface-hover">
          <div class="flex items-center justify-center h-full text-secondary">
            <span class="material-symbols-outlined text-6xl">map</span>
          </div>
        </div>
      </main>
    </div>
  );
};
