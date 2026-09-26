import { useId, useRef } from 'react';
import { Badge, DecisionTypeBadge, MigrationStatusBadge } from './Badge';
import { IconButton } from './Button';
import { footerHelpTrigger, helpLinkTrigger } from './shared';

type LabelGuideProps = {
  variant?: 'inline' | 'footer';
  triggerClassName?: string;
};

export function LabelGuide({ variant = 'inline', triggerClassName }: LabelGuideProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const triggerClass =
    triggerClassName ?? (variant === 'footer' ? footerHelpTrigger : helpLinkTrigger);

  return (
    <>
      <button type="button" className={triggerClass} onClick={() => dialogRef.current?.showModal()}>
        {variant === 'footer' ? (
          <>
            <TagIcon />
            <span className="min-w-0 flex-1">What the labels mean</span>
          </>
        ) : (
          'What do these labels mean?'
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
          className="flex h-fit max-h-[85vh] w-[min(36rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 text-slate-800 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
            <h2 id={titleId} className="text-lg font-semibold">
              Label guide
            </h2>
            <IconButton aria-label="Close label guide" onClick={() => dialogRef.current?.close()}>
              ×
            </IconButton>
          </div>
          <div className="min-h-0 overflow-y-auto px-5 py-4 text-sm">
            <p className="mb-3 font-medium text-slate-900">Group decisions</p>
            <dl className="divide-y divide-slate-100 border-y border-slate-200">
              <GuideRow label={<DecisionTypeBadge outcome="merge" />}>
                All other members merge into one chosen component.
              </GuideRow>
              <GuideRow label={<DecisionTypeBadge outcome="partial" />}>
                Some members merge; the rest stay separate.
              </GuideRow>
              <GuideRow label={<DecisionTypeBadge outcome="keep" />}>
                Every member stays separate. No backlog item is created.
              </GuideRow>
            </dl>
            <p className="mb-3 mt-5 font-medium text-slate-900">Merge work</p>
            <dl className="divide-y divide-slate-100 border-y border-slate-200">
              <GuideRow label={<MigrationStatusBadge status="pending" />}>
                The merge has not been marked complete.
              </GuideRow>
              <GuideRow label={<MigrationStatusBadge status="complete" />}>
                A reviewer marked the merge work complete.
              </GuideRow>
            </dl>
            <p className="mb-3 mt-5 font-medium text-slate-900">Other labels</p>
            <dl className="divide-y divide-slate-100 border-y border-slate-200">
              <GuideRow label={<Badge color="blue">Markup</Badge>}>
                Evidence and component tags describe source code; they are not decisions.
              </GuideRow>
              <GuideRow label={<Badge color="slate">3</Badge>}>
                Numbers beside tabs count the items in that section.
              </GuideRow>
            </dl>
          </div>
        </div>
      </dialog>
    </>
  );
}

function TagIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="size-4 shrink-0 text-primary-700"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
    >
      <path d="M13.172 2a2 2 0 0 1 1.414.586l6.71 6.71a2.4 2.4 0 0 1 0 3.408l-4.592 4.592a2.4 2.4 0 0 1-3.408 0l-6.71-6.71A2 2 0 0 1 6 9.172V3a1 1 0 0 1 1-1z" />
      <path d="M2 7v6.172a2 2 0 0 0 .586 1.414l6.71 6.71a2.4 2.4 0 0 0 3.191.193" />
      <circle cx="10.5" cy="6.5" r=".5" fill="currentColor" />
    </svg>
  );
}

function GuideRow({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-3">
      <dt>{label}</dt>
      <dd className="text-slate-600">{children}</dd>
    </div>
  );
}
