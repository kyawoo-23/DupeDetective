import { useEffect, useId, useState } from 'react';
import toast from 'react-hot-toast';
import {
  decisionOutcome,
  decisionSummary,
  mergedIds,
  mergeTarget,
  sameMembers,
  validateDecision,
} from '../../lib/decisions';
import { makeDecisionId, useAppStore } from '../../store';
import type { CandidateGroup, CandidatePair, GroupDecision, MemberRole, Scan } from '../../types';
import {
  Button,
  Card,
  ComponentTag,
  ComponentTagList,
  componentJsxTag,
  DecisionTypeBadge,
  FileLocation,
  GroupSimilaritySummary,
  Popover,
  Sheet,
  TextArea,
} from '../ui';
import { ComponentComparison, GroupEvidenceMatrix, PairEvidence } from './ReviewPanel';

interface GroupDraft {
  /** null until the reviewer picks a target or "keep all separate". */
  targetId: string | null;
  mergeIds: string[];
  rationale: string;
}

function initialDraft(scan: Scan, group: CandidateGroup): GroupDraft {
  const existing = scan.groupDecisions.find((decision) => decision.groupId === group.id);
  if (!existing) return { targetId: null, mergeIds: [], rationale: '' };
  return {
    targetId: mergeTarget(existing) ?? '',
    mergeIds: mergedIds(existing),
    rationale: existing.rationale,
  };
}

function MemberRosterLine({
  name,
  file,
  line,
  role,
  targetName,
}: {
  name: string;
  file: string;
  line: number;
  role: MemberRole;
  targetName?: string;
}) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="truncate font-medium">
          <ComponentTag name={name} />
        </span>
        {role === 'target' && (
          <span className="shrink-0 text-primary-600" title="Merge target">
            <MergeTargetIcon className="size-4" />
          </span>
        )}
        {role === 'merge' && targetName && (
          <span className="ml-auto shrink-0 pl-2 text-xs font-normal text-slate-500">
            → <ComponentTag name={targetName} />
          </span>
        )}
      </div>
      <FileLocation file={file} line={line} truncate className="mt-1 max-w-full" />
    </div>
  );
}

function MergeTargetIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`lucide lucide-combine size-4 shrink-0 ${className}`}
      aria-hidden
    >
      <path d="M14 3a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1" />
      <path d="M19 3a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1" />
      <path d="m7 15 3 3" />
      <path d="m7 21 3-3H5a2 2 0 0 1-2-2v-2" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="3" width="7" height="7" rx="1" />
    </svg>
  );
}

function memberListRowClass(componentId: string, targetId: string | null): string {
  const base =
    'flex min-w-0 items-start gap-2 border-b border-l-4 border-b-slate-200 border-l-transparent bg-white px-2.5 py-2.5 transition-colors last:border-b-0';
  if (targetId === componentId) {
    return `${base} border-l-primary-500 bg-primary-50 text-primary-900`;
  }
  if (targetId) {
    return `${base} text-slate-600`;
  }
  return `${base} text-slate-800`;
}

function mergeTargetOptionClass(selected: boolean): string {
  const base =
    'flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-lg border-2 px-3 text-sm font-medium transition-colors';
  return selected
    ? `${base} border-primary-500 bg-primary-50 text-primary-800`
    : `${base} border-slate-200 text-slate-700 hover:border-slate-300`;
}

function rolesFromDraft(group: CandidateGroup, draft: GroupDraft): Record<string, MemberRole> {
  const roles: Record<string, MemberRole> = {};
  for (const component of group.components) {
    if (!draft.targetId) roles[component.id] = 'separate';
    else if (component.id === draft.targetId) roles[component.id] = 'target';
    else if (draft.mergeIds.includes(component.id)) roles[component.id] = 'merge';
    else roles[component.id] = 'separate';
  }
  return roles;
}

