// ConfirmDialog.tsx
// Sprint 4 — first modal in the app. Simple yes/no confirmation.
// Opened with showModal() via a ref; uses <form method="dialog"> to close.

import { forwardRef } from "react";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

/** Confirmation dialog — the original modal pattern. */
export const ConfirmDialog = forwardRef<HTMLDialogElement, ConfirmDialogProps>(
  function ConfirmDialog(
    { title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", onConfirm, onCancel, danger = false },
    ref
  ) {
    return (
      <dialog
        ref={ref}
        aria-labelledby="cd-title"
        className="m-auto w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-lg backdrop:bg-slate-900/50"
      >
        <h2 id="cd-title" className="font-semibold text-slate-900 mb-2">{title}</h2>
        <p className="text-sm text-slate-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <form method="dialog">
            <button
              type="submit"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              {cancelLabel}
            </button>
          </form>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-semibold text-white ${danger ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600 hover:bg-indigo-700"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </dialog>
    );
  }
);
