// InfoCard.tsx
// Added in sprint 4 for the dashboard — "a card with an icon and a stat".
// Structurally the same as Card.tsx but with an icon slot and different
// spacing. No shared abstraction was made at the time.

import React from "react";

interface InfoCardProps {
  icon: React.ReactNode;
  heading: string;
  body: string;
  /** Optional CTA label */
  action?: string;
  onAction?: () => void;
}

/** Dashboard info card — duplicate of Card with icon slot. */
export function InfoCard({ icon, heading, body, action, onAction }: InfoCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-4">
      <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-slate-900">{heading}</p>
        <p className="text-slate-500 text-sm mt-1 leading-relaxed">{body}</p>
      </div>
      {action && (
        <button
          type="button"
          onClick={onAction}
          className="self-start text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          {action} →
        </button>
      )}
    </div>
  );
}
