// AlertModal.tsx
// Sprint 7 — "we need a modal for alerts, not just confirmations".
// Adds a `type` prop for severity and an icon. Structurally the same
// as ConfirmDialog and Modal.tsx — three modal variants now exist.

import React, { forwardRef } from "react";

type AlertType = "info" | "warning" | "error" | "success";

interface AlertModalProps {
  type?: AlertType;
  heading: string;
  detail: string;
  onDismiss: () => void;
}

const alertConfig: Record<AlertType, { icon: string; bg: string; text: string }> = {
  info:    { icon: "ℹ", bg: "bg-indigo-50",  text: "text-indigo-700" },
  warning: { icon: "⚠", bg: "bg-amber-50",   text: "text-amber-700"  },
  error:   { icon: "✕", bg: "bg-red-50",     text: "text-red-700"    },
  success: { icon: "✓", bg: "bg-emerald-50", text: "text-emerald-700"},
};

/** Alert modal — near-duplicate of ConfirmDialog and Modal. */
export const AlertModal = forwardRef<HTMLDialogElement, AlertModalProps>(
  function AlertModal({ type = "info", heading, detail, onDismiss }, ref) {
    const cfg = alertConfig[type];
    return (
      <dialog
        ref={ref}
        aria-labelledby="am-heading"
        className="m-auto w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-xl backdrop:bg-slate-900/50"
      >
        <div className="p-6">
          <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${cfg.bg} ${cfg.text} text-lg mb-4`}>
            {cfg.icon}
          </div>
          <h2 id="am-heading" className="font-semibold text-slate-900 mb-1">{heading}</h2>
          <p className="text-sm text-slate-500 mb-5">{detail}</p>
          <form method="dialog">
            <button
              type="submit"
              onClick={onDismiss}
              className="w-full py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
            >
              Got it
            </button>
          </form>
        </div>
      </dialog>
    );
  }
);
