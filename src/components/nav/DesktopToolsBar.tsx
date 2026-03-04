import { Component, For, createEffect } from 'solid-js';
import { useUI } from '../../context/UIContext';
import SettingsPanel from '../settings/SettingsPanel';
import GpsPanel from '../tools/GpsPanel';
import RulerPanel from '../tools/RulerPanel';
import SavedScreen from '../saved/SavedScreen';

type ToolId = 'saved' | 'gps' | 'ruler' | 'settings';

const TOOLS: { id: ToolId; label: string; icon: string }[] = [
  { id: 'saved', label: 'Saved', icon: '🔖' },
  { id: 'gps', label: 'GPS/Compass', icon: '🧭' },
  { id: 'ruler', label: 'Ruler', icon: '📏' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

function panelFor(id: ToolId) {
  switch (id) {
    case 'saved':
      return <SavedScreen />;
    case 'gps':
      return <GpsPanel />;
    case 'ruler':
      return <RulerPanel />;
    case 'settings':
      return <SettingsPanel />;
  }
}

const DesktopToolsBar: Component = () => {
  const { activeTool, desktopSection, setDesktopSection } = useUI();

  // When UIContext activeTool is set programmatically (e.g. addSelectedToRuler),
  // open that section in the accordion.
  createEffect(() => {
    const tool = activeTool();
    if (tool === 'gps' || tool === 'ruler' || tool === 'settings') {
      setDesktopSection(tool);
    }
  });

  const section = desktopSection;
  const toggle = (id: ToolId) => setDesktopSection(section() === id ? null : id);

  return (
    <div
      class="desktop-tools-bar"
      style={{ display: 'none', 'flex-direction': 'column', flex: '1', overflow: 'hidden' }}
    >
      <For each={TOOLS}>
        {(tool) => (
          <div
            style={{
              display: 'flex',
              'flex-direction': 'column',
              ...(section() === tool.id ? { flex: '1', overflow: 'hidden' } : {}),
            }}
          >
            {/* Accordion heading */}
            <button
              aria-expanded={section() === tool.id}
              onClick={() => toggle(tool.id)}
              style={{
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'space-between',
                padding: '11px 16px',
                background:
                  section() === tool.id ? 'var(--color-accent-bg)' : 'var(--color-bg-secondary)',
                border: 'none',
                'border-bottom': '1px solid var(--color-border)',
                cursor: 'pointer',
                color: section() === tool.id ? 'var(--color-accent)' : 'var(--color-text)',
                'font-size': '0.8125rem',
                'font-weight': '600',
                'font-family': 'inherit',
                width: '100%',
                'text-align': 'left',
                'flex-shrink': '0',
              }}
            >
              <span style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
                <span style={{ 'font-size': '0.875rem' }}>{tool.icon}</span>
                {tool.label}
              </span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                style={{
                  transform: section() === tool.id ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.15s ease',
                  'flex-shrink': '0',
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Accordion content — grid trick animates both open and close */}
            <div
              style={{
                display: 'grid',
                'grid-template-rows': section() === tool.id ? '1fr' : '0fr',
                transition: 'grid-template-rows 0.2s ease',
                flex: section() === tool.id ? '1' : '0',
                'min-height': '0',
                width: '100%',
              }}
            >
              <div
                style={{
                  overflow: 'hidden',
                  display: 'flex',
                  'flex-direction': 'column',
                  'min-height': '0',
                }}
              >
                {panelFor(tool.id)}
              </div>
            </div>
          </div>
        )}
      </For>
    </div>
  );
};

export default DesktopToolsBar;
