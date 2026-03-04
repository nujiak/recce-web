import { Component } from 'solid-js';
import { useUI } from '../../context/UIContext';

const BottomNav: Component = () => {
  const { activeNav, setActiveNav, setActiveTool } = useUI();

  return (
    <nav
      class="bottom-nav"
      aria-label="Main navigation"
      style={{
        display: 'flex',
        height: 'var(--nav-height)',
        background: 'var(--color-bg-secondary)',
        'border-top': '1px solid var(--color-border)',
      }}
    >
      <button
        class="bottom-nav__tab"
        aria-label="Map"
        aria-pressed={activeNav() === 'map'}
        onClick={() => setActiveNav('map')}
        style={{
          flex: 1,
          display: 'flex',
          'flex-direction': 'column',
          'align-items': 'center',
          'justify-content': 'center',
          gap: '2px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: activeNav() === 'map' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
          'font-size': '0.625rem',
          'font-family': 'inherit',
        }}
      >
        <span class="material-symbols-outlined" style={{ 'font-size': '24px' }}>
          map
        </span>
        Map
      </button>

      <button
        class="bottom-nav__tab"
        aria-label="Saved"
        aria-pressed={activeNav() === 'saved'}
        onClick={() => setActiveNav('saved')}
        style={{
          flex: 1,
          display: 'flex',
          'flex-direction': 'column',
          'align-items': 'center',
          'justify-content': 'center',
          gap: '2px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: activeNav() === 'saved' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
          'font-size': '0.625rem',
          'font-family': 'inherit',
        }}
      >
        <span class="material-symbols-outlined" style={{ 'font-size': '24px' }}>
          bookmarks
        </span>
        Saved
      </button>

      <button
        class="bottom-nav__tab"
        aria-label="Tools"
        aria-pressed={activeNav() === 'tools'}
        onClick={() => {
          setActiveNav('tools');
          setActiveTool(null);
        }}
        style={{
          flex: 1,
          display: 'flex',
          'flex-direction': 'column',
          'align-items': 'center',
          'justify-content': 'center',
          gap: '2px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: activeNav() === 'tools' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
          'font-size': '0.625rem',
          'font-family': 'inherit',
        }}
      >
        <span class="material-symbols-outlined" style={{ 'font-size': '24px' }}>
          construction
        </span>
        Tools
      </button>
    </nav>
  );
};

export default BottomNav;
