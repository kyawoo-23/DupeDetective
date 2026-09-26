// Queue tab — one verdict per candidate group. Pairs stay inside the group review.

import { decisionOutcome, decisionSummary } from '../../lib/decisions';
import { evidenceHighlights, GROUP_THRESHOLD, STRONG_GROUP_SCORE } from '../../lib/scorer';
import type { CandidateGroup, Scan } from '../../types';
import { GroupReviewPanel } from '../review/GroupReviewPanel';
import { Card, ComponentTagList, DecisionTypeBadge, Empty, GroupSimilaritySummary } from '../ui';

const DEFAULT_MIN_SCORE = GROUP_THRESHOLD;
const SCORE_OPTIONS = [GROUP_THRESHOLD, STRONG_GROUP_SCORE, 50];

export { DEFAULT_MIN_SCORE, SCORE_OPTIONS };

interface QueueTabProps {
  scan: Scan;
  pendingGroups: CandidateGroup[];
  decidedGroups: CandidateGroup[];
  minScore: number;
  hiddenGroups: number;
  onMinScoreChange: (score: number) => void;
  selectedGroup: CandidateGroup | null;
  selectedPairId: string | null;
  onSelectGroup: (group: CandidateGroup) => void;
  onSelectPair: (pairId: string) => void;
  onCloseReview: () => void;
  onDirtyChange: (dirty: boolean) => void;
}

export function QueueTab({
  scan,
  pendingGroups,
  decidedGroups,
  minScore,
  hiddenGroups,
  onMinScoreChange,
  selectedGroup,
  selectedPairId,
  onSelectGroup,
  onSelectPair,
  onCloseReview,
  onDirtyChange,
}: QueueTabProps) {
  if (selectedGroup) {
    return (
      <GroupReviewPanel
        key={`${scan.id}:${selectedGroup.id}`}
        scan={scan}
        group={selectedGroup}
        selectedPairId={selectedPairId}
        onSelectPair={(pair) => onSelectPair(pair.id)}
        onBack={onCloseReview}
        onDirtyChange={onDirtyChange}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-stretch justify-between gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-900">
            Pending review <span className="text-slate-500">({pendingGroups.length})</span>
          </h2>
          <p className="mt-0.5 text-xs text-slate-500" aria-live="polite">
            {hiddenGroups > 0
              ? `${hiddenGroups} ${hiddenGroups === 1 ? 'group is' : 'groups are'} hidden below ${minScore}.`
              : `Showing groups scored ${minScore} or higher.`}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 sm:justify-start">
          <label
            htmlFor="queue-min-score"
            className="whitespace-nowrap text-sm font-medium text-slate-600"
          >
            Minimum score
          </label>
          <select
            id="queue-min-score"
            value={String(minScore)}
            onChange={(event) => onMinScoreChange(Number(event.target.value))}
            className="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 sm:min-h-0 sm:min-w-40 sm:flex-none sm:text-sm"
          >
            {SCORE_OPTIONS.map((score) => (
              <option key={score} value={score}>
                {score === GROUP_THRESHOLD
                  ? `All groups (${GROUP_THRESHOLD}+)`
                  : score === STRONG_GROUP_SCORE
                    ? `Strong (${STRONG_GROUP_SCORE}+)`
                    : `${score}+`}
              </option>
            ))}
          </select>
        </div>
      </div>
      {pendingGroups.length === 0 && decidedGroups.length === 0 && (
        <Empty
          title={hiddenGroups > 0 ? 'No groups meet this score' : 'No candidate groups found'}
          description={
            hiddenGroups > 0
              ? 'Lower the minimum score to see more groups.'
              : 'No similar React components were detected. Try a repository with more components.'
          }
        />
      )}
      {pendingGroups.length > 0 && (
        <section>
          <p className="mb-4 max-w-3xl text-sm text-slate-600">
            Each row is one group. Open it to compare the members, then decide which component to
            keep and which ones fold into it.
          </p>
          <div className="flex flex-col gap-3">
            {pendingGroups.map((group) => (
              <GroupCard key={group.id} group={group} scan={scan} onSelectGroup={onSelectGroup} />
            ))}
          </div>
        </section>
      )}
      {decidedGroups.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Reviewed ({decidedGroups.length})
          </h2>
          <div className="flex flex-col gap-3">
            {decidedGroups.map((group) => (
              <GroupCard key={group.id} group={group} scan={scan} onSelectGroup={onSelectGroup} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function GroupCard({
  group,
  scan,
  onSelectGroup,
}: {
  group: CandidateGroup;
  scan: Scan;
  onSelectGroup: (group: CandidateGroup) => void;
}) {
  const decision = scan.groupDecisions.find((item) => item.groupId === group.id);
  const highlights = evidenceHighlights(group);

  return (
    <Card className="queue-card min-w-0">
      <button type="button" className="queue-row" onClick={() => onSelectGroup(group)}>
        <span className="queue-row-copy">
          <span className="queue-row-title">
            <ComponentTagList names={group.components.map((component) => component.name)} />
            {decision && (
              <DecisionTypeBadge
                outcome={decisionOutcome(decision)}
                className="ml-2 align-middle"
              />
            )}
          </span>
          <span className="queue-row-meta">
            {group.components.length} components
            {decision ? ` · ${decisionSummary(decision, group.components)}` : ''}
          </span>
          {highlights.length > 0 && (
            <span className="queue-row-evidence">{highlights.join(' · ')}</span>
          )}
        </span>
        <GroupSimilaritySummary
          score={group.score}
          confidence={group.confidence}
          className="w-36 shrink-0 sm:w-44"
        />
        <span className="queue-review-action">
          {decision ? 'View group' : 'Review group'} <span aria-hidden="true">→</span>
        </span>
      </button>
    </Card>
  );
}
