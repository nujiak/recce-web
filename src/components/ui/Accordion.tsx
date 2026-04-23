import { For, type Component, type JSX } from 'solid-js';
import { Accordion } from '@kobalte/core/accordion';
import Icon from './Icon';

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
          border-top: 1px solid var(--color-border-subtle);
        }
        .ui-accordion-trigger {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          min-height: 48px;
          padding: 0 12px;
          color: var(--color-text);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-family: inherit;
          background: transparent;
          border: none;
          border-bottom: 1px solid var(--color-border-subtle);
          cursor: pointer;
          outline: none;
          transition: color 75ms linear;
        }
        .ui-accordion-trigger:hover {
          filter: none;
        }
        .ui-accordion-trigger[data-expanded] {
          color: var(--color-accent);
          /* accent left stripe */
          border-left: 3px solid var(--color-accent);
          padding-left: 9px;
        }
        .ui-accordion-trigger[data-expanded] .ui-accordion-chevron {
          color: var(--color-accent);
        }
        .ui-accordion-trigger:focus-visible {
          outline: 1px solid var(--color-accent);
          outline-offset: 3px;
        }
        .ui-accordion-chevron {
          color: var(--color-text-secondary);
          transition: transform 75ms linear;
          flex-shrink: 0;
        }
        .ui-accordion-trigger[data-expanded] .ui-accordion-chevron {
          transform: rotate(180deg);
        }
        .ui-accordion-content {
          overflow: hidden;
          max-height: var(--kb-accordion-content-height, 9999px);
          transition: max-height 75ms linear;
        }
        .ui-accordion-content[data-closed] {
          max-height: 0;
        }
        .ui-accordion-content > div {
          overflow: hidden;
        }
        .ui-accordion-content-inner {
          background: var(--color-bg);
          padding: 12px;
          overflow-y: auto;
        }
      `}</style>

      <For each={props.items}>
        {(item) => (
          <Accordion.Item value={item.value} class="ui-accordion-item" forceMount={true as any}>
            <Accordion.Header>
              <Accordion.Trigger class="ui-accordion-trigger">
                <span style={{ flex: '1', 'text-align': 'left' }}>{item.trigger}</span>
                <Icon name="expand_more" class="ui-accordion-chevron" size={18} />
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
