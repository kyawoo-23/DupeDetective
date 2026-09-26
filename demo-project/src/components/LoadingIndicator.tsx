// LoadingIndicator.tsx
// Sprint 5 — someone needed a loader for a page transition and wrote this
// from scratch. Same role as Spinner.tsx; uses CSS classes instead of
// explicit SVG attributes. Slightly different animation approach.

interface LoadingIndicatorProps {
  /** "sm" | "md" | "lg" */
  scale?: "sm" | "md" | "lg";
  label?: string;
}

const scaleClass = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-10 h-10" };

/** Page-level loading indicator — near-duplicate of Spinner. */
export function LoadingIndicator({ scale = "md", label = "Loading…" }: LoadingIndicatorProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2" role="status" aria-live="polite">
      <span
        className={`block rounded-full border-4 border-slate-200 border-t-indigo-500 animate-spin ${scaleClass[scale]}`}
      />
      <span className="text-xs text-slate-400">{label}</span>
    </div>
  );
}
