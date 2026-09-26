import { useState } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:   "bg-indigo-600 text-white hover:bg-indigo-700 border-transparent",
  secondary: "bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-50",
  ghost:     "bg-transparent text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-100",
  danger:    "bg-red-600 text-white hover:bg-red-700 border-transparent",
};

const BASE = "inline-flex items-center justify-center font-semibold border rounded-lg transition-colors disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2";

function Btn({
  variant = "primary",
  size = "md",
  disabled,
  children,
}: {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const sizeClass = size === "sm" ? "px-3 py-1.5 text-xs" : size === "lg" ? "px-6 py-3 text-base" : "px-4 py-2 text-sm";
  return (
    <button
      type="button"
      disabled={disabled}
      className={`${BASE} ${VARIANT_CLASSES[variant]} ${sizeClass}`}
    >
      {children}
    </button>
  );
}

const TOGGLE_OPTIONS = ["Grid", "List", "Compact"];

/** Section: demonstrates button variants, sizes, disabled states, and a toggle group. */
export default function ButtonGroup() {
  const [active, setActive] = useState("Grid");

  return (
    <section id="section-buttons" aria-labelledby="btn-heading" className="scroll-mt-20">
      <SectionHeader
        title="Button group"
        desc="Four variants — primary, secondary, ghost, and danger — across three sizes, with disabled states and a toggle group."
      />

      <div className="space-y-6">
        {/* Variants */}
        <ComponentBlock label="Variants">
          <div className="flex flex-wrap gap-3" role="group" aria-label="Button variants">
            <Btn variant="primary">Primary</Btn>
            <Btn variant="secondary">Secondary</Btn>
            <Btn variant="ghost">Ghost</Btn>
            <Btn variant="danger">Danger</Btn>
          </div>
        </ComponentBlock>

        {/* Sizes */}
        <ComponentBlock label="Sizes">
          <div className="flex flex-wrap items-center gap-3">
            <Btn size="sm">Small</Btn>
            <Btn size="md">Default</Btn>
            <Btn size="lg">Large</Btn>
            <Btn disabled>Disabled</Btn>
          </div>
        </ComponentBlock>

        {/* Toggle group */}
        <ComponentBlock label="Toggle group">
          <div
            className="inline-flex rounded-lg border border-slate-300 overflow-hidden"
            role="group"
            aria-label="View mode"
          >
            {TOGGLE_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                aria-pressed={active === opt}
                onClick={() => setActive(opt)}
                className={`px-4 py-2 text-sm font-medium transition-colors border-r last:border-r-0 border-slate-300 ${
                  active === opt
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </ComponentBlock>
      </div>
    </section>
  );
}

/* ── Shared layout helpers ────────────────────────────────────────────── */

export function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-8">
      <h2
        className="text-2xl font-bold text-slate-900 mb-2"
        style={{ fontFamily: "'Syne', sans-serif" }}
      >
        {title}
      </h2>
      <p className="text-slate-500 text-sm max-w-2xl">{desc}</p>
    </div>
  );
}

export function ComponentBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">{label}</p>
      {children}
    </div>
  );
}
