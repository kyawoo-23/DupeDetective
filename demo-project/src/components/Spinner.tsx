// Spinner.tsx
// Loading spinner — sprint 3. SVG-based animated ring.

interface SpinnerProps {
  size?: number;
  color?: string;
}

/** Inline SVG spinner. */
export function Spinner({ size = 20, color = "currentColor" }: SpinnerProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin"
      aria-label="Loading"
      role="status"
    >
      <circle
        className="opacity-20"
        cx="12" cy="12" r="10"
        stroke={color}
        strokeWidth="4"
      />
      <path
        className="opacity-80"
        fill={color}
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
