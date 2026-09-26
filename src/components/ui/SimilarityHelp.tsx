import { useId, useRef } from 'react';
import { GROUP_THRESHOLD, STRONG_GROUP_SCORE, WEIGHTS } from '../../lib/scorer';
import { IconButton } from './Button';
import { footerHelpTrigger, helpLinkTrigger } from './shared';

const SIGNALS = [
  {
    key: 'markup',
    label: 'Markup',
    description:
      '40% for the same root element, scaled by how rare that element is in this scan, and 60% for shared tags and ARIA roles. Common tags such as div count for less than a rare tag such as dialog.',
  },
  {
    key: 'styling',
    label: 'Class names',
    description:
      'Shared class tokens, including text inside template literals and conditional class strings. A class used everywhere counts for less than a class used by only these components.',
  },
  {
    key: 'props',
    label: 'Prop roles',
    description:
      'Shared prop names after treating aliases as the same role, such as title and heading, or variant, color, status, and accent.',
  },
  {
    key: 'name',
    label: 'Component names',
    description:
      'Full credit when the last word of each name matches, or is a known synonym such as modal and dialog, badge and pill, or button and btn. Otherwise zero.',
  },
  {
    key: 'behavior',
    label: 'Behavior',
    description: 'Shared JSX event attributes and callback props such as onClick or onClose.',
  },
] as const;

function DocIcon() {
  return (
    <svg
      className="size-4 shrink-0 text-primary-700"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
      focusable="false"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 2.75h5.25L15.25 6.75V16.25a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3.75a1 1 0 0 1 1-1Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 2.75V6.75h4" />
    </svg>
  );
}

type SimilarityHelpProps = {
  variant?: 'inline' | 'footer';
  triggerClassName?: string;
};

export function SimilarityHelp({ variant = 'inline', triggerClassName }: SimilarityHelpProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const triggerClass =
    triggerClassName ?? (variant === 'footer' ? footerHelpTrigger : helpLinkTrigger);

  return (
    <>
      <button type="button" className={triggerClass} onClick={() => dialogRef.current?.showModal()}>
        {variant === 'footer' ? (
          <>
            <DocIcon />
            <span className="min-w-0 flex-1">How similarity is calculated</span>
          </>
        ) : (
          'How is similarity calculated?'
        )}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="fixed inset-0 m-0 flex h-dvh max-h-dvh w-full max-w-none items-center justify-center border-0 bg-transparent p-4 shadow-none backdrop:bg-slate-950/50 [&:not([open])]:hidden"
        onClick={() => dialogRef.current?.close()}
        onKeyDown={(e) => e.key === 'Escape' && dialogRef.current?.close()}
      >
        {/* biome-ignore lint/a11y/noStaticElementInteractions: inner panel stops propagation only; backdrop close is on the dialog */}
        <div
          className="flex h-fit max-h-[min(85vh,48rem)] w-[min(42rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 text-slate-800 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
            <h2 id={titleId} className="text-lg font-semibold">
              How similarity is calculated
            </h2>
            <IconButton
              aria-label="Close similarity explanation"
              onClick={() => dialogRef.current?.close()}
            >
              ×
            </IconButton>
          </div>
          <div className="min-h-0 space-y-5 overflow-y-auto overscroll-contain px-5 py-5 text-sm leading-6">
            <p>
              We parse each exported React component and score every pair with five fixed checks.
              Each check earns points from zero to its maximum. A token that shows up in many
              components is worth less than a token that shows up in few. The total is a score out
              of 100, not a probability that the components are duplicates.
            </p>
            <dl className="divide-y divide-slate-200 border-y border-slate-200">
              {SIGNALS.map(({ key, label, description }) => (
                <div key={key} className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr_auto] sm:gap-3">
                  <dt className="font-medium text-slate-900">{label}</dt>
                  <dd className="text-slate-600">{description}</dd>
                  <dd className="font-semibold tabular-nums text-slate-800 sm:text-right">
                    {WEIGHTS[key]} points
                  </dd>
                </div>
              ))}
            </dl>
            <p>
              Components that are not exported stay out of groups. We join components into a group
              while the average score between the two sides is at least {GROUP_THRESHOLD}. A group's
              score is the average of every pair inside it, including the weaker links.{' '}
              {STRONG_GROUP_SCORE} or higher is labeled Strong; anything lower that still grouped is
              Possible.
            </p>
            <p>
              The review queue starts at {GROUP_THRESHOLD}, which lists every group. Raising it
              hides whole groups. It does not drop members out of a group. You decide the group, not
              each pair: pick the component to keep, which of the others fold into it, and which
              stay separate.
            </p>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
              <p className="font-semibold">Use this to choose what to inspect first.</p>
              <p className="mt-1">
                A high score can still mean different behavior or purpose. A low score can miss a
                real duplicate hidden by wrappers, computed styles, or different names. Compare
                source and previews before deciding whether to merge.
              </p>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
