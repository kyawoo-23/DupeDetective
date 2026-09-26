import * as parser from '@babel/parser';
import traverseModule from '@babel/traverse';
import * as t from '@babel/types';

const traverse =
  typeof traverseModule === 'function'
    ? traverseModule
    : (traverseModule as unknown as { default: typeof traverseModule }).default;

// Names the preview function already provides, plus language globals that must
// not be redeclared. Project bindings are everything else.
const PREVIEW_PROVIDED = new Set([
  'React',
  'ReactDOM',
  'Fragment',
  'use',
  'useState',
  'useEffect',
  'useMemo',
  'useCallback',
  'useRef',
  'useContext',
  'forwardRef',
  'memo',
  'Component',
  'PureComponent',
  'Children',
  'createElement',
  'cloneElement',
  'isValidElement',
  'createContext',
  'createRef',
  'useReducer',
  'useLayoutEffect',
  'useImperativeHandle',
  'useDebugValue',
  'useId',
  'useDeferredValue',
  'useTransition',
  'useSyncExternalStore',
  'useInsertionEffect',
  'Suspense',
  'lazy',
  'createPortal',
  'ResizeObserver',
  'IntersectionObserver',
  'MutationObserver',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'window',
  'document',
  'navigator',
  'location',
  'URL',
  'URLSearchParams',
  'undefined',
  'NaN',
  'Infinity',
  'arguments',
  'eval',
]);

const RESERVED = new Set([
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'function',
  'if',
  'import',
  'in',
  'instanceof',
  'new',
  'null',
  'return',
  'super',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'enum',
  'implements',
  'interface',
  'let',
  'package',
  'private',
  'protected',
  'public',
  'static',
  'yield',
  'await',
]);

const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

function isHostGlobal(name: string): boolean {
  if (typeof globalThis === 'undefined' || !(name in globalThis)) return false;
  const value = Object.getOwnPropertyDescriptor(globalThis, name)?.value;
  return typeof value === 'function' || (typeof value === 'object' && value !== null);
}

function isTypePosition(path: {
  parent: t.Node;
  findParent: (predicate: (parent: { type: string }) => boolean) => unknown;
}): boolean {
  if (path.parent.type.startsWith('TS')) return true;
  return Boolean(
    path.findParent(
      (parent) =>
        parent.type === 'TSTypeAnnotation' ||
        parent.type === 'TSTypeParameterInstantiation' ||
        parent.type === 'TSTypeParameterDeclaration'
    )
  );
}

function jsxComponentName(name: t.JSXOpeningElement['name']): string | null {
  if (t.isJSXIdentifier(name)) return /^[A-Z]/.test(name.name) ? name.name : null;
  if (!t.isJSXMemberExpression(name)) return null;
  let object = name.object;
  while (t.isJSXMemberExpression(object)) object = object.object;
  return t.isJSXIdentifier(object) ? object.name : null;
}

export function unboundPreviewNames(source: string, includeRuntime = false): string[] {
  let ast: t.File;
  try {
    ast = parser.parse(source, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });
  } catch {
    return [];
  }

  const names = new Set<string>();
  const consider = (
    name: string,
    scope: { hasBinding: (bindingName: string) => boolean },
    path: {
      parent: t.Node;
      findParent: (predicate: (parent: { type: string }) => boolean) => unknown;
    },
    jsx = false
  ) => {
    if (
      !IDENTIFIER.test(name) ||
      RESERVED.has(name) ||
      (!includeRuntime && PREVIEW_PROVIDED.has(name))
    )
      return;
    if (isTypePosition(path) || (!jsx && isHostGlobal(name)) || scope.hasBinding(name)) return;
    names.add(name);
  };

  traverse(ast, {
    ReferencedIdentifier(path) {
      consider(path.node.name, path.scope, path);
    },
    JSXOpeningElement(path) {
      const name = jsxComponentName(path.node.name);
      if (name) consider(name, path.scope, path, true);
    },
  });

  return [...names].sort();
}

