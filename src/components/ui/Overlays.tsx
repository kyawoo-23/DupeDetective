import { useEffect, useState } from 'react';
import { IconButton } from './Button';

// ──────────────────────────────────────────
// Modal
// ──────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
}

export function Modal({ open, onClose, title, children, width = 'max-w-lg' }: ModalProps) {
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

const SHEET_EXIT_MS = 240;

export function Sheet({ open, onClose, title, children, width = 'max-w-md' }: SheetProps) {
  const [mounted, setMounted] = useState(open);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setExiting(false);
      return;
    }
    if (!mounted) return;
    setExiting(true);
    const t = window.setTimeout(() => {
      setMounted(false);
      setExiting(false);
    }, SHEET_EXIT_MS);
    return () => window.clearTimeout(t);
  }, [open, mounted]);

  if (!mounted) return null;

  const backdropAnim = exiting ? 'dd-sheet-backdrop-exit' : 'dd-sheet-backdrop-enter';
  const panelAnim = exiting ? 'dd-sheet-panel-exit' : 'dd-sheet-panel-enter';

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close panel"
        className={`absolute inset-0 bg-black/40 ${backdropAnim}`}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        className={`relative bg-white shadow-2xl w-full ${width} flex flex-col max-h-full h-full ${panelAnim}`}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 shrink-0">
          <h2 id="sheet-title" className="text-base font-semibold text-slate-900">
            {title}
          </h2>
          <IconButton onClick={onClose} aria-label="Close">
            ✕
          </IconButton>
        </div>
        <div className="overflow-y-auto flex-1 p-5">{children}</div>
      </div>
    </div>
  );
}
