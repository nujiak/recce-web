import { Component, For, createEffect } from 'solid-js';
import { useUI } from '../../context/UIContext';
import SettingsPanel from '../settings/SettingsPanel';
import GpsPanel from '../tools/GpsPanel';
import RulerPanel from '../tools/RulerPanel';
import CoaPanel from '../tools/CoaPanel';
import SavedScreen from '../saved/SavedScreen';

type ToolId = 'saved' | 'gps' | 'ruler' | 'coa' | 'settings';

const TOOLS: { id: ToolId; label: string; icon: string }[] = [
  { id: 'saved', label: 'Saved', icon: 'bookmarks' },
  { id: 'coa', label: 'COA', icon: 'near_me' },
  { id: 'gps', label: 'GPS/Compass', icon: 'satellite_alt' },
  { id: 'ruler', label: 'Ruler', icon: 'straighten' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

function panelFor(id: ToolId) {
  switch (id) {
    case 'saved':
      return <SavedScreen />;
    case 'coa':
      return <CoaPanel />;
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
    if (tool === 'gps' || tool === 'ruler' || tool === 'coa' || tool === 'settings') {
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
                <span class="material-symbols-outlined" style={{ 'font-size': '0.875rem' }}>
                  {tool.icon}
                </span>
                {tool.label}
              </span>
              <span
                class="material-symbols-outlined"
                style={{
                  'font-size': '14px',
                  transform: section() === tool.id ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.15s ease',
                  'flex-shrink': '0',
                }}
              >
                expand_more
              </span>
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
                <div style={{ 'overflow-y': 'auto', 'min-height': '0', flex: '1' }}>
                  {panelFor(tool.id)}
                </div>
              </div>
            </div>
          </div>
        )}
      </For>
    </div>
  );
};

export default DesktopToolsBar;
