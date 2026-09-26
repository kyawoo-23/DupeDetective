// Outputs panel: backlog, guidelines, agent instructions
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  buildBacklog,
  renderAgentInstruction,
  renderBacklogMarkdown,
  renderCombinedAgentInstruction,
  renderGuidelinesMarkdown,
} from '../../lib/outputs';
import { useAppStore } from '../../store';
import type { Scan } from '../../types';
import {
  Button,
  Card,
  CopyButton,
  DecisionTypeBadge,
  Empty,
  MigrationStatusBadge,
  Modal,
  Tabs,
  TextArea,
} from '../ui';

type OutputTab = 'backlog' | 'guidelines' | 'instructions';

interface OutputsPanelProps {
  scan: Scan;
}

export function OutputsPanel({ scan }: OutputsPanelProps) {
  const [tab, setTab] = useState<OutputTab>('backlog');
  const merges = scan.decisions.filter((d) => d.type === 'merge');
  const backlogItems = buildBacklog(scan);

  const tabs = [
    { id: 'backlog' as OutputTab, label: 'Backlog', count: backlogItems.length },
    { id: 'guidelines' as OutputTab, label: 'Guidelines' },
    {
      id: 'instructions' as OutputTab,
      label: 'Agent Instructions',
      mobileLabel: 'Instructions',
      count: merges.length,
    },
  ];

  return (
    <div>
      <Tabs tabs={tabs} active={tab} onChange={(id) => setTab(id as OutputTab)} className="mb-6" />

      {tab === 'backlog' && <BacklogTab scan={scan} />}
      {tab === 'guidelines' && <GuidelinesTab scan={scan} />}
      {tab === 'instructions' && <InstructionsTab scan={scan} />}
    </div>
  );
}

