// SummaryCard.tsx
// Written by a different dev in sprint 7 for the reports page.
// Essentially Card.tsx + InfoCard.tsx merged — icon, title, value, trend.
// Nobody noticed the overlap until code review was skipped.

import React from "react";

interface SummaryCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  icon?: React.ReactNode;
  /** "default" uses white bg; "tinted" uses a light indigo wash */
  variant?: "default" | "tinted";
}

/** Summary / metric card — third variant of the Card concept. */
export function SummaryCard({
  label,
  value,
  trend,
  trendUp = true,
  icon,
  variant = "default",
}: SummaryCardProps) {
  const bg = variant === "tinted" ? "bg-indigo-50 border-indigo-100" : "bg-white border-slate-200";
  return (
    <div className={`rounded-lg border p-5 ${bg}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        {icon && (
          <span className="text-slate-400">{icon}</span>
        )}
      </div>
      <p className="text-2xl font-semibold tracking-tight text-slate-900 leading-none">{value}</p>
      {trend && (
        <p className={`text-xs font-semibold mt-2 ${trendUp ? "text-emerald-600" : "text-red-500"}`}>
          {trendUp ? "↑" : "↓"} {trend}
        </p>
      )}
    </div>
  );
}
