import { createEffect, type Component } from 'solid-js';
import { useUI } from '../../context/UIContext';
import SettingsPanel from '../settings/SettingsPanel';
import GpsPanel from '../tools/GpsPanel';
import RulerPanel from '../tools/RulerPanel';
import SavedScreen from '../saved/SavedScreen';
import Accordion from '../ui/Accordion';

type ToolId = 'saved' | 'gps' | 'ruler' | 'settings';

const TOOLS: { id: ToolId; label: string; icon: string }[] = [
  { id: 'saved', label: 'Saved', icon: 'bookmarks' },
  { id: 'gps', label: 'GPS/Compass', icon: 'satellite_alt' },
  { id: 'ruler', label: 'Ruler', icon: 'straighten' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
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

  createEffect(() => {
    const tool = activeTool();
    if (tool === 'gps' || tool === 'ruler' || tool === 'settings') {
      setDesktopSection(tool);
    }
  });

  const openValue = () => {
    const s = desktopSection();
    return s ? [s] : [];
  };

  return (
    <div
      class="desktop-tools-bar"
      style={{ display: 'none', 'flex-direction': 'column', flex: '1', overflow: 'hidden' }}
    >
      <style>{`
        .dtb-accordion {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }
        /* Kobalte accordion root renders as a plain div — make it a flex column too */
        .dtb-accordion > div {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }
        .dtb-accordion .ui-accordion-item {
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          min-height: 0;
        }
        .dtb-accordion .ui-accordion-item[data-expanded] {
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }
        /* Expanded content must fill the flex item — clear max-height cap from base styles */
        .dtb-accordion .ui-accordion-content {
          max-height: 0;
        }
        .dtb-accordion .ui-accordion-content[data-expanded] {
          display: flex;
          flex-direction: column;
          flex: 1;
          max-height: none;
          min-height: 0;
        }
        .dtb-accordion .ui-accordion-content[data-expanded] > div {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }
        .dtb-accordion .ui-accordion-content-inner {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
        }
      `}</style>
      <div class="dtb-accordion">
        <Accordion
          items={TOOLS.map((tool) => ({
            value: tool.id,
            trigger: (
              <span style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
                <span class="material-symbols-outlined" style={{ 'font-size': '0.875rem' }}>
                  {tool.icon}
                </span>
                {tool.label}
              </span>
            ),
            content: panelFor(tool.id),
          }))}
          value={openValue()}
          onChange={(vals) => setDesktopSection((vals[0] as ToolId) ?? null)}
          collapsible
        />
      </div>
    </div>
  );
};

export default DesktopToolsBar;
