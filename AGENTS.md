# DupeDetective

DupeDetective is a web app for finding and reviewing similar React components in a public GitHub repository or uploaded ZIP.

Read the guide for the area you are changing:

- [Scan sources](docs/agents/scan-sources.md): GitHub revisions, ZIP validation, file selection, source identity, and the dev-server archive proxy.
- [Component analysis](docs/agents/component-analysis.md): React discovery, deterministic similarity, grouping, and match evidence.
- [Preview](docs/agents/preview.md): isolated rendering, mock props, source fallback, and the bundled demo project.
- [Review and outputs](docs/agents/review-and-outputs.md): group decisions, scan isolation, verdict drafts, the member roster, backlog, and coding-agent instructions.
- [Interface](docs/agents/ui.md): URL query state and component path chips.
- [Tooling](docs/agents/tooling.md): Vite config, the scan bundle, and the browser TypeScript project.

When a change may fall outside product scope, read the [PRD](docs/PRD.md).

## Learned User Preferences

- Show React component names in JSX form (e.g. `<FormField />`) in review and queue UI, not bare identifiers.
- Fix existing popover and sheet overlays in place; do not replace them with a different overlay primitive.
- Use `react-hot-toast` for success/error toasts, styled to match the app.
- Keep the app favicon colors aligned with `DetectiveIcon`.

## Learned Workspace Facts

- DupeDetective is built for the IBM Bob 2.0 Hackathon by team DarkLunar (Kyaw Kyaw Oo); the site footer carries that context and the GitHub repo link, and a live deploy is at https://dupe-detective-one.vercel.app/.
- The scan start page can load the bundled `demo-project.zip` as a one-click demo.
- Hackathon slides live at `docs/hackathon-slides.html` (also served from `public/`) and open from the app nav as a fullscreen modal.