export function previewReactDeclarations(source: string): string {
  const reactNames = new Set([
    'Component',
    'PureComponent',
    'Fragment',
    'Children',
    'Suspense',
    'lazy',
    'memo',
    'forwardRef',
    'createElement',
    'cloneElement',
    'isValidElement',
    'createContext',
    'createRef',
    'use',
    'useState',
    'useEffect',
    'useMemo',
    'useCallback',
    'useRef',
    'useContext',
    'useReducer',
    'useLayoutEffect',
    'useImperativeHandle',
    'useDebugValue',
    'useId',
    'useDeferredValue',
    'useTransition',
    'useSyncExternalStore',
    'useInsertionEffect',
  ]);
  return unboundPreviewNames(source, true)
    .flatMap((name) =>
      reactNames.has(name)
        ? [`const ${name} = React.${name};`]
        : name === 'createPortal'
          ? ['const createPortal = ReactDOM.createPortal;']
          : []
    )
    .join('\n');
}

// Runs inside the sandboxed preview document. Placeholders stand in for project
// imports so the component's own markup can still render.
export const PREVIEW_STUB_RUNTIME = `
const __previewStubCache = new Map();
const __previewMockValues = new WeakSet();
const __previewEmptyDeps = [];
function __previewStub(name) {
  if (__previewStubCache.has(name)) return __previewStubCache.get(name);
  const stub = __createPreviewStub(name);
  __previewStubCache.set(name, stub);
  return stub;
}
function __primitiveStub(label) {
  const cache = new Map();
  const fn = function previewStub() { return __primitiveStub(label + '()'); };
  const proxy = new Proxy(fn, {
    get(_target, prop) {
      if (prop === Symbol.iterator) return function* () { for (let i = 0; i < 8; i++) yield __primitiveStub(label + '.' + i); };
      if (prop === '$$typeof') return undefined;
      if (prop === Symbol.toPrimitive || prop === 'valueOf') return function () { return 'Mock'; };
      if (prop === 'toString') return function () { return 'Mock'; };
      if (prop === 'then') return undefined;
      if (typeof prop !== 'string') return undefined;
      if (prop === 'length') return label.split('.').length > 6 ? 0 : 1;
      if (prop === 'avatar' || prop === 'gravatarUrl') return null;
      if (/^(is|has|can|should)[A-Z]/.test(prop)) return /^(isOpen|isVisible|isPersisted|can)/.test(prop);
      if (prop === 'text' || prop === 'name' || prop === 'username' || prop === 'id' || prop === 'content' || prop === 'title' || prop === 'placeholder') return 'Mock ' + prop;
      if (prop === 'getTime') return function () { return 1768478400000; };
      if (prop === 'toISOString') return function () { return '2026-01-15T12:00:00.000Z'; };
      if (prop === 'includes') return function () { return false; };
      if (prop === 'split') return function () { return ['Mock']; };
      if (prop === 'trim' || prop === 'replace' || prop === 'toUpperCase' || prop === 'toLowerCase') return function () { return 'Mock'; };
      if (prop === 'slice' || prop === 'concat' || prop === 'sort') return function () { return []; };
      if (/^[A-Z][A-Z_0-9]*$/.test(prop)) return prop.toLowerCase();
      if (prop === 'find') return function () { return __primitiveStub(label + '.item'); };
      if (prop === 'map' || prop === 'flatMap' || prop === 'filter' || prop === 'forEach' || prop === 'reduce' || prop === 'some' || prop === 'every' || prop === 'find') {
        return Array.prototype[prop].bind(label.split('.').length > 6 ? [] : [__primitiveStub(label + '.item')]);
      }
      if (!cache.has(prop)) cache.set(prop, __primitiveStub(label + '.' + prop));
      return cache.get(prop);
    },
    apply() { return __primitiveStub(label + '()'); },
    construct() { return {}; }
  });
  __previewMockValues.add(proxy);
  return proxy;
}
function __assignRef(ref, node) {
  if (typeof ref === 'function') ref(node);
  else if (ref && typeof ref === 'object') ref.current = node;
}
function __componentStub(name) {
  const component = React.forwardRef(function PreviewStub(props, ref) {
    props = props || {};
    const forwardedRef = ref;
    ref = function (node) {
      __assignRef(forwardedRef, node && new Proxy(node, {
        get(target, key) {
          const value = Reflect.get(target, key, target);
          return typeof value === 'function' ? value.bind(target) : value === undefined && typeof key === 'string' ? function () {} : value;
        }
      }));
    };
    if (typeof props.children === 'function') return props.children(__primitiveStub(name + '.renderProps'), __primitiveStub(name + '.renderState'));
    if (props.trigger) return React.createElement('div', {className: 'dd-stub'}, props.trigger, props.children);

    if (typeof props.onSubmit === 'function') {
      return React.createElement('form', {
        ref: ref,
        className: 'dd-stub',
        onSubmit: function (event) {
          event.preventDefault();
          props.onSubmit(event);
        }
      }, props.children);
    }
    const looksLikeField = Object.prototype.hasOwnProperty.call(props, 'value') || props.placeholder || props.rows || props.onChange;
    if (looksLikeField) {
      return React.createElement('textarea', {
        ref: function (node) {
          __assignRef(ref, node);
          __assignRef(props.inputRef, node);
        },
        className: 'dd-stub-input',
        value: typeof props.value === 'string' ? props.value : '',
        placeholder: typeof props.placeholder === 'string' ? props.placeholder : '',
        rows: props.rows || 2,
        onChange: function (event) {
          if (typeof props.onChange === 'function') props.onChange(event, event.target.value);
        },
        onFocus: props.onFocus,
        onKeyDown: props.onKeyDown
      });
    }
    if ((props.content != null && !props.children) || (props.onClick && !props.children)) {
      return React.createElement('button', {
        ref: ref,
        type: props.type === 'submit' ? 'submit' : 'button',
        className: 'dd-stub-button',
        onClick: props.onClick
      }, typeof props.content === 'string' && props.content ? props.content : name);
    }
    return React.createElement('div', { ref: ref, className: 'dd-stub', 'data-stub': name }, props.children || props.content || props.label || React.createElement('span', {'data-placeholder': name}, name + ' (placeholder)')); 
  });
  return new Proxy(component, {
    get(target, prop) {
      if (prop in target || typeof prop !== 'string' || ['then', 'defaultProps', 'propTypes', 'displayName'].includes(prop)) return target[prop];
      return __previewStub(name + '.' + prop);
    }
  });
}
function __hookStub(name) {
  if (name === 'useSelector' || name === 'useStore') {
    return function useSelector() {
      return React.useMemo(function () { return __primitiveStub('state'); }, __previewEmptyDeps);
    };
  }
  if (name === 'useRouter' || name === 'useNavigate') return function () { return __primitiveStub('router'); };
  if (name === 'useSearchParams') return function () { const params = new URLSearchParams(); const result = [params, function () {}]; for (const key of ['get', 'getAll', 'has', 'entries', 'toString']) result[key] = params[key].bind(params); return result; };
  if (name === 'useParams') return function () { return {id: 'preview-1'}; };
  if (name === 'useLocation') return function () { return {pathname: '/', search: '', hash: '', state: null}; };
  if (name === 'useDispatch') {
    return function useDispatch() {
      return React.useCallback(function dispatch() {}, __previewEmptyDeps);
    };
  }
  if (name === 'useTranslation' || name === 'useTranslate') {
    return function useTranslation() {
      const translate = React.useCallback(function translate(key, options) {
        if (options && options.postProcess === 'parseDate') return new Date('2026-01-15T12:00:00.000Z');
        const text = String(key == null ? '' : key);
        const leaf = text.split('.').pop() || text;
        const spaced = leaf.replace(/([a-z])([A-Z])/g, '$1 $2');
        return spaced.charAt(0).toUpperCase() + spaced.slice(1);
      }, __previewEmptyDeps);
      const i18n = {t: translate, language: 'en', resolvedLanguage: 'en', exists: function () {return false;}, changeLanguage: function () {}};
      const result = [translate, i18n];
      result.t = translate; result.i18n = i18n; result.ready = true;
      return result;
    };
  }
  if (/^usePopup/.test(name)) return function () { return __componentStub(name.slice(3)); };
  if (name === 'useClosableModal') return function () { return [__componentStub('Modal'), {current: false}, function () {}, function () {}, function () {}]; };
  if (name === 'useModal') return function () { return [false, function () {}, function () {}]; };
  if (name === 'useDropzone') return function () { return {getRootProps: function () {return {};}, getInputProps: function () {return {};}, acceptedFiles: [], isDragActive: false}; };
  if (name === 'useSteps') return function () { return [null, function () {}, function () {}]; };
  if (name === 'useField') return function (initial) { return React.useState(initial == null ? '' : initial); };
  if (name === 'useEventCallback') return function (callback) { return callback; };
  if (name === 'useInView') return function () { return [function () {}, true]; };
  if (name === 'useWindowWidth') return function () { return 800; };
  if (name === 'useMarkdownEditor') return function () { return __primitiveStub('editor'); };
  if (name === 'useForm') {
    return function useForm(initial) {
      const [data, setData] = React.useState(function () {
        try {
          const value = typeof initial === 'function' ? initial() : initial;
          if (value && typeof value === 'object') return value;
        } catch (error) { /* initializer may read placeholder state */ }
        return { text: '' };
      });
      return [data, function () {}, setData];
    };
  }
  if (name === 'useToggle') {
    return function useToggle(initial) {
      const [value, setValue] = React.useState(Boolean(initial));
      const toggle = React.useCallback(function toggle() {
        setValue(function (current) { return !current; });
      }, __previewEmptyDeps);
      return [value, toggle, setValue];
    };
  }
  if (name === 'useNestedRef' || name === 'useForkRef' || name === 'useMergedRef') {
    return function useNestedRef() {
      const ref = React.useRef(null);
      const setRef = React.useCallback(function setRef(node) { ref.current = node; }, __previewEmptyDeps);
      return [ref, setRef];
    };
  }
  if (name === 'useDidUpdate' || name === 'useUpdateEffect' || name === 'useIsomorphicLayoutEffect') {
    return function useDidUpdate(effect, deps) {
      React.useEffect(function () {
        try { if (typeof effect === 'function') effect(); } catch (error) { /* project effects can touch unloaded refs */ }
      }, deps || __previewEmptyDeps);
    };
  }
  if (name === 'useClickAwayListener' || name === 'useClickAway' || name === 'useOnClickOutside') {
    return function useClickAwayListener() { return {}; };
  }
  if (name === 'useEscapeInterceptor') {
    return function useEscapeInterceptor() {
      const noop = React.useCallback(function noop() {}, __previewEmptyDeps);
      return [noop, noop];
    };
  }
  return function usePreviewStub(initial) {
    const [value, setValue] = React.useState(initial);
    const noop = React.useCallback(function noop() {}, __previewEmptyDeps);
    return [value, setValue, noop];
  };
}
function __createPreviewStub(name) {
  if (name === 'Fragment') return React.Fragment;
  if (name === 'Component') return React.Component;
  if (/^use[A-Z0-9]/.test(name)) return __hookStub(name);
  if (name !== 'DragDropContext' && /Context$/.test(name)) return React.createContext(__primitiveStub(name));
  if (name === 'classNames' || name === 'clsx' || name === 'cn') return function () {return Array.from(arguments).filter(function(v) {return typeof v === 'string';}).join(' ');};
  if (/^[A-Z][A-Z_0-9]+$/.test(name)) return ['Mock item'];
  if (/^(Paths|.*Types|.*Roles|.*Statuses|.*Modes|.*Sizes|.*Colors|.*Constants|Config)$/.test(name)) return __primitiveStub(name);
  if (/^use[A-Z0-9]/.test(name)) return __hookStub(name);
  if (/^[A-Z]/.test(name)) return __componentStub(name);
  if (name === 'styles' || /Styles$/.test(name) || /Classes$/.test(name)) {
    return new Proxy({}, {
      get(_target, prop) { return typeof prop === 'string' ? prop : ''; }
    });
  }
  return __primitiveStub(name);
}
`;
