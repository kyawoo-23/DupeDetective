// Isolated component preview using a sandboxed iframe
import { useEffect, useMemo, useRef, useState } from 'react';
import { componentJsxTag } from '../../lib/componentDisplay';
import type { PropControls } from '../../lib/mockProps';
import { controlsToValues } from '../../lib/mockProps';
import type { ReactComponent } from '../../types';
import {
  PREVIEW_STUB_RUNTIME,
  previewReactDeclarations,
  unboundPreviewNames,
} from './previewBindings';

interface ComponentPreviewProps {
  component: ReactComponent;
  controls: PropControls;
}

export function ComponentPreview({ component, controls }: ComponentPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [noUi, setNoUi] = useState(false);
  const [approximate, setApproximate] = useState(false);
  const [frameHeight, setFrameHeight] = useState(220);

  const previewSource = [component.previewDependencies, sanitizeForPreview(component.source)]
    .filter(Boolean)
    .join('\n');
  const stubNames = useMemo(() => unboundPreviewNames(previewSource), [previewSource]);
  const html = buildPreviewHtml(component, controlsToValues(controls), previewSource, stubNames);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    setLoading(true);
    setPreviewError(null);
    setNoUi(false);
    setApproximate(false);
    setFrameHeight(220);

    let timeout: ReturnType<typeof setTimeout>;
    const handler = (e: MessageEvent) => {
      if (e.source !== iframe.contentWindow) return;
      if (e.data?.type === 'preview-error' && typeof e.data.message === 'string') {
        clearTimeout(timeout);
        setPreviewError(e.data.message);
        setLoading(false);
      } else if (e.data?.type === 'preview-ready') {
        clearTimeout(timeout);
        setLoading(false);
        setNoUi(e.data.empty === true);
        setApproximate(e.data.approximate === true);
      } else if (
        e.data?.type === 'preview-height' &&
        typeof e.data.height === 'number' &&
        Number.isFinite(e.data.height)
      ) {
        setFrameHeight(Math.min(720, Math.max(180, Math.ceil(e.data.height))));
      }
    };
    window.addEventListener('message', handler);

    iframe.srcdoc = html;
    timeout = setTimeout(() => {
      setPreviewError((current) => current ?? 'Preview timed out while loading its runtime.');
      setLoading(false);
    }, 5000);

    return () => {
      window.removeEventListener('message', handler);
      clearTimeout(timeout);
    };
  }, [html]);

  return (
    <div className="min-w-0">
      <div className="relative min-h-[180px] min-w-0 overflow-hidden bg-[#f8f9fb]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="animate-spin h-5 w-5 text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              focusable="false"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        )}
        {previewError && (
          <div className="p-4">
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <span className="text-amber-500 shrink-0">⚠</span>
              <div>
                <p className="text-xs font-medium text-amber-800">Preview unavailable</p>
                <p className="text-xs text-amber-700 mt-0.5">{previewError}</p>
                <p className="text-xs text-amber-600 mt-1">
                  Source code and structural comparison are still available.
                </p>
              </div>
            </div>
          </div>
        )}
        {noUi && !loading && !previewError && (
          <p className="p-4 text-sm text-slate-500" role="status">
            This component renders no visible UI with the current mock data.
          </p>
        )}
        <iframe
          ref={iframeRef}
          title={`Preview: ${componentJsxTag(component.name)}`}
          className={`block w-full min-w-0 border-0 ${previewError ? 'hidden' : loading ? 'opacity-0' : 'opacity-100'}`}
          style={{ height: `${frameHeight}px` }}
          sandbox="allow-scripts"
        />
        <div className="absolute top-2 right-2">
          <span className="bg-slate-100 text-slate-400 text-xs rounded px-1.5 py-0.5">mock</span>
        </div>
      </div>
      {(stubNames.length > 0 || approximate) && !previewError && !loading && (
        <p className="border-t border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] leading-4 text-slate-500">
          Approximate preview. Project dependencies are placeholders.
        </p>
      )}
    </div>
  );
}

