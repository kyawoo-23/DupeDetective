import { WEIGHTS } from '../../lib/scorer';
import type { SimilaritySignal } from '../../types';
import { Badge } from './Badge';
import type { BadgeColor } from './shared';

const signalColors: Record<SimilaritySignal, BadgeColor> = {
  markup: 'blue',
  styling: 'amber',
  props: 'purple',
  name: 'slate',
  behavior: 'teal',
};
const signalLabels: Record<SimilaritySignal, string> = {
  markup: 'Markup',
  styling: 'Classes',
  props: 'Props',
  name: 'Names',
  behavior: 'Behavior',
};
const signalDescriptions: Record<SimilaritySignal, string> = {
  markup: 'Shared root element, tags, and ARIA roles, weighted by how rare they are in this scan',
  styling: 'Shared class tokens, weighted by how rare they are in this scan',
  props: 'Shared prop roles, such as title/heading or size/scale',
  name: 'Names end with the same word or a known synonym',
  behavior: 'Shared event attributes and callback props',
};

export function signalMaxScore(signal: SimilaritySignal): number {
  return WEIGHTS[signal];
}

export function SignalBadge({ signal }: { signal: SimilaritySignal }) {
  return (
    <Badge color={signalColors[signal]} title={signalDescriptions[signal]}>
      {signalLabels[signal]}
    </Badge>
  );
}
