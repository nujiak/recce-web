import type { Component, JSX } from 'solid-js';
import { Dialog } from '@kobalte/core/dialog';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: JSX.Element;
  preventClose?: boolean;
}

let dialogZCounter = 0;

const DIALOG_Z_BASE = 100;

const Dialog_: Component<DialogProps> = (props) => {
  const zIndex = DIALOG_Z_BASE + ++dialogZCounter * 2;
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <Dialog.Portal>
        <style>{`
          .ui-dialog-overlay {
            position: fixed;
            inset: 0;
            background: var(--color-overlay);
            animation: ui-dialog-overlay-in 0.075s linear;
          }
          .ui-dialog-overlay[data-closed] {
            animation: ui-dialog-overlay-out 0.075s linear;
          }
          .ui-dialog-content {
            position: fixed;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            animation: ui-dialog-content-in 0.075s linear;
          }
          .ui-dialog-content[data-closed] {
            animation: ui-dialog-content-out 0.075s linear;
          }
          .ui-dialog-card {
            background: var(--color-bg-secondary);
            border: 1px solid var(--color-border);
            border-radius: 0px;
            padding: 0;
            max-width: 480px;
            min-width: 360px;
            width: 90%;
            position: relative;
            outline: none;
            /* no box-shadow — flat display discipline */
          }
          .ui-dialog-card-body {
            padding: 1.25rem 1rem 1.5rem;
          }
          .ui-dialog-title {
            color: var(--color-text);
            font-weight: 500;
            font-size: 15px;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            padding: 12px 16px 12px;
            padding-right: 3.5rem;
            min-height: 48px;
            display: flex;
            align-items: center;
            border-bottom: 1px solid var(--color-border);
            margin-bottom: 0;
            /* accent left stripe */
            border-left: 3px solid var(--color-accent);
            padding-left: 13px;
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
            transition: background 75ms linear, color 75ms linear;
          }
          .ui-dialog-close:hover {
            background: var(--color-accent-bg);
            color: var(--color-accent);
          }
          .ui-dialog-close:focus-visible {
            outline: 1px solid var(--color-accent);
            outline-offset: 3px;
          }
          @media (min-width: 768px) {
            /* 4-corner bracket on desktop dialog */
            .ui-dialog-card {
              outline: 1px solid transparent;
              box-shadow:
                -10px -10px 0 -9px var(--color-accent),
                10px -10px 0 -9px var(--color-accent),
                -10px 10px 0 -9px var(--color-accent),
                10px 10px 0 -9px var(--color-accent);
            }
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
              max-height: 85dvh;
              overflow-y: auto;
              scrollbar-gutter: stable;
              border-top: 1px solid var(--color-border);
              border-left: none;
              border-right: none;
              border-bottom: none;
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
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes ui-dialog-content-out {
            from { opacity: 1; }
            to { opacity: 0; }
          }
        `}</style>

        <Dialog.Overlay class="ui-dialog-overlay" style={{ 'z-index': zIndex }} />
        <Dialog.Content
          class="ui-dialog-content"
          style={{ 'z-index': zIndex + 1 }}
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
            <div class="ui-dialog-card-body">{props.children}</div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
};

export default Dialog_;
