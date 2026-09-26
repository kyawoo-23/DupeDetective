# Tooling

Apply this guide when changing Vite config, the scan bundle, or the root TypeScript project.

- The scan bundle includes `@babel/parser` and `@babel/types`. The `define` block in `vite.config.ts` supplies the `process.env` reads those packages expect at init.
- The root `tsconfig.json` typechecks `src/` as a browser project. In `vite.config.ts`, read Vite's `mode` so that file typechecks without `@types/node`.
