# Component analysis

Apply this guide when changing parsing, feature extraction, candidate scoring, grouping, or match explanations.

- Discover likely React function, arrow-function, and class components that produce JSX, using static parsing of JavaScript and TypeScript. Component IDs are `file#name#line`.
- Compare five fixed signals: markup (root element, tags, and ARIA roles), class tokens including template literals, prop names after aliasing shared roles, component-name families, and event or callback overlap.
- Weight a token by how rare it is among the scan's exported components. Common tags and classes contribute less than distinctive ones.
- Group with average-linkage clustering. Join two clusters while the mean pair score between them is at least `GROUP_THRESHOLD` in `src/lib/scorer.ts`. A group's score is the mean of every pair inside it. Scores order the review queue. Explain the contributing signals in plain language.
- Unexported components stay out of groups. Do not score with AI, and do not use screenshot similarity.
- Preserve source paths and focused structural evidence so a reviewer can inspect a match when rendering fails.
- Account for false positives and missed matches caused by wrappers, computed styles, and project-specific abstractions. The reviewer decides each member's role.
