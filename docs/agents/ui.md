# Interface

Apply this guide when changing URL query state or how component paths are shown.

- URL query string state uses **nuqs**: `NuqsAdapter` from `nuqs/adapters/react-router/v6`, and `useQueryStates`.
- Show component paths as monospace code chips with the shared **`FileLocation`** component (`file` or `file:line`).
- Show scanned React component names as monospace `<Name />` tags via **`ComponentTag`** / **`ComponentTagList`** (helpers in `src/lib/componentDisplay.ts`).
