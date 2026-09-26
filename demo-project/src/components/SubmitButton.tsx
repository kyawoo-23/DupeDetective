// SubmitButton.tsx
// Created for forms in sprint 5 — "just a simple submit button".
// Overlaps heavily with Button.tsx and ActionButton.tsx but is
// hardcoded to the primary style and adds only a `pending` state.

import React from "react";

interface SubmitButtonProps {
  pending?: boolean;
  label?: string;
  pendingLabel?: string;
  fullWidth?: boolean;
  onClick?: () => void;
}

/** Form submit button — effectively Button variant="primary" with loading state. */
export function SubmitButton({
  pending = false,
  label = "Submit",
  pendingLabel = "Saving…",
  fullWidth = false,
  onClick,
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={onClick}
      className={`${fullWidth ? "w-full" : ""} inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors`}
    >
      {pending && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {pending ? pendingLabel : label}
    </button>
  );
}
