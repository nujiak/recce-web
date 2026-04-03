import { For, type Component, type JSX } from 'solid-js';
import { Accordion } from '@kobalte/core/accordion';

interface AccordionItem {
  value: string;
  trigger: JSX.Element;
  content: JSX.Element;
}

interface AccordionProps {
  items: AccordionItem[];
  defaultValue?: string;
  value?: string[];
  onChange?: (value: string[]) => void;
  multiple?: boolean;
  collapsible?: boolean;
}

const Accordion_: Component<AccordionProps> = (props) => {
  return (
    <Accordion
      defaultValue={props.defaultValue ? [props.defaultValue] : []}
      value={props.value}
      onChange={props.onChange}
      multiple={props.multiple ?? false}
      collapsible={props.collapsible ?? true}
    >
      <style>{`
        .ui-accordion-item + .ui-accordion-item .ui-accordion-trigger {
          border-top: 1px solid var(--color-border-subtle, var(--color-border));
        }
        .ui-accordion-item + .ui-accordion-item .ui-accordion-trigger {
          border-top: 1px solid var(--color-border);
        }
        .ui-accordion-item:not(:last-child) .ui-accordion-trigger {
          border-bottom: 1px solid var(--color-border);
        }
        .ui-accordion-trigger {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          padding: 11px 16px;
          color: var(--color-text);
          font-weight: 600;
          font-size: 0.8125rem;
          font-family: inherit;
          background: var(--color-bg-secondary);
          border: none;
          cursor: pointer;
          outline: none;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .ui-accordion-trigger:hover {
          filter: brightness(0.97);
        }
        .ui-accordion-trigger[data-expanded] {
          background: var(--color-accent-bg);
          color: var(--color-accent);
        }
        .ui-accordion-trigger[data-expanded] .ui-accordion-chevron {
          color: var(--color-accent);
        }
        .ui-accordion-trigger:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: -2px;
          border-radius: var(--radius-md);
        }
        .ui-accordion-chevron {
          font-family: 'Material Symbols Outlined', sans-serif;
          font-size: 14px;
          color: var(--color-text-secondary);
          transition: transform 0.15s ease;
          flex-shrink: 0;
        }
        .ui-accordion-trigger[data-expanded] .ui-accordion-chevron {
          transform: rotate(180deg);
        }
        .ui-accordion-content {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.2s ease;
        }
        .ui-accordion-content[data-expanded] {
          grid-template-rows: 1fr;
        }
        .ui-accordion-content > div {
          overflow: hidden;
        }
        .ui-accordion-content-inner {
          overflow-y: auto;
          min-height: 0;
          flex: 1;
        }
      `}</style>

      <For each={props.items}>
        {(item) => (
          <Accordion.Item value={item.value} class="ui-accordion-item">
            <Accordion.Header>
              <Accordion.Trigger class="ui-accordion-trigger">
                <span style={{ flex: '1', 'text-align': 'left' }}>{item.trigger}</span>
                <span class="ui-accordion-chevron" aria-hidden="true">
                  expand_more
                </span>
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content class="ui-accordion-content">
              <div>
                <div class="ui-accordion-content-inner">{item.content}</div>
              </div>
            </Accordion.Content>
          </Accordion.Item>
        )}
      </For>
    </Accordion>
  );
};

export default Accordion_;
