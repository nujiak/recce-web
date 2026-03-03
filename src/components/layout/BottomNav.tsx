import { type Component, Show } from 'solid-js';
import { uiStore } from '@/stores/ui';

export const BottomNav: Component = () => {
  const tabs = [
    { id: 'map' as const, icon: 'map', label: 'Map' },
    { id: 'saved' as const, icon: 'bookmark', label: 'Saved' },
    { id: 'tools' as const, icon: 'apps', label: 'Tools' },
  ];

  const handleTabClick = (tab: 'map' | 'saved' | 'tools') => {
    uiStore.setScreen(tab);
  };

  return (
    <nav class="flex items-center justify-around border-t border-border bg-surface">
      {tabs.map((tab) => (
        <button
          class="flex flex-col items-center gap-1 px-4 py-2 transition-colors"
          classList={{
            'text-primary': uiStore.screen() === tab.id,
            'text-secondary': uiStore.screen() !== tab.id,
          }}
          onClick={() => handleTabClick(tab.id)}
        >
          <span class="material-symbols-outlined">{tab.icon}</span>
          <span class="text-xs">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};
