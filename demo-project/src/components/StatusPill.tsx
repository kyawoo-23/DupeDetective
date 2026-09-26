// StatusPill.tsx
// Created in sprint 6 for the orders page — "we need a pill-shaped label".
// Same job as Badge.tsx; uses `color` instead of `status`, uppercase text,
// and slightly different padding. Classic AI-regenerated near-duplicate.

type PillColor = "green" | "yellow" | "gray" | "red" | "blue";

const colorStyles: Record<PillColor, string> = {
  green:  "bg-emerald-100 text-emerald-800",
  yellow: "bg-amber-100 text-amber-800",
  gray:   "bg-slate-100 text-slate-600",
  red:    "bg-red-100 text-red-800",
  blue:   "bg-indigo-100 text-indigo-800",
};

interface StatusPillProps {
  color: PillColor;
  children: React.ReactNode;
}

import React from "react";

/** Status pill — near-duplicate of Badge, different prop shape. */
export function StatusPill({ color, children }: StatusPillProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide ${colorStyles[color]}`}>
      {children}
    </span>
  );
}
