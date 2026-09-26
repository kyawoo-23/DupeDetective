# Scan sources

Apply this guide when changing scan input, archive handling, GitHub fetching, or source selection.

- Accept public GitHub repositories and project ZIP archives. GitHub scans may target a branch or commit; default to the repository's default branch.
- Resolve a GitHub reference to a commit SHA and record that SHA in the scan source identity. Fetch an archive for that revision instead of requesting files individually. Explain throttling or retrieval failures and offer ZIP upload.
- Validate ZIP paths before extraction. Enforce configurable archive size, expanded size, file count, and nesting depth limits; reject malformed and traversal paths. Identify a ZIP scan by a content hash of the archive bytes.
- Analyze React `.js`, `.jsx`, `.ts`, and `.tsx` source. Skip dependencies, generated output, build output, and configured vendor directories. Surface parse and discovery failures.
- For repositories with multiple source areas, show the detected roots and let the reviewer select a supported area.
- Treat every new scan as a fresh workspace. Prior decisions and outputs belong only to their original scan.
