// Deterministic similarity scoring for React components
// Fixed weights, no AI.

import type {
  CandidateGroup,
  CandidatePair,
  ReactComponent,
  SignalDetail,
  SimilaritySignal,
} from '../types';

// ──────────────────────────────────────────
// Signal weights (tunable for demo repo)
// ──────────────────────────────────────────
const WEIGHTS: Record<SimilaritySignal, number> = {
  'jsx-structure': 35,
  'prop-overlap': 25,
  'event-handlers': 15,
  'class-names': 10,
  'component-name': 5,
  'nesting-depth': 10,
};

const PAIR_THRESHOLD = 30; // minimum score to include a pair inside a group
const CLUSTER_THRESHOLD = 55; // minimum score to drive union-find clustering

// Common layout and icon tags appear in unrelated components. A pair needs
// evidence beyond those tags, event names, and similar nesting to enter review.
const GENERIC_TAGS = new Set([
  'div', 'span', 'p', 'section', 'main', 'article', 'header', 'footer', 'aside',
  'svg', 'path', 'circle', 'line', 'polyline', 'g',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
]);

function hasSpecificEvidence(a: ReactComponent, b: ReactComponent): boolean {
  const sharedProps = a.propNames.filter((prop) => b.propNames.includes(prop));
  if (sharedProps.length >= 2 || nameSimilarity(a.name, b.name) >= 0.6) return true;

  const specificTags = (component: ReactComponent) =>
    component.jsxTags.filter((tag) => tag === tag.toLowerCase() && !GENERIC_TAGS.has(tag));
  const aTags = specificTags(a);
  const bTags = specificTags(b);
  if (aTags.length && bTags.length && jaccard(aTags, bTags) >= 0.6) return true;

  // Tiny leaf components can be genuine variants even when their only tag is
  // normally generic (for example, two status pills made from a single span).
  return a.jsxTags.length === 1 && b.jsxTags.length === 1 &&
    a.jsxTags[0] === b.jsxTags[0] && ['span', 'button', 'input', 'label'].includes(a.jsxTags[0]);
}

// ──────────────────────────────────────────
// Jaccard similarity helper
// ──────────────────────────────────────────
function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let intersection = 0;
  for (const v of setA) if (setB.has(v)) intersection++;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// ──────────────────────────────────────────
// Name similarity: normalized Levenshtein ratio
// ──────────────────────────────────────────
function nameSimilarity(a: string, b: string): number {
  const la = a.toLowerCase();
  const lb = b.toLowerCase();
  if (la === lb) return 1;
  // Strip common prefixes/suffixes like Base, New, V2, Legacy
  const strip = (s: string) =>
    s
      .replace(/^(base|new|old|v\d+|legacy|common|shared)/i, '')
      .replace(
        /(button|card|modal|form|input|list|item|badge|chip|tag|icon|label|text|heading|title|header|footer|nav|menu|item|row|cell|column|panel|section|container|wrapper|box|layout)$/i,
        '_$1'
      );
  if (strip(la) === strip(lb)) return 0.85;
  // Common substrings
  const shorter = la.length < lb.length ? la : lb;
  const longer = la.length >= lb.length ? la : lb;
  if (longer.includes(shorter) && shorter.length > 3) return 0.7;
  return 0;
}

// ──────────────────────────────────────────
// JSX tag tree similarity
// ──────────────────────────────────────────
function jsxStructureScore(a: ReactComponent, b: ReactComponent): { score: number; label: string } {
  const tagJaccard = jaccard(a.jsxTags, b.jsxTags);

  // Normalize tag counts (penalize if they're very different in size)
  const countRatio =
    Math.min(a.jsxNodeCount, b.jsxNodeCount) / (Math.max(a.jsxNodeCount, b.jsxNodeCount) || 1);

  const raw = tagJaccard * 0.7 + countRatio * 0.3;
  const score = Math.round(raw * WEIGHTS['jsx-structure']);

  const commonTags = a.jsxTags.filter((t) => b.jsxTags.includes(t));
  const label =
    commonTags.length > 0
      ? `Same JSX elements: ${commonTags.slice(0, 5).join(', ')}${commonTags.length > 5 ? ` +${commonTags.length - 5} more` : ''}`
      : 'Similar JSX structure';

  return { score, label };
}

