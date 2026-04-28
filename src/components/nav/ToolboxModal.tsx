/**
 * ToolboxModal — mobile tool launcher and panel host
 *
 * Shows a grid of tool launchers when activeTool is null.
 * Renders the selected tool inside ToolPanelShell (from toolRegistry)
 * when a tool is active.
 */

import { Component, Show, For } from 'solid-js';
import { useUI } from '../../context/UIContext';
import { rulerPoints, clearRuler } from '../../stores/ruler';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import ToolPanelShell from '../tools/ToolPanelShell';
import { TOOLS, getTool } from '../tools/toolRegistry';

const ToolboxModal: Component = () => {
  const { activeNav, activeTool, setActiveTool } = useUI();

  const tool = () => getTool(activeTool() ?? '');

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
        <Show when={activeTool() !== null && tool()}>
          <ToolPanelShell
            title={tool()!.label}
            icon={tool()!.icon}
            onClose={() => setActiveTool(null)}
            actions={
              activeTool() === 'ruler' && rulerPoints().length > 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearRuler}
                  style={{
                    border: '1px solid var(--color-danger)',
                    color: 'var(--color-danger)',
                  }}
                >
                  Clear All
                </Button>
              ) : undefined
            }
          >
            {(() => {
              const Panel = tool()!.panel;
              return <Panel />;
            })()}
          </ToolPanelShell>
        </Show>

        <Show when={activeTool() === null}>
          {/* Grid view */}
          <div style={{ padding: '16px' }}>
            <h2 style={{ 'font-size': '0.875rem', 'margin-bottom': '12px' }}>Tools</h2>
            <div
              style={{ display: 'grid', 'grid-template-columns': 'repeat(3, 1fr)', gap: '12px' }}
            >
              <For each={TOOLS}>
                {(t) => (
                  <Button
                    variant="ghost"
                    aria-label={t.label}
                    onClick={() => setActiveTool(t.id)}
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
                    <Icon name={t.icon} />
                    {t.label}
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
