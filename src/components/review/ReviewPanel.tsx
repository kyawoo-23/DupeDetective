// Review panel: side-by-side comparison, decision form, mock props, preview
import React, { useState } from 'react';
import { generateMockProps } from '../../lib/mockProps';
import { makeDecisionId, useAppStore } from '../../store';
import type { CandidateGroup, CandidatePair, DecisionType, Scan } from '../../types';
import { ComponentPreview } from '../preview/ComponentPreview';
import {
  Badge,
  Button,
  Card,
  CodeBlock,
  CopyButton,
  DecisionTypeBadge,
  MigrationStatusBadge,
  Modal,
  ScoreBar,
  SegmentedControl,
  Select,
  Sheet,
  SignalBadge,
  SimilarityScore,
  signalMaxScore,
  TextArea,
} from '../ui';

interface ReviewPanelProps {
  scan: Scan;
  group: CandidateGroup;
  pair: CandidatePair;
  onBack: () => void;
}

export function ReviewPanel({ scan, group: _group, pair, onBack }: ReviewPanelProps) {
  const { addDecision, updateDecision, getDecision } = useAppStore();
  const existing = getDecision(pair.id);

  const [decisionType, setDecisionType] = useState<DecisionType>(existing?.type ?? 'merge');
  const [rationale, setRationale] = useState(existing?.rationale ?? '');
  const [canonicalId, setCanonicalId] = useState(
    existing?.canonicalComponentId ?? pair.componentA.id
  );
  const [completionNote, setCompletionNote] = useState(existing?.completionNote ?? '');
  const [showCompletion, setShowCompletion] = useState(false);
  const [view, setView] = useState<'compare' | 'codeA' | 'codeB'>('compare');
  const [rationaleError, setRationaleError] = useState('');
  const [saved, setSaved] = useState(!!existing);
  const [sheetOpen, setSheetOpen] = useState(false);

  const componentOptions = [pair.componentA, pair.componentB].map((c) => ({
    value: c.id,
    label: `${c.name} (${c.file})`,
  }));

  const requiresRationale = decisionType === 'merge';

  const handleSave = () => {
    if (requiresRationale && !rationale.trim()) {
      setRationaleError('Add a note before saving a merge.');
      return;
    }
    setRationaleError('');

    const decisionData = {
      scanId: scan.id,
      pairId: pair.id,
      componentIds: [pair.componentA.id, pair.componentB.id],
      type: decisionType,
      rationale: rationale.trim(),
      canonicalComponentId: decisionType === 'merge' ? canonicalId : undefined,
      migrationStatus:
        decisionType === 'merge'
          ? existing?.type === 'merge' && existing.migrationStatus
            ? existing.migrationStatus
            : 'pending'
          : undefined,
      reviewedAt: new Date().toISOString(),
    };

    if (existing) {
      updateDecision(existing.id, decisionData);
    } else {
      addDecision({ id: makeDecisionId(), ...decisionData });
    }
    setSaved(true);
  };

  const handleMarkComplete = () => {
    if (!existing) return;
    updateDecision(existing.id, {
      migrationStatus: 'complete',
      completionNote: completionNote.trim() || undefined,
    });
    setShowCompletion(false);
  };

  const currentDecision = getDecision(pair.id);
  const renderDecisionButton = (className = '') => (
    <Button variant="primary" onClick={() => setSheetOpen(true)} className={className}>
      <span>{currentDecision ? 'Edit decision' : 'Record decision'}</span>
      {currentDecision && (
        <>
          <span className="h-4 w-px shrink-0 bg-white/25" aria-hidden />
          <DecisionTypeBadge type={currentDecision.type} tone="onPrimary" />
        </>
      )}
      {!currentDecision && !saved && (
        <span
          className="h-2 w-2 shrink-0 rounded-full bg-amber-300 ring-2 ring-amber-300/30"
          title="Unsaved"
        />
      )}
    </Button>
  );

  return (
    <div className="flex min-w-0 flex-col gap-5 pb-28 sm:gap-6 sm:pb-0">
      {/* Breadcrumb */}
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Button variant="link" onClick={onBack} className="gap-1">
          ← Back to queue
        </Button>
        <span className="text-slate-300">/</span>
        <span className="min-w-0 break-words text-sm text-slate-600 font-medium">
          {pair.componentA.name} ↔ {pair.componentB.name}
        </span>
        {currentDecision && <DecisionTypeBadge type={currentDecision.type} />}
        <div className="hidden sm:ml-auto sm:block">{renderDecisionButton()}</div>
      </div>

      {/* Match evidence */}
      <Card className="min-w-0 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
          <h3 className="text-sm font-semibold text-slate-700">Why these look similar</h3>
          <SimilarityScore score={pair.totalScore} className="w-40" />
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Each row is one check on the source code. Points add up to the similarity score above.
        </p>
        <div className="divide-y divide-slate-100">
          {pair.signals.map((sig) => (
            <div
              key={sig.signal}
              className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 py-2 text-sm sm:grid-cols-[auto_minmax(0,1fr)_7rem]"
            >
              <div className="min-w-0">
                <SignalBadge signal={sig.signal} />
              </div>
              <span className="col-span-2 row-start-2 min-w-0 break-words text-slate-600 sm:col-span-1 sm:row-start-auto">
                {sig.label}
              </span>
              <ScoreBar
                score={sig.score}
                max={signalMaxScore(sig.signal)}
                showMax
                className="col-start-2 row-start-1 w-24 shrink-0 sm:col-start-3 sm:row-start-auto sm:w-28"
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Comparison — full width; decision lives in sheet */}
      <div className="flex flex-col gap-4 min-w-0">
        <SegmentedControl
          size="sm"
          value={view}
          onChange={setView}
          options={[
            { value: 'compare', label: 'Side by Side' },
            { value: 'codeA', label: pair.componentA.name },
            { value: 'codeB', label: pair.componentB.name },
          ]}
        />

        {view === 'compare' && (
          <div className="comparison-grid grid grid-cols-1 gap-4 md:grid-cols-2">
            <ComponentPane component={pair.componentA} />
            <ComponentPane component={pair.componentB} />
          </div>
        )}
        {view === 'codeA' && <FullCodePane component={pair.componentA} />}
        {view === 'codeB' && <FullCodePane component={pair.componentB} />}
      </div>
      <div className="hidden justify-end sm:flex">{renderDecisionButton()}</div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_-18px_rgba(15,23,42,0.35)] backdrop-blur sm:hidden">
        {renderDecisionButton('w-full shadow-sm')}
      </div>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Record decision">
        <div className="flex flex-col gap-4">
          <Select
            label="Relationship"
            value={decisionType}
            onChange={(e) => {
              setDecisionType(e.target.value as DecisionType);
              setSaved(false);
            }}
            options={[
              { value: 'merge', label: 'Merge' },
              { value: 'keep', label: 'Keep separate' },
            ]}
          />

          <DecisionDescription type={decisionType} />

          {decisionType === 'merge' && (
            <Select
              label="Component to keep"
              value={canonicalId}
              onChange={(e) => {
                setCanonicalId(e.target.value);
                setSaved(false);
              }}
              options={componentOptions}
            />
          )}

          <TextArea
            label={`Note${requiresRationale ? '' : ' (optional)'}`}
            value={rationale}
            onChange={(e) => {
              setRationale(e.target.value);
              setSaved(false);
              setRationaleError('');
            }}
            rows={4}
            placeholder={
              decisionType === 'merge'
                ? 'Why these should become one component…'
                : 'Why they stay separate, or leave blank to dismiss…'
            }
            error={rationaleError}
          />

          <Button onClick={handleSave} variant={saved ? 'successSoft' : 'primary'}>
            {saved ? (
              <>
                <span
                  className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-700"
                  aria-hidden
                >
                  ✓
                </span>
                Saved
              </>
            ) : (
              'Save decision'
            )}
          </Button>

          {currentDecision?.type === 'merge' && (
            <div className="pt-4 border-t border-slate-200 flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-slate-700">Migration status</h3>
              <MigrationStatusBadge status={currentDecision.migrationStatus} />
              {currentDecision.migrationStatus === 'pending' && (
                <Button variant="success" size="sm" onClick={() => setShowCompletion(true)}>
                  Mark complete
                </Button>
              )}
              {currentDecision.migrationStatus === 'complete' && (
                <p className="text-xs text-emerald-700 bg-emerald-50 rounded p-2">
                  ✓ Migration confirmed
                  {currentDecision.completionNote && `: ${currentDecision.completionNote}`}
                </p>
              )}
            </div>
          )}
        </div>
      </Sheet>

      {/* Completion modal */}
      <Modal
        open={showCompletion}
        onClose={() => setShowCompletion(false)}
        title="Confirm Migration Complete"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-600">
            Confirming this marks the merge as done. The component you kept will show up in the
            guidelines.
          </p>
          <TextArea
            label="Completion note (optional)"
            value={completionNote}
            onChange={(e) => setCompletionNote(e.target.value)}
            rows={2}
            placeholder="What changed or was verified…"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowCompletion(false)}>
              Cancel
            </Button>
            <Button variant="success" onClick={handleMarkComplete}>
              Confirm Complete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ──────────────────────────────────────────
// Component pane: preview + props summary
// ──────────────────────────────────────────
function ComponentPane({ component }: { component: import('../../types').ReactComponent }) {
  const controls = React.useMemo(() => generateMockProps(component), [component.id, component]);
  const [localControls, setLocalControls] = React.useState(controls);

  return (
    <Card className="comparison-pane flex min-w-0 flex-col overflow-hidden">
      <div className="flex min-w-0 flex-col">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="min-w-0 break-all font-semibold text-sm text-slate-900">
              {component.name}
            </span>
            <Badge color="slate">{component.kind}</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 break-all">
            {component.file}:{component.line}
          </p>
        </div>

        {/* Preview */}
        <div className="border-b border-slate-200">
          <ComponentPreview component={component} controls={localControls} />
        </div>

        {/* Props */}
        {component.propNames.length > 0 && (
          <div className="px-4 py-3">
            <PropControls
              component={component}
              controls={localControls}
              onChange={(key, val) =>
                setLocalControls((prev) => ({
                  ...prev,
                  [key]: { ...prev[key], value: val } as (typeof prev)[typeof key],
                }))
              }
            />
          </div>
        )}
      </div>

      {/* Source snippet */}
      <div className="border-t border-slate-100 px-4 py-3">
        <p className="mb-2 break-all text-xs font-semibold text-slate-600">
          {component.name} source
        </p>
        <CodeBlock code={component.source} maxLines={15} />
      </div>
    </Card>
  );
}

function FullCodePane({ component }: { component: import('../../types').ReactComponent }) {
  return (
    <Card className="min-w-0 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <span className="break-all font-semibold text-sm text-slate-900">{component.name}</span>
          <span className="block break-all text-xs text-slate-500 sm:ml-2 sm:inline">
            {component.file}:{component.line}
          </span>
        </div>
        <CopyButton text={component.source} label="Copy source" />
      </div>
      <CodeBlock code={component.source} showLineNumbers />
    </Card>
  );
}

// ──────────────────────────────────────────
// Prop controls
// ──────────────────────────────────────────
import type { PropControls as PropControlsType } from '../../lib/mockProps';

function PropControls({
  component,
  controls,
  onChange,
}: {
  component: import('../../types').ReactComponent;
  controls: PropControlsType;
  onChange: (key: string, val: string | number | boolean) => void;
}) {
  const idPrefix = React.useId();
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Preview props</p>
      {Object.entries(controls).map(([key, ctrl]) => {
        const controlId = `${idPrefix}-${component.id}-${key}`;
        if (ctrl.type === 'callback') {
          return (
            <div key={key} className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="min-w-0 break-all text-xs font-medium text-slate-600">{key}</span>
              <span className="text-xs text-slate-500 italic">callback (stubbed)</span>
            </div>
          );
        }
        return (
          <div
            key={key}
            className="grid min-w-0 gap-1 sm:grid-cols-[minmax(6rem,8rem)_minmax(0,1fr)] sm:items-center sm:gap-3"
          >
            <label
              htmlFor={controlId}
              className="min-w-0 break-all text-xs font-medium text-slate-600"
            >
              {key}
            </label>
            {ctrl.type === 'boolean' ? (
              <input
                id={controlId}
                type="checkbox"
                checked={ctrl.value}
                onChange={(e) => onChange(key, e.target.checked)}
                className="h-5 w-5 rounded accent-blue-600"
              />
            ) : ctrl.type === 'number' ? (
              <input
                id={controlId}
                type="number"
                value={ctrl.value}
                onChange={(e) => onChange(key, parseFloat(e.target.value) || 0)}
                className="min-h-11 w-full min-w-0 rounded-md border border-slate-300 px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:min-h-0 sm:text-sm"
              />
            ) : ctrl.type === 'select' ? (
              <select
                id={controlId}
                value={ctrl.value}
                onChange={(e) => onChange(key, e.target.value)}
                className="min-h-11 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:min-h-0 sm:text-sm"
              >
                {ctrl.options.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            ) : ctrl.type === 'json' ? (
              <input
                id={controlId}
                type="text"
                value={ctrl.value}
                onChange={(e) => onChange(key, e.target.value)}
                className="min-h-11 w-full min-w-0 rounded-md border border-slate-300 px-3 py-2 font-mono text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:min-h-0 sm:text-sm"
              />
            ) : (
              <input
                id={controlId}
                type="text"
                value={ctrl.value}
                onChange={(e) => onChange(key, e.target.value)}
                className="min-h-11 w-full min-w-0 rounded-md border border-slate-300 px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:min-h-0 sm:text-sm"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────
// Decision description
// ──────────────────────────────────────────
const descriptions: Record<DecisionType, string> = {
  merge: 'Pick one component to use going forward.',
  keep: 'They stay separate. Add a short note if helpful, or leave blank to dismiss this match.',
};
function DecisionDescription({ type }: { type: DecisionType }) {
  return <p className="text-xs text-slate-400">{descriptions[type]}</p>;
}
