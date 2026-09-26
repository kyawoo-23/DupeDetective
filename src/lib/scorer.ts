// Deterministic similarity scoring for React components.
// Fixed weights, no AI. Tuned so demo-project's six duplicate families group apart from unrelated components.

import type {
  CandidateGroup,
  CandidatePair,
  GroupConfidence,
  ReactComponent,
  SignalDetail,
  SimilaritySignal,
} from '../types';

const WEIGHTS: Record<SimilaritySignal, number> = {
  markup: 30,
  styling: 25,
  props: 20,
  name: 15,
  behavior: 10,
};

/** Mean pair score required to join two clusters. */
const GROUP_THRESHOLD = 28;
/** Group score at or above this is labeled Strong. */
const STRONG_GROUP_SCORE = 40;

const NAME_FAMILIES: readonly (readonly string[])[] = [
  ['button', 'btn'],
  ['card', 'tile'],
  ['badge', 'pill', 'tag', 'chip'],
  ['spinner', 'loader', 'loading', 'indicator'],
  ['input', 'field', 'textinput', 'textfield'],
  ['modal', 'dialog'],
  ['table', 'grid'],
  ['form'],
];

/** Prop names that mean the same thing across near-duplicates. */
const PROP_ROLES: Record<string, string> = {
  heading: 'title',
  title: 'title',
  description: 'body',
  body: 'body',
  message: 'body',
  detail: 'body',
  desc: 'body',
  onclose: 'dismiss',
  ondismiss: 'dismiss',
  oncancel: 'dismiss',
  variant: 'tone',
  color: 'tone',
  status: 'tone',
  accent: 'tone',
  type_: 'tone',
  size: 'size',
  scale: 'size',
  loading: 'busy',
  pending: 'busy',
  error: 'error',
  errormessage: 'error',
  errormsg: 'error',
  label: 'text',
  children: 'text',
};

function canonicalProp(name: string): string {
  return PROP_ROLES[name.toLowerCase()] ?? name.toLowerCase();
}

function nameWords(name: string): string[] {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(' ')
    .filter(Boolean);
}

function lastWord(name: string): string {
  const words = nameWords(name);
  return words[words.length - 1] ?? '';
}

function nameFamily(name: string): number {
  return NAME_FAMILIES.findIndex((family) => family.includes(lastWord(name)));
}

function markupTokens(component: ReactComponent): string[] {
  return [
    ...component.jsxTags.filter((tag) => tag === tag.toLowerCase()),
    ...component.ariaRoles.map((role) => `role:${role}`),
  ];
}

function propTokens(component: ReactComponent): string[] {
  return [...new Set(component.propNames.map(canonicalProp))];
}

function behaviorTokens(component: ReactComponent): string[] {
  const callbacks = component.propNames
    .filter((prop) => /^on[A-Z]/.test(prop))
    .map((prop) => `cb:${PROP_ROLES[prop.toLowerCase()] ?? prop}`);
  return [...new Set([...component.eventHandlers, ...callbacks])];
}

function weightedOverlap(
  left: string[],
  right: string[],
  weight: (token: string) => number
): number {
  const a = new Set(left);
  const b = new Set(right);
  let shared = 0;
  let union = 0;
  for (const token of new Set([...a, ...b])) {
    const tokenWeight = weight(token);
    union += tokenWeight;
    if (a.has(token) && b.has(token)) shared += tokenWeight;
  }
  return union === 0 ? 0 : shared / union;
}

function sharedTokens(
  left: string[],
  right: string[],
  weight: (token: string) => number,
  limit = 4
): string[] {
  const other = new Set(right);
  return [...new Set(left.filter((token) => other.has(token)))]
    .sort((a, b) => weight(b) - weight(a) || a.localeCompare(b))
    .slice(0, limit);
}

function capitalize(word: string): string {
  return word ? word.charAt(0).toUpperCase() + word.slice(1) : word;
}

interface ScoredSignals {
  total: number;
  signals: SignalDetail[];
}

