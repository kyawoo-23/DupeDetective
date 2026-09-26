import * as t from '@babel/types';

/** Read data declarations without executing code from the scanned repository. */
export function staticPreviewValue(node: t.Node | null | undefined): unknown {
  if (t.isStringLiteral(node) || t.isNumericLiteral(node) || t.isBooleanLiteral(node))
    return node.value;
  if (t.isNullLiteral(node)) return null;
  if (t.isTSAsExpression(node) || t.isTSSatisfiesExpression(node))
    return staticPreviewValue(node.expression);
  if (t.isUnaryExpression(node) && node.operator === '-' && t.isNumericLiteral(node.argument))
    return -node.argument.value;
  if (t.isArrayExpression(node)) return node.elements.map(staticPreviewValue);
  if (t.isObjectExpression(node)) {
    const result: Record<string, unknown> = {};
    for (const prop of node.properties) {
      if (!t.isObjectProperty(prop) || prop.computed) continue;
      const key = t.isIdentifier(prop.key)
        ? prop.key.name
        : t.isStringLiteral(prop.key)
          ? prop.key.value
          : null;
      if (key && !['__proto__', 'constructor', 'prototype'].includes(key)) {
        const value = staticPreviewValue(prop.value);
        if (value !== undefined) result[key] = value;
      }
    }
    return result;
  }
  return undefined;
}

function sample(name: string): unknown {
  if (/^(is|has|can|should)[A-Z]/.test(name))
    return /^(isOpen|isVisible|isPersisted|can)/.test(name);
  if (/^(on[A-Z]|render[A-Z])/.test(name)) return `__callback__${name}`;
  if (/(count|total|size|width|height|position)$/i.test(name)) return 1;
  if (
    /^(items|options|rows|columns|data|users|members|tasks|labels|cards|boards|projects)$/.test(
      name
    )
  )
    return [];
  if (/At$/.test(name)) return '2026-01-15T12:00:00.000Z';
  if (name === 'id' || /Id$/.test(name)) return 'preview-1';
  if (name === 'color') return '#2457c5';
  if (name === 'style') return {};
  return name === 'children' ? 'Example content' : name.replace(/([a-z])([A-Z])/g, '$1 $2');
}

function propTypeValue(node: t.Node, name: string): unknown {
  if (t.isMemberExpression(node) && t.isIdentifier(node.property, { name: 'isRequired' }))
    return propTypeValue(node.object, name);
  if (t.isMemberExpression(node) && t.isIdentifier(node.property)) {
    switch (node.property.name) {
      case 'bool':
        return /^(isOpen|open|visible|isVisible)$/.test(name);
      case 'number':
        return 1;
      case 'func':
        return `__callback__${name}`;
      case 'array':
        return [];
      case 'object':
        return {};
      case 'node':
        return 'Example content';
      case 'elementType':
        return 'div';
      case 'element':
        return '__element__Example content';
      case 'string':
        return String(sample(name));
    }
  }
  if (
    t.isCallExpression(node) &&
    t.isMemberExpression(node.callee) &&
    t.isIdentifier(node.callee.property)
  ) {
    const arg = node.arguments[0];
    switch (node.callee.property.name) {
      case 'instanceOf':
        return t.isIdentifier(arg, { name: 'Date' }) ? '__date__2026-01-15T12:00:00.000Z' : {};
      case 'oneOf':
        return t.isArrayExpression(arg) ? staticPreviewValue(arg.elements[0]) : undefined;
      case 'oneOfType':
        return t.isArrayExpression(arg) && arg.elements[0]
          ? propTypeValue(arg.elements[0], name)
          : undefined;
      case 'arrayOf':
        return arg ? [propTypeValue(arg, 'item') ?? {}] : [];
      case 'shape':
      case 'exact': {
        const result: Record<string, unknown> = {};
        if (t.isObjectExpression(arg))
          for (const prop of arg.properties) {
            if (t.isObjectProperty(prop) && t.isIdentifier(prop.key) && !prop.computed)
              result[prop.key.name] = propTypeValue(prop.value, prop.key.name);
          }
        return result;
      }
    }
  }
  return undefined;
}

