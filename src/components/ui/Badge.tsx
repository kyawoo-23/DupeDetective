import type React from 'react';
import { getDecisionLabel, getMigrationStatusLabel } from '../../store';
import type { DecisionType, MigrationStatus } from '../../types';
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
  blue: 'bg-blue-100 text-blue-800',
  green: 'bg-emerald-100 text-emerald-800',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-800',
  purple: 'bg-purple-100 text-purple-800',
  slate: 'bg-slate-100 text-slate-700',
  teal: 'bg-teal-100 text-teal-800',
};

export function Badge({ color = 'slate', children, className = '', title }: BadgeProps) {
  return (
    <span
      title={title}
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badgeCls[color]} ${className}`}
    >
      {children}
    </span>
  );
}

// ──────────────────────────────────────────
// MigrationStatusBadge
// ──────────────────────────────────────────
const migrationStatusStyles: Record<
  MigrationStatus,
  { shell: string; dot: string; dotPulse?: boolean }
> = {
  pending: {
    shell: 'bg-slate-50 text-slate-700 ring-slate-200/90',
    dot: 'bg-slate-400',
  },
  complete: {
    shell: 'bg-emerald-50 text-emerald-800 ring-emerald-200/90',
    dot: 'bg-emerald-500',
  },
};

export function MigrationStatusBadge({ status }: { status?: MigrationStatus }) {
  if (!status) return null;
  const styles = migrationStatusStyles[status];
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-tight ring-1 ring-inset ${styles.shell}`}
    >
      <span
        className={`size-1.5 shrink-0 rounded-full ${styles.dot}${styles.dotPulse ? ' motion-safe:animate-pulse' : ''}`}
        aria-hidden
      />
      {getMigrationStatusLabel(status)}
    </span>
  );
}

// ──────────────────────────────────────────
// DecisionTypeBadge
// ──────────────────────────────────────────
const decisionSurfaceStyles: Record<DecisionType, string> = {
  merge: 'bg-violet-50 text-violet-900 ring-violet-200/90',
  keep: 'bg-emerald-50 text-emerald-900 ring-emerald-200/90',
};

export function DecisionTypeBadge({
  type,
  tone = 'surface',
  className = '',
}: {
  type: DecisionType;
  tone?: 'surface' | 'onPrimary';
  className?: string;
}) {
  if (tone === 'onPrimary') {
    return (
      <span
        className={`inline-flex max-w-[9.5rem] items-center truncate rounded-full border border-white/30 bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold tracking-tight text-white shadow-sm ${className}`}
        title={getDecisionLabel(type)}
      >
        {getDecisionLabel(type)}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-tight ring-1 ring-inset ${decisionSurfaceStyles[type]} ${className}`}
    >
      {getDecisionLabel(type)}
    </span>
  );
}

// ──────────────────────────────────────────
// Decision color helper
// ──────────────────────────────────────────
export const decisionColors: Record<DecisionType, BadgeColor> = {
  merge: 'purple',
  keep: 'green',
};
