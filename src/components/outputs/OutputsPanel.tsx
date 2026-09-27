// Outputs panel: backlog and agent instructions
import { type ReactNode, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import {
  buildBacklog,
  renderAgentInstruction,
  renderCombinedAgentInstruction,
} from '../../lib/outputs';
import { useAppStore } from '../../store';
import type { BacklogItem, Scan } from '../../types';
import {
  AgentInstructionIcon,
  BacklogIcon,
  Button,
  Card,
  ComponentTag,
  ComponentTagList,
  CopyButton,
  DecisionTypeBadge,
  Empty,
  FileLocation,
  MarkdownPreview,
  MergeComponentTitle,
  MigrationStatusBadge,
  Modal,
  mergeComponentsTitle,
  SegmentedControl,
  Tabs,
} from '../ui';

type OutputTab = 'backlog' | 'instructions';

interface OutputsPanelProps {
  scan: Scan;
}

export function OutputsPanel({ scan }: OutputsPanelProps) {
  const [tab, setTab] = useState<OutputTab>('backlog');
  const backlogItems = buildBacklog(scan);
  const pendingInstructionCount = backlogItems.filter((item) => item.status === 'pending').length;

  const tabs = [
    {
      id: 'backlog' as OutputTab,
      label: 'Backlog',
      icon: <BacklogIcon />,
      count: backlogItems.length,
    },
    {
      id: 'instructions' as OutputTab,
      label: 'Agent Instructions',
      mobileLabel: 'Instructions',
      icon: <AgentInstructionIcon />,
      count: pendingInstructionCount,
    },
  ];

  return (
    <div>
      <Tabs tabs={tabs} active={tab} onChange={(id) => setTab(id as OutputTab)} className="mb-6" />

      {tab === 'backlog' && <BacklogTab scan={scan} />}
      {tab === 'instructions' && <InstructionsTab scan={scan} />}
    </div>
  );
}

// ──────────────────────────────────────────
// Backlog tab
// ──────────────────────────────────────────
function BacklogTab({ scan }: { scan: Scan }) {
  const items = buildBacklog(scan);
  const updateGroupDecision = useAppStore((state) => state.updateGroupDecision);
  const [completionModal, setCompletionModal] = useState<string | null>(null);
  const keepSeparateCount = scan.groupDecisions.length - items.length;

  const explanation = (
    <p className="max-w-3xl text-sm text-slate-600">
      Backlog tracks merge work only. Keep separate decisions
      {keepSeparateCount > 0 && ` (${keepSeparateCount} in this scan)`} stay under Reviewed in the
      Review Queue.
    </p>
  );

  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        {explanation}
        <OutputEmpty
          scanId={scan.id}
          title="No backlog items yet"
          description="Merge at least one component in a group to add items here."
        />
      </div>
    );
  }

  const pendingItems = items.filter((item) => item.status === 'pending');
  const completeItems = items.filter((item) => item.status === 'complete');

  const handleComplete = (item: BacklogItem) => {
    updateGroupDecision(item.decisionId, { migrationStatus: 'complete' });
    setCompletionModal(null);
    toast.success(`Marked complete: ${backlogItemTitle(item)}`);
  };

  const handleMarkPending = (item: BacklogItem) => {
    updateGroupDecision(item.decisionId, { migrationStatus: 'pending' });
    toast.success(`Back to pending: ${backlogItemTitle(item)}`);
  };

  const sectionHeading = 'mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500';

  return (
    <div className="flex flex-col gap-6">
      {explanation}

      {pendingItems.length > 0 && (
        <section>
          <h2 className={sectionHeading}>Pending ({pendingItems.length})</h2>
          <div className="flex flex-col gap-3">
            {pendingItems.map((item) => (
              <BacklogItemCard
                key={item.id}
                item={item}
                action={
                  <Button
                    variant="successSoft"
                    size="sm"
                    className="shrink-0 self-start"
                    onClick={() => setCompletionModal(item.decisionId)}
                  >
                    Mark Complete
                  </Button>
                }
              />
            ))}
          </div>
        </section>
      )}

      {completeItems.length > 0 && (
        <section>
          <h2 className={sectionHeading}>Complete ({completeItems.length})</h2>
          <div className="flex flex-col gap-3">
            {completeItems.map((item) => (
              <BacklogItemCard
                key={item.id}
                item={item}
                action={
                  <Button
                    variant="secondary"
                    size="sm"
                    className="shrink-0 self-start"
                    onClick={() => handleMarkPending(item)}
                  >
                    Set Back to Pending
                  </Button>
                }
              />
            ))}
          </div>
        </section>
      )}

      <Modal
        open={!!completionModal}
        onClose={() => setCompletionModal(null)}
        title="Confirm Complete"
        width="max-w-sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCompletionModal(null)}>
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={() => {
                const item = items.find((entry) => entry.decisionId === completionModal);
                if (item) handleComplete(item);
              }}
            >
              Confirm Complete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Mark this merge as done. It will show as complete in your backlog.
        </p>
      </Modal>
    </div>
  );
}

function backlogItemTitle(item: BacklogItem): string {
  return mergeComponentsTitle(item.componentNames, item.canonicalComponent ?? 'unknown');
}