// ──────────────────────────────────────────
// Prop overlap
// ──────────────────────────────────────────
function propOverlapScore(a: ReactComponent, b: ReactComponent): { score: number; label: string } {
  const j = jaccard(a.propNames, b.propNames);
  const score = Math.round(j * WEIGHTS['prop-overlap']);

  const shared = a.propNames.filter((p) => b.propNames.includes(p));
  const total = new Set([...a.propNames, ...b.propNames]).size;
  const label =
    shared.length > 0
      ? `${shared.length} of ${total} prop names overlap: ${shared.slice(0, 4).join(', ')}${shared.length > 4 ? '…' : ''}`
      : 'No prop overlap';

  return { score, label };
}

// ──────────────────────────────────────────
// Event handler overlap
// ──────────────────────────────────────────
function eventHandlerScore(a: ReactComponent, b: ReactComponent): { score: number; label: string } {
  const j = jaccard(a.eventHandlers, b.eventHandlers);
  const score = Math.round(j * WEIGHTS['event-handlers']);

  const shared = a.eventHandlers.filter((e) => b.eventHandlers.includes(e));
  const label =
    shared.length > 0 ? `Shared event handlers: ${shared.join(', ')}` : 'No shared event handlers';

  return { score, label };
}

// ──────────────────────────────────────────
// Class names
// ──────────────────────────────────────────
function classNameScore(a: ReactComponent, b: ReactComponent): { score: number; label: string } {
  const j = jaccard(a.classNames, b.classNames);
  const score = Math.round(j * WEIGHTS['class-names']);

  const shared = a.classNames.filter((c) => b.classNames.includes(c));
  const label =
    shared.length > 0
      ? `Shared class names: ${shared.slice(0, 4).join(', ')}${shared.length > 4 ? '…' : ''}`
      : 'No shared class names';

  return { score, label };
}

// ──────────────────────────────────────────
// Component name
// ──────────────────────────────────────────
function componentNameScore(
  a: ReactComponent,
  b: ReactComponent
): { score: number; label: string } {
  const sim = nameSimilarity(a.name, b.name);
  const score = Math.round(sim * WEIGHTS['component-name']);
  const label =
    sim > 0.8
      ? `Very similar names: "${a.name}" and "${b.name}"`
      : sim > 0.5
        ? `Related names: "${a.name}" and "${b.name}"`
        : `Different names: "${a.name}" and "${b.name}"`;
  return { score, label };
}

// ──────────────────────────────────────────
// Nesting depth
// ──────────────────────────────────────────
function nestingDepthScore(a: ReactComponent, b: ReactComponent): { score: number; label: string } {
  const maxDepth = Math.max(a.jsxDepth, b.jsxDepth);
  if (maxDepth === 0) return { score: 0, label: 'No JSX nesting' };
  const diff = Math.abs(a.jsxDepth - b.jsxDepth);
  const sim = 1 - diff / maxDepth;
  const score = Math.round(sim * WEIGHTS['nesting-depth']);
  const label =
    diff === 0
      ? `Same JSX nesting depth (${a.jsxDepth})`
      : `Similar nesting depth: ${a.jsxDepth} vs ${b.jsxDepth}`;
  return { score, label };
}

// ──────────────────────────────────────────
// Score a pair
// ──────────────────────────────────────────
let pairIdCounter = 0;
function makePairId() {
  return `pair_${++pairIdCounter}`;
}

