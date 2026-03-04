import { Component, Show } from 'solid-js';
import { useUI } from '../../context/UIContext';
import SettingsPanel from '../settings/SettingsPanel';
import GpsPanel from '../tools/GpsPanel';
import RulerPanel from '../tools/RulerPanel';

interface ToolCard {
  id: string;
  label: string;
  icon: string;
}

const TOOL_CARDS: ToolCard[] = [
  { id: 'gps', label: 'GPS/Compass', icon: 'satellite_alt' },
  { id: 'ruler', label: 'Ruler', icon: 'straighten' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

const ToolboxModal: Component = () => {
  const { activeNav, activeTool, setActiveTool } = useUI();

  return (
    <Show when={activeNav() === 'tools'}>
      <div
        role="dialog"
        aria-label="Tools"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'var(--color-bg)',
          'z-index': '10',
          display: 'flex',
          'flex-direction': 'column',
          overflow: 'hidden',
        }}
      >
        <Show when={activeTool() !== null}>
          {/* Tool detail view */}
          <div style={{ display: 'flex', 'flex-direction': 'column', flex: 1, overflow: 'hidden' }}>
            <div
              style={{
                display: 'flex',
                'align-items': 'center',
                gap: '8px',
                padding: '12px 16px',
                'border-bottom': '1px solid var(--color-border)',
                background: 'var(--color-bg-secondary)',
              }}
            >
              <button
                aria-label="Back"
                onClick={() => setActiveTool(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text)',
                  padding: '4px',
                  display: 'flex',
                  'align-items': 'center',
                }}
              >
                <span class="material-symbols-outlined" style={{ 'font-size': '20px' }}>
                  arrow_back
                </span>
              </button>
              <span style={{ 'font-size': '0.875rem', 'font-weight': '600' }}>
                {TOOL_CARDS.find((t) => t.id === activeTool())?.label ?? activeTool()}
              </span>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <Show when={activeTool() === 'settings'}>
                <SettingsPanel />
              </Show>
              <Show when={activeTool() === 'gps'}>
                <GpsPanel />
              </Show>
              <Show when={activeTool() === 'ruler'}>
                <RulerPanel />
              </Show>
            </div>
          </div>
        </Show>

        <Show when={activeTool() === null}>
          {/* Grid view */}
          <div style={{ padding: '16px' }}>
            <h2 style={{ 'font-size': '0.875rem', 'font-weight': '600', 'margin-bottom': '12px' }}>
              Tools
            </h2>
            <div
              style={{ display: 'grid', 'grid-template-columns': 'repeat(3, 1fr)', gap: '12px' }}
            >
              {TOOL_CARDS.map((tool) => (
                <button
                  aria-label={tool.label}
                  onClick={() => setActiveTool(tool.id)}
                  style={{
                    display: 'flex',
                    'flex-direction': 'column',
                    'align-items': 'center',
                    gap: '8px',
                    padding: '16px 8px',
                    background: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    'border-radius': 'var(--radius-md)',
                    cursor: 'pointer',
                    color: 'var(--color-text)',
                    'font-size': '0.75rem',
                    'font-family': 'inherit',
                  }}
                >
                  <span class="material-symbols-outlined" style={{ 'font-size': '1.5rem' }}>
                    {tool.icon}
                  </span>
                  {tool.label}
                </button>
              ))}
            </div>
          </div>
        </Show>
      </div>
    </Show>
  );
};

export default ToolboxModal;