function BacklogItemCard({ item, action }: { item: BacklogItem; action: ReactNode }) {
  return (
    <Card className="queue-card min-w-0">
      <div className="flex min-w-0 flex-col gap-3 p-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="break-words text-sm font-semibold text-slate-900">
            <MergeComponentTitle
              sources={item.componentNames}
              target={item.canonicalComponent ?? 'unknown'}
            />
            <DecisionTypeBadge outcome={item.outcome} className="ml-2 align-middle" />
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span>{item.componentNames.length} to replace</span>
            <MigrationStatusBadge status={item.status} />
          </div>
          <div className="mt-3 flex flex-col gap-1.5">
            {item.componentNames.map((name, idx) => (
              <div
                key={`${name}:${item.sourcePaths[idx]}`}
                className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 text-xs text-slate-600"
              >
                <ComponentTag name={name} className="font-medium text-slate-700" />
                <FileLocation file={item.sourcePaths[idx]} />
              </div>
            ))}
          </div>
          {item.unchangedNames.length > 0 && (
            <p className="mt-2 break-words text-xs text-slate-500">
              Leave unchanged: <ComponentTagList names={item.unchangedNames} />
            </p>
          )}
          {item.rationale && (
            <p className="mt-2 break-words text-xs text-slate-600">
              <span className="font-medium text-slate-700">Note:</span> {item.rationale}
            </p>
          )}
        </div>
        {action}
      </div>
    </Card>
  );
}

// ──────────────────────────────────────────
// Instructions tab
// ──────────────────────────────────────────
function InstructionsTab({ scan }: { scan: Scan }) {
  const allMerges = buildBacklog(scan);
  const mergeGroups = allMerges.filter((item) => item.status === 'pending');
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(mergeGroups.map((item) => item.decisionId))
  );

  if (allMerges.length === 0) {
    return (
      <OutputEmpty
        scanId={scan.id}
        title="No merge decisions yet"
        description="Merge at least one component in a group to generate agent instructions."
      />
    );
  }

  if (mergeGroups.length === 0) {
    return (
      <Empty
        title="No pending merge instructions"
        description="Completed merges stay on the Backlog tab. Mark one pending again to copy agent instructions."
      />
    );
  }

  const combined = renderCombinedAgentInstruction(scan, [...selected]);

  return (
    <div className="flex flex-col gap-4">
      {/* Selection controls */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700">Select merges</h3>
          <div className="flex gap-2">
            <Button
              variant="link"
              size="sm"
              className="text-xs"
              onClick={() => setSelected(new Set(mergeGroups.map((item) => item.decisionId)))}
            >
              All
            </Button>
            <Button
              variant="linkMuted"
              size="sm"
              className="text-xs"
              onClick={() => setSelected(new Set())}
            >
              None
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {mergeGroups.map((item) => {
            return (
              <label
                key={item.id}
                className="flex min-h-11 min-w-0 flex-wrap items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.has(item.decisionId)}
                  onChange={(e) => {
                    const next = new Set(selected);
                    e.target.checked ? next.add(item.decisionId) : next.delete(item.decisionId);
                    setSelected(next);
                  }}
                  className="h-4 w-4 rounded accent-primary-600"
                />
                <span className="min-w-0 break-words text-sm text-slate-700">
                  <ComponentTagList names={item.componentNames} separator=" + " />
                </span>
              </label>
            );
          })}
        </div>
      </Card>

      {/* Combined instruction */}
      {selected.size > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-700">
              Combined instruction ({selected.size} merge{selected.size !== 1 ? 's' : ''})
            </h3>
            <CopyButton text={combined} label="Copy instruction" />
          </div>
          <InstructionMarkdownPanel markdown={combined} />
        </div>
      )}

      {/* Individual instructions */}
      <h3 className="text-sm font-semibold text-slate-700 mt-2">Individual instructions</h3>
      {mergeGroups.map((item) => {
        const instruction = renderAgentInstruction(scan, item.decisionId);
        return (
          <Card key={item.id} className="min-w-0 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <span className="min-w-0 break-words text-sm font-medium text-slate-800">
                <ComponentTagList names={item.componentNames} separator=" + " />
              </span>
              <CopyButton text={instruction} label="Copy" />
            </div>
            <pre className="max-h-[200px] min-w-0 overflow-auto whitespace-pre-wrap break-words rounded bg-slate-50 p-3 font-mono text-xs leading-5 text-slate-600">
              {instruction}
            </pre>
          </Card>
        );
      })}
    </div>
  );
}

type InstructionView = 'preview' | 'raw';

function InstructionMarkdownPanel({ markdown }: { markdown: string }) {
  const [view, setView] = useState<InstructionView>('preview');

  return (
    <Card className="min-w-0 overflow-hidden p-0">
      <div className="border-b border-slate-200 px-4 py-3">
        <SegmentedControl
          size="sm"
          options={[
            { value: 'preview', label: 'Preview' },
            { value: 'raw', label: 'Raw MD' },
          ]}
          value={view}
          onChange={setView}
        />
      </div>
      <div className="p-4">
        {view === 'preview' ? (
          <MarkdownPreview source={markdown} className="max-h-[400px] overflow-auto" />
        ) : (
          <pre className="max-h-[400px] min-w-0 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-5 text-slate-700">
            {markdown}
          </pre>
        )}
      </div>
    </Card>
  );
}

// ──────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────
function OutputEmpty({
  scanId,
  title,
  description,
}: {
  scanId: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <Empty title={title} description={description} />
      <Link
        to={`/scan/${scanId}?tab=queue`}
        className="-mt-9 inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        Go to review queue →
      </Link>
    </div>
  );
}
