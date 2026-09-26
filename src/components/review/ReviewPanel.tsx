// Pair evidence with previews and source for every component in the group.
import React, { useState } from 'react';
import { componentJsxTag } from '../../lib/componentDisplay';
import { generateMockProps } from '../../lib/mockProps';
import type { CandidatePair, ReactComponent } from '../../types';
import { ComponentPreview } from '../preview/ComponentPreview';
import {
  Badge,
  Card,
  CodeBlock,
  ComponentTag,
  CopyButton,
  FileLocation,
  ScoreBar,
  SegmentedControl,
  SignalBadge,
  SimilarityScore,
  signalMaxScore,
} from '../ui';

export function findGroupPair(
  pairs: CandidatePair[],
  leftId: string,
  rightId: string
): CandidatePair | undefined {
  return pairs.find(
    (pair) =>
      (pair.componentA.id === leftId && pair.componentB.id === rightId) ||
      (pair.componentA.id === rightId && pair.componentB.id === leftId)
  );
}

/** Stable key for a matrix cell; matches both (A,B) and (B,A). */
export function pairCellKey(leftId: string, rightId: string): string {
  return [leftId, rightId].sort().join('|');
}

export function GroupEvidenceMatrix({
  components,
  pairs,
  selectedPairId,
  onSelectPair,
}: {
  components: ReactComponent[];
  pairs: CandidatePair[];
  selectedPairId: string | null;
  onSelectPair: (pair: CandidatePair) => void;
}) {
  const [hoveredCellKey, setHoveredCellKey] = useState<string | null>(null);

  const clearHoverUnlessMovingToSamePair = (
    event: React.PointerEvent<HTMLElement>,
    cellKey: string
  ) => {
    const next = event.relatedTarget;
    if (next instanceof Element) {
      const nextKey = next.closest('[data-pair-cell-key]')?.getAttribute('data-pair-cell-key');
      if (nextKey === cellKey) return;
    }
    setHoveredCellKey(null);
  };

  return (
    <div
      className="overflow-x-auto"
      onPointerLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setHoveredCellKey(null);
        }
      }}
    >
      <table className="w-full min-w-[28rem] table-fixed border-separate border-spacing-1 text-sm">
        <caption className="sr-only">Similarity score for each pair in this group</caption>
        <colgroup>
          <col key="pair-matrix-corner" style={{ width: `${100 / (components.length + 1)}%` }} />
          {components.map((component) => (
            <col key={component.id} style={{ width: `${100 / (components.length + 1)}%` }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th className="p-2 text-left font-medium text-slate-500" scope="col">
              <span className="sr-only">Component</span>
            </th>
            {components.map((component) => (
              <th
                key={component.id}
                scope="col"
                className="p-2 text-left font-medium text-slate-700 break-words"
              >
                <ComponentTag name={component.name} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {components.map((row) => (
            <tr key={row.id}>
              <th scope="row" className="p-2 text-left font-medium text-slate-700 break-words">
                <ComponentTag name={row.name} />
              </th>
              {components.map((column) => {
                if (row.id === column.id) {
                  return (
                    <td key={column.id} className="p-2 text-center text-slate-300">
                      —
                    </td>
                  );
                }
                const pair = findGroupPair(pairs, row.id, column.id);
                const cellKey = pairCellKey(row.id, column.id);
                const selected = pair?.id === selectedPairId;
                const pairHovered = Boolean(pair && hoveredCellKey === cellKey);
                return (
                  <td key={column.id} className="p-1">
                    <button
                      type="button"
                      disabled={!pair}
                      data-pair-cell-key={pair ? cellKey : undefined}
                      onClick={() => pair && onSelectPair(pair)}
                      onPointerEnter={() => pair && setHoveredCellKey(cellKey)}
                      onPointerLeave={(event) => clearHoverUnlessMovingToSamePair(event, cellKey)}
                      aria-pressed={selected}
                      className={`min-h-11 w-full rounded-md px-2 tabular-nums font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-default disabled:text-slate-300 enabled:cursor-pointer ${
                        selected
                          ? pairHovered
                            ? 'bg-primary-200 text-primary-950 ring-1 ring-primary-400'
                            : 'bg-primary-100 text-primary-900 ring-1 ring-primary-300'
                          : pairHovered
                            ? 'bg-primary-50 text-primary-800 ring-1 ring-primary-200'
                            : 'text-slate-800'
                      }`}
                    >
                      {pair ? pair.totalScore : '—'}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PairEvidence({ pair, heading }: { pair: CandidatePair; heading: string }) {
  return (
    <Card className="min-w-0 p-4 sm:p-5">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-700">{heading}</h3>
        <SimilarityScore score={pair.totalScore} className="w-40" />
      </div>
      <p className="mb-3 text-xs text-slate-500">
        <ComponentTag name={pair.componentA.name} /> and{' '}
        <ComponentTag name={pair.componentB.name} />. Each row is one check. Points add up to the
        score above.
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
  );
}

export function ComponentComparison({ components }: { components: ReactComponent[] }) {
  const [view, setView] = useState('compare');
  const selectedComponent = components.find((component) => component.id === view);
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <SegmentedControl
        size="sm"
        value={view}
        onChange={setView}
        options={[
          {
            value: 'compare',
            label: components.length > 2 ? `All ${components.length} components` : 'Side by Side',
          },
          ...components.map((component) => ({
            value: component.id,
            label: componentJsxTag(component.name),
          })),
        ]}
      />

      {view === 'compare' &&
        (components.length > 2 ? (
          <section
            className="min-w-0 overflow-x-auto pb-2"
            aria-label="Component comparison, scroll horizontally"
          >
            <div className="comparison-grid comparison-grid--many grid min-w-0 gap-4">
              {components.map((component) => (
                <ComponentPane key={component.id} component={component} compact />
              ))}
            </div>
          </section>
        ) : (
          <div className="min-w-0">
            <div className="comparison-grid grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
              {components.map((component) => (
                <ComponentPane key={component.id} component={component} compact={false} />
              ))}
            </div>
          </div>
        ))}
      {selectedComponent && <FullCodePane component={selectedComponent} />}
    </div>
  );
}

// ──────────────────────────────────────────
// Component pane: preview + props summary
// ──────────────────────────────────────────
type ScannedComponent = ReactComponent;

function usePreviewControls(component: ScannedComponent) {
  const controls = React.useMemo(() => generateMockProps(component), [component.id, component]);
  const [localControls, setLocalControls] = React.useState(controls);

  React.useEffect(() => {
    setLocalControls(controls);
  }, [controls]);

  const updateControl = (key: string, val: string | number | boolean) => {
    setLocalControls((prev) => ({
      ...prev,
      [key]: { ...prev[key], value: val } as (typeof prev)[typeof key],
    }));
  };

  return { localControls, updateControl };
}

function PreviewWithProps({
  component,
  compact = false,
  previewClassName = 'min-w-0 border-b border-slate-200',
  propsClassName = 'min-w-0 px-4 py-3',
}: {
  component: ScannedComponent;
  compact?: boolean;
  previewClassName?: string;
  propsClassName?: string;
}) {
  const { localControls, updateControl } = usePreviewControls(component);
  return (
    <>
      <div className={previewClassName}>
        <ComponentPreview component={component} controls={localControls} />
      </div>
      {component.propNames.length > 0 &&
        (compact ? (
          <details className="min-w-0 border-b border-slate-200">
            <summary className="cursor-pointer px-4 py-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary-500">
              Preview props ({component.propNames.length})
            </summary>
            <div className={propsClassName}>
              <PropControls
                component={component}
                controls={localControls}
                onChange={updateControl}
              />
            </div>
          </details>
        ) : (
          <div className={propsClassName}>
            <PropControls component={component} controls={localControls} onChange={updateControl} />
          </div>
        ))}
    </>
  );
}

function ComponentPane({ component, compact }: { component: ScannedComponent; compact: boolean }) {
  return (
    <Card className="comparison-pane flex min-w-0 flex-col overflow-hidden">
      <div className="flex w-full min-w-0 flex-col">
        <div className="comparison-pane-header px-4 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex min-w-0 items-center gap-2">
            <span className="min-w-0 truncate font-semibold text-sm text-slate-900">
              <ComponentTag name={component.name} />
            </span>
            <Badge color="slate" className="shrink-0">
              {component.kind}
            </Badge>
          </div>
          <p className="mt-0.5 min-w-0">
            <FileLocation
              file={component.file}
              line={component.line}
              className="inline-block w-fit max-w-full truncate whitespace-nowrap break-normal"
            />
          </p>
        </div>

        <PreviewWithProps component={component} compact={compact} />
      </div>

      {compact ? (
        <details className="w-full min-w-0">
          <summary className="cursor-pointer px-4 py-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary-500">
            Source code
          </summary>
          <div className="min-w-0 px-4 pb-3">
            <CodeBlock code={component.source} maxLines={15} />
          </div>
        </details>
      ) : (
        <div className="w-full min-w-0 border-t border-slate-100 px-4 py-3">
          <p className="mb-2 break-all text-xs font-semibold text-slate-600">
            <ComponentTag name={component.name} /> source
          </p>
          <CodeBlock code={component.source} maxLines={15} />
        </div>
      )}
    </Card>
  );
}

function FullCodePane({ component }: { component: ScannedComponent }) {
  return (
    <Card className="min-w-0 overflow-hidden p-0">
      <div className="flex flex-wrap items-start justify-between gap-3 p-4 pb-0">
        <div className="min-w-0">
          <span className="break-all font-semibold text-sm text-slate-900">
            <ComponentTag name={component.name} />
          </span>
          <FileLocation
            file={component.file}
            line={component.line}
            className="mt-1 block sm:mt-0 sm:ml-2 sm:inline"
          />
        </div>
        <CopyButton text={component.source} label="Copy source" />
      </div>
      <div className="mt-3">
        <PreviewWithProps
          component={component}
          previewClassName="min-w-0 border-y border-slate-200"
          propsClassName="min-w-0 border-b border-slate-200 px-4 py-3"
        />
      </div>
      <div className="min-w-0 p-4">
        <CodeBlock code={component.source} showLineNumbers />
      </div>
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
    <div className="flex min-w-0 flex-col gap-3 overflow-hidden">
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
                className="h-5 w-5 rounded accent-primary-600"
              />
            ) : ctrl.type === 'number' ? (
              <input
                id={controlId}
                type="number"
                value={ctrl.value}
                onChange={(e) => onChange(key, parseFloat(e.target.value) || 0)}
                className="min-h-11 w-full min-w-0 rounded-md border border-slate-300 px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 sm:min-h-0 sm:text-sm"
              />
            ) : ctrl.type === 'select' ? (
              <select
                id={controlId}
                value={ctrl.value}
                onChange={(e) => onChange(key, e.target.value)}
                className="min-h-11 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 sm:min-h-0 sm:text-sm"
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
                className="min-h-11 w-full min-w-0 rounded-md border border-slate-300 px-3 py-2 font-mono text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 sm:min-h-0 sm:text-sm"
              />
            ) : (
              <input
                id={controlId}
                type="text"
                value={ctrl.value}
                onChange={(e) => onChange(key, e.target.value)}
                className="min-h-11 w-full min-w-0 rounded-md border border-slate-300 px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 sm:min-h-0 sm:text-sm"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
