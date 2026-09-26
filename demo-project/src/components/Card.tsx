// Card.tsx
// Original card component from the design system kickoff.
// Props: title, description, optional footer content.

interface CardProps {
  title: string;
  description?: string;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

import React from "react";

/** Base card with title + description. */
export function Card({ title, description, footer, children }: CardProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 flex flex-col gap-3">
      <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
      {description && <p className="text-slate-500 text-sm leading-relaxed">{description}</p>}
      {children}
      {footer && (
        <div className="pt-3 border-t border-slate-100 mt-auto">{footer}</div>
      )}
    </div>
  );
}
