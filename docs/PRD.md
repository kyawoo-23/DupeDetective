# PRD: DupeDetective

**Status:** Hackathon build draft  
**Owner:** TBD  
**Last updated:** 2026-09-26

## 1. Product summary

DupeDetective is a web application for finding and reviewing similar React components in a codebase.

A reviewer starts a scan by entering a public GitHub repository URL or uploading a ZIP file. The system analyzes React JavaScript and TypeScript code with deterministic rules, groups likely matches, and explains the evidence. It attempts to render the components with editable mock props in an isolated preview.

A person decides whether to merge the components or keep them separate. The website records those decisions within the scan and generates a backlog, component guidance, and copyable instructions for a coding agent.

Every scan is independent. A new scan starts without decisions or records from previous scans. Previous scans may remain available as separate sessions.

## 2. Problem

Teams can add similar frontend components quickly, especially when developers use coding assistants. Similar components may be accidental copies, intentional variants, or unrelated components that share a visual structure.

Similarity alone cannot determine which case applies. Teams need a place to inspect the code and previews, make a human decision, record the reason, and prepare cleanup work and guidance.

## 3. Goal

Help a frontend reviewer:

1. Scan a public GitHub repository or uploaded ZIP for likely similar React components.
2. Inspect the code evidence and best-effort previews.
3. Record and explain a decision for each reviewed relationship.
4. Generate follow-up work and component guidance for the current scan.
5. Copy a structured repair instruction into a coding agent when a merge is needed.

## 4. Target user

The primary user is a frontend tech lead, design-system maintainer, or senior frontend engineer reviewing a React codebase.

The hackathon demo is presented manually by the project owner. It does not require a live coding-agent integration.

## 5. Product principles

- **Human judgment:** A match is a candidate for review, not a verdict.
- **Deterministic detection:** Candidate analysis uses code structure and fixed rules. It does not rely on AI.
- **Visible evidence:** The interface explains which code signals contributed to a match.
- **Best-effort previews:** The system attempts to render components and provides source evidence when a preview fails.
- **Scan isolation:** Decisions, suppressions, and outputs from one scan are not carried into a later scan.
- **No source changes:** The website does not write to the scanned repository.

## 6. Hackathon scope

### In scope

- A web UI that accepts:
  - A public GitHub repository URL.
  - A ZIP archive of a project.
- Optional branch or commit selection for GitHub scans.
- React JavaScript and TypeScript component analysis.
- Deterministic candidate grouping and explanations.
- A review queue and side-by-side comparison.
- Isolated, best-effort component previews with editable mock props.
- Human decisions, rationale, and migration status.
- A Markdown backlog and `component-guidelines.md` generated within the website for each scan.
- Individual and combined copyable coding-agent instructions.

### Out of scope

- Private GitHub repositories.
- Vue, Svelte, Angular, and other framework analysis.
- Automatic code edits, refactoring, merges, or pull requests.
- Writing decisions or generated files back to the scanned repository.
- AI-based similarity detection or AI-generated candidate scores.
- Suppression rules or syntax.
- Carrying decisions, rationale, or other review records into a later scan.
- Authentication, permissions, multi-tenant workspaces, and issue-tracker integrations.
- Running arbitrary repository installation or build scripts.
- A live coding-agent demonstration or integration.

## 7. Scan input and source handling

### 7.1 ZIP upload

- Accept a ZIP containing a project source tree.
- Validate the archive before extraction.
- Apply configurable limits for archive size, expanded size, file count, and nesting depth.
- Reject path traversal entries and other malformed archive paths.
- Record a content hash for the uploaded archive as the scan’s source identifier.

### 7.2 Public GitHub URL

- Accept public repository URLs from GitHub.
- Allow the reviewer to choose a branch or commit; default to the repository’s default branch.
- Resolve the selected reference to a commit SHA and record that SHA with the scan.
- Fetch a source archive for the resolved revision and cache it where practical.
- Avoid fetching each source file through a separate API request.
- If URL retrieval is throttled or unavailable, explain the problem and offer ZIP upload as a fallback.

