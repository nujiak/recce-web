import { For, createEffect, createSignal, onCleanup, type Component } from 'solid-js';
import { useUI } from '../../context/UIContext';
import type { DesktopSection } from '../../context/UIContext';
import SettingsPanel from '../settings/SettingsPanel';
import GpsPanel from '../tools/GpsPanel';
import RulerPanel from '../tools/RulerPanel';
import SavedScreen from '../saved/SavedScreen';

type ToolId = 'saved' | 'gps' | 'ruler' | 'settings';

const TOOLS: { id: ToolId; label: string; icon: string }[] = [
  { id: 'saved', label: 'Saved', icon: 'bookmarks' },
  { id: 'gps', label: 'GPS', icon: 'satellite_alt' },
  { id: 'ruler', label: 'Ruler', icon: 'straighten' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

const MIN_WIDTH = 200;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 300;
const STORAGE_KEY = 'recce_dtb_width';

function loadWidth(): number {
  const v = parseInt(localStorage.getItem(STORAGE_KEY) ?? '', 10);
  return isNaN(v) ? DEFAULT_WIDTH : Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, v));
}

const DesktopToolsBar: Component = () => {
  const { activeTool, desktopSection, setDesktopSection } = useUI();
  const [panelWidth, setPanelWidth] = createSignal(loadWidth());

  // Sync activeTool → desktopSection
  createEffect(() => {
    const tool = activeTool() as ToolId | null;
    if (tool === 'gps' || tool === 'ruler' || tool === 'settings') {
      setDesktopSection(tool);
    }
  });

  const active = (): ToolId | null => desktopSection() as ToolId | null;
  const isOpen = () => active() !== null;

  // Drag-to-resize: dragging the left edge of the panel
  function startResize(e: PointerEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startW = panelWidth();

    function onMove(ev: PointerEvent) {
      // Panel is on the right; dragging left increases width
      const delta = startX - ev.clientX;
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startW + delta));
      setPanelWidth(next);
    }

    function onUp() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      localStorage.setItem(STORAGE_KEY, String(panelWidth()));
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  // Keep all panels mounted so switching is instant; hide inactive ones with display:none
  const panels: Record<ToolId, () => ReturnType<typeof SavedScreen>> = {
    saved: () => <SavedScreen />,
    gps: () => <GpsPanel />,
    ruler: () => <RulerPanel />,
    settings: () => <SettingsPanel />,
  };

  return (
    <div class="desktop-tools-bar" style={{ display: 'contents' }}>
      <style>{`
        .dtb-panel-wrap {
          display: flex;
          flex-direction: row;
          overflow: hidden;
          transition: width 0.22s ease;
          border-left: 1px solid var(--color-border);
          flex-shrink: 0;
        }
        .dtb-resize-handle {
          width: 4px;
          flex-shrink: 0;
          cursor: col-resize;
          background: transparent;
          transition: background 0.15s ease;
          z-index: 1;
        }
        .dtb-resize-handle:hover,
        .dtb-resize-handle:active {
          background: var(--color-accent);
        }
        .dtb-panel {
          flex: 1;
          min-width: 0;
          min-height: 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          background: var(--color-bg);
        }
        .dtb-panel-inner {
          /* Each tool panel fills the wrapper; only active is visible */
          position: relative;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }
        .dtb-tool-pane {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.15s ease;
        }
        .dtb-tool-pane.is-active {
          opacity: 1;
          pointer-events: auto;
        }
        .dtb-tabs {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          width: 49px;
          flex-shrink: 0;
          border-left: 1px solid var(--color-border);
          background: var(--color-bg-secondary);
          /* padding-left compensates for the 1px border so visual margin is equal on both sides */
          padding: 8px 4px 8px 3px;
          gap: 2px;
        }
        .dtb-tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          width: 100%;
          height: 52px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: var(--color-text-secondary);
          cursor: pointer;
          transition: background 0.12s ease, color 0.12s ease;
          padding: 0;
          font-family: inherit;
        }
        .dtb-tab:hover {
          background: var(--color-bg);
          color: var(--color-text);
        }
        .dtb-tab.is-active {
          background: var(--color-accent-bg);
          color: var(--color-accent);
        }
        .dtb-tab-icon {
          font-family: 'Material Symbols Outlined', sans-serif;
          font-size: 20px;
          line-height: 1;
        }
        .dtb-tab-label {
          font-size: 0.5625rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          line-height: 1;
        }
      `}</style>

      {/* Panel wrapper — width transitions between 0 and panelWidth() */}
      <div class="dtb-panel-wrap" style={{ width: isOpen() ? `${panelWidth()}px` : '0px' }}>
        <div class="dtb-resize-handle" onPointerDown={startResize} />
        <div class="dtb-panel">
          <div class="dtb-panel-inner">
            <For each={TOOLS}>
              {(tool) => (
                <div class={`dtb-tool-pane${active() === tool.id ? ' is-active' : ''}`}>
                  {panels[tool.id]()}
                </div>
              )}
            </For>
          </div>
        </div>
      </div>

      {/* Vertical icon tab strip */}
      <div class="dtb-tabs" role="tablist" aria-label="Tools">
        <For each={TOOLS}>
          {(tool) => (
            <button
              role="tab"
              class={`dtb-tab${active() === tool.id ? ' is-active' : ''}`}
              aria-selected={active() === tool.id}
              aria-label={tool.label}
              title={tool.label}
              onClick={() =>
                setDesktopSection((active() === tool.id ? null : tool.id) as DesktopSection)
              }
            >
              <span class="dtb-tab-icon material-symbols-outlined">{tool.icon}</span>
              <span class="dtb-tab-label">{tool.label}</span>
            </button>
          )}
        </For>
      </div>
    </div>
  );
};

export default DesktopToolsBar;
