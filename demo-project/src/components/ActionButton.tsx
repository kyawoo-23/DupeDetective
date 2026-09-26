// ActionButton.tsx
// Introduced in sprint 3 when the design team asked for "action buttons".
// Almost identical to Button.tsx — uses `type` instead of `variant`,
// renames size values, and tweaks border-radius.

import React from "react";

type ActionButtonType = "default" | "outline" | "destructive";

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** "default" = filled, "outline" = bordered, "destructive" = red */
  type_?: ActionButtonType;
  /** "small" | "normal" | "large" instead of sm/md/lg */
  size?: "small" | "normal" | "large";
  loading?: boolean;
}

const typeClasses: Record<ActionButtonType, string> = {
  default:     "bg-indigo-600 text-white hover:bg-indigo-700",
  outline:     "bg-transparent text-slate-700 border border-slate-300 hover:bg-slate-50",
  destructive: "bg-red-500 text-white hover:bg-red-600",
};

const sizeClasses: Record<string, string> = {
  small:  "px-3 py-1.5 text-xs",
  normal: "px-4 py-2 text-sm",
  large:  "px-5 py-2.5 text-base",
};

/** Action button — near-duplicate of Button, added in a later sprint. */
export function ActionButton({
  type_  = "default",
  size = "normal",
  loading = false,
  className = "",
  children,
  disabled,
  ...rest
}: ActionButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${typeClasses[type_]} ${sizeClasses[size]} ${className}`}
    >
      {loading ? <span className="animate-spin mr-2">⟳</span> : null}
      {children}
    </button>
  );
}
