import type { DecisionOutcome, GroupDecision, MemberRole, ReactComponent } from '../types';
import { componentJsxTag } from './componentDisplay';

export function mergeTarget(decision: GroupDecision): string | undefined {
  return Object.entries(decision.roles).find(([, role]) => role === 'target')?.[0];
}

export function mergedIds(decision: GroupDecision): string[] {
  return Object.entries(decision.roles)
    .filter(([, role]) => role === 'merge')
    .map(([id]) => id);
}

export function separateIds(decision: GroupDecision): string[] {
  return Object.entries(decision.roles)
    .filter(([, role]) => role === 'separate')
    .map(([id]) => id);
}

export function decisionOutcome(decision: GroupDecision): DecisionOutcome {
  const merges = mergedIds(decision).length;
  if (merges === 0) return 'keep';
  return separateIds(decision).length === 0 ? 'merge' : 'partial';
}

function componentLabel(components: ReactComponent[], id: string | undefined): string {
  if (!id) return 'the kept component';
  const name = components.find((component) => component.id === id)?.name ?? id;
  return componentJsxTag(name);
}

export function decisionSummary(decision: GroupDecision, components: ReactComponent[]): string {
  if (decisionOutcome(decision) === 'keep') return 'Keep separate';
  const merged = mergedIds(decision).map((id) => componentLabel(components, id));
  const separate = separateIds(decision).map((id) => componentLabel(components, id));
  const head = `Merge ${merged.join(', ')} into ${componentLabel(components, mergeTarget(decision))}`;
  if (separate.length === 0) return head;
  const stay =
    separate.length === 1
      ? `${separate[0]} stays separate`
      : `${separate.join(', ')} stay separate`;
  return `${head} · ${stay}`;
}

/** Returns an error message, or null when member roles are valid. */
export function validateDecision(roles: Record<string, MemberRole>): string | null {
  const assigned = Object.values(roles);
  const targets = assigned.filter((role) => role === 'target').length;
  const merges = assigned.filter((role) => role === 'merge').length;
  if (targets > 1 || (merges > 0 && targets !== 1)) return 'Choose one component to keep.';
  if (targets === 1 && merges === 0) return 'Choose at least one component to merge into it.';
  return null;
}

export function sameMembers(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  const sortedRight = [...right].sort();
  return [...left].sort().every((id, index) => id === sortedRight[index]);
}