// ──────────────────────────────────────────
// Backlog tab
// ──────────────────────────────────────────
function BacklogTab({ scan }: { scan: Scan }) {
  const items = buildBacklog(scan);
  const markdown = renderBacklogMarkdown(scan);
  const { updateDecision } = useAppStore();
  const [completionModal, setCompletionModal] = useState<string | null>(null);
  const [note, setNote] = useState('');

  if (items.length === 0) {
    return (
      <OutputEmpty
        scanId={scan.id}
        title="No backlog items yet"
        description="Choose Merge in the review queue to add items here."
      />
    );
  }

  const handleComplete = (decisionId: string) => {
    updateDecision(decisionId, {
      migrationStatus: 'complete',
      completionNote: note.trim() || undefined,
    });
    setCompletionModal(null);
    setNote('');
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <CopyButton text={markdown} label="Copy Markdown" />
      </div>

      {items.map((item) => {
        const decision = scan.decisions.find((d) => d.id === item.decisionId);
        return (
          <Card key={item.id} className="min-w-0 p-4 sm:p-5">
            <div className="flex flex-col items-start justify-between gap-3 mb-3 sm:flex-row">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <DecisionTypeBadge type={item.type} />
                  <MigrationStatusBadge status={item.status} />
                </div>
                <h3 className="break-words text-sm font-semibold text-slate-900">
                  {item.componentNames.join(' + ')}
                </h3>
              </div>
              {decision?.type === 'merge' && item.status === 'pending' && (
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => {
                    setCompletionModal(item.decisionId);
                    setNote('');
                  }}
                >
                  Mark Complete
                </Button>
              )}
            </div>

            <div className="text-xs text-slate-500 space-y-1 mb-3">
              {item.sourcePaths.map((path, i) => (
                <div key={path} className="break-all font-mono">
                  {item.componentNames[i]} → <span className="text-slate-400">{path}</span>
                </div>
              ))}
            </div>

            {item.canonicalComponent && (
              <p className="break-all text-xs text-blue-700 bg-blue-50 rounded px-2 py-1 mb-2">
                Keep: <code>{item.canonicalComponent}</code>
              </p>
            )}

            <p className="break-words text-sm text-slate-700">{item.rationale}</p>

            {item.completionNote && (
              <p className="text-xs text-emerald-700 mt-2 bg-emerald-50 rounded px-2 py-1">
                Note: {item.completionNote}
              </p>
            )}

            <p className="text-xs text-slate-400 mt-2 italic">{item.suggestedNextStep}</p>
          </Card>
        );
      })}

      {/* Download button */}
      <div className="flex justify-end">
        <Button variant="secondary" size="sm" onClick={() => downloadText(markdown, 'backlog.md')}>
          ↓ Download backlog.md
        </Button>
      </div>

      <Modal
        open={!!completionModal}
        onClose={() => setCompletionModal(null)}
        title="Confirm Complete"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-600">
            Mark this merge as done. The component you kept will appear in the guidelines.
          </p>
          <TextArea
            label="Completion note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="What was verified or changed…"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setCompletionModal(null)}>
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={() => completionModal && handleComplete(completionModal)}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ──────────────────────────────────────────
// Guidelines tab
// ──────────────────────────────────────────
function GuidelinesTab({ scan }: { scan: Scan }) {
  const markdown = renderGuidelinesMarkdown(scan);
  const hasContent = scan.decisions.some(
    (d) => d.type === 'merge' || (d.type === 'keep' && d.rationale.trim())
  );

  if (!hasContent) {
    return (
      <OutputEmpty
        scanId={scan.id}
        title="No guidelines yet"
        description="Finished merges and keep-separate notes appear here. A blank keep-separate decision does not."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap justify-end gap-2">
        <CopyButton text={markdown} label="Copy Markdown" />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => downloadText(markdown, 'component-guidelines.md')}
        >
          ↓ Download component-guidelines.md
        </Button>
      </div>
      <Card className="min-w-0 p-4 sm:p-6">
        <MarkdownPreview content={markdown} />
      </Card>
    </div>
  );
}

// ──────────────────────────────────────────
// Instructions tab
// ──────────────────────────────────────────
function InstructionsTab({ scan }: { scan: Scan }) {
  const merges = scan.decisions.filter((d) => d.type === 'merge');
  const [selected, setSelected] = useState<Set<string>>(new Set(merges.map((d) => d.id)));

  if (merges.length === 0) {
    return (
      <OutputEmpty
        scanId={scan.id}
        title="No merge decisions yet"
        description="Choose Merge in the review queue to generate agent instructions."
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
              onClick={() => setSelected(new Set(merges.map((d) => d.id)))}
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
          {merges.map((d) => {
            const components = d.componentIds
              .map((id) => scan.components.find((c) => c.id === id))
              .filter(Boolean);
            return (
              <label
                key={d.id}
                className="flex min-h-11 min-w-0 flex-wrap items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.has(d.id)}
                  onChange={(e) => {
                    const next = new Set(selected);
                    e.target.checked ? next.add(d.id) : next.delete(d.id);
                    setSelected(next);
                  }}
                  className="h-4 w-4 rounded accent-blue-600"
                />
                <span className="min-w-0 break-words text-sm text-slate-700">
                  {components.map((c) => c?.name).join(' + ')}
                </span>
                <MigrationStatusBadge status={d.migrationStatus} />
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
          <Card className="min-w-0 p-4">
            <pre className="max-h-[400px] min-w-0 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-5 text-slate-700">
              {combined}
            </pre>
          </Card>
        </div>
      )}

      {/* Individual instructions */}
      <h3 className="text-sm font-semibold text-slate-700 mt-2">Individual instructions</h3>
      {merges.map((d) => {
        const instruction = renderAgentInstruction(scan, d.id);
        const components = d.componentIds
          .map((id) => scan.components.find((c) => c.id === id))
          .filter(Boolean);
        return (
          <Card key={d.id} className="min-w-0 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <span className="min-w-0 break-words text-sm font-medium text-slate-800">
                {components.map((c) => c?.name).join(' + ')}
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
        className="-mt-9 inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        Go to review queue →
      </Link>
    </div>
  );
}

function MarkdownPreview({ content }: { content: string }) {
  // Escape decision notes before adding the small set of supported Markdown tags.
  const html = content
    .replace(
      /[&<>"']/g,
      (character) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ??
        character
    )
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-semibold mt-4 mb-1 text-slate-800">$1</h3>')
    .replace(
      /^## (.+)$/gm,
      '<h2 class="text-base font-semibold mt-6 mb-2 text-slate-900 border-b border-slate-200 pb-1">$1</h2>'
    )
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mb-4 text-slate-900">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(
      /`([^`]+)`/g,
      '<code class="bg-slate-100 text-slate-800 rounded px-1 font-mono text-xs">$1</code>'
    )
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-sm text-slate-700">$1</li>')
    .replace(
      /^&gt; (.+)$/gm,
      '<blockquote class="border-l-4 border-slate-300 pl-3 text-slate-500 text-sm italic">$1</blockquote>'
    )
    .replace(/^---$/gm, '<hr class="border-slate-200 my-4"/>')
    .replace(/\n\n/g, '<br/><br/>');

  return (
    <div
      className="prose prose-sm max-w-none min-w-0 break-words text-slate-700 [&_code]:break-all"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: user text is HTML-escaped before Markdown tags are added
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function downloadText(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