export function inferPreviewProps(ast: t.File, name: string, fn: t.Node): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  const aliases = new Map<string, string[]>();
  const ignored = new Set(['__proto__', 'constructor', 'prototype']);
  const first = t.isFunction(fn) ? fn.params[0] : undefined;
  const pattern = t.isAssignmentPattern(first) ? first.left : first;
  function bindPattern(node: t.Node, prefix: string[]) {
    if (t.isIdentifier(node)) aliases.set(node.name, prefix);
    if (t.isAssignmentPattern(node)) {
      bindPattern(node.left, prefix);
      if (prefix.length === 1) {
        const value = staticPreviewValue(node.right);
        if (value !== undefined) values[prefix[0]] = value;
      }
    }
    if (t.isObjectPattern(node))
      for (const prop of node.properties) {
        if (t.isObjectProperty(prop) && t.isIdentifier(prop.key) && !prop.computed) {
          const keys = [...prefix, prop.key.name];
          if (keys.length === 1 && !(keys[0] in values)) values[keys[0]] = sample(keys[0]);
          if (keys.length > 1) put(keys, sample(keys[keys.length - 1]));
          bindPattern(prop.value, keys);
        }
      }
  }
  if (pattern) bindPattern(pattern, []);
  // PropTypes are common in JavaScript projects; do not evaluate their imports.
  for (const stmt of ast.program.body) {
    if (!t.isExpressionStatement(stmt) || !t.isAssignmentExpression(stmt.expression)) continue;
    const { left, right } = stmt.expression;
    if (
      !t.isMemberExpression(left) ||
      !t.isIdentifier(left.object, { name }) ||
      !t.isIdentifier(left.property) ||
      !t.isObjectExpression(right)
    )
      continue;
    if (left.property.name === 'propTypes')
      for (const prop of right.properties) {
        if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
          const value = propTypeValue(prop.value, prop.key.name);
          if (value !== undefined) values[prop.key.name] = value;
        }
      }
  }
  // Learn only paths actually read by the component. Array callbacks contribute
  // one deterministic row, including nested object fields, rather than an empty list.
  function keysOf(node: t.Node | null | undefined): string[] | null {
    if (t.isIdentifier(node)) return aliases.get(node.name) ?? null;
    if (t.isThisExpression(node)) return ['$this'];
    if (t.isMemberExpression(node) || t.isOptionalMemberExpression(node)) {
      const base = keysOf(node.object);
      const key =
        !node.computed && t.isIdentifier(node.property)
          ? node.property.name
          : t.isStringLiteral(node.property)
            ? node.property.value
            : t.isNumericLiteral(node.property)
              ? String(node.property.value)
              : null;
      if (!base || key === null || ignored.has(key)) return null;
      if (base[0] === '$this') return key === 'props' ? [] : null;
      return [...base, key];
    }
    return null;
  }
  function put(keys: string[], value: unknown) {
    if (!keys.length || keys.some((k) => ignored.has(k))) return;
    let target: Record<string, unknown> = values;
    keys.forEach((key, index) => {
      if (index === keys.length - 1) {
        if (
          target[key] === undefined ||
          (typeof value === 'object' && value !== null && typeof target[key] !== 'object')
        )
          target[key] = value;
      } else {
        if (!target[key] || typeof target[key] !== 'object')
          target[key] = /^\d+$/.test(keys[index + 1]) ? [] : {};
        target = target[key] as Record<string, unknown>;
      }
    });
  }
  function walk(node: t.Node) {
    if (t.isCallExpression(node) && t.isIdentifier(node.callee)) {
      const keys = aliases.get(node.callee.name);
      if (keys?.length === 1) values[keys[0]] = `__callback__${keys[0]}`;
    }
    if (t.isVariableDeclarator(node) && node.init) {
      const keys = keysOf(node.init);
      if (keys) bindPattern(node.id, keys);
    }
    if (t.isCallExpression(node) && t.isMemberExpression(node.callee)) {
      const keys = keysOf(node.callee.object);
      const method = t.isIdentifier(node.callee.property) ? node.callee.property.name : '';
      if (
        keys &&
        ['map', 'flatMap', 'filter', 'find', 'some', 'every', 'forEach'].includes(method)
      ) {
        put(keys, [{}]);
        let array: unknown = values;
        for (const key of keys)
          array =
            array && typeof array === 'object'
              ? (array as Record<string, unknown>)[key]
              : undefined;
        if (Array.isArray(array) && array.length === 0) array.push({});
        const callback = node.arguments[0];
        if (t.isFunction(callback) && callback.params[0])
          bindPattern(callback.params[0], [...keys, '0']);
      } else if (keys && ['toFixed', 'toPrecision'].includes(method)) put(keys, 1);
      else if (keys && ['getTime', 'toISOString', 'getFullYear'].includes(method)) {
        if (keys.length === 1) values[keys[0]] = '__date__2026-01-15T12:00:00.000Z';
      } else if (
        keys &&
        method &&
        ![
          'slice',
          'includes',
          'trim',
          'split',
          'replace',
          'join',
          'toLowerCase',
          'toUpperCase',
        ].includes(method)
      ) {
        put([...keys, method], `__callback__${method}`);
      }
    }
    if (t.isMemberExpression(node) || t.isOptionalMemberExpression(node)) {
      const keys = keysOf(node);
      if (
        keys?.length &&
        ![
          'map',
          'filter',
          'flatMap',
          'find',
          'some',
          'every',
          'forEach',
          'length',
          'trim',
          'split',
          'slice',
          'includes',
          'toLowerCase',
          'toUpperCase',
          'toFixed',
          'toPrecision',
          'getTime',
          'toISOString',
          'getFullYear',
          'replace',
          'join',
        ].includes(keys[keys.length - 1])
      )
        put(keys, sample(keys[keys.length - 1]));
    }
    for (const key of t.VISITOR_KEYS[node.type] ?? []) {
      const child = (node as unknown as Record<string, unknown>)[key];
      if (Array.isArray(child))
        child.forEach((value) => {
          if (value && typeof value.type === 'string') walk(value);
        });
      else if (child && typeof child === 'object' && 'type' in child) walk(child as t.Node);
    }
  }
  walk(fn);
  return values;
}