// ──────────────────────────────────────────
// Build self-contained preview HTML
// ──────────────────────────────────────────
export function buildPreviewHtml(
  component: ReactComponent,
  props: Record<string, unknown>,
  previewSource: string,
  stubNames: string[]
): string {
  const source = scriptLiteral(previewSource);
  const propValues = scriptLiteral(props);
  const componentName = scriptLiteral(component.name);
  const stubDeclarations = stubNames
    .map((name) => `const ${name} = __previewStub(${JSON.stringify(name)});`)
    .join('\n');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' https://unpkg.com; style-src 'unsafe-inline' https://unpkg.com https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src data:; connect-src https://unpkg.com; form-action 'none'; base-uri 'none'">

<style type="text/tailwindcss">
  @theme {
    --font-sans: "Schibsted Grotesk", ui-sans-serif, system-ui, sans-serif;
    --color-indigo-50: #eef3fc;
    --color-indigo-100: #d9e4f8;
    --color-indigo-200: #b7cbf0;
    --color-indigo-300: #8aabe4;
    --color-indigo-500: #3d6fd4;
    --color-indigo-600: #2457c5;
    --color-indigo-700: #1c459e;
    --color-indigo-800: #16367c;
    --color-slate-50: #f4f6f8;
    --color-slate-100: #eef1f4;
    --color-slate-200: #d5dce3;
    --color-slate-300: #c3cdd6;
    --color-slate-400: #8b97a6;
    --color-slate-500: #5c6b7a;
    --color-slate-600: #3e4c5e;
    --color-slate-700: #2a3848;
    --color-slate-800: #1e2a3a;
    --color-slate-900: #172033;
    --color-emerald-50: #e7f4f3;
    --color-emerald-100: #cde8e6;
    --color-emerald-200: #a3d4d1;
    --color-emerald-600: #0f6e6b;
    --color-emerald-700: #0c5856;
    --color-emerald-800: #0a4846;
  }
</style>
<script src="https://unpkg.com/@tailwindcss/browser@4"></script>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 16px; font-family: "Schibsted Grotesk", ui-sans-serif, system-ui, sans-serif; font-size: 14px; line-height: 1.5; color: #172033; background: #f4f6f8; }
  button { cursor: pointer; }
  a { color: #2457c5; }
  .dd-stub { display: flex; flex-direction: column; gap: 8px; min-width: 0; max-width: 100%; }
  .dd-stub-input { display: block; width: 100%; max-width: 100%; box-sizing: border-box; border: 1px solid #d5dce3; border-radius: 8px; padding: 8px 10px; font: inherit; color: inherit; background: white; resize: vertical; }
  .dd-stub-button { border: 0; border-radius: 8px; background: #2457c5; color: white; font: inherit; font-weight: 600; padding: 8px 12px; }
</style>
</head>
<body>
<div id="root"></div>
<script>
function notifyReady() {
  try {
    const visible = Array.from(document.body.querySelectorAll('*')).some(function (node) {
      if (['SCRIPT', 'STYLE', 'LINK', 'META'].includes(node.tagName)) return false;
      const style = getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || !node.getClientRects().length) return false;
      for (let ancestor = node; ancestor && ancestor !== document.body; ancestor = ancestor.parentElement) {
        if (getComputedStyle(ancestor).opacity === '0') return false;
      }
      if (Array.from(node.childNodes).some(function (child) { return child.nodeType === Node.TEXT_NODE && child.textContent.trim(); })) return true;
      if (node.matches('img,svg,canvas,video,audio,input,textarea,select,button,hr,iframe')) { const box = node.getBoundingClientRect(); return box.width > 0 && box.height > 0; }
      return node.id !== 'root' && node.getBoundingClientRect().height > 0 && (parseFloat(style.borderTopWidth) > 0 || (style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent'));
    });
    window.parent.postMessage({ type: 'preview-ready', empty: !visible, approximate: window.__previewApproximate === true }, '*');
  } catch(e){}
}
function notifyError(msg) { try { window.parent.postMessage({ type: 'preview-error', message: String(msg) }, '*'); } catch(e){} }
function notifyHeight() {
  try { window.parent.postMessage({ type: 'preview-height', height: document.documentElement.scrollHeight }, '*'); } catch(e){}
}

window.onerror = function(msg, _src, line, _column, error) {
  notifyError('Runtime error: ' + (error?.message || msg) + (line ? ' (line ' + line + ')' : ''));
  return true;
};
window.onunhandledrejection = function(e) {
  notifyError('Unhandled promise: ' + (e.reason?.message || e.reason));
};
</script>
<script src="https://unpkg.com/react@18.3.1/umd/react.production.min.js" crossorigin="anonymous"
  onerror="notifyError('Could not load React. Check your internet connection.')"></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js" crossorigin="anonymous"
  onerror="notifyError('Could not load ReactDOM.')"></script>
<script src="https://unpkg.com/@babel/standalone@7.29.9/babel.min.js" crossorigin="anonymous"
  onerror="notifyError('Could not load Babel transformer.')"></script>
<script>
${PREVIEW_STUB_RUNTIME}
try {
  if (!window.React || !window.ReactDOM || !window.Babel) {
    throw new Error('The preview runtime could not be loaded.');
  }
  const source = ${source};
  if (source.includes('use(') && typeof React.use !== 'function') {
    throw new Error('This component uses React 19 use(), which is unavailable in the React 18 preview runtime.');
  }
  const componentName = ${componentName};
  const transformed = Babel.transform(source, {
    presets: ['react', 'typescript'],
    filename: 'preview.tsx',
  }).code;
  const makeComponent = new Function('React',
    ${scriptLiteral(previewReactDeclarations(previewSource))} +
    String.fromCharCode(10) + ${scriptLiteral(stubDeclarations)} + String.fromCharCode(10) +
    transformed + String.fromCharCode(10) +
    'return ' + componentName + ';');
  let approximate = ${stubNames.length > 0};
  function placeholderChild(child) {
    if (typeof child === 'function' && __previewMockValues.has(child)) { approximate = true; window.__previewApproximate = true; return 'Mock value'; }
    return Array.isArray(child) ? child.map(placeholderChild) : child;
  }
  const previewReact = Object.assign({}, React, {
    createElement: function (type, props) {
      const children = Array.prototype.slice.call(arguments, 2).map(placeholderChild);
      if (type == null) {
        approximate = true; window.__previewApproximate = true;
        return React.createElement('span', {'data-placeholder': 'unresolved'}, 'Unresolved component (placeholder)');
      }
      return React.createElement.apply(React, [type, props].concat(children));
    },
    cloneElement: function (element, props) {
      const children = Array.prototype.slice.call(arguments, 2).map(placeholderChild);
      if (!React.isValidElement(element)) {
        approximate = true; window.__previewApproximate = true;
        element = React.createElement('span', null, typeof element === 'string' ? element : 'Mock content');
      }
      return React.cloneElement.apply(React, [element, props].concat(children));
    }
  });
  const Component = makeComponent(previewReact);
  const props = ${propValues};
  const inferredProps = ${scriptLiteral(component.previewPropValues ?? {})};
  function hydrate(value, template) {
    if (typeof template === 'string' && template.startsWith('__date__') && typeof value === 'string' && !value.startsWith('__date__')) return new Date(value);
    if (typeof template === 'string' && template.startsWith('__element__') && typeof value === 'string' && !value.startsWith('__element__')) return React.createElement('span', null, value);
    if (typeof value === 'string' && value.startsWith('__date__')) return new Date(value.slice(8));
    if (typeof value === 'string' && value.startsWith('__element__')) return React.createElement('span', null, value.slice(11));
    if (typeof value === 'string' && value.startsWith('__callback__')) return function () { return /listen|subscribe/.test(value) ? function () {} : /children|render/.test(value) ? 'Mock content' : undefined; };
    if (Array.isArray(value)) return value.map(function (item, index) { return hydrate(item, template?.[index]); });
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, hydrate(item, template?.[key])]));
    return value;
  }
  for (const key of Object.keys(props)) props[key] = hydrate(props[key], inferredProps[key]);

  class PreviewBoundary extends React.Component {
    constructor(props) { super(props); this.state = { error: null }; }
    static getDerivedStateFromError(error) { return { error }; }
    componentDidCatch(error) {
      const message = error?.message || String(error);
      const missing = message.match(/^([A-Za-z_$][A-Za-z0-9_$]*) is not defined$/);
      notifyError(missing
        ? 'This component needs project dependency ' + missing[1] + ', which the isolated preview cannot load.'
        : 'Render error: ' + message);
    }
    componentDidMount() {
      if (!this.state.error) {
        if (props.isOpen !== false && props.open !== false) {
          for (const dialog of document.querySelectorAll('dialog')) {
            try { if (!dialog.open) dialog.showModal(); } catch(e) {}
          }
        }
        window.__previewApproximate = approximate;
        // Loading frames may be transparent or offscreen; animation frames can be suspended.
        setTimeout(function () { notifyReady(); notifyHeight(); }, 0);
        let pending;
        new MutationObserver(function () {
          clearTimeout(pending);
          pending = setTimeout(function () { notifyReady(); notifyHeight(); }, 50);
        }).observe(document.body, {childList: true, subtree: true, attributes: true, characterData: true});
        if (typeof ResizeObserver !== 'undefined') {
          new ResizeObserver(notifyHeight).observe(document.getElementById('root'));
        }
      }
    }
    render() { return this.state.error ? null : this.props.children; }
  }
  const container = document.getElementById('root');
  if (!container) throw new Error('No root element');
  const root = ReactDOM.createRoot(container);
  root.render(React.createElement(PreviewBoundary, null, React.createElement(Component, props)));
} catch(e) {
  notifyError(e.message || String(e));
}
</script>
</body>
</html>`;
}

function scriptLiteral(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function sanitizeForPreview(source: string): string {
  // Remove import/export statements — they don't work in inline Babel
  return source
    .replace(/^import\s+.*?from\s+['"][^'"]*['"]\s*;?\s*$/gm, '// [import removed]')
    .replace(/^import\s+['"][^'"]*['"]\s*;?\s*$/gm, '// [import removed]')
    .replace(/^export\s+(default\s+)?/gm, '')
    .replace(/^export\s*\{[^}]*\}\s*;?\s*$/gm, '');
}
