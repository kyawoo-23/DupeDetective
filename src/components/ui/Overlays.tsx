import type React from 'react';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconButton } from './Button';

const supportsPopover =
  typeof HTMLElement !== 'undefined' && 'showPopover' in HTMLElement.prototype;

function popoverPortalRoot(): HTMLElement {
  const dialog = document.querySelector('dialog[open]');
  return dialog instanceof HTMLElement ? dialog : document.body;
}

// ──────────────────────────────────────────
// Popover (top-layer panel anchored to trigger)
// ──────────────────────────────────────────
function FileOutlineIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="size-4"
      aria-hidden
    >
      <path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h2.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H13.5A1.5 1.5 0 0 1 15 6.5v7a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 2 13.5v-10Z" />
    </svg>
  );
}

const panelClassName =
  'w-max max-w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white p-2.5 shadow-lg';

export function Popover({
  label,
  children,
  /** Stop clicks from activating a wrapping <label> (e.g. checkbox rows). */
  isolateFromLabel = false,
}: {
  label: string;
  children: React.ReactNode;
  isolateFromLabel?: boolean;
}) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const stopIfLabel = (event: React.SyntheticEvent) => {
    if (isolateFromLabel) event.stopPropagation();
  };

  const measure = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 6,
      left: Math.min(rect.right, window.innerWidth - 16),
    });
  }, []);

  const applyPanelPosition = (node: HTMLDivElement) => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    node.style.position = 'fixed';
    node.style.top = `${rect.bottom + 6}px`;
    node.style.left = `${Math.min(rect.right, window.innerWidth - 16)}px`;
    node.style.transform = 'translateX(-100%)';
    node.style.margin = '0';
  };

  const setPanelRef = (node: HTMLDivElement | null) => {
    panelRef.current = node;
    // Manual popover: trigger toggle is handled in React so a second click closes instead of
    // auto-dismiss on pointerdown followed by showPopover on click.
    if (node && supportsPopover) node.setAttribute('popover', 'manual');
  };

  useLayoutEffect(() => {
    if (!open || supportsPopover) return;
    measure();
  }, [open, measure]);

  useEffect(() => {
    if (!open) return;
    const close = () => {
      const node = panelRef.current;
      if (supportsPopover && node?.matches(':popover-open')) node.hidePopover();
      setOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        close();
      }
    };
    const frame = requestAnimationFrame(() => {
      window.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('keydown', onKeyDown, true);
    });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown, true);
    };
  }, [open]);

  const toggle = (event: React.MouseEvent) => {
    stopIfLabel(event);
    const node = panelRef.current;
    if (supportsPopover && node) {
      if (open) {
        if (node.matches(':popover-open')) node.hidePopover();
        setOpen(false);
      } else {
        applyPanelPosition(node);
        node.showPopover();
        setOpen(true);
      }
      return;
    }
    measure();
    setOpen((value) => !value);
  };

  const panel = (
    <div
      ref={setPanelRef}
      id={panelId}
      role="dialog"
      aria-label={label}
      className={`${panelClassName} ${supportsPopover ? 'fixed z-[100]' : 'fixed z-[100]'}`}
      style={
        supportsPopover
          ? undefined
          : {
              top: position.top,
              left: position.left,
              transform: 'translateX(-100%)',
            }
      }
      onPointerDown={stopIfLabel}
    >
      <div className="overflow-x-auto [&_code]:max-w-none [&_code]:break-normal [&_code]:whitespace-nowrap">
        {children}
      </div>
    </div>
  );

  return (
    <>
      <span ref={triggerRef} className="inline-flex shrink-0">
        <IconButton
          size="sm"
          type="button"
          aria-label={label}
          aria-expanded={open}
          aria-controls={panelId}
          className="text-slate-400"
          onPointerDown={stopIfLabel}
          onClick={toggle}
        >
          <FileOutlineIcon />
        </IconButton>
      </span>
      {supportsPopover ? panel : open && createPortal(panel, popoverPortalRoot())}
    </>
  );
}

// ──────────────────────────────────────────
// Tooltip (hover, portaled so clipped ancestors still show it)
// ──────────────────────────────────────────
const tooltipClassName =
  'pointer-events-none fixed z-[110] max-w-[min(22rem,calc(100vw-2rem))] rounded-md border border-slate-800 bg-slate-900 px-2 py-1 font-mono text-xs text-white shadow-md';

export function Tooltip({ content, children }: { content: string; children: React.ReactNode }) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipId = useId();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const show = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 6,
      left: rect.left + rect.width / 2,
    });
    setOpen(true);
  }, []);

  const hide = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className="inline-flex max-w-full min-w-0 border-0 bg-transparent p-0 text-left font-inherit cursor-default"
        aria-describedby={open ? tooltipId : undefined}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </button>
      {open &&
        createPortal(
          <div
            id={tooltipId}
            role="tooltip"
            className={tooltipClassName}
            style={{
              top: position.top,
              left: position.left,
              transform: 'translateX(-50%)',
            }}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
}

// ──────────────────────────────────────────
// Modal
// ──────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}

export function Modal({ open, onClose, title, children, footer, width = 'max-w-lg' }: ModalProps) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      tabIndex={-1}
    >
      {/* biome-ignore lint/a11y/noStaticElementInteractions: inner panel stops propagation only; all keyboard/focus handling is on the outer dialog */}
      <div
        className={`bg-white rounded-2xl shadow-xl w-full ${width} flex flex-col max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 id="modal-title" className="text-base font-semibold text-slate-900">
            {title}
          </h2>
          <IconButton onClick={onClose} aria-label="Close">
            ✕
          </IconButton>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
        {footer && (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// Sheet (slide-over panel)
// ──────────────────────────────────────────
interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Tailwind max-width class for the panel */
  width?: string;
}

export function Sheet({ open, onClose, title, children, width = 'max-w-md' }: SheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    const body = document.body;
    const html = document.documentElement;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyPosition = body.style.position;
    const prevBodyTop = body.style.top;
    const prevBodyWidth = body.style.width;
    const scrollbarGap = window.innerWidth - html.clientWidth;

    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    if (scrollbarGap > 0) {
      body.style.paddingRight = `${scrollbarGap}px`;
    }

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.position = prevBodyPosition;
      body.style.top = prevBodyTop;
      body.style.width = prevBodyWidth;
      body.style.paddingRight = '';
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="fixed inset-0 m-0 flex h-dvh max-h-dvh w-full max-w-none overflow-hidden border-0 bg-transparent p-0 shadow-none backdrop:bg-transparent [&:not([open])]:hidden"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close"
        className={`absolute inset-0 border-0 bg-black/40 p-0 ${open ? 'dd-sheet-backdrop-enter' : ''}`}
        onClick={onClose}
      />
      <div
        className={`relative z-10 ml-auto flex h-full w-full flex-col overflow-hidden bg-white p-0 shadow-2xl ${width} ${open ? 'dd-sheet-panel-enter' : ''}`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 id={titleId} className="text-base font-semibold text-slate-900">
            {title}
          </h2>
          <IconButton onClick={onClose} aria-label="Close">
            ✕
          </IconButton>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </dialog>
  );
}
