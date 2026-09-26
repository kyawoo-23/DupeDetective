// Tag.tsx
// Added in sprint 9 for filtering UI — "just a little tag chip".
// Fulfils the same role as Badge and StatusPill; adds an optional
// onRemove handler. Nobody searched for existing badge components.

import React from "react";

interface TagProps {
  label: string;
  onRemove?: () => void;
  /** Accent colour key */
  accent?: "indigo" | "rose" | "teal" | "amber";
}

const accentStyles: Record<string, string> = {
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  rose:   "bg-rose-50 text-rose-700 border-rose-200",
  teal:   "bg-teal-50 text-teal-700 border-teal-200",
  amber:  "bg-amber-50 text-amber-700 border-amber-200",
};

/** Removable tag chip — third near-duplicate of Badge / StatusPill. */
export function Tag({ label, onRemove, accent = "indigo" }: TagProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium ${accentStyles[accent]}`}>
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
        >
          ×
        </button>
      )}
    </span>
  );
}
