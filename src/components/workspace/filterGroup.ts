// Utility for filtering candidate groups by minimum similarity score

import type { CandidateGroup } from '../../types';

export function filterGroup(group: CandidateGroup, minScore: number): CandidateGroup | null {
  const pairs = group.pairs.filter((pair) => pair.totalScore >= minScore);
  if (pairs.length === 0) return null;
  const componentIds = new Set(pairs.flatMap((pair) => [pair.componentA.id, pair.componentB.id]));
  const signalTotals = new Map<CandidateGroup['primarySignals'][number], number>();
  for (const pair of pairs) {
    for (const signal of pair.signals) {
      signalTotals.set(signal.signal, (signalTotals.get(signal.signal) ?? 0) + signal.score);
    }
  }
  return {
    ...group,
    pairs,
    components: group.components.filter((component) => componentIds.has(component.id)),
    topScore: pairs.reduce((max, pair) => Math.max(max, pair.totalScore), 0),
    primarySignals: [...signalTotals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([signal]) => signal),
  };
}
