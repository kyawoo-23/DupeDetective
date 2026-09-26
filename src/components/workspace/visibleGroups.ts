import type { CandidateGroup } from '../../types';

/** A group stays listed when its cohesion score meets the minimum. Membership does not change. */
export function visibleGroups(groups: CandidateGroup[], minScore: number): CandidateGroup[] {
  return groups.filter((group) => group.score >= minScore);
}

export function hiddenGroupCount(groups: CandidateGroup[], minScore: number): number {
  return groups.filter((group) => group.score < minScore).length;
}
