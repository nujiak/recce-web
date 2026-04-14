import { type Component, type JSX, createEffect, onCleanup, onMount } from 'solid-js';
import { Popover } from '@kobalte/core/popover';

interface PopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: JSX.Element;
  children: JSX.Element;
  placement?: string;
}

const Popover_: Component<PopoverProps> = (props) => {
  let contentRef!: HTMLDivElement;

  const onViewportResize = () => {
    const vv = window.visualViewport;
    if (!vv || !contentRef) return;
    const offset = window.innerHeight - vv.height - vv.offsetTop;
    if (offset <= 0) {
      contentRef.style.transform = '';
      return;
    }
    const rect = contentRef.getBoundingClientRect();
    const visibleBottom = vv.height + vv.offsetTop;
    if (rect.bottom > visibleBottom) {
      const shift = rect.bottom - visibleBottom;
      contentRef.style.transform = `translateY(-${shift}px)`;
    } else {
      contentRef.style.transform = '';
    }
  };

  onMount(() => {
    const vv = window.visualViewport;
    vv?.addEventListener('resize', onViewportResize);
    vv?.addEventListener('scroll', onViewportResize);
  });

  onCleanup(() => {
    const vv = window.visualViewport;
    vv?.removeEventListener('resize', onViewportResize);
    vv?.removeEventListener('scroll', onViewportResize);
  });

  createEffect(() => {
    if (!props.open && contentRef) {
      contentRef.style.transform = '';
    }
  });

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
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border);
          border-radius: 0px;
          padding: 0.75rem;
          /* no box-shadow — flat display discipline */
          z-index: 50;
          outline: none;
          min-width: 200px;
          animation: ui-popover-in 0.075s linear;
          /* 4-corner bracket dressing */
          box-shadow:
            -10px -10px 0 -9px var(--color-accent),
            10px -10px 0 -9px var(--color-accent),
            -10px 10px 0 -9px var(--color-accent),
            10px 10px 0 -9px var(--color-accent);
        }
        .ui-popover-content[data-closed] {
          animation: ui-popover-out 0.075s linear;
        }
        @keyframes ui-popover-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes ui-popover-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
      <Popover
        open={props.open}
        onOpenChange={props.onOpenChange}
        placement={props.placement as any}
      >
        <Popover.Trigger class="ui-popover-trigger">{props.trigger}</Popover.Trigger>
        <Popover.Portal>
          <Popover.Content ref={contentRef} class="ui-popover-content">
            {props.children}
          </Popover.Content>
        </Popover.Portal>
      </Popover>
    </>
  );
};

export default Popover_;
