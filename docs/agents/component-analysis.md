# Component analysis

Apply this guide when changing parsing, feature extraction, candidate scoring, grouping, or match explanations.

- Discover likely React function, arrow-function, and class components that produce JSX, using static parsing of JavaScript and TypeScript.
- Compare normalized JSX structure, prop names and types, event handlers and relevant logic, repeated styles and class names, component names, exports, and nearby source patterns.
- Use fixed, deterministic rules for ranking and grouping, without AI similarity scoring. Keep scores as review-order hints. Explain the contributing signals in plain language.
- Preserve source paths and focused structural evidence so a reviewer can inspect a match when rendering fails.
- Account for false positives and missed matches caused by wrappers, computed styles, and project-specific abstractions. The reviewer decides the relationship.
- Keep screenshot similarity outside the required hackathon ranking signals.
