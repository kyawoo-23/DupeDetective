import { forwardRef, useState } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Native <dialog> modal — opened via showModal() in App.tsx.
 * Uses <form method="dialog"> for cancel and a confirm button for the action.
 */
const Modal = forwardRef<HTMLDialogElement, ModalProps>(function Modal(
  { onClose },
  ref
) {
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const handleConfirm = () => {
    setDeleting(true);
    // Simulate async delete
    setTimeout(() => {
      setDeleting(false);
      setDeleted(true);
      setTimeout(() => {
        setDeleted(false);
        onClose();
      }, 1200);
    }, 900);
  };

  return (
    <dialog
      ref={ref}
      id="demo-modal"
      aria-labelledby="modal-title"
      onClose={onClose}
      className="m-auto w-full max-w-md rounded-lg border border-slate-200 bg-white p-0 shadow-lg backdrop:bg-slate-900/50 open:flex open:flex-col"
    >
      {deleted ? (
        /* Success state */
        <div className="flex flex-col items-center justify-center gap-3 py-12 px-8">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 text-xl">
            ✓
          </div>
          <p className="font-semibold text-slate-800">Project deleted</p>
          <p className="text-sm text-slate-400">Closing…</p>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
            <h2 id="modal-title" className="font-semibold text-slate-900 text-base">
              Confirm deletion
            </h2>
            <form method="dialog">
              <button
                type="submit"
                aria-label="Close dialog"
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <line x1="2" y1="2" x2="14" y2="14"/>
                  <line x1="14" y1="2" x2="2" y2="14"/>
                </svg>
              </button>
            </form>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-3">
            <p className="text-sm text-slate-600 leading-relaxed">
              You are about to permanently delete{" "}
              <strong className="text-slate-900">Project Alpha</strong>.
              This action cannot be undone.
            </p>
            <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-sm text-red-700">
              All associated data, settings, and history will be removed.
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
            <form method="dialog">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
            </form>
            <button
              type="button"
              disabled={deleting}
              onClick={handleConfirm}
              className="px-5 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60 disabled:pointer-events-none transition-colors"
            >
              {deleting ? "Deleting…" : "Delete project"}
            </button>
          </div>
        </>
      )}
    </dialog>
  );
});

export default Modal;
