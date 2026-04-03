import { type Component, type JSX } from 'solid-js';
import { Popover } from '@kobalte/core/popover';

interface PopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: JSX.Element;
  children: JSX.Element;
  placement?: string;
}

const Popover_: Component<PopoverProps> = (props) => {
  return (
    <>
      <style>{`
        .ui-popover-trigger {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: inherit;
          font: inherit;
        }
        .ui-popover-content {
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: 10px;
          padding: 0.75rem;
          box-shadow: 0 4px 16px rgba(0,0,0,0.2);
          z-index: 50;
          outline: none;
          min-width: 200px;
          animation: ui-popover-in 0.12s ease-out;
        }
        .ui-popover-content[data-closed] {
          animation: ui-popover-out 0.1s ease-in;
        }
        @keyframes ui-popover-in {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes ui-popover-out {
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0; transform: scale(0.96); }
        }
      `}</style>
      <Popover
        open={props.open}
        onOpenChange={props.onOpenChange}
        placement={props.placement as any}
      >
        <Popover.Trigger class="ui-popover-trigger">{props.trigger}</Popover.Trigger>
        <Popover.Portal>
          <Popover.Content class="ui-popover-content">{props.children}</Popover.Content>
        </Popover.Portal>
      </Popover>
    </>
  );
};

export default Popover_;