export function GroupReviewPanel({
  scan,
  group,
  selectedPairId,
  onSelectPair,
  onBack,
  onDirtyChange,
}: {
  scan: Scan;
  group: CandidateGroup;
  selectedPairId: string | null;
  onSelectPair: (pair: CandidatePair) => void;
  onBack: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const saveGroupDecision = useAppStore((state) => state.saveGroupDecision);
  const storageKey = `dd-group-verdict-draft:${scan.id}:${group.id}`;
  const targetLegendId = useId();
  const mergeLegendId = useId();
  const [baseline, setBaseline] = useState(() => initialDraft(scan, group));
  const [draft, setDraft] = useState<GroupDraft>(() => {
    try {
      const saved = window.sessionStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved) as GroupDraft;
    } catch {
      /* Browser storage may be unavailable. */
    }
    return initialDraft(scan, group);
  });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [error, setError] = useState('');
  const existing = scan.groupDecisions.find((decision) => decision.groupId === group.id);
  const pair = group.pairs.find((candidate) => candidate.id === selectedPairId) ?? group.pairs[0];
  const showMatrix = group.components.length > 2;
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);
  const draftDecision: GroupDecision = {
    id: 'draft',
    scanId: scan.id,
    groupId: group.id,
    roles: rolesFromDraft(group, draft),
    rationale: draft.rationale,
    reviewedAt: '',
  };
  const summary =
    draft.targetId === null
      ? 'Choose a component to keep, or keep all separate.'
      : decisionSummary(draftDecision, group.components);
  const memberRoles = rolesFromDraft(group, draft);

  useEffect(() => {
    onDirtyChange(dirty);
    return () => onDirtyChange(false);
  }, [dirty, onDirtyChange]);
  useEffect(() => {
    try {
      if (dirty) window.sessionStorage.setItem(storageKey, JSON.stringify(draft));
      else window.sessionStorage.removeItem(storageKey);
    } catch {
      /* The in-memory draft remains available for this session. */
    }
  }, [dirty, draft, storageKey]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const changeDraft = (updates: Partial<GroupDraft>) => {
    setDraft((current) => ({ ...current, ...updates }));
    setError('');
  };

  const chooseTarget = (targetId: string) => {
    changeDraft({
      targetId,
      mergeIds: targetId
        ? group.components
            .filter((component) => component.id !== targetId)
            .map((component) => component.id)
        : [],
    });
  };

  const toggleMerge = (componentId: string, checked: boolean) => {
    changeDraft({
      mergeIds: checked
        ? [...draft.mergeIds, componentId]
        : draft.mergeIds.filter((id) => id !== componentId),
    });
  };

  const save = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (draft.targetId === null) {
      setError('Choose a component to keep, or keep all separate.');
      return;
    }
    const roles = rolesFromDraft(group, draft);
    const problem = validateDecision(roles);
    if (problem) {
      setError(problem);
      return;
    }
    const nextMerged = draft.targetId ? draft.mergeIds : [];
    const unchangedTarget =
      !!existing &&
      (mergeTarget(existing) ?? '') === draft.targetId &&
      sameMembers(mergedIds(existing), nextMerged);
    const decision: GroupDecision = {
      id: existing?.id ?? makeDecisionId(),
      scanId: scan.id,
      groupId: group.id,
      roles,
      rationale: draft.rationale.trim(),
      migrationStatus: draft.targetId
        ? unchangedTarget
          ? (existing?.migrationStatus ?? 'pending')
          : 'pending'
        : undefined,
      completionNote: unchangedTarget ? existing?.completionNote : undefined,
      reviewedAt: new Date().toISOString(),
    };
    saveGroupDecision(decision);
    setBaseline(draft);
    toast.success(decisionSummary(decision, group.components));
    setError('');
    setSheetOpen(false);
  };

  const buttonLabel = existing ? 'Edit group decision' : 'Decide group';
  const target = group.components.find((component) => component.id === draft.targetId);

  return (
    <div className="flex min-w-0 flex-col gap-5 pb-24 sm:pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Button variant="link" onClick={onBack}>
            ← Back to queue
          </Button>
          <h2 className="mt-2 break-words text-lg font-semibold text-slate-900">
            <ComponentTagList names={group.components.map((component) => component.name)} />
          </h2>
          <p className="text-sm text-slate-500">
            {group.components.length} components · group score {group.score}/100
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <GroupSimilaritySummary
            score={group.score}
            confidence={group.confidence}
            className="w-44"
          />
          {existing && <DecisionTypeBadge outcome={decisionOutcome(existing)} />}
          <Button
            variant="primary"
            onClick={() => setSheetOpen(true)}
            className="hidden sm:inline-flex"
          >
            {buttonLabel}
          </Button>
        </div>
      </div>

      <Card className="min-w-0 p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-slate-700">Why these are grouped</h3>
        <p className="mt-1 text-xs text-slate-500">
          {showMatrix
            ? 'Each cell is one pair. The group score is the average of all of them.'
            : 'This group is one pair. The group score is that pair’s score.'}
        </p>
        {showMatrix && (
          <div className="mt-3">
            <GroupEvidenceMatrix
              components={group.components}
              pairs={group.pairs}
              selectedPairId={pair?.id ?? null}
              onSelectPair={onSelectPair}
            />
          </div>
        )}
      </Card>

      {pair && (
        <PairEvidence
          pair={pair}
          heading={showMatrix ? 'Why the selected pair looks similar' : 'Why these look similar'}
        />
      )}

      <ComponentComparison key={group.id} components={group.components} />

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_-18px_rgba(15,23,42,0.35)] backdrop-blur sm:hidden">
        <Button variant="primary" onClick={() => setSheetOpen(true)} className="w-full">
          {buttonLabel}
        </Button>
      </div>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Group decision"
        width="max-w-lg"
      >
        <form onSubmit={save} className="flex min-h-full flex-col gap-5">
          <div>
            <p className="text-sm font-medium text-slate-800">
              {group.components.length} components in this group
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {target
                ? 'Highlighted row is the merge target; others show where they merge.'
                : 'Pick a merge target below to preview the plan.'}
            </p>
            <ol className="mt-2 flex list-none flex-col overflow-hidden rounded-lg border border-slate-200 p-0 m-0">
              {group.components.map((component, index) => {
                const role = memberRoles[component.id];
                return (
                  <li
                    key={component.id}
                    className={memberListRowClass(component.id, draft.targetId)}
                    aria-current={draft.targetId === component.id ? 'true' : undefined}
                  >
                    <span
                      className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded border border-slate-200 bg-slate-50 text-xs font-semibold tabular-nums text-slate-500"
                      aria-hidden
                    >
                      {index + 1}
                    </span>
                    <MemberRosterLine
                      name={component.name}
                      file={component.file}
                      line={component.line}
                      role={role}
                      targetName={target?.name}
                    />
                  </li>
                );
              })}
            </ol>
          </div>

          <fieldset>
            <legend id={targetLegendId} className="text-sm font-semibold text-slate-800">
              Which component should the others merge into?
            </legend>
            <p aria-live="polite" className="text-[12px] text-slate-700 italic">
              {summary}
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {group.components.map((component) => {
                const inputId = `${targetLegendId}-${component.id}`;
                return (
                  <label
                    key={component.id}
                    htmlFor={inputId}
                    className={mergeTargetOptionClass(draft.targetId === component.id)}
                  >
                    <input
                      id={inputId}
                      type="radio"
                      name="group-target"
                      value={component.id}
                      checked={draft.targetId === component.id}
                      onChange={() => chooseTarget(component.id)}
                      className="size-4 shrink-0 accent-primary-600"
                    />
                    <ComponentTag name={component.name} />
                  </label>
                );
              })}
              <hr aria-hidden className="my-1 border-0 border-t border-slate-200" />
              <label
                htmlFor={`${targetLegendId}-none`}
                className={mergeTargetOptionClass(draft.targetId === '')}
              >
                <input
                  id={`${targetLegendId}-none`}
                  type="radio"
                  name="group-target"
                  value=""
                  checked={draft.targetId === ''}
                  onChange={() => chooseTarget('')}
                  className="size-4 accent-primary-600"
                />
                None, keep all separate
              </label>
            </div>
          </fieldset>

          {target && (
            <fieldset>
              <legend id={mergeLegendId} className="text-sm font-semibold text-slate-800">
                Merge into <ComponentTag name={target.name} />
              </legend>
              <p id={`${mergeLegendId}-hint`} className="mt-1 text-xs text-slate-500">
                Unchecked components stay separate.
              </p>
              <div className="mt-3 flex flex-col gap-2">
                {group.components
                  .filter((component) => component.id !== target.id)
                  .map((component) => {
                    const inputId = `${mergeLegendId}-${component.id}`;
                    return (
                      <div
                        key={component.id}
                        className="flex min-h-11 w-full min-w-0 items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 text-sm text-slate-700"
                      >
                        <label
                          htmlFor={inputId}
                          className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-2"
                        >
                          <input
                            id={inputId}
                            type="checkbox"
                            name={`merge-${component.id}`}
                            checked={draft.mergeIds.includes(component.id)}
                            aria-describedby={`${mergeLegendId}-hint`}
                            onChange={(event) => toggleMerge(component.id, event.target.checked)}
                            className="size-4 shrink-0 accent-primary-600"
                          />
                          <span className="min-w-0 truncate font-medium">
                            <ComponentTag name={component.name} />
                          </span>
                        </label>
                        <Popover
                          label={`Source file for ${componentJsxTag(component.name)}`}
                          isolateFromLabel
                        >
                          <FileLocation file={component.file} line={component.line} />
                        </Popover>
                      </div>
                    );
                  })}
              </div>
            </fieldset>
          )}

          <TextArea
            name="group-note"
            label={draft.targetId ? 'Why merge these components? (optional)' : 'Note (optional)'}
            rows={3}
            value={draft.rationale}
            onChange={(event) => changeDraft({ rationale: event.target.value })}
          />

          {error && (
            <p role="alert" className="mb-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="sticky bottom-0 -mx-5 -mb-5 mt-5 border-t border-slate-200 bg-white px-5 py-4">
            <Button type="submit" variant="primary" className="w-full">
              Save group decision
            </Button>
          </div>
        </form>
      </Sheet>
    </div>
  );
}
