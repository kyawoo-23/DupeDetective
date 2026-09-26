import { useState, useEffect } from "react";

interface NavbarProps {
  onOpenModal: () => void;
}

const NAV_LINKS = [
  { label: "Buttons", href: "#section-buttons" },
  { label: "Cards", href: "#section-cards" },
  { label: "Form", href: "#section-form" },
  { label: "Table", href: "#section-table" },
];

/** Sticky navbar with smooth-scroll links and an active indicator. */
export default function Navbar({ onOpenModal }: NavbarProps) {
  const [activeHash, setActiveHash] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  // Track which section is in view via IntersectionObserver
  useEffect(() => {
    const sectionIds = NAV_LINKS.map((l) => l.href.replace("#", ""));
    const observers: IntersectionObserver[] = [];

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveHash(`#${id}`); },
        { rootMargin: "-40% 0px -55% 0px" }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <nav
        className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between"
        aria-label="Primary navigation"
      >
        {/* Logo */}
        <a href="#" className="flex items-center gap-2 font-semibold text-slate-900 text-sm">
          <span className="inline-flex gap-0.5" aria-hidden="true">
            <span className="block w-2.5 h-2.5 rounded-sm bg-indigo-500" />
            <span className="block w-2.5 h-2.5 rounded-sm bg-indigo-300" />
          </span>
          Modules
        </a>

        {/* Desktop links */}
        <ul className="hidden sm:flex items-center gap-1" role="list">
          {NAV_LINKS.map(({ label, href }) => {
            const isActive = activeHash === href;
            return (
              <li key={href}>
                <a
                  href={href}
                  className={`relative px-3 py-1.5 text-sm rounded-md transition-colors ${
                    isActive
                      ? "nav-link-active text-indigo-600 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                  aria-current={isActive ? "true" : undefined}
                >
                  {label}
                </a>
              </li>
            );
          })}
        </ul>

        {/* CTA + hamburger */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenModal}
            className="hidden sm:inline-flex items-center px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Open dialog
          </button>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="sm:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              {menuOpen ? (
                <>
                  <line x1="3" y1="3" x2="17" y2="17" />
                  <line x1="17" y1="3" x2="3" y2="17" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="17" y2="6" />
                  <line x1="3" y1="10" x2="17" y2="10" />
                  <line x1="3" y1="14" x2="17" y2="14" />
                </>
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="sm:hidden border-t border-slate-100 bg-white px-4 py-3 flex flex-col gap-1">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm text-slate-700 hover:bg-slate-100"
            >
              {label}
            </a>
          ))}
          <button
            type="button"
            onClick={() => { setMenuOpen(false); onOpenModal(); }}
            className="mt-1 w-full px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
          >
            Open dialog
          </button>
        </div>
      )}
    </header>
  );
}
