/** Real browser tests: scanned code executes only in sandboxed, opaque-origin iframes. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const project = fileURLToPath(new URL('../', import.meta.url));
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'dupe-preview-'));
const bundle = path.join(temp, 'preview.cjs');
await build({
  stdin: {
    contents: `
export {parseFile} from './src/lib/parser';
export {generateMockProps,controlsToValues} from './src/lib/mockProps';
export {buildPreviewHtml,sanitizeForPreview} from './src/components/preview/ComponentPreview';
export {unboundPreviewNames} from './src/components/preview/previewBindings';`,
    resolveDir: project,
  },
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: bundle,
  logLevel: 'silent',
});
const {
  parseFile,
  generateMockProps,
  controlsToValues,
  buildPreviewHtml,
  sanitizeForPreview,
  unboundPreviewNames,
} = require(bundle);
const cases = [];
const discoveryErrors = [];
const fixtures = JSON.parse(
  fs.readFileSync(path.join(project, 'tests/preview/fixtures.json'), 'utf8')
);
for (const fixture of fixtures) {
  const { components, errors } = parseFile(fixture.file || `${fixture.name}.tsx`, fixture.source);
  assert.deepEqual(errors, [], fixture.name);
  assert.equal(
    components.length,
    fixture.discovered === false ? 0 : 1,
    `${fixture.name}: discovery`
  );
  if (components[0]) cases.push({ component: components[0], expected: fixture });
}
for (const corpus of process.argv.slice(2)) {
  function visit(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', '.git', 'dist', 'build'].includes(entry.name)) continue;
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (/\.[jt]sx?$/.test(file)) {
        const { components, errors } = parseFile(file, fs.readFileSync(file, 'utf8'));
        discoveryErrors.push(...errors);
        cases.push(...components.map((component) => ({ component })));
      }
    }
  }
  visit(path.resolve(corpus));
}
const installedChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const executablePath =
  process.env.PREVIEW_CHROME || (fs.existsSync(installedChrome) ? installedChrome : undefined);
const browser = await chromium.launch({ executablePath, headless: true });
const context = await browser.newContext();
// Supply exactly the preview's React/Babel runtime without downloading repository imports.
const runtimes = {
  react: fs.readFileSync(
    path.join(path.dirname(require.resolve('react/package.json')), 'umd/react.production.min.js')
  ),
  dom: fs.readFileSync(
    path.join(
      path.dirname(require.resolve('react-dom/package.json')),
      'umd/react-dom.production.min.js'
    )
  ),
  babel: fs.readFileSync(require.resolve('@babel/standalone/babel.min.js')),
};
await context.route('**/*', async (route) => {
  const url = route.request().url();
  const body = url.includes('unpkg.com/react-dom@')
    ? runtimes.dom
    : url.includes('unpkg.com/react@')
      ? runtimes.react
      : url.includes('unpkg.com/@babel/standalone')
        ? runtimes.babel
        : '';
  await route.fulfill({
    body,
    contentType: 'application/javascript',
    headers: { 'access-control-allow-origin': '*' },
  });
});
let index = 0;
const results = [];
try {
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      const page = await context.newPage();
      while (index < cases.length) {
        const { component, expected } = cases[index++];
        const source = [component.previewDependencies, sanitizeForPreview(component.source)]
          .filter(Boolean)
          .join('\n');
        const html = buildPreviewHtml(
          component,
          controlsToValues(generateMockProps(component)),
          source,
          unboundPreviewNames(source)
        );
        await page.setContent('<html><body></body></html>');
        const result = await page.evaluate(
          (html) =>
            new Promise((resolve) => {
              const frame = document.createElement('iframe');
              frame.sandbox = 'allow-scripts';
              frame.style.cssText = 'width:640px;height:480px;border:0';
              let settle;
              let ready;
              const finish = (result) => {
                clearTimeout(timeout);
                clearTimeout(settle);
                window.removeEventListener('message', onMessage);
                resolve(result);
              };
              const onMessage = (event) => {
                if (event.source !== frame.contentWindow) return;
                if (event.data?.type === 'preview-error')
                  finish({ status: 'error', message: event.data.message });
                if (event.data?.type === 'preview-ready') {
                  ready = event.data;
                  // A fixed settling window observes passive effects and delayed empty-state updates.
                  if (!settle)
                    settle = setTimeout(() => finish({ status: 'ready', ...ready }), 250);
                }
              };
              const timeout = setTimeout(() => finish({ status: 'timeout' }), 8000);
              window.addEventListener('message', onMessage);
              document.body.appendChild(frame);
              frame.srcdoc = html;
            }),
          html
        );
        if (result.status === 'ready') {
          const frame = page.frames()[1];
          result.text = await frame.locator('body').innerText();
          if (
            process.env.PREVIEW_SCREENSHOTS &&
            (expected?.name === 'Compound' || component.name === 'AddBoardStep')
          ) {
            fs.mkdirSync(process.env.PREVIEW_SCREENSHOTS, { recursive: true });
            await page.screenshot({
              path: path.join(
                process.env.PREVIEW_SCREENSHOTS,
                `${expected?.name || component.name}.png`
              ),
            });
          }
          result.placeholders = await frame.locator('[data-placeholder], [data-stub]').count();
          assert.equal(
            await frame.evaluate(() => {
              try {
                void parent.document.body;
                return true;
              } catch {
                return false;
              }
            }),
            false,
            'sandbox must isolate the parent'
          );
        }
        const failures = [];
        if (expected?.error) {
          if (result.status !== 'error' || !result.message?.includes(expected.error))
            failures.push(`Expected error: ${expected.error}`);
        } else {
          if (result.status !== 'ready') failures.push(result.message || result.status);
          if (expected?.text && !result.text?.includes(expected.text))
            failures.push(`Expected text: ${expected.text}`);
          if (typeof expected?.empty === 'boolean' && result.empty !== expected.empty)
            failures.push(`Expected empty=${expected.empty}`);
        }
        if (failures.length) console.error(component.file + ': ' + failures.join('; '));
        results.push({
          name: expected?.name || component.name,
          file: component.file,
          ...result,
          failures,
        });
        if (results.length % 40 === 0) console.log(`Tested ${results.length}/${cases.length}`);
      }
      await page.close();
    })
  );
  if (process.env.PREVIEW_REPORT)
    fs.writeFileSync(
      process.env.PREVIEW_REPORT,
      JSON.stringify({ results, discoveryErrors }, null, 2)
    );
  // Exercise the actual parent React component as well as its generated document.
  const uiBuild = await build({
    stdin: {
      contents: `
    import React from 'react';
    import {createRoot} from 'react-dom/client';
    import {ComponentPreview} from './src/components/preview/ComponentPreview';
    import {generateMockProps} from './src/lib/mockProps';
    const root = createRoot(document.getElementById('app'));
    window.showPreview = component => root.render(React.createElement(ComponentPreview, {component, controls: generateMockProps(component)}));
  `,
      resolveDir: project,
    },
    bundle: true,
    platform: 'browser',
    format: 'iife',
    jsx: 'automatic',
    write: false,
    define: {
      'process.env.NODE_ENV': '"production"',
      'process.env.BABEL_TYPES_8_BREAKING': 'false',
    },
    logLevel: 'silent',
  });
  const ui = await context.newPage();
  ui.on('pageerror', (error) => console.error('Parent UI error:', error.message));
  await ui.setContent('<div id="app"></div>');
  await ui.addScriptTag({ content: uiBuild.outputFiles[0].text });
  await ui.evaluate(
    (component) => window.showPreview(component),
    cases.find((c) => c.expected?.name === 'Null').component
  );
  await ui.getByText('This component renders no visible UI with the current mock data.').waitFor();
  await ui.evaluate(
    (component) => window.showPreview(component),
    cases.find((c) => c.expected?.name === 'Error').component
  );
  await ui.getByText('Preview unavailable', { exact: true }).waitFor();
  await ui.evaluate(
    (component) => window.showPreview(component),
    cases.find((c) => c.expected?.name === 'Compound').component
  );
  await ui.getByText('Approximate preview. Project dependencies are placeholders.').waitFor();
  assert.equal(await ui.getByText('Preview unavailable', { exact: true }).count(), 0);
  assert.equal(
    await ui.getByText('This component renders no visible UI with the current mock data.').count(),
    0
  );
  await ui.frameLocator('iframe').getByText('Menu item', { exact: true }).waitFor();
  await ui.evaluate(
    (component) => window.showPreview(component),
    cases.find((c) => c.expected?.name === 'BrowserGlobalComponent').component
  );
  await ui.frameLocator('iframe').getByText('Image (placeholder)', { exact: true }).waitFor();
  await ui.close();
  console.log('Parent preview UI: empty state, errors, recovery, and approximation labels passed.');
} finally {
  await browser.close();
  fs.rmSync(temp, { recursive: true, force: true });
}
const failures = results.filter((result) => result.failures.length);
const summary = {
  tested: results.length,
  rendered: results.filter((r) => r.status === 'ready' && !r.empty).length,
  empty: results.filter((r) => r.status === 'ready' && r.empty).length,
  expectedErrors: results.filter((r) => r.status === 'error' && !r.failures.length).length,
  failed: failures.length,
  parseErrors: discoveryErrors.length,
};
console.log(JSON.stringify(summary, null, 2));
for (const result of failures)
  console.error(`${result.file}#${result.name}: ${result.failures.join('; ')}`);
if (process.env.PREVIEW_REPORT)
  fs.writeFileSync(
    process.env.PREVIEW_REPORT,
    JSON.stringify({ summary, discoveryErrors, results }, null, 2)
  );
if (failures.length || discoveryErrors.length) process.exitCode = 1;
