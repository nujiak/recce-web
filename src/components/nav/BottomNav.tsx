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
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="3,6 9,3 15,6 21,3 21,18 15,21 9,18 3,21"/>
        </svg>
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
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
        Saved
      </button>

      <button
        class="bottom-nav__tab"
        aria-label="Tools"
        aria-pressed={activeNav() === 'tools'}
        onClick={() => { setActiveNav('tools'); setActiveTool(null); }}
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
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
        Tools
      </button>
    </nav>
  );
};

export default BottomNav;