function scoreComponents(
  a: ReactComponent,
  b: ReactComponent,
  weight: (token: string) => number,
  componentCount: number
): ScoredSignals {
  const sameRoot = a.rootTag !== '' && a.rootTag === b.rootTag;
  const rootWeight = sameRoot ? weight(`root:${a.rootTag}`) / Math.log(1 + componentCount) : 0;
  const markup =
    WEIGHTS.markup *
    (0.4 * rootWeight + 0.6 * weightedOverlap(markupTokens(a), markupTokens(b), weight));
  const styling = WEIGHTS.styling * weightedOverlap(a.classNames, b.classNames, weight);
  const props = WEIGHTS.props * weightedOverlap(propTokens(a), propTokens(b), weight);
  const familyA = nameFamily(a.name);
  const familyB = nameFamily(b.name);
  const name = WEIGHTS.name * (familyA >= 0 && familyA === familyB ? 1 : 0);
  const behavior = WEIGHTS.behavior * weightedOverlap(behaviorTokens(a), behaviorTokens(b), weight);

  const raw: { signal: SimilaritySignal; score: number; label: string }[] = [
    { signal: 'markup', score: markup, label: markupLabel(a, b, weight) },
    { signal: 'styling', score: styling, label: stylingLabel(a, b, weight) },
    { signal: 'props', score: props, label: propsLabel(a, b, weight) },
    { signal: 'name', score: name, label: nameLabel(a, b) },
    { signal: 'behavior', score: behavior, label: behaviorLabel(a, b, weight) },
  ];

  const total = Math.round(raw.reduce((sum, signal) => sum + signal.score, 0));
  const signals = raw
    .map((signal) => ({ ...signal, score: Math.round(signal.score) }))
    .filter((signal) => signal.score > 0)
    .sort((left, right) => right.score - left.score || left.signal.localeCompare(right.signal));
  const drift = total - signals.reduce((sum, signal) => sum + signal.score, 0);
  if (drift !== 0 && signals.length > 0) signals[0].score += drift;
  if (signals.length > 0 && signals[0].score <= 0) signals.shift();

  return {
    total: Math.max(
      0,
      signals.reduce((sum, signal) => sum + signal.score, 0)
    ),
    signals,
  };
}

function markupLabel(
  a: ReactComponent,
  b: ReactComponent,
  weight: (token: string) => number
): string {
  const parts: string[] = [];
  if (a.rootTag && a.rootTag === b.rootTag) parts.push(`Root <${a.rootTag}>`);
  const shared = sharedTokens(markupTokens(a), markupTokens(b), weight).filter(
    (token) => token !== a.rootTag
  );
  const roles = shared
    .filter((token) => token.startsWith('role:'))
    .map((token) => `role=${token.slice(5)}`);
  const tags = shared.filter((token) => !token.startsWith('role:')).map((token) => `<${token}>`);
  if (roles.length > 0) parts.push(roles.join(', '));
  if (tags.length > 0) parts.push(tags.join(', '));
  return parts.join(' · ') || 'Similar markup';
}

function stylingLabel(
  a: ReactComponent,
  b: ReactComponent,
  weight: (token: string) => number
): string {
  const shared = sharedTokens(a.classNames, b.classNames, weight);
  return shared.length > 0 ? `Shared classes: ${shared.join(', ')}` : 'Similar class names';
}

function propsLabel(
  a: ReactComponent,
  b: ReactComponent,
  weight: (token: string) => number
): string {
  const shared = sharedTokens(propTokens(a), propTokens(b), weight);
  return shared.length > 0 ? `Shared props: ${shared.join(', ')}` : 'Similar props';
}

function nameLabel(a: ReactComponent, b: ReactComponent): string {
  const lastA = lastWord(a.name) || a.name;
  const lastB = lastWord(b.name) || b.name;
  return lastA === lastB
    ? `Names end in ${capitalize(lastA)}`
    : `Related names: ${lastA} and ${lastB}`;
}

function behaviorLabel(
  a: ReactComponent,
  b: ReactComponent,
  weight: (token: string) => number
): string {
  const shared = sharedTokens(behaviorTokens(a), behaviorTokens(b), weight);
  const events = shared.filter((token) => !token.startsWith('cb:'));
  const callbacks = shared
    .filter((token) => token.startsWith('cb:'))
    .map((token) => token.slice(3));
  const parts: string[] = [];
  if (events.length > 0) parts.push(`Shared events: ${events.join(', ')}`);
  if (callbacks.length > 0) parts.push(`Shared callbacks: ${callbacks.join(', ')}`);
  return parts.join(' · ') || 'Similar behavior';
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join('|');
}

function pairId(a: string, b: string): string {
  return `pair:${pairKey(a, b)}`;
}

interface Cluster {
  ids: string[];
}

function clusterKey(ids: string[]): string {
  return [...ids].sort().join('|');
}

function meanPairScore(
  left: Cluster,
  right: Cluster,
  scoreOf: (a: string, b: string) => number
): number {
  let sum = 0;
  let count = 0;
  for (const a of left.ids) {
    for (const b of right.ids) {
      sum += scoreOf(a, b);
      count++;
    }
  }
  return count === 0 ? 0 : sum / count;
}

