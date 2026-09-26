// Isolated component preview using a sandboxed iframe
import { useEffect, useRef, useState } from 'react';
import type { PropControls } from '../../lib/mockProps';
import { controlsToValues } from '../../lib/mockProps';
import type { ReactComponent } from '../../types';

interface ComponentPreviewProps {
  component: ReactComponent;
  controls: PropControls;
}

export function ComponentPreview({ component, controls }: ComponentPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [frameHeight, setFrameHeight] = useState(220);

  const html = buildPreviewHtml(component, controlsToValues(controls));

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    setLoading(true);
    setPreviewError(null);
    setFrameHeight(220);

    let timeout: ReturnType<typeof setTimeout>;
    const handler = (e: MessageEvent) => {
      if (e.source !== iframe.contentWindow) return;
      if (e.data?.type === 'preview-error') {
        clearTimeout(timeout);
        setPreviewError(e.data.message);
        setLoading(false);
      } else if (e.data?.type === 'preview-ready') {
        clearTimeout(timeout);
        setLoading(false);
      } else if (e.data?.type === 'preview-height' &&
                 typeof e.data.height === 'number' && Number.isFinite(e.data.height)) {
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
    <div className="relative min-h-[180px] bg-[#f8f9fb]">
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
      <iframe
        ref={iframeRef}
        title={`Preview: ${component.name}`}
        className={`w-full border-0 ${previewError ? 'hidden' : loading ? 'opacity-0' : 'opacity-100'}`}
        style={{ height: `${frameHeight}px` }}
        sandbox="allow-scripts"
      />
      <div className="absolute top-2 right-2">
        <span className="bg-slate-100 text-slate-400 text-xs rounded px-1.5 py-0.5">mock</span>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// Build self-contained preview HTML
// ──────────────────────────────────────────
function buildPreviewHtml(component: ReactComponent, props: Record<string, unknown>): string {
  // Sanitize: remove any import/export statements for the preview
  const source = scriptLiteral(
    [component.previewDependencies, sanitizeForPreview(component.source)].filter(Boolean).join('\n')
  );
  const propValues = scriptLiteral(props);
  const componentName = scriptLiteral(component.name);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' https://unpkg.com; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'">
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 16px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 14px; line-height: 1.5; color: #1f2328; background: #f8f9fb; }
  button { cursor: pointer; }
  a { color: #3b82d4; }
</style>
</head>
<body>
<div id="root"></div>
<script>
function notifyReady() { try { window.parent.postMessage({ type: 'preview-ready' }, '*'); } catch(e){} }
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
<script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin="anonymous"
  onerror="notifyError('Could not load React. Check your internet connection.')"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin="anonymous"
  onerror="notifyError('Could not load ReactDOM.')"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js" crossorigin="anonymous"
  onerror="notifyError('Could not load Babel transformer.')"></script>
<script>
try {
  if (!window.React || !window.ReactDOM || !window.Babel) {
    throw new Error('The preview runtime could not be loaded.');
  }
  const source = ${source};
  if (source.includes('useRouter(') || source.includes('useSearchParams(')) {
    throw new Error('This component needs a Next.js router context, which the isolated preview does not provide.');
  }
  if (source.includes('use(') && typeof React.use !== 'function') {
    throw new Error('This component uses React 19 use(), which is unavailable in the React 18 preview runtime.');
  }
  const componentName = ${componentName};
  const transformed = Babel.transform(source, {
    presets: ['react', 'typescript'],
    filename: 'preview.tsx',
  }).code;
  const makeComponent = new Function('React',
    'const { use, useState, useEffect, useMemo, useCallback, useRef, useContext, forwardRef, memo } = React;' +
    String.fromCharCode(10) + transformed + String.fromCharCode(10) +
    'return ' + componentName + ';');
  const Component = makeComponent(React);
  const props = ${propValues};
  for (const [key, value] of Object.entries(props)) {
    if (typeof value === 'string' && value === '__callback__' + key) {
      props[key] = () => {};
    }
  }

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
        notifyReady();
        notifyHeight();
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

function sanitizeForPreview(source: string): string {
  // Remove import/export statements — they don't work in inline Babel
  return source
    .replace(/^import\s+.*?from\s+['"][^'"]*['"]\s*;?\s*$/gm, '// [import removed]')
    .replace(/^import\s+['"][^'"]*['"]\s*;?\s*$/gm, '// [import removed]')
    .replace(/^export\s+(default\s+)?/gm, '')
    .replace(/^export\s*\{[^}]*\}\s*;?\s*$/gm, '');
}
