import type React from 'react';
import { getDecisionLabel, getMigrationStatusLabel } from '../../store';
import type { DecisionOutcome, MigrationStatus } from '../../types';
import type { BadgeColor } from './shared';

// ──────────────────────────────────────────
// Badge
// ──────────────────────────────────────────
interface BadgeProps {
  color?: BadgeColor;
  children: React.ReactNode;
  className?: string;
  title?: string;
}

const badgeCls: Record<BadgeColor, string> = {
  blue: 'bg-primary-50 text-primary-800 ring-primary-200',
  green: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-900 ring-amber-200',
  red: 'bg-red-50 text-red-800 ring-red-200',
  purple: 'bg-purple-50 text-purple-800 ring-purple-200',
  slate: 'bg-slate-50 text-slate-700 ring-slate-200',
  teal: 'bg-teal-50 text-teal-800 ring-teal-200',
};

const pillClass =
  'inline-flex w-fit items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold leading-4 whitespace-nowrap ring-1 ring-inset';

export function Badge({ color = 'slate', children, className = '', title }: BadgeProps) {
  return (
    <span title={title} className={`${pillClass} ${badgeCls[color]} ${className}`}>
      {children}
    </span>
  );
}

// ──────────────────────────────────────────
// MigrationStatusBadge
// ──────────────────────────────────────────
const migrationStatusStyles: Record<MigrationStatus, { shell: string; dot: string }> = {
  pending: {
    shell: badgeCls.amber,
    dot: 'bg-amber-500',
  },
  complete: {
    shell: badgeCls.green,
    dot: 'bg-emerald-500',
  },
};

export function MigrationStatusBadge({ status }: { status?: MigrationStatus }) {
  if (!status) return null;
  const styles = migrationStatusStyles[status];
  return (
    <span className={`${pillClass} gap-1.5 ${styles.shell}`}>
      <span className={`size-1.5 shrink-0 rounded-full ${styles.dot}`} aria-hidden />
      {getMigrationStatusLabel(status)}
    </span>
  );
}

// ──────────────────────────────────────────
// DecisionTypeBadge
// ──────────────────────────────────────────
const decisionSurfaceStyles: Record<DecisionOutcome, string> = {
  merge: badgeCls.blue,
  partial: badgeCls.amber,
  keep: badgeCls.green,
};

export function DecisionTypeBadge({
  outcome,
  tone = 'surface',
  className = '',
}: {
  outcome: DecisionOutcome;
  tone?: 'surface' | 'onPrimary';
  className?: string;
}) {
  if (tone === 'onPrimary') {
    return (
      <span
        className={`${pillClass} max-w-[9.5rem] truncate bg-white/15 text-white ring-white/30 ${className}`}
        title={getDecisionLabel(outcome)}
      >
        {getDecisionLabel(outcome)}
      </span>
    );
  }
  return (
    <span className={`${pillClass} ${decisionSurfaceStyles[outcome]} ${className}`}>
      {getDecisionLabel(outcome)}
    </span>
  );
}

// ──────────────────────────────────────────
// Decision color helper
// ──────────────────────────────────────────
export const decisionColors: Record<DecisionOutcome, BadgeColor> = {
  merge: 'blue',
  partial: 'amber',
  keep: 'green',
};
