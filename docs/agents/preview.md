# Component preview

Apply this guide when changing component execution, iframe isolation, mock props, or preview errors.

- Attempt best-effort rendering in a locked React runtime. Run scanned code in an isolated origin and sandbox with restrictive content policies, away from the app's cookies, storage, and privileged APIs.
- Restrict unsupported imports and project-specific dependencies. Never run repository package installation, build scripts, or arbitrary project commands.
- Include referenced static constants declared in the component's source file, such as style maps, when building preview code. Keep dynamic declarations and imports outside the preview.
- Generate mock values deterministically from prop types and common patterns: text for strings, toggles for booleans, number inputs, choices for literal unions, JSON for arrays and objects, and harmless logging stubs for callbacks.
- Label generated values as mock data. Let reviewers edit them and rerender. Offer a manual JSON editor when inference is uncertain.
- Keep the review usable if rendering fails: show a clear error alongside source, props, and structural comparison.
