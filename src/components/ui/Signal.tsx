import { WEIGHTS } from '../../lib/scorer';
import type { SimilaritySignal } from '../../types';
import { Badge } from './Badge';
import type { BadgeColor } from './shared';

const signalColors: Record<SimilaritySignal, BadgeColor> = {
  'jsx-structure': 'blue',
  'prop-overlap': 'purple',
  'event-handlers': 'teal',
  'class-names': 'amber',
  'component-name': 'slate',
  'nesting-depth': 'green',
};
const signalLabels: Record<SimilaritySignal, string> = {
  'jsx-structure': 'Markup',
  'prop-overlap': 'Shared props',
  'event-handlers': 'Events',
  'class-names': 'CSS classes',
  'component-name': 'Names',
  'nesting-depth': 'Nesting',
};
const signalDescriptions: Record<SimilaritySignal, string> = {
  'jsx-structure': 'Uses similar HTML/JSX elements (div, button, etc.)',
  'prop-overlap': 'Declares overlapping prop names',
  'event-handlers': 'Uses similar event handler props (onClick, onChange, …)',
  'class-names': 'Shares Tailwind or CSS class strings',
  'component-name': 'Component names look related',
  'nesting-depth': 'JSX is nested to a similar depth',
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
