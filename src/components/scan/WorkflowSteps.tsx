// How component detection and matching lead to review.

type WorkflowIconKind = 'project' | 'review' | 'decision';

const workflowSteps: {
  number: string;
  title: string;
  description: string;
  icon: WorkflowIconKind;
}[] = [
  {
    number: '01',
    title: 'Detect components',
    description:
      'Read .js, .jsx, .ts, and .tsx files for capitalized functions and classes that produce JSX. Only exported components are matched.',
    icon: 'project',
  },
  {
    number: '02',
    title: 'Score similarities',
    description:
      'Compare markup, class names, prop roles, name families, and events. Rare shared details carry more weight.',
    icon: 'review',
  },
  {
    number: '03',
    title: 'Review groups',
    description:
      'Group components by average score. Inspect source and previews, then decide what merges and what stays separate.',
    icon: 'decision',
  },
];

export function WorkflowSteps() {
  return (
    <section className="w-full max-w-5xl border-t border-slate-200 pt-8 lg:pt-12">
      <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">
        How the scan works
      </p>
      <h2 className="mx-auto max-w-4xl text-center text-3xl font-semibold leading-[1.1] tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
        Find the overlap. Decide what stays.
      </h2>
      <p className="mx-auto mt-5 max-w-2xl text-center text-base leading-7 text-slate-600">
        The scan suggests candidates from source code. You make the final call on every group.
      </p>
      <ol className="mt-8 grid gap-8 pt-8 sm:grid-cols-3 sm:gap-6">
        {workflowSteps.map((step) => (
          <li key={step.number} className="flex flex-col items-center text-center">
            <span
              className="flex size-12 items-center justify-center rounded-xl border border-primary-200 bg-primary-50 text-primary-700 shadow-sm"
              aria-hidden="true"
            >
              <WorkflowIcon kind={step.icon} />
            </span>
            <span className="mt-3 font-mono text-xs font-semibold tracking-wider text-primary-700">
              {step.number}
            </span>
            <h3 className="mt-1 text-sm font-semibold text-slate-900">{step.title}</h3>
            <p className="mt-1 max-w-64 text-sm leading-6 text-slate-500">{step.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function WorkflowIcon({ kind }: { kind: WorkflowIconKind }) {
  return (
    <svg
      className="size-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {kind === 'project' && (
        <>
          <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2.2 2.5h7.3A2.5 2.5 0 0 1 21 10v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7.5Z" />
          <path d="M12 11v6M9 14h6" />
        </>
      )}
      {kind === 'review' && (
        <>
          <rect x="3" y="4" width="11" height="14" rx="2" />
          <rect x="10" y="7" width="11" height="14" rx="2" />
          <path d="M6.5 8h4M6.5 11h2" />
        </>
      )}
      {kind === 'decision' && (
        <>
          <rect x="5" y="4" width="14" height="17" rx="2" />
          <path d="M9 4.5V3h6v1.5M8.5 13l2.5 2.5 4.5-5" />
        </>
      )}
    </svg>
  );
}
