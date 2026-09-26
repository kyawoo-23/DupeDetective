// ScoreBar and SimilarityScore

interface ScoreBarProps {
  score: number;
  max?: number;
  className?: string;
  /** When true, show "42/100" instead of "42". */
  showMax?: boolean;
}

export function ScoreBar({ score, max = 100, className = '', showMax = false }: ScoreBarProps) {
  const pct = Math.round((score / max) * 100);
  const color = pct >= 70 ? 'bg-red-500' : pct >= 40 ? 'bg-amber-500' : 'bg-primary-400';
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 bg-slate-100 rounded-full h-1.5 min-w-[3rem]">
        <div
          className={`h-1.5 rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-slate-500 shrink-0">
        {showMax ? `${score}/${max}` : score}
      </span>
    </div>
  );
}

const SIMILARITY_HINT =
  'Rule-based similarity from code structure (0–100). Higher means more alike; you still decide in review.';

export function SimilarityScore({
  score,
  className = '',
  compact = false,
}: {
  score: number;
  className?: string;
  /** Omit the "Similarity" label (e.g. in tight pair rows). */
  compact?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`} title={SIMILARITY_HINT}>
      {!compact && <span className="text-xs text-slate-500 whitespace-nowrap">Similarity</span>}
      <ScoreBar score={score} max={100} showMax className="flex-1 min-w-0" />
    </div>
  );
}

const GROUP_SIMILARITY_HINT =
  'Group score is the average similarity of every pair in the group (0–100). Strong means 40 or higher. You still decide in review.';

/** Group cohesion: one score, plus Strong or Possible. */
export function GroupSimilaritySummary({
  score,
  confidence,
  className = '',
}: {
  score: number;
  confidence: 'strong' | 'possible';
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`} title={GROUP_SIMILARITY_HINT}>
      <span className="text-xs font-medium text-slate-600 whitespace-nowrap shrink-0">
        {confidence === 'strong' ? 'Strong' : 'Possible'}
      </span>
      <ScoreBar score={score} max={100} showMax className="flex-1 min-w-0" />
    </div>
  );
}
