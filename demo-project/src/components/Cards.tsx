import { SectionHeader } from "./ButtonGroup";

/** Section: stat cards, a content card, and an action card. */
export default function Cards() {
  return (
    <section id="section-cards" aria-labelledby="cards-heading" className="scroll-mt-20">
      <SectionHeader
        title="Card component"
        desc="Three patterns: metric stat cards, a content card with a tag, and a feature/action card."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Stat cards */}
        <StatCard label="Active users" value="12,480" delta="+8.2%" positive />
        <StatCard label="Avg. session" value="4m 37s" delta="−1.1%" positive={false} />
        <StatCard label="Conversion" value="3.6%" delta="+0.4 pts" positive />

        {/* Content card */}
        <article className="bg-white rounded-lg border border-slate-200 p-5 flex flex-col gap-3 sm:col-span-2">
          <span className="inline-block self-start text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
            Tutorial
          </span>
          <h3 className="font-semibold text-slate-900 text-base leading-snug">
            Getting started with CSS Grid
          </h3>
          <p className="text-slate-500 text-sm leading-relaxed flex-1">
            Learn to build two-dimensional layouts with CSS Grid — from
            basic tracks to named template areas and auto-placement algorithms.
          </p>
          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <span className="text-xs text-slate-400">5 min read</span>
            <button
              type="button"
              className="text-xs font-semibold text-indigo-700 hover:text-indigo-800 transition-colors"
            >
              Read
            </button>
          </div>
        </article>

        {/* Action card */}
        <article className="bg-white rounded-lg border border-slate-200 p-5 flex flex-col gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-900 text-base">Enable 2FA</h3>
          <p className="text-slate-500 text-sm leading-relaxed flex-1">
            Protect your account with two-factor authentication using an
            authenticator app of your choice.
          </p>
          <button
            type="button"
            className="self-start px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Set up now
          </button>
        </article>
      </div>
    </section>
  );
}

/* ── Stat card ────────────────────────────────────────────────────────── */
function StatCard({
  label,
  value,
  delta,
  positive,
}: {
  label: string;
  value: string;
  delta: string;
  positive: boolean;
}) {
  return (
    <article className="bg-white rounded-lg border border-slate-200 p-5">
      <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-semibold tracking-tight text-slate-900 mb-1">{value}</p>
      <p
        className={`text-xs font-semibold ${
          positive ? "text-emerald-600" : "text-red-500"
        }`}
      >
        {delta} this week
      </p>
    </article>
  );
}
