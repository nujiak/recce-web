import { Component, Show, For } from 'solid-js';
import { useUI } from '../../context/UIContext';
import Button from '../ui/Button';
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
              <Button variant="icon" aria-label="Back" onClick={() => setActiveTool(null)}>
                <span class="material-symbols-outlined" style={{ 'font-size': '20px' }}>
                  arrow_back
                </span>
              </Button>
              <span style={{ 'font-size': '0.875rem' }}>
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
            <h2 style={{ 'font-size': '0.875rem', 'margin-bottom': '12px' }}>Tools</h2>
            <div
              style={{ display: 'grid', 'grid-template-columns': 'repeat(3, 1fr)', gap: '12px' }}
            >
              <For each={TOOL_CARDS}>
                {(tool) => (
                  <Button
                    variant="ghost"
                    aria-label={tool.label}
                    onClick={() => setActiveTool(tool.id)}
                    style={{
                      display: 'flex',
                      'flex-direction': 'column',
                      'align-items': 'center',
                      gap: '8px',
                      padding: '16px 8px',
                      background: 'var(--color-bg-secondary)',
                      'border-radius': 'var(--radius-md)',
                      flex: 1,
                      width: '100%',
                      'font-size': '0.75rem',
                    }}
                  >
                    <span class="material-symbols-outlined" style={{ 'font-size': '1.5rem' }}>
                      {tool.icon}
                    </span>
                    {tool.label}
                  </Button>
                )}
              </For>
            </div>
          </div>
        </Show>
      </div>
    </Show>
  );
};

export default ToolboxModal;
