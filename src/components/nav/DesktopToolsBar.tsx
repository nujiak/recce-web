/**
 * DesktopToolsBar — desktop sidebar with tab strip and resizable panel
 *
 * Tab strip includes "Saved" (special case) plus all tools from toolRegistry.
 * Active tool panels are rendered inside ToolPanelShell; SavedScreen is a
 * special case rendered without the shell.
 */

import { For, Show, createEffect, createSignal, onCleanup, type Component } from 'solid-js';
import { useUI } from '../../context/UIContext';
import type { DesktopSection } from '../../context/UIContext';
import Icon from '../ui/Icon';
import type { IconName } from '../ui/Icon';
import SavedScreen from '../saved/SavedScreen';
import ToolPanelShell from '../tools/ToolPanelShell';
import { TOOLS } from '../tools/toolRegistry';
import { rulerPoints, clearRuler } from '../../stores/ruler';

type TabId = 'saved' | 'gps' | 'ruler' | 'settings';

const TABS: { id: TabId; label: string; icon: IconName }[] = [
  { id: 'saved', label: 'Saved', icon: 'bookmarks' },
  ...TOOLS.map((t) => ({ id: t.id as TabId, label: t.label, icon: t.icon })),
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
    const tool = activeTool() as TabId | null;
    if (tool === 'gps' || tool === 'ruler' || tool === 'settings') {
      setDesktopSection(tool);
    }
  });

  const active = (): TabId | null => desktopSection() as TabId | null;
  const isOpen = () => active() !== null;

  const activeToolDef = () => TOOLS.find((t) => t.id === active());

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
          width: 32px;
          flex-shrink: 0;
          cursor: col-resize;
          background: transparent;
          z-index: 2;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          touch-action: none;
        }
        .dtb-resize-handle::after {
          content: '';
          width: 4px;
          height: 32px;
          border-radius: 2px;
          background: var(--color-border);
          transition: background 0.15s ease;
        }
        .dtb-resize-handle:hover::after,
        .dtb-resize-handle:active::after {
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
        .dtb-tabs {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          flex-shrink: 0;
          background: var(--color-bg-secondary);
          padding: 8px 4px;
          width: 72px;
          gap: 2px;
        }
        .dtb-tabs-border {
          width: 1px;
          flex-shrink: 0;
          background: var(--color-border);
        }
        .dtb-tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          width: 100%;
          height: 52px;
          min-height: 48px;
          border-radius: 0px;
          border: none;
          border-left: 3px solid transparent;
          background: transparent;
          color: var(--color-text-muted);
          cursor: pointer;
          transition: background 75ms linear, color 75ms linear, border-color 75ms linear;
          padding: 0;
          font-family: inherit;
          position: relative;
        }
        .dtb-tab:hover {
          background: var(--color-accent-bg);
          color: var(--color-text);
        }
        .dtb-tab.is-active {
          background: var(--color-accent-bg);
          color: var(--color-accent);
          border-left-color: var(--color-accent);
        }
        .dtb-tab-icon {
          line-height: 1;
        }
        .dtb-tab-label {
          display: none;
        }
      `}</style>

      {/* Panel wrapper — width transitions between 0 and panelWidth() */}
      <div class="dtb-panel-wrap" style={{ width: isOpen() ? `${panelWidth()}px` : '0px' }}>
        <div class="dtb-resize-handle" onPointerDown={startResize} />
        <div class="dtb-panel">
          <Show when={active() === 'saved'}>
            <SavedScreen />
          </Show>
          <Show when={active() !== 'saved' && active() !== null && activeToolDef()}>
            {(() => {
              const def = activeToolDef()!;
              const Panel = def.panel;
              return (
                <ToolPanelShell
                  title={def.label}
                  icon={def.icon}
                  actions={
                    def.id === 'ruler' && rulerPoints().length > 0 ? (
                      <button
                        onClick={clearRuler}
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--color-danger)',
                          color: 'var(--color-danger)',
                          padding: '4px 10px',
                          'font-size': '11px',
                          'text-transform': 'uppercase',
                          cursor: 'pointer',
                          'font-family': 'inherit',
                        }}
                      >
                        Clear All
                      </button>
                    ) : undefined
                  }
                >
                  <Panel />
                </ToolPanelShell>
              );
            })()}
          </Show>
        </div>
      </div>

      {/* Divider between panel and tabs */}
      <div class="dtb-tabs-border" aria-hidden="true" />

      {/* Vertical icon tab strip */}
      <div class="dtb-tabs" role="tablist" aria-label="Tools">
        <For each={TABS}>
          {(tab) => (
            <button
              role="tab"
              class={`dtb-tab${active() === tab.id ? ' is-active bracket-selected' : ''}`}
              aria-selected={active() === tab.id}
              aria-label={tab.label}
              title={tab.label}
              onClick={() =>
                setDesktopSection((active() === tab.id ? null : tab.id) as DesktopSection)
              }
            >
              <Icon name={tab.icon} class="dtb-tab-icon" size={20} />
              <span class="dtb-tab-label">{tab.label}</span>
            </button>
          )}
        </For>
      </div>
    </div>
  );
};

export default DesktopToolsBar;