GitHub provides source archives for branches, tags, and commits. If the REST archive endpoint is used, its request remains subject to GitHub’s REST API rate limits; ZIP upload does not use that API. [GitHub source archives](https://docs.github.com/en/repositories/working-with-files/using-files/downloading-source-code-archives), [GitHub archive endpoint](https://docs.github.com/en/rest/repos/contents), [GitHub REST API rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)

### 7.3 Files included in analysis

- Analyze relevant React JavaScript and TypeScript source files, including `.jsx`, `.tsx`, `.js`, and `.ts`.
- Skip dependency directories, generated output, build output, and other configured vendor directories.
- Show files that could not be parsed or components that could not be identified.
- When a repository contains multiple apps or packages, show the detected source roots and allow the reviewer to choose which supported source area to scan.

## 8. Deterministic component analysis

### 8.1 Component discovery

Use static parsing to identify likely React components, including function, arrow-function, and class components that produce JSX.

A parser that supports JSX and TypeScript can represent source as an abstract syntax tree (AST). The scanner compares that structure without depending on whitespace or code formatting. [Babel parser documentation](https://babeljs.io/docs/babel-parser)

### 8.2 Similarity signals

The first version uses a transparent combination of:

- Normalized JSX element trees, including tags and nesting.
- Prop names, declared types, and overlap.
- Event-handler names and relevant logic structure.
- Repeated style values, class names, and design tokens.
- Component names, export patterns, and nearby source patterns.

### 8.3 Candidate ranking and explanation

- Use fixed, deterministic rules to rank pairs and groups.
- Display matched signals in plain language, such as “same JSX nesting and 4 of 5 prop names overlap.”
- Treat scores as review ordering, not probability or a duplicate verdict.
- Keep the initial weights simple and tune them using the chosen demo repository.
- Do not use screenshot similarity as a required signal in the hackathon build.

Static analysis can miss components whose behavior is hidden behind wrappers, computed styles, or project-specific abstractions. It can also group components that share structure but have different meanings. Reviewers make the final decision.

## 9. Component preview and mock props

### 9.1 Best-effort rendering

- Attempt to render identified components using a locked React preview runtime.
- Run untrusted preview code in an isolated origin and sandbox with restrictive content policies.
- Keep preview code away from the main website’s cookies, storage, and privileged APIs.
- Do not run package installation scripts, repository build scripts, or arbitrary project commands.
- Restrict unsupported imports and project-specific dependencies.
- If a preview fails, keep the candidate reviewable and show source, props, and structural comparison with a clear preview error.

Browser sandboxing can restrict a frame’s access and give it an opaque origin. It must be configured carefully when the frame needs to run component scripts. [MDN: CSP sandbox](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/sandbox), [MDN: embedding content](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/General_embedding_technologies)

### 9.2 Editable mock props

Generate default mock values using deterministic rules based on declared prop types and common patterns:

- Booleans: toggle controls.
- Strings: editable text inputs.
- Numbers: editable number inputs.
- Literal and union types: selection controls.
- Arrays and objects: editable JSON.
- Callback props: harmless stubs that log the event in the preview.

Label generated values as mock data. Allow the reviewer to change them and rerender the component. When types are missing or too complex to infer, show a manual JSON editor or the source-only fallback.

## 10. Review workflow

1. **Start a scan:** Enter a public GitHub URL or upload a ZIP.
2. **Choose the revision:** For GitHub input, choose an optional branch or commit.
3. **Review scan results:** See supported components and ranked candidate groups with match explanations.
4. **Compare candidates:** Inspect best-effort previews, mock-prop controls, prop signatures, source paths, and focused source structure.
5. **Choose a relationship:** Review a pair or subset within a group.
6. **Record a decision:** Select a disposition and provide the required rationale.
7. **Prepare follow-up work:** Copy an individual or combined coding-agent instruction from the UI.
8. **Track cleanup:** Move merge work from Pending to Complete.
9. **Generate scan outputs:** View the backlog and component guidelines for this scan in the website.

## 11. Decision types and status

### Merge

The components should become one.

- Require the component to keep and a note.
- Create a migration backlog item.
- Provide an individual coding-agent instruction and include the decision in combined instructions when selected.
- Mark as Complete only after reviewer confirmation. A short note about what changed or was checked is optional.
- Include the kept component in this scan’s guidelines only after it is marked Complete.

### Keep separate

The components stay as they are.

- A note is optional.
- If the note is filled in, record the decision in this scan’s guidelines.
- If the note is blank, treat the match as dismissed: remove it from this scan’s active queue, and do not add a guideline or backlog item.
- Do not create a suppression. A future scan evaluates the source independently and may surface the pair again.

Every decision records the reviewer, timestamp, affected component IDs, a note when required, and migration status where applicable.

## 12. Per-scan records and isolation

- Store scan results and review decisions in the website, not in the scanned repository.
- Give each scan its own workspace and source identity:
  - GitHub URL plus resolved commit SHA, or
  - ZIP content hash.
- Keep prior scans as separate saved sessions if retained.
- Starting a new scan imports no previous decisions, rationale, statuses, guidelines, backlogs, or suppressions.
- Generate all outputs from the current scan only.

## 13. Generated outputs

### 13.1 Merge backlog

Show a Markdown backlog in the website and allow the reviewer to copy or download it. Each item includes:

- Decision and affected components.
- Source paths.
- Note.
- Component to keep, when applicable.
- Status and suggested next step.
- Optional reviewer note after completion.

Create items only for merge decisions.

### 13.2 Component guidelines

Generate a Markdown document named `component-guidelines.md` for the current scan. Include:

- Completed merges and the component to keep.
- Keep-separate decisions that include a note.
- Proposed merges in a clearly marked pending section.

Only completed merges name a component to keep. A keep-separate decision with a blank note does not appear.

### 13.3 Coding-agent instructions

Display copyable instructions in the review UI:

- One instruction for each Merge decision.
- One combined instruction covering all pending decisions by default, with controls to select a smaller group.

Instructions name the component to keep, affected paths, required behavior to preserve, and suggested checks. The reviewer runs them manually in a coding agent. The website does not send them to an agent or modify code.

## 14. Success criteria

The demo succeeds when:

- A reviewer can start a scan from a public GitHub URL or ZIP.
- GitHub scans record the selected revision’s commit SHA.
- React JavaScript and TypeScript components are identified with deterministic, repeatable signals.
- Candidate groups explain why their members were matched.
- The reviewer can inspect previews when available and continue with source evidence when they fail.
- Mock props can be changed and the preview rerendered.
- A reviewer can compare and decide on a candidate in under 30 seconds.
- Decisions update the current scan’s backlog and guidelines.
- A completed merge names the component to keep only after reviewer confirmation.
- The UI presents individual and combined copyable repair instructions.
- A new scan starts without importing any prior scan state.
- The presenter can demonstrate the workflow manually without a live agent integration.

## 15. Demo plan

1. Enter a presenter-selected public React repository URL or upload its ZIP.
2. Select the default branch or a known commit.
3. Show deterministic candidate groups and their matching evidence.
4. Compare an appropriate pair with editable mock props and source structure.
5. Record a Merge decision and choose the component to keep.
6. Copy the generated repair instruction and show its expected checks.
7. Mark the migration Complete with reviewer confirmation and an optional note.
8. Show the updated backlog and component guidelines for that scan.
9. Start a second scan and show that it begins with no decisions from the first.

The presenter chooses the repository and demo pairs ahead of time. The website does not provide a preloaded sample repo.

## 16. Build plan

1. **Build input handling:** Accept ZIP uploads and public GitHub URLs; validate archives, resolve revisions, and record source identities.
2. **Build deterministic indexing:** Discover React components, extract AST-based features, rank candidates, and display match explanations.
3. **Prove isolated previewing:** Render a supported component with generated mock props; provide source fallback for unsupported imports or runtime errors.
4. **Build review workspace:** Add queue, comparison details, decision forms, reviewer records, and migration statuses.
5. **Generate outputs:** Produce the scan-specific backlog, guidelines, and individual/combined coding-agent instructions.
6. **Prepare the manual demo:** Rehearse against a presenter-selected public React project and use a static source-comparison fallback if rendering fails.
