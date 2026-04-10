import { Component, For } from 'solid-js';
import { useUI } from '../../context/UIContext';

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
      <For
        each={[
          { key: 'map', label: 'MAP', icon: 'map' },
          { key: 'saved', label: 'SAVED', icon: 'bookmarks' },
          { key: 'tools', label: 'TOOLS', icon: 'construction' },
        ]}
      >
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
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color:
                activeNav() === tab.key ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              'font-size': '10px',
              'letter-spacing': '0.06em',
              'font-family': 'inherit',
              position: 'relative',
              'text-transform': 'uppercase' as const,
            }}
          >
            <span class="material-symbols-outlined" style={{ 'font-size': '24px' }}>
              {tab.icon}
            </span>
            {tab.label}
          </button>
        )}
      </For>
    </nav>
  );
};

export default BottomNav;
