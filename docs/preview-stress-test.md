# Component preview stress tests

Run the browser regression suite:

```sh
npm run test:preview
```

The runner uses installed Chrome on macOS, `PREVIEW_CHROME=/path/to/chrome` when supplied, or Playwright Chromium (`npx playwright install chromium`). It supplies the pinned React and Babel runtime locally, blocks other network requests, and executes scanned component code only inside `sandbox="allow-scripts"` iframes. It does not install or run the scanned project's dependencies or scripts.

To test a repository and the bundled demo:

```sh
PREVIEW_REPORT=/tmp/preview-report.json npm run test:preview -- /path/to/planka/client/src demo-project/src
```

Optional `PREVIEW_SCREENSHOTS=/tmp/preview-screenshots` captures representative previews. Reports include each component's status, visible text, placeholder count, empty-output classification, and failures. Corpus parse errors or unexpected preview errors fail the command.

## Coverage

The suite contains 47 render cases and a negative discovery case. It covers function and arrow components, classes and class expressions, anonymous default exports, nested `memo`/`forwardRef`, aliased React imports, JSX-free element creation, fragments, scalar output, null/false output, hidden output, portals, effects, native hooks, contexts, compound dependency components, render props, recursive components, PropTypes, nested object/array mock data, dates, element props, static dependencies, and browser-global name collisions.

Separate checks mount the real parent preview panel and verify the empty state, error state, recovery on component changes, approximation labels, and imported `<Image />` handling. Every successfully rendered case checks that the iframe cannot read the parent's document. Readiness must work for offscreen or transparent loading frames without waiting on `requestAnimationFrame`.

## Planka run

Source: [plankanban/planka, revision 627701d](https://github.com/plankanban/planka/tree/627701dda3459fa25830b0fd5bb2f5668d033284), inspected on 2026-09-27.

The baseline discovered 242 components: 94 reached ready and 148 failed. Final verification:

| Corpus | Components | Visible UI | No visible UI | Unexpected errors |
| --- | ---: | ---: | ---: | ---: |
| Planka | 242 | 241 | 1 | 0 |
| Bundled demo | 30 | 30 | 0 | 0 |
| Synthetic render cases | 47 | 37 | 8 | 0 |

Two synthetic cases deliberately throw to verify error reporting. An additional non-component utility fixture verifies that discovery rejects it. All corpus parses and parent-panel checks passed. Planka's remaining empty preview is `<ProjectBackground />`, whose appearance depends on project styles and background assets.

The updated preview removes the reproduced initial-render failures. It uses mock props and clearly labeled dependency placeholders, not Planka's running Redux store, stylesheets, backend, or installed dependencies.

A ready preview is not proof of fidelity to the complete application. Conditional branches depend on generated data; project CSS and unsupported dependencies can affect visibility. The empty-state message therefore says **“This component renders no visible UI with the current mock data.”** It does not claim the component can never show UI.

Arbitrary React structures and all interaction paths cannot be exhaustively covered. Async server components, React 19-only APIs in the React 18 runtime, application services, and genuinely failing component code can still require the source fallback. Errors remain visible; unsupported dynamic component types are shown as explicit placeholders.

Rescan previously saved repositories to populate the additional inferred prop metadata.
