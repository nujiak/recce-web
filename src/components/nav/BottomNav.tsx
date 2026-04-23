import { Component, For } from 'solid-js';
import { useUI } from '../../context/UIContext';
import Icon from '../ui/Icon';
import type { IconName } from '../ui/Icon';

const tabs: { key: string; label: string; icon: IconName }[] = [
  { key: 'map', label: 'MAP', icon: 'map' },
  { key: 'saved', label: 'SAVED', icon: 'bookmarks' },
  { key: 'tools', label: 'TOOLS', icon: 'construction' },
];

const BottomNav: Component = () => {
  const { activeNav, setActiveNav, setActiveTool } = useUI();

  return (
    <nav
      class="bottom-nav"
      aria-label="Main navigation"
      style={{
        display: 'flex',
        'min-height': 'var(--nav-height)',
        background: 'var(--color-bg-secondary)',
        'border-top': '1px solid var(--color-border)',
      }}
    >
      <For each={tabs}>
        {(tab) => (
          <button
            class={`bottom-nav__tab${activeNav() === tab.key ? ' bracket-selected' : ''}`}
            aria-label={tab.label.charAt(0) + tab.label.slice(1).toLowerCase()}
            aria-pressed={activeNav() === tab.key}
            onClick={() => {
              setActiveNav(tab.key as 'map' | 'saved' | 'tools');
              if (tab.key === 'tools') setActiveTool(null);
            }}
            style={{
              flex: 1,
              display: 'flex',
              'flex-direction': 'column',
              'align-items': 'center',
              'justify-content': 'center',
              gap: '2px',
              'min-height': '56px',
              'min-width': '48px',
              background: activeNav() === tab.key ? 'var(--color-accent-bg)' : 'none',
              border: 'none',
              cursor: 'pointer',
              color: activeNav() === tab.key ? 'var(--color-accent)' : 'var(--color-text-muted)',
              'font-size': '10px',
              'font-weight': activeNav() === tab.key ? '500' : '400',
              'letter-spacing': '0.10em',
              'font-family': 'inherit',
              position: 'relative',
              'text-transform': 'uppercase' as const,
              transition: 'color 75ms linear, background 75ms linear',
            }}
          >
            <Icon name={tab.icon} />
            {tab.label}
          </button>
        )}
      </For>
    </nav>
  );
};

export default BottomNav;
