# DupeDetective

Find and review similar React components in a codebase.

## What it does

DupeDetective scans a public GitHub repository or a ZIP archive for similar React components. It uses deterministic, AST-based analysis — no AI — to group candidates and explain the evidence. A reviewer inspects the code, tries best-effort component previews, records a decision, and generates a merge backlog and component guidelines.

## Quick start

```bash
npm install
npm run dev        # development server at http://localhost:5173
npm run build      # production build
npm run typecheck  # type-check only
```

## Scan inputs

- **GitHub URL** — enter any public repository URL (`https://github.com/owner/repo`). An optional branch or commit can be specified; defaults to the repository's default branch. The resolved commit SHA is recorded with the scan.
- **ZIP upload** — drag and drop or select a `.zip` archive of a project source tree. Path traversal entries are rejected; `node_modules`, `dist`, and other vendor directories are skipped automatically.

## How similarity works

Components are analyzed with five deterministic signals, each weighted independently:

| Signal | Weight |
|---|---|
| JSX element tree (tags + count) | 35 |
| Prop name overlap | 25 |
| Nesting depth match | 10 |
| Event handler overlap | 15 |
| Shared class names | 10 |
| Component name similarity | 5 |

Candidate pairs need specific evidence (shared props, related names, or strongly overlapping element types) as well as a score ≥ 30 to enter review. Groups are formed by union-finding connected pairs. All scores are review-ordering hints, not probability or duplicate verdicts.

The review queue initially shows pairs scoring 50 or higher. Use the Minimum score filter to include lower-scoring candidates down to 30; the selected cutoff stays in the scan URL while reviewing pairs.

## Review decisions

| Decision | Requires a note | Creates backlog item | Guideline entry |
|---|---|---|---|
| Merge | Yes, plus the component to keep | Yes | After marked Complete |
| Keep separate | No | No | Only when the note is filled in |

Decisions are scoped to the current scan. A new scan starts with no prior decisions.

## Generated outputs

All outputs are generated within the website for the current scan:

- **Backlog** — Markdown listing merges with status and next steps. Downloadable as `backlog.md`.
- **Component guidelines** — `component-guidelines.md` with finished merges and keep-separate notes. A blank keep-separate decision is omitted.
- **Agent instructions** — Copyable repair instructions for each merge, individually or combined.

## Component preview

The preview renders components in a sandboxed `<iframe>` using React 18 (loaded from unpkg) and Babel Standalone. It cannot access the main app's cookies, storage, or APIs. Imports are stripped before rendering; if a component relies on project-specific imports, a clear error is shown and source comparison remains available.

Mock props are generated from declared prop types using deterministic heuristics (string → text input, boolean → toggle, union literals → select, callbacks → stubs).

## Architecture

```
src/
  lib/
    parser.ts     — Babel AST component discovery
    scorer.ts     — Deterministic similarity scoring and candidate grouping
    fs.ts         — ZIP extraction and GitHub archive fetching
    mockProps.ts  — Mock prop generation from prop types
    outputs.ts    — Markdown backlog, guidelines, agent instruction generators
    scan.ts       — Scan orchestration (ZIP and GitHub)
  store/
    index.ts      — Zustand store (scans, decisions, per-scan state)
  types/
    index.ts      — All domain types
  pages/
    ScanInputPage.tsx      — GitHub URL / ZIP upload form
    ScanWorkspacePage.tsx  — Review queue, components list, outputs
  components/
    review/ReviewPanel.tsx        — Side-by-side comparison + decision form
    preview/ComponentPreview.tsx  — Sandboxed iframe preview + mock prop controls
    outputs/OutputsPanel.tsx      — Backlog, guidelines, agent instructions
    ui/index.tsx                  — Shared UI primitives
```

## Demo plan

1. Open the app and enter a public React repository URL (e.g. `https://github.com/shadcn-ui/ui`).
2. Wait for the scan to complete. Inspect candidate groups and match evidence.
3. Open a pair, adjust mock props, view previews and source side-by-side.
4. Record a **Merge** decision, choose the component to keep, save.
5. Go to **Outputs → Agent Instructions**, copy the instruction.
6. In the Backlog tab, advance the item from Planned → In Progress → Complete.
7. View the updated **Component Guidelines** — the kept component appears there only after completion.
8. Click **New Scan** — verify the new scan starts with no prior decisions.

## Security

- Scanned source is never written back to any repository.
- Preview runs in a sandboxed iframe (`sandbox="allow-scripts"`) with no access to the main app.
- ZIP archives are validated: path traversal entries and oversized files are rejected.
- Only public GitHub repositories are supported.
