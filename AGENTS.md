# DupeDetective

DupeDetective is a web app for finding and reviewing similar React components in a public GitHub repository or uploaded ZIP.

Use the relevant guide before changing that area:

- [Scan sources](docs/agents/scan-sources.md): GitHub revisions, ZIP validation, file selection, and source identity.
- [Component analysis](docs/agents/component-analysis.md): React discovery, deterministic similarity, and match evidence.
- [Preview](docs/agents/preview.md): isolated rendering, mock props, and source fallback.
- [Review and outputs](docs/agents/review-and-outputs.md): decisions, scan isolation, backlog, guidelines, and coding-agent instructions.

The [PRD](docs/PRD.md) defines product scope. Keep each scan's records separate and leave scanned repositories unchanged.

Run `npm run typecheck` for TypeScript validation; `npm run build` also runs `tsc` before Vite.

## Learned User Preferences

- Use **nuqs** (`NuqsAdapter` from `nuqs/adapters/react-router/v6`, `useQueryStates`) for URL query string state in the app, not manual `useSearchParams`.

## Learned Workspace Facts

- `graphify-out/` is gitignored (generated graphify output).
- GitHub archive fetch in the client uses same-origin Vite proxies (`/__github_api`, `/__github_codeload` in `vite.config.ts`); browser calls to zipball/codeload URLs fail CORS without them. Static hosting without those proxies cannot run GitHub scans from the browser.
- Scanning pulls `@babel/parser` / `@babel/types` into the browser bundle; `vite.config.ts` `define` replaces `process.env` reads those packages need at init.
- Root `tsconfig.json` is browser-scoped for `src/`; in `vite.config.ts` prefer Vite’s `mode` over Node `process.env` so typecheck stays clean without `@types/node`.
