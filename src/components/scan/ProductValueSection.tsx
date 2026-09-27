const overlapCases = [
  {
    title: 'Accidental copy',
    description: 'The same component, written again.',
  },
  {
    title: 'Intentional variant',
    description: 'A real difference that should stay.',
  },
  {
    title: 'Same shape, different job',
    description: 'Shared structure, unrelated meaning.',
  },
] as const;

const productBenefits = [
  'Find candidates with fixed AST rules — no AI scoring and no code sent to a model.',
  'Show which signals matched so you can judge accidental copy versus real variant.',
  'Compare source and sandboxed previews, with source fallback when render fails.',
  'Record one decision per group and export a backlog plus copyable agent instructions.',
  'Keep scans read-only: your repo is never written from the browser.',
] as const;

export function ProductValueSection() {
  return (
    <section
      className="w-full max-w-5xl border-t border-slate-200 pt-8 lg:pt-12"
      aria-labelledby="product-value-heading"
    >
      <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">
        The problem
      </p>
      <h2
        id="product-value-heading"
        className="mx-auto max-w-4xl text-center text-3xl font-semibold leading-[1.1] tracking-tight text-slate-950 sm:text-4xl"
      >
        A reviewer still has to say what the match means.
      </h2>
      <p className="mx-auto mt-5 max-w-2xl text-center text-base leading-7 text-slate-600">
        Coding assistants make it easy to add another button, card, or field. Three different
        situations can look the same in a pull request — similarity alone cannot pick among them.
      </p>

      <ul className="mt-8 grid gap-4 sm:grid-cols-3">
        {overlapCases.map((item) => (
          <li
            key={item.title}
            className="rounded-xl border border-slate-200 bg-white px-4 py-4 text-left shadow-sm"
          >
            <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
          </li>
        ))}
      </ul>

      <div className="mt-12 rounded-2xl border border-primary-100 bg-primary-50/60 px-5 py-6 sm:px-8 sm:py-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-800">
          Why DupeDetective
        </p>
        <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
          Inspect the evidence. Decide. Hand off the cleanup.
        </h3>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700 sm:text-base sm:leading-7">
          DupeDetective groups likely similar React components, explains the match, and keeps human
          judgment in the loop — then turns merge decisions into follow-up work for a coding agent.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {productBenefits.map((benefit) => (
            <li key={benefit} className="flex gap-2.5 text-sm leading-6 text-slate-700">
              <span
                className="mt-2 size-1.5 shrink-0 rounded-full bg-primary-600"
                aria-hidden="true"
              />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