function scorePair(a: ReactComponent, b: ReactComponent): CandidatePair {
  const signals: SignalDetail[] = [];

  const jsx = jsxStructureScore(a, b);
  const props = propOverlapScore(a, b);
  const events = eventHandlerScore(a, b);
  const classes = classNameScore(a, b);
  const name = componentNameScore(a, b);
  const depth = nestingDepthScore(a, b);

  if (jsx.score > 0) signals.push({ signal: 'jsx-structure', label: jsx.label, score: jsx.score });
  if (props.score > 0)
    signals.push({ signal: 'prop-overlap', label: props.label, score: props.score });
  if (events.score > 0)
    signals.push({ signal: 'event-handlers', label: events.label, score: events.score });
  if (classes.score > 0)
    signals.push({ signal: 'class-names', label: classes.label, score: classes.score });
  if (name.score > 0)
    signals.push({ signal: 'component-name', label: name.label, score: name.score });
  if (depth.score > 0)
    signals.push({ signal: 'nesting-depth', label: depth.label, score: depth.score });

  const totalScore = signals.reduce((sum, s) => sum + s.score, 0);

  // Human-readable summary
  const topSignals = signals.sort((a, b) => b.score - a.score).slice(0, 2);
  const summary =
    topSignals.length > 0 ? topSignals.map((s) => s.label).join('; ') : 'Structural similarity';

  return {
    id: makePairId(),
    componentA: a,
    componentB: b,
    totalScore,
    signals: signals.sort((a, b) => b.score - a.score),
    summary,
  };
}

// ──────────────────────────────────────────
// Build candidate groups
// ──────────────────────────────────────────
let groupIdCounter = 0;
function makeGroupId() {
  return `group_${++groupIdCounter}`;
}

export function buildCandidateGroups(components: ReactComponent[]): CandidateGroup[] {
  if (components.length < 2) return [];

  // Score all pairs
  const pairs: CandidatePair[] = [];
  for (let i = 0; i < components.length; i++) {
    for (let j = i + 1; j < components.length; j++) {
      // Skip same-file pairs — intra-file helpers (Btn, Field, StatCard, etc.)
      // should never drive cross-component grouping.
      if (components[i].file === components[j].file) continue;
      if (!hasSpecificEvidence(components[i], components[j])) continue;
      const pair = scorePair(components[i], components[j]);
      if (pair.totalScore >= PAIR_THRESHOLD) {
        pairs.push(pair);
      }
    }
  }

  // Sort pairs by score descending
  pairs.sort((a, b) => b.totalScore - a.totalScore);

  // Cluster: union-find driven only by high-confidence pairs so that a
  // weakly-matching hub component (e.g. a shared layout helper) cannot
  // transitively merge unrelated groups.
  const parent = new Map<string, string>();
  function find(id: string): string {
    if (!parent.has(id)) parent.set(id, id);
    // biome-ignore lint/style/noNonNullAssertion: parent.has(id) is guaranteed by the line above
    const p = parent.get(id)!;
    if (p !== id) parent.set(id, find(p));
    // biome-ignore lint/style/noNonNullAssertion: path compression guarantees entry exists
    return parent.get(id)!;
  }
  function union(a: string, b: string) {
    parent.set(find(a), find(b));
  }

  for (const pair of pairs) {
    if (pair.totalScore >= CLUSTER_THRESHOLD) {
      union(pair.componentA.id, pair.componentB.id);
    }
  }

  // Collect groups
  const groupMap = new Map<string, Set<string>>();
  for (const pair of pairs) {
    const root = find(pair.componentA.id);
    if (!groupMap.has(root)) groupMap.set(root, new Set());
    groupMap.get(root)?.add(pair.componentA.id);
    groupMap.get(root)?.add(pair.componentB.id);
  }

  const groups: CandidateGroup[] = [];
  for (const [, memberIds] of groupMap) {
    const groupComponents = components.filter((c) => memberIds.has(c.id));
    const groupPairs = pairs.filter(
      (p) => memberIds.has(p.componentA.id) && memberIds.has(p.componentB.id)
    );
    // A large connected group can contain more pairs than the engine allows
    // as function arguments. The pairs are already sorted by score.
    const topScore = groupPairs[0].totalScore;

    // Collect primary signals
    const signalCounts = new Map<SimilaritySignal, number>();
    for (const pair of groupPairs) {
      for (const sig of pair.signals) {
        signalCounts.set(sig.signal, (signalCounts.get(sig.signal) ?? 0) + sig.score);
      }
    }
    const primarySignals = [...signalCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([s]) => s);

    groups.push({
      id: makeGroupId(),
      components: groupComponents,
      pairs: groupPairs,
      topScore,
      primarySignals,
    });
  }

  // Sort groups by top score
  return groups.sort((a, b) => b.topScore - a.topScore);
}

export { CLUSTER_THRESHOLD, PAIR_THRESHOLD, WEIGHTS };
