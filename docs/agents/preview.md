# Component preview

Apply this guide when changing component execution, iframe isolation, mock props, preview errors, or the bundled demo project.

- Attempt best-effort rendering in a locked React runtime. Run scanned code in an isolated origin and sandbox with restrictive content policies, away from the app's cookies, storage, and privileged APIs.
- Restrict unsupported imports and project-specific dependencies. Never run repository package installation, build scripts, or arbitrary project commands. Substitute harmless placeholders for those bindings so markup can still render, and label that result as an approximate preview.
- Include referenced static constants declared in the component's source file, such as style maps, when building preview code. Keep dynamic declarations and imports outside the preview.
- Generate mock values deterministically from prop types and common patterns: text for strings, toggles for booleans, number inputs, choices for literal unions, JSON for arrays and objects, and harmless logging stubs for callbacks.
- Label generated values as mock data. Let reviewers edit them and rerender. Offer a manual JSON editor when inference is uncertain.
- Keep the review usable if rendering fails: show a clear error alongside source, props, and structural comparison.
- `demo-project/` is the bundled sample repository for scans and previews. Keep its components visually presentable for demos.

- Preview prop inference lives in `src/lib/previewProps.ts`. Read PropTypes, destructured aliases, defaults, and accessed object/array paths statically; never evaluate a repository to infer data. Persist inferred values with each component so controls remain editable.
- Report null, false, empty fragments, and hidden output as “no visible UI with the current mock data.” Do not conflate empty output with a runtime failure. Count portal content and update the status when the DOM changes.
- Imported compound components, context values, hooks, and data collections may use clearly labeled placeholders. Preserve real React APIs and do not let browser globals such as `Image` override JSX component placeholders.
- Use `npm run test:preview` for browser regressions and append source directories to stress-test a corpus. See [preview stress tests](../preview-stress-test.md). The tests run scanned code only in sandboxed frames, including when testing local repositories.
