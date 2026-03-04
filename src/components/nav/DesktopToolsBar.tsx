import { Component, Show } from 'solid-js';
import { useUI } from '../../context/UIContext';
import SettingsPanel from '../settings/SettingsPanel';
import GpsPanel from '../tools/GpsPanel';
import RulerPanel from '../tools/RulerPanel';

type ToolId = 'gps' | 'ruler' | 'settings' | 'saved';

interface Tool {
  id: ToolId;
  label: string;
  icon: string;
}

const TOOLS: Tool[] = [
  { id: 'saved', label: 'Saved', icon: 'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z' },
  { id: 'gps', label: 'GPS/Compass', icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
  { id: 'ruler', label: 'Ruler', icon: 'M2 12h20M12 2v20' },
  { id: 'settings', label: 'Settings', icon: 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 6a4 4 0 1 1 0 8 4 4 0 0 1 0-8z' },
];

const DesktopToolsBar: Component = () => {
  const { activeTool, setActiveTool } = useUI();

  return (
    <div class="desktop-tools-bar" style={{ display: 'none', 'flex-direction': 'column' }}>
      {/* Icon row */}
      <div style={{ display: 'flex', 'flex-direction': 'column', background: 'var(--color-bg-secondary)', 'border-bottom': '1px solid var(--color-border)' }}>
        {TOOLS.map((tool) => (
          <button
            aria-label={tool.label}
            aria-pressed={activeTool() === tool.id}
            onClick={() => setActiveTool(activeTool() === tool.id ? null : tool.id)}
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: '8px',
              padding: '12px 16px',
              background: activeTool() === tool.id ? 'var(--color-accent-bg)' : 'none',
              border: 'none',
              'border-left': activeTool() === tool.id ? '2px solid var(--color-accent)' : '2px solid transparent',
              cursor: 'pointer',
              color: activeTool() === tool.id ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              'font-size': '0.75rem',
              'font-family': 'inherit',
              width: '100%',
              'text-align': 'left',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d={tool.icon} />
            </svg>
            {tool.label}
          </button>
        ))}
      </div>

      {/* Accordion panel */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Show when={activeTool() === 'settings'}>
          <SettingsPanel />
        </Show>
        <Show when={activeTool() === 'saved'}>
          <div style={{ padding: '16px', color: 'var(--color-text-secondary)' }}>Saved panel (Phase 5)</div>
        </Show>
        <Show when={activeTool() === 'gps'}>
          <GpsPanel />
        </Show>
        <Show when={activeTool() === 'ruler'}>
          <RulerPanel />
        </Show>
      </div>
    </div>
  );
};

export default DesktopToolsBar;
