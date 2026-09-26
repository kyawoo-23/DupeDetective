// Badge.tsx
// Status badge — sprint 2. Maps a status string to a colour.

type BadgeStatus = "active" | "pending" | "inactive" | "error";

const statusStyles: Record<BadgeStatus, string> = {
  active:   "bg-emerald-50 text-emerald-700 border border-emerald-200",
  pending:  "bg-amber-50 text-amber-700 border border-amber-200",
  inactive: "bg-slate-100 text-slate-500 border border-slate-200",
  error:    "bg-red-50 text-red-700 border border-red-200",
};

interface BadgeProps {
  status: BadgeStatus;
  label?: string;
}

/** Semantic status badge. */
export function Badge({ status, label }: BadgeProps) {
  const text = label ?? status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${statusStyles[status]}`}>
      {text}
    </span>
  );
}