/** Short evidence lines for the queue, strongest signal first. */
export function evidenceHighlights(group: CandidateGroup): string[] {
  const best = new Map<SimilaritySignal, { score: number; label: string }>();
  for (const pair of group.pairs) {
    for (const signal of pair.signals) {
      const current = best.get(signal.signal);
      if (!current || signal.score > current.score) {
        best.set(signal.signal, { score: signal.score, label: signal.label });
      }
    }
  }
  return [...best.values()]
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
    .slice(0, 2)
    .map((signal) => signal.label);
}

export function buildCandidateGroups(components: ReactComponent[]): CandidateGroup[] {
  const candidates = components.filter((component) => component.exportType !== 'none');
  if (candidates.length < 2) return [];

  const prepared = candidates.map((component) => ({
    ...component,
    rootTag: component.rootTag || component.jsxTags[0] || '',
    ariaRoles: component.ariaRoles ?? [],
  }));

  const documentFrequency = new Map<string, number>();
  const featureTokens = (component: ReactComponent): string[] => [
    ...new Set([
      ...markupTokens(component),
      ...component.classNames,
      ...propTokens(component),
      ...behaviorTokens(component),
      ...(component.rootTag ? [`root:${component.rootTag}`] : []),
    ]),
  ];
  for (const component of prepared) {
    for (const token of featureTokens(component)) {
      documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
    }
  }
  const weight = (token: string) =>
    Math.log(1 + prepared.length / Math.max(1, documentFrequency.get(token) ?? 0));

  const byId = new Map(prepared.map((component) => [component.id, component]));
  const scoredPairs = new Map<string, CandidatePair>();
  for (let i = 0; i < prepared.length; i++) {
    for (let j = i + 1; j < prepared.length; j++) {
      const a = prepared[i];
      const b = prepared[j];
      const scored = scoreComponents(a, b, weight, prepared.length);
      const [first, second] = [a, b].sort((left, right) => left.id.localeCompare(right.id));
      scoredPairs.set(pairKey(a.id, b.id), {
        id: pairId(a.id, b.id),
        componentA: first,
        componentB: second,
        totalScore: scored.total,
        signals: scored.signals,
        summary: scored.signals
          .slice(0, 2)
          .map((signal) => signal.label)
          .join('; '),
      });
    }
  }

  const scoreOf = (a: string, b: string) => scoredPairs.get(pairKey(a, b))?.totalScore ?? 0;
  let clusters: Cluster[] = prepared.map((component) => ({ ids: [component.id] }));
  while (clusters.length > 1) {
    let bestMean = Number.NEGATIVE_INFINITY;
    let bestKey = '';
    let leftIndex = -1;
    let rightIndex = -1;
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const mean = meanPairScore(clusters[i], clusters[j], scoreOf);
        if (mean + 1e-9 < GROUP_THRESHOLD) continue;
        const key = [clusterKey(clusters[i].ids), clusterKey(clusters[j].ids)].sort().join('~');
        if (mean > bestMean + 1e-9 || (Math.abs(mean - bestMean) <= 1e-9 && key < bestKey)) {
          bestMean = mean;
          bestKey = key;
          leftIndex = i;
          rightIndex = j;
        }
      }
    }
    if (leftIndex < 0 || rightIndex < 0) break;
    const merged = { ids: [...clusters[leftIndex].ids, ...clusters[rightIndex].ids] };
    clusters = clusters.filter((_, index) => index !== leftIndex && index !== rightIndex);
    clusters.push(merged);
  }

  const groups: CandidateGroup[] = [];
  for (const cluster of clusters) {
    if (cluster.ids.length < 2) continue;
    const members = cluster.ids
      .map((id) => byId.get(id))
      .filter((component): component is ReactComponent => !!component)
      .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
    const pairs: CandidatePair[] = [];
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const pair = scoredPairs.get(pairKey(members[i].id, members[j].id));
        if (pair) pairs.push(pair);
      }
    }
    pairs.sort((a, b) => b.totalScore - a.totalScore || a.id.localeCompare(b.id));
    if (pairs.length === 0) continue;
    const signalTotals = new Map<SimilaritySignal, number>();
    for (const pair of pairs) {
      for (const signal of pair.signals) {
        signalTotals.set(signal.signal, (signalTotals.get(signal.signal) ?? 0) + signal.score);
      }
    }
    const score = Math.round(pairs.reduce((sum, pair) => sum + pair.totalScore, 0) / pairs.length);
    const confidence: GroupConfidence = score >= STRONG_GROUP_SCORE ? 'strong' : 'possible';
    groups.push({
      id: `group:${clusterKey(members.map((member) => member.id))}`,
      components: members,
      pairs,
      score,
      confidence,
      primarySignals: [...signalTotals.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 3)
        .map(([signal]) => signal),
    });
  }

  return groups.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}

export { GROUP_THRESHOLD, STRONG_GROUP_SCORE, WEIGHTS };
