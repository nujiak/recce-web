import type { Component, JSX } from 'solid-js';
import { Dialog } from '@kobalte/core/dialog';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: JSX.Element;
  preventClose?: boolean;
}

const Dialog_: Component<DialogProps> = (props) => {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <Dialog.Portal>
        <style>{`
          .ui-dialog-overlay {
            position: fixed;
            inset: 0;
            background: var(--color-overlay);
            z-index: 100;
            animation: ui-dialog-overlay-in 0.15s ease-out;
          }
          .ui-dialog-overlay[data-closed] {
            animation: ui-dialog-overlay-out 0.15s ease-in;
          }
          .ui-dialog-content {
            position: fixed;
            inset: 0;
            z-index: 101;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            animation: ui-dialog-content-in 0.15s ease-out;
          }
          .ui-dialog-content[data-closed] {
            animation: ui-dialog-content-out 0.15s ease-in;
          }
          .ui-dialog-card {
            background: var(--color-bg-secondary);
            border: 1px solid var(--color-border);
            border-radius: 0px;
            padding: 1.5rem;
            max-width: 480px;
            min-width: 360px;
            width: 90%;
            position: relative;
            outline: none;
          }
          .ui-dialog-title {
            color: var(--color-text);
            font-weight: 400;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            padding-right: 3.5rem;
            padding-bottom: 12px;
            min-height: 48px;
            display: flex;
            align-items: center;
            border-bottom: 1px solid var(--color-border);
            margin-bottom: 16px;
          }
          .ui-dialog-close {
            position: absolute;
            top: 0;
            right: 0;
            background: none;
            border: none;
            cursor: pointer;
            color: var(--color-text-secondary);
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 0px;
            font-family: 'Material Symbols Outlined', sans-serif;
            font-size: 18px;
            outline: none;
          }
          .ui-dialog-close:hover {
            background: var(--color-accent-bg);
            color: var(--color-accent);
          }
          .ui-dialog-close:focus-visible {
            outline: 2px solid var(--color-accent);
            outline-offset: -2px;
          }
          @media (max-width: 767px) {
            .ui-dialog-content {
              align-items: flex-end;
              padding: 0;
            }
            .ui-dialog-card {
              width: 100%;
              max-width: 100%;
              min-width: 0;
              border-radius: 0px;
              padding: 1.25rem 1rem;
              max-height: 85dvh;
              overflow-y: auto;
              scrollbar-gutter: stable;
            }
          }
          @keyframes ui-dialog-overlay-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes ui-dialog-overlay-out {
            from { opacity: 1; }
            to { opacity: 0; }
          }
          @keyframes ui-dialog-content-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes ui-dialog-content-out {
            from { opacity: 1; transform: scale(1); }
            to { opacity: 0; transform: scale(0.95); }
          }
        `}</style>

        <Dialog.Overlay class="ui-dialog-overlay" />
        <Dialog.Content
          class="ui-dialog-content"
          onClick={(e) => {
            if (!props.preventClose && e.target === e.currentTarget) {
              props.onOpenChange(false);
            }
          }}
          onPointerDownOutside={props.preventClose ? (e) => e.preventDefault() : undefined}
          onEscapeKeyDown={props.preventClose ? (e) => e.preventDefault() : undefined}
        >
          <div class="ui-dialog-card">
            <Dialog.Title class="ui-dialog-title">{props.title}</Dialog.Title>
            {!props.preventClose && (
              <Dialog.CloseButton class="ui-dialog-close" aria-label="Close">
                close
              </Dialog.CloseButton>
            )}
            {props.children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
};

export default Dialog_;
