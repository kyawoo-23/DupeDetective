// Main scan workspace page
import React from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { OutputsPanel } from '../components/outputs/OutputsPanel';
import { Button, DetectiveIcon, Empty, Tabs } from '../components/ui';
import { ComponentsTab } from '../components/workspace/ComponentsTab';
import { ErrorsTab } from '../components/workspace/ErrorsTab';
import { filterGroup } from '../components/workspace/filterGroup';
import { DEFAULT_MIN_SCORE, QueueTab, SCORE_OPTIONS } from '../components/workspace/QueueTab';
import { useAppStore } from '../store';
import type { CandidateGroup, CandidatePair } from '../types';

type TabId = 'queue' | 'components' | 'outputs' | 'errors';
const VALID_TABS: TabId[] = ['queue', 'components', 'outputs', 'errors'];

export function ScanWorkspacePage() {
  const { scanId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const scan = useAppStore((s) => s.scans.find((sc) => sc.id === scanId));
  const setActiveScan = useAppStore((s) => s.setActiveScan);

  const rawTab = searchParams.get('tab') as TabId | null;
  const tab: TabId = rawTab && VALID_TABS.includes(rawTab) ? rawTab : 'queue';
  const pairId = searchParams.get('pair');
  const requestedMinScore = Number(searchParams.get('minScore'));
  const minScore = SCORE_OPTIONS.includes(requestedMinScore)
    ? requestedMinScore
    : DEFAULT_MIN_SCORE;

  // Resolve selected pair from URL
  let selectedPair: { group: CandidateGroup; pair: CandidatePair } | null = null;
  if (pairId && scan) {
    for (const group of scan.groups) {
      const pair = group.pairs.find((p) => p.id === pairId);
      if (pair) {
        selectedPair = { group, pair };
        break;
      }
    }
  }

  function setTab(id: TabId) {
    window.scrollTo(0, 0);
    setSearchParams(
      (prev) => {
        prev.set('tab', id);
        prev.delete('pair');
        return prev;
      },
      { replace: true }
    );
  }

  function selectPair(_group: CandidateGroup, pair: CandidatePair) {
    window.scrollTo(0, 0);
    setSearchParams((prev) => {
      prev.set('tab', 'queue');
      prev.set('pair', pair.id);
      return prev;
    });
  }

  function closePair() {
    window.scrollTo(0, 0);
    setSearchParams((prev) => {
      prev.delete('pair');
      return prev;
    });
  }

  function setMinScore(value: number) {
    setSearchParams(
      (prev) => {
        if (value === DEFAULT_MIN_SCORE) prev.delete('minScore');
        else prev.set('minScore', String(value));
        return prev;
      },
      { replace: true }
    );
  }

  React.useEffect(() => {
    if (scan) setActiveScan(scan.id);
  }, [scan?.id, setActiveScan, scan]);

  if (!scan) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Empty title="Scan not found" description="This scan session no longer exists." />
        <Button variant="secondary" size="sm" onClick={() => navigate('/')}>
          Back home
        </Button>
      </div>
    );
  }

  const decidedPairIds = new Set(scan.decisions.map((d) => d.pairId));
  const visibleGroups = scan.groups
    .map((group) => filterGroup(group, minScore))
    .filter((group): group is CandidateGroup => group !== null);
  const pendingGroups = visibleGroups.filter((g) => g.pairs.some((p) => !decidedPairIds.has(p.id)));
  const decidedGroups = visibleGroups.filter((g) => g.pairs.every((p) => decidedPairIds.has(p.id)));
  const hiddenPairs = scan.groups.reduce(
    (count, group) => count + group.pairs.filter((pair) => pair.totalScore < minScore).length,
    0
  );
  const merges = scan.decisions.filter((d) => d.type === 'merge');

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
    { id: 'outputs' as TabId, label: 'Outputs', count: merges.length },
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
            className="flex shrink-0 items-center gap-2 rounded-md hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
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
          <div className="ml-auto flex shrink-0 items-center gap-4">
            <span className="hidden lg:inline text-xs text-slate-400">
              {scan.components.length} components · {scan.groups.length} candidate groups
            </span>
            <Button variant="secondary" size="sm" onClick={() => navigate('/')}>
              <span className="sm:hidden">New</span>
              <span className="hidden sm:inline">New scan</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <Tabs tabs={tabs} active={tab} onChange={(id) => setTab(id as TabId)} />
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full min-w-0 px-4 py-5 sm:px-6 sm:py-6">
        {tab === 'queue' && (
          <QueueTab
            scan={scan}
            pendingGroups={pendingGroups}
            decidedGroups={decidedGroups}
            minScore={minScore}
            hiddenPairs={hiddenPairs}
            onMinScoreChange={setMinScore}
            selectedPair={selectedPair}
            onSelectPair={selectPair}
            onCloseReview={closePair}
          />
        )}
        {tab === 'components' && <ComponentsTab scan={scan} />}
        {tab === 'outputs' && <OutputsPanel scan={scan} />}
        {tab === 'errors' && <ErrorsTab scan={scan} />}
      </main>
    </div>
  );
}
