// Main scan workspace page
import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';
import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { OutputsPanel } from '../components/outputs/OutputsPanel';
import { DetectiveIcon, Empty, LinkButton, Tabs } from '../components/ui';
import { HackathonSlidesModal } from '../components/ui/HackathonSlidesModal';
import { ComponentsTab } from '../components/workspace/ComponentsTab';
import { ErrorsTab } from '../components/workspace/ErrorsTab';
import { DEFAULT_MIN_SCORE, QueueTab, SCORE_OPTIONS } from '../components/workspace/QueueTab';
import {
  visibleGroups as getVisibleGroups,
  hiddenGroupCount,
} from '../components/workspace/visibleGroups';
import { buildBacklog } from '../lib/outputs';
import { useAppStore } from '../store';
import type { CandidateGroup } from '../types';

type TabId = 'queue' | 'components' | 'outputs' | 'errors';
const VALID_TABS: TabId[] = ['queue', 'components', 'outputs', 'errors'];
const workspaceQuery = {
  tab: parseAsStringLiteral(VALID_TABS).withDefault('queue'),
  group: parseAsString,
  pair: parseAsString,
  minScore: parseAsInteger.withDefault(DEFAULT_MIN_SCORE),
};

export function ScanWorkspacePage() {
  const { scanId } = useParams();
  const [query, setQuery] = useQueryStates(workspaceQuery);
  const scan = useAppStore((s) => s.scans.find((sc) => sc.id === scanId));
  const setActiveScan = useAppStore((s) => s.setActiveScan);
  const reviewDirty = React.useRef(false);
  const onDirtyChange = React.useCallback((dirty: boolean) => {
    reviewDirty.current = dirty;
  }, []);

  const tab = query.tab;
  const pairId = query.pair;
  const requestedMinScore = query.minScore;
  const minScore = SCORE_OPTIONS.includes(requestedMinScore)
    ? requestedMinScore
    : DEFAULT_MIN_SCORE;

  const visibleGroups = scan ? getVisibleGroups(scan.groups, minScore) : [];
  const selectedGroup =
    scan?.groups.find((group) => group.id === query.group) ??
    (pairId
      ? scan?.groups.find((group) => group.pairs.some((pair) => pair.id === pairId))
      : undefined) ??
    null;

  React.useEffect(() => {
    if (minScore !== requestedMinScore) {
      void setQuery({ minScore }, { history: 'replace' });
    }
  }, [minScore, requestedMinScore, setQuery]);

  function mayLeaveReview() {
    if (!reviewDirty.current) return true;
    if (!window.confirm('Discard unsaved group decision?')) return false;
    if (scan && selectedGroup) {
      try {
        window.sessionStorage.removeItem(`dd-group-verdict-draft:${scan.id}:${selectedGroup.id}`);
      } catch {
        /* The in-memory draft is discarded on navigation. */
      }
    }
    reviewDirty.current = false;
    return true;
  }

  function setTab(id: TabId) {
    if (selectedGroup && !mayLeaveReview()) return;
    window.scrollTo(0, 0);
    void setQuery({ tab: id, group: null, pair: null }, { history: 'replace' });
  }

  function selectGroup(group: CandidateGroup) {
    window.scrollTo(0, 0);
    void setQuery({ tab: 'queue', group: group.id, pair: null }, { history: 'push' });
  }

  function selectGroupPair(pairId: string) {
    void setQuery({ pair: pairId }, { history: 'replace' });
  }

  function closeReview() {
    if (!mayLeaveReview()) return;
    window.scrollTo(0, 0);
    void setQuery({ group: null, pair: null }, { history: 'push' });
  }

  function setMinScore(value: number) {
    void setQuery({ minScore: value }, { history: 'replace' });
  }

  React.useEffect(() => {
    if (scan) setActiveScan(scan.id);
  }, [scan?.id, setActiveScan, scan]);

  if (!scan) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/90 bg-white px-6 py-8 shadow-sm shadow-slate-900/5 sm:px-8 sm:py-10">
          <Empty
            className="py-6 sm:py-8"
            icon={<DetectiveIcon size={36} />}
            title="Scan not found"
            description="This scan session no longer exists."
          />
          <div className="mt-2 flex justify-center border-t border-slate-100 pt-6">
            <LinkButton to="/" variant="primary" size="md">
              <svg
                className="h-4 w-4 shrink-0 opacity-90"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
                focusable="false"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back home
            </LinkButton>
          </div>
        </div>
      </div>
    );
  }

  const decidedGroupIds = new Set(scan.groupDecisions.map((decision) => decision.groupId));
  const pendingGroups = visibleGroups.filter((group) => !decidedGroupIds.has(group.id));
  const decidedGroups = visibleGroups.filter((group) => decidedGroupIds.has(group.id));
  const hiddenGroups = hiddenGroupCount(scan.groups, minScore);
  const mergeCount = buildBacklog(scan).length;

  const tabs = [
    {
      id: 'queue' as TabId,
      label: 'Review Queue',
      mobileLabel: 'Review',
      count: pendingGroups.length,
    },
    {
      id: 'components' as TabId,
      label: 'All Components',
      mobileLabel: 'Components',
      count: scan.components.length,
    },
    { id: 'outputs' as TabId, label: 'Outputs', count: mergeCount },
    ...(scan.parseErrors.length > 0
      ? [
          {
            id: 'errors' as TabId,
            label: 'Parse Errors',
            mobileLabel: 'Errors',
            count: scan.parseErrors.length,
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="px-4 py-3 sm:px-6 sm:py-4 bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex min-w-0 items-center gap-2 sm:gap-3">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2 rounded-md hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            <DetectiveIcon size={24} />
            <span className="hidden sm:inline font-bold text-slate-900 text-sm">DupeDetective</span>
          </Link>
          <span className="text-slate-300">/</span>
          <span className="min-w-0 flex-1 text-sm text-slate-500 max-w-xs truncate">
            {scan.source.kind === 'github'
              ? `${scan.source.url.replace('https://github.com/', '')} @ ${scan.source.commitSha.slice(0, 7)}`
              : scan.source.filename}
          </span>
          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-4">
            <span className="hidden lg:inline text-xs text-slate-400">
              {scan.components.length} components · {scan.groups.length} candidate groups
            </span>
            <HackathonSlidesModal variant="header" />
            <LinkButton
              to="/"
              variant="primary"
              size="sm"
              className="shrink-0 whitespace-nowrap text-sm sm:text-sm"
            >
              <span className="sm:hidden">New</span>
              <span className="hidden sm:inline">New scan</span>
            </LinkButton>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <Tabs tabs={tabs} active={tab} onChange={(id) => setTab(id as TabId)} />
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full min-w-0 px-4 pt-5 pb-16 sm:px-6 sm:pt-6 sm:pb-20">
        {tab === 'queue' && (
          <QueueTab
            scan={scan}
            pendingGroups={pendingGroups}
            decidedGroups={decidedGroups}
            minScore={minScore}
            hiddenGroups={hiddenGroups}
            onMinScoreChange={setMinScore}
            selectedGroup={selectedGroup}
            selectedPairId={pairId}
            onSelectGroup={selectGroup}
            onSelectPair={selectGroupPair}
            onCloseReview={closeReview}
            onDirtyChange={onDirtyChange}
          />
        )}
        {tab === 'components' && <ComponentsTab scan={scan} />}
        {tab === 'outputs' && <OutputsPanel scan={scan} />}
        {tab === 'errors' && <ErrorsTab scan={scan} />}
      </main>
    </div>
  );
}
