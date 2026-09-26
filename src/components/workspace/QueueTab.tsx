// Queue tab — pending/decided groups and per-pair review

import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '../../store';
import type { CandidateGroup, CandidatePair, Scan } from '../../types';
import { ReviewPanel } from '../review/ReviewPanel';
import {
  Badge,
  Card,
  DecisionTypeBadge,
  Empty,
  RowButton,
  SignalBadge,
  SimilarityScore,
} from '../ui';

const DEFAULT_MIN_SCORE = 50;
const SCORE_OPTIONS = [30, 40, 50, 60, 70];

export { DEFAULT_MIN_SCORE, SCORE_OPTIONS };

interface QueueTabProps {
  scan: Scan;
  pendingGroups: CandidateGroup[];
  decidedGroups: CandidateGroup[];
  minScore: number;
  hiddenPairs: number;
  onMinScoreChange: (score: number) => void;
  selectedPair: { group: CandidateGroup; pair: CandidatePair } | null;
  onSelectPair: (g: CandidateGroup, p: CandidatePair) => void;
  onCloseReview: () => void;
}

export function QueueTab({
  scan,
  pendingGroups,
  decidedGroups,
  minScore,
  hiddenPairs,
  onMinScoreChange,
  selectedPair,
  onSelectPair,
  onCloseReview,
}: QueueTabProps) {
  if (selectedPair) {
    return (
      <ReviewPanel
        scan={scan}
        group={selectedPair.group}
        pair={selectedPair.pair}
        onBack={onCloseReview}
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
          <p className="text-xs text-slate-500 mt-0.5" aria-live="polite">
            {hiddenPairs > 0
              ? `${hiddenPairs} ${hiddenPairs === 1 ? 'pair' : 'pairs'} below ${minScore} hidden`
              : 'All candidate pairs shown'}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 sm:justify-start">
          <label
            htmlFor="queue-min-score"
            className="text-sm font-medium text-slate-600 whitespace-nowrap"
          >
            Minimum score
          </label>
          <select
            id="queue-min-score"
            value={String(minScore)}
            onChange={(event) => onMinScoreChange(Number(event.target.value))}
            className="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:min-h-0 sm:min-w-40 sm:flex-none sm:text-sm"
          >
            {SCORE_OPTIONS.map((score) => (
              <option key={score} value={score}>
                {score === 30
                  ? 'All candidates (30+)'
                  : `${score}+${score === DEFAULT_MIN_SCORE ? ' · default' : ''}`}
              </option>
            ))}
          </select>
        </div>
      </div>
      {pendingGroups.length === 0 && decidedGroups.length === 0 && (
        <Empty
          title={hiddenPairs > 0 ? 'No pairs meet this score' : 'No candidate groups found'}
          description={
            hiddenPairs > 0
              ? 'Lower the minimum score to see more candidates.'
              : 'No similar React components were detected. Try a repository with more components.'
          }
        />
      )}
      {pendingGroups.length > 0 && (
        <section>
          <p className="text-sm text-slate-600 mb-4 max-w-3xl">
            Scores help prioritize review. Open a pair to compare before deciding.
          </p>
          <div className="flex flex-col gap-3">
            {pendingGroups.map((group) => (
              <GroupCard key={group.id} group={group} scan={scan} onSelectPair={onSelectPair} />
            ))}
          </div>
        </section>
      )}
      {decidedGroups.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Reviewed ({decidedGroups.length})
          </h2>
          <div className="flex flex-col gap-3">
            {decidedGroups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                scan={scan}
                onSelectPair={onSelectPair}
                decided
              />
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
  onSelectPair,
  decided,
}: {
  group: CandidateGroup;
  scan: Scan;
  onSelectPair: (g: CandidateGroup, p: CandidatePair) => void;
  decided?: boolean;
}) {
  const pairIds = group.pairs.map((p) => p.id);
  const decisions = useAppStore(
    useShallow((_s) => scan.decisions.filter((d) => pairIds.includes(d.pairId)))
  );

  return (
    <Card className={`min-w-0 p-4 ${decided ? 'opacity-70' : ''}`}>
      <div className="flex flex-col gap-2 mb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-slate-500 mb-0.5">Related components</p>
            <p className="break-words font-medium text-sm text-slate-800">
              {group.components.map((c) => c.name).join(', ')}
            </p>
          </div>
          <SimilarityScore score={group.topScore} className="w-full sm:w-44 shrink-0" />
        </div>
        {group.primarySignals.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500">Matched on:</span>
            {group.primarySignals.map((s) => (
              <SignalBadge key={s} signal={s} />
            ))}
          </div>
        )}
      </div>
      <div className="grid gap-2">
        {group.pairs.map((pair) => {
          const decision = decisions.find((d) => d.pairId === pair.id);
          return (
            <RowButton
              key={pair.id}
              variant="subtle"
              className="min-w-0 flex-wrap sm:flex-nowrap"
              onClick={() => onSelectPair(group, pair)}
            >
              <div className="w-full min-w-0 sm:w-auto sm:flex-1">
                <div className="text-sm font-medium text-slate-800 truncate">
                  {pair.componentA.name} ↔ {pair.componentB.name}
                </div>
                <div className="text-xs text-slate-400 mt-0.5 truncate">{pair.summary}</div>
              </div>
              <SimilarityScore score={pair.totalScore} compact className="w-28 shrink-0" />
              {decision ? (
                <DecisionTypeBadge type={decision.type} />
              ) : (
                <Badge color="blue">Review</Badge>
              )}
            </RowButton>
          );
        })}
      </div>
    </Card>
  );
}
