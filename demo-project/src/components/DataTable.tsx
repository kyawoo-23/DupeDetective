import { useState, useMemo } from "react";
import { SectionHeader } from "./ButtonGroup";

type Status = "Active" | "Pending" | "Archived";
type SortDir = "asc" | "desc" | "none";

interface Project {
  id: number;
  name: string;
  owner: string;
  status: Status;
  updated: string; // ISO date
}

const STATUS_STYLES: Record<Status, string> = {
  Active:   "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Pending:  "bg-amber-50 text-amber-700 border border-amber-200",
  Archived: "bg-slate-100 text-slate-500 border border-slate-200",
};

// Sample data
const PROJECTS: Project[] = [
  { id: 1, name: "Design system v2",  owner: "Alice Chen",    status: "Active",   updated: "2025-05-20" },
  { id: 2, name: "API gateway refactor", owner: "Bob Kim",   status: "Pending",  updated: "2025-05-18" },
  { id: 3, name: "Mobile onboarding", owner: "Clara Singh",  status: "Active",   updated: "2025-05-15" },
  { id: 4, name: "Auth service",      owner: "Dana Park",    status: "Archived", updated: "2025-04-30" },
  { id: 5, name: "Analytics dashboard", owner: "Evan Ruiz",  status: "Active",   updated: "2025-05-22" },
  { id: 6, name: "Email templates",   owner: "Fiona Osei",   status: "Pending",  updated: "2025-05-10" },
  { id: 7, name: "Search indexer",    owner: "George Liu",   status: "Archived", updated: "2025-03-14" },
];

type ColKey = "name" | "owner" | "status" | "updated";

/** Section: sortable + filterable data table with status badges and row actions. */
export default function DataTable() {
  const [filter, setFilter] = useState("");
  const [sortCol, setSortCol] = useState<ColKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("none");

  const handleSort = (col: ColKey) => {
    if (sortCol !== col) {
      setSortCol(col);
      setSortDir("asc");
    } else {
      setSortDir((d) => (d === "asc" ? "desc" : d === "desc" ? "none" : "asc"));
      if (sortDir === "desc") setSortCol(null);
    }
  };

  const rows = useMemo(() => {
    let data = PROJECTS.filter((p) =>
      p.name.toLowerCase().includes(filter.toLowerCase()) ||
      p.owner.toLowerCase().includes(filter.toLowerCase())
    );
    if (sortCol && sortDir !== "none") {
      data = [...data].sort((a, b) => {
        const av = a[sortCol];
        const bv = b[sortCol];
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return data;
  }, [filter, sortCol, sortDir]);

  const sortIcon = (col: ColKey) => {
    if (sortCol !== col) return <span className="text-slate-300 ml-1 select-none">↕</span>;
    return <span className="text-indigo-500 ml-1 select-none">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  const ariaSort = (col: ColKey): "ascending" | "descending" | "none" => {
    if (sortCol !== col) return "none";
    return sortDir === "asc" ? "ascending" : sortDir === "desc" ? "descending" : "none";
  };

  return (
    <section id="section-table" aria-labelledby="table-heading" className="scroll-mt-20">
      <SectionHeader
        title="Data table"
        desc="Sortable columns, live text filtering, status badges, and row-level actions."
      />

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <label htmlFor="table-filter" className="sr-only">Filter projects</label>
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            id="table-filter"
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by name or owner…"
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        {filter && (
          <button
            type="button"
            onClick={() => setFilter("")}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div
        className="rounded-xl border border-slate-200 overflow-hidden"
        role="region"
        aria-labelledby="table-heading"
        tabIndex={0}
      >
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {(
                [
                  { col: "name",    label: "Project" },
                  { col: "owner",   label: "Owner" },
                  { col: "status",  label: "Status" },
                  { col: "updated", label: "Updated" },
                ] as { col: ColKey; label: string }[]
              ).map(({ col, label }) => (
                <th
                  key={col}
                  scope="col"
                  aria-sort={ariaSort(col)}
                  className="px-4 py-3 text-left font-semibold text-slate-600 cursor-pointer hover:text-slate-900 select-none whitespace-nowrap"
                  onClick={() => handleSort(col)}
                >
                  {label}{sortIcon(col)}
                </th>
              ))}
              <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400 text-sm">
                  No projects match your filter.
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr key={p.id} className="data-row bg-white transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap transition-colors">{p.name}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap transition-colors">{p.owner}</td>
                  <td className="px-4 py-3 transition-colors">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[p.status]}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap tabular-nums transition-colors">
                    {new Date(p.updated).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 transition-colors">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        Edit
                      </button>
                      <span className="text-slate-200">|</span>
                      <button
                        type="button"
                        className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        Showing {rows.length} of {PROJECTS.length} projects
      </p>
    </section>
  );
}
