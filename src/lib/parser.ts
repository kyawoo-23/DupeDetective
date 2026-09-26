// Deterministic React component analyzer using Babel AST
// No AI — fixed rules and weights only.
// Note: Babel's NodePath generics are complex; we use type assertions where needed.

/* eslint-disable @typescript-eslint/no-explicit-any */

import * as parser from '@babel/parser';
import traverseModule from '@babel/traverse';
import * as t from '@babel/types';
import type { ParseError, ReactComponent } from '../types';
import { inferPreviewProps } from './previewProps';

const traverse =
  typeof traverseModule === 'function'
    ? traverseModule
    : (traverseModule as unknown as { default: typeof traverseModule }).default;

function componentId(file: string, name: string, line: number) {
  return `${file}#${name}@${line}`;
}

function isComponentName(name: string): boolean {
  return /^[A-Z]/.test(name);
}

function tsTypeToString(node: t.TSType): string {
  if (t.isTSStringKeyword(node)) return 'string';
  if (t.isTSNumberKeyword(node)) return 'number';
  if (t.isTSBooleanKeyword(node)) return 'boolean';
  if (t.isTSAnyKeyword(node)) return 'any';
  if (t.isTSUnknownKeyword(node)) return 'unknown';
  if (t.isTSArrayType(node)) return `${tsTypeToString(node.elementType)}[]`;
  if (t.isTSTypeLiteral(node)) return 'object';
  if (t.isTSParenthesizedType(node)) return tsTypeToString(node.typeAnnotation);
  if (t.isTSFunctionType(node)) return '() => void';
  if (t.isTSUnionType(node)) return node.types.map(tsTypeToString).join(' | ');
  if (t.isTSTypeReference(node) && t.isIdentifier(node.typeName)) return node.typeName.name;
  if (t.isTSLiteralType(node)) {
    if (t.isStringLiteral(node.literal)) return `"${node.literal.value}"`;
    if (t.isNumericLiteral(node.literal)) return String(node.literal.value);
    if (t.isBooleanLiteral(node.literal)) return String(node.literal.value);
  }
  return 'unknown';
}

function propTypeToString(node: t.TSType, ast: t.File): string {
  if (t.isTSTypeReference(node) && t.isIdentifier(node.typeName)) {
    const typeName = node.typeName.name;
    const alias = ast.program.body.find(
      (statement) => t.isTSTypeAliasDeclaration(statement) && statement.id.name === typeName
    );
    if (alias && t.isTSTypeAliasDeclaration(alias)) return tsTypeToString(alias.typeAnnotation);
  }
  return tsTypeToString(node);
}

// ──────────────────────────────────────────
// Feature extraction using traverse on a subtree
// ──────────────────────────────────────────
interface ComponentFeatures {
  jsxTags: string[];
  propNames: string[];
  propTypes: Record<string, string>;
  eventHandlers: string[];
  classNames: string[];
  rootTag: string;
  ariaRoles: string[];
  jsxDepth: number;
  jsxNodeCount: number;
  hasJsx: boolean;
}

function pushClassTokens(value: string, into: string[]) {
  for (const token of value.split(/\s+/)) {
    if (token) into.push(token);
  }
}

/** Static class tokens from string literals, template text, ternaries, and cn/clsx-style calls. */
function collectClassTokens(expr: t.Node | null | undefined, into: string[]) {
  if (!expr || typeof expr !== 'object') return;
  if (t.isStringLiteral(expr)) {
    pushClassTokens(expr.value, into);
    return;
  }
  if (t.isTemplateLiteral(expr)) {
    for (const quasi of expr.quasis) pushClassTokens(quasi.value.cooked ?? quasi.value.raw, into);
    for (const expression of expr.expressions) collectClassTokens(expression, into);
    return;
  }
  if (
    t.isParenthesizedExpression(expr) ||
    t.isTSAsExpression(expr) ||
    t.isTSTypeAssertion(expr) ||
    t.isTSNonNullExpression(expr) ||
    t.isTSSatisfiesExpression(expr)
  ) {
    collectClassTokens(expr.expression, into);
    return;
  }
  if (t.isConditionalExpression(expr)) {
    collectClassTokens(expr.consequent, into);
    collectClassTokens(expr.alternate, into);
    return;
  }
  if (t.isLogicalExpression(expr)) {
    collectClassTokens(expr.left, into);
    collectClassTokens(expr.right, into);
    return;
  }
  if (t.isCallExpression(expr) || t.isNewExpression(expr)) {
    for (const arg of expr.arguments) {
      collectClassTokens(t.isSpreadElement(arg) ? arg.argument : arg, into);
    }
    return;
  }
  if (t.isArrayExpression(expr)) {
    for (const element of expr.elements) {
      if (!element) continue;
      collectClassTokens(t.isSpreadElement(element) ? element.argument : element, into);
    }
    return;
  }
  if (t.isObjectExpression(expr)) {
    for (const prop of expr.properties) {
      if (!t.isObjectProperty(prop)) continue;
      if (!prop.computed && t.isStringLiteral(prop.key)) pushClassTokens(prop.key.value, into);
      else if (!prop.computed && t.isIdentifier(prop.key)) into.push(prop.key.name);
      collectClassTokens(prop.value, into);
    }
  }
}

function jsxStringAttribute(value: t.JSXAttribute['value']): string | null {
  if (t.isStringLiteral(value)) return value.value;
  if (t.isJSXExpressionContainer(value) && t.isStringLiteral(value.expression)) {
    return value.expression.value;
  }
  return null;
}

function extractFeaturesFromNode(node: t.Node): ComponentFeatures {
  const jsxTags: string[] = [];
  const eventHandlers: string[] = [];
  const classNames: string[] = [];
  const ariaRoles: string[] = [];
  let rootTag = '';
  let jsxDepth = 0;
  let currentDepth = 0;
  let jsxNodeCount = 0;
  let foundJsx = false;

  // We'll traverse by building a mini-AST walker
  walkNode(node);

  function walkNode(n: t.Node | null | undefined) {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) {
      n.forEach(walkNode);
      return;
    }

    switch (n.type) {
      case 'JSXElement':
        foundJsx = true;
        jsxNodeCount++;
        currentDepth++;
        if (currentDepth > jsxDepth) jsxDepth = currentDepth;
        walkChildren(n);
        currentDepth--;
        return;

      case 'JSXFragment':
        foundJsx = true;
        jsxNodeCount++;
        currentDepth++;
        if (currentDepth > jsxDepth) jsxDepth = currentDepth;
        walkChildren(n);
        currentDepth--;
        return;

      case 'JSXOpeningElement': {
        const name = (n as t.JSXOpeningElement).name;
        let tagName = '';
        if (t.isJSXIdentifier(name)) {
          tagName = name.name;
        } else if (t.isJSXMemberExpression(name)) {
          const parts: string[] = [];
          let cur: t.JSXMemberExpression | t.JSXIdentifier = name;
          while (t.isJSXMemberExpression(cur)) {
            parts.unshift(cur.property.name);
            cur = cur.object;
          }
          if (t.isJSXIdentifier(cur)) parts.unshift(cur.name);
          tagName = parts.join('.');
        }
        if (tagName) {
          jsxTags.push(tagName);
          if (!rootTag) rootTag = tagName;
        }
        // Check attributes
        for (const attr of (n as t.JSXOpeningElement).attributes) {
          if (!t.isJSXAttribute(attr)) continue;
          if (!t.isJSXIdentifier(attr.name)) continue;
          const attrName = attr.name.name;
          if (
            attrName.startsWith('on') &&
            attrName.length > 2 &&
            attrName[2] === attrName[2].toUpperCase()
          ) {
            eventHandlers.push(attrName);
          }
          if (attrName === 'className') {
            const val = attr.value;
            if (t.isStringLiteral(val)) pushClassTokens(val.value, classNames);
            else if (t.isJSXExpressionContainer(val))
              collectClassTokens(val.expression, classNames);
          }
          if (attrName === 'role') {
            const role = jsxStringAttribute(attr.value);
            if (role) ariaRoles.push(role);
          }
        }
        return;
      }
    }

    walkChildren(n);
  }

  function walkChildren(n: t.Node) {
    for (const key of Object.keys(n)) {
      if (key === 'type' || key === 'loc' || key === 'start' || key === 'end') continue;
      walkNode((n as any)[key]);
    }
  }

  return {
    jsxTags: [...new Set(jsxTags)],
    propNames: [],
    propTypes: {},
    eventHandlers: [...new Set(eventHandlers)],
    classNames: [...new Set(classNames)],
    rootTag,
    ariaRoles: [...new Set(ariaRoles)],
    jsxDepth,
    jsxNodeCount,
    hasJsx: foundJsx,
  };
}

const INPUT_ATTRIBUTE_PROPS = ['value', 'onChange', 'placeholder', 'name', 'disabled'] as const;

function heritageName(expr: t.TSEntityName | t.Expression): string | null {
  if (t.isIdentifier(expr)) return expr.name;
  if (t.isTSQualifiedName(expr)) return expr.right.name;
  if (t.isMemberExpression(expr) && t.isIdentifier(expr.property)) return expr.property.name;
  return null;
}

function extendsInputHtmlAttributes(declaration: t.TSInterfaceDeclaration): boolean {
  return (declaration.extends ?? []).some(
    (clause) => heritageName(clause.expression) === 'InputHTMLAttributes'
  );
}

function extractProps(
  params: t.Function['params'],
  ast: t.File,
  fallbackTypeName?: string
): {
  propNames: string[];
  propTypes: Record<string, string>;
} {
  const propNames: string[] = [];
  const propTypes: Record<string, string> = {};

  const firstParam = params[0];
  if (!firstParam) return { propNames, propTypes };

  let pattern: t.LVal | t.Expression = firstParam as any;
  if (t.isAssignmentPattern(pattern)) pattern = pattern.left as any;

  if (t.isObjectPattern(pattern as any)) {
    const op = pattern as unknown as t.ObjectPattern;
    const annotation = t.isTSTypeAnnotation(op.typeAnnotation)
      ? op.typeAnnotation.typeAnnotation
      : null;
    let members: t.TSTypeElement[] = [];
    if (annotation && t.isTSTypeLiteral(annotation)) members = annotation.members;
    const typeName =
      annotation && t.isTSTypeReference(annotation) && t.isIdentifier(annotation.typeName)
        ? annotation.typeName.name
        : fallbackTypeName;
    let inheritsInputAttributes = false;
    if (typeName) {
      const declaration = ast.program.body.find(
        (statement) =>
          (t.isTSInterfaceDeclaration(statement) || t.isTSTypeAliasDeclaration(statement)) &&
          statement.id.name === typeName
      );
      if (declaration && t.isTSInterfaceDeclaration(declaration)) {
        members = declaration.body.body;
        inheritsInputAttributes = extendsInputHtmlAttributes(declaration);
      }
      if (
        declaration &&
        t.isTSTypeAliasDeclaration(declaration) &&
        t.isTSTypeLiteral(declaration.typeAnnotation)
      ) {
        members = declaration.typeAnnotation.members;
      }
    }
    for (const member of members) {
      if (t.isTSPropertySignature(member) && t.isIdentifier(member.key) && member.typeAnnotation) {
        propTypes[member.key.name] = propTypeToString(member.typeAnnotation.typeAnnotation, ast);
        propNames.push(member.key.name);
      }
      if (t.isTSMethodSignature(member) && t.isIdentifier(member.key)) {
        propTypes[member.key.name] = '() => void';
        propNames.push(member.key.name);
      }
    }
    for (const prop of op.properties) {
      if (t.isObjectProperty(prop)) {
        const key = prop.key;
        if (t.isIdentifier(key)) {
          propNames.push(key.name);
          // Check if value has type annotation
          const val = prop.value;
          if (t.isIdentifier(val) && (val as any).typeAnnotation) {
            const ann = (val as any).typeAnnotation as t.TSTypeAnnotation;
            if (t.isTSTypeAnnotation(ann)) {
              propTypes[key.name] = tsTypeToString(ann.typeAnnotation);
            }
          }
        }
      } else if (t.isRestElement(prop)) {
        // skip
      }
    }
    if (inheritsInputAttributes) {
      for (const name of INPUT_ATTRIBUTE_PROPS) {
        if (!propNames.includes(name)) propNames.push(name);
        if (!propTypes[name]) {
          propTypes[name] =
            name === 'onChange' ? '() => void' : name === 'disabled' ? 'boolean' : 'string';
        }
      }
    }
  }

  return { propNames: [...new Set(propNames)], propTypes };
}

// Include only referenced, file-local constants whose values cannot execute
// code during initialization. Imported modules and dynamic expressions remain
// unavailable to the isolated preview.
function isStaticPreviewValue(node: t.Node | null | undefined): boolean {
  if (!node) return false;
  if (
    t.isStringLiteral(node) ||
    t.isNumericLiteral(node) ||
    t.isBooleanLiteral(node) ||
    t.isNullLiteral(node)
  )
    return true;
  if (t.isTemplateLiteral(node)) return node.expressions.length === 0;
  if (t.isUnaryExpression(node)) {
    return ['+', '-', '!', '~'].includes(node.operator) && isStaticPreviewValue(node.argument);
  }
  if (t.isArrayExpression(node)) {
    return node.elements.every((element) => element != null && isStaticPreviewValue(element));
  }
  if (t.isObjectExpression(node)) {
    return node.properties.every(
      (property) =>
        t.isObjectProperty(property) && !property.computed && isStaticPreviewValue(property.value)
    );
  }
  if (t.isTSAsExpression(node) || t.isTSTypeAssertion(node) || t.isTSSatisfiesExpression(node)) {
    return isStaticPreviewValue(node.expression);
  }
  return false;
}

function extractPreviewDependencies(path: any, source: string): string {
  const declarations = new Map<number, string>();
  const visited = new Set<number>();
  if (path.node.start != null) visited.add(path.node.start);
  if (t.isVariableDeclaration(path.node))
    for (const node of path.node.declarations) if (node.start != null) visited.add(node.start);
  const collect = (current: any) => {
    current.traverse({
      ReferencedIdentifier(reference: any) {
        const binding = reference.scope.getBinding(reference.node.name);
        if (!binding) return;
        const bindingPath = binding.path;
        const declaration = bindingPath.isVariableDeclarator()
          ? bindingPath.parentPath
          : bindingPath;
        const parent = declaration?.parentPath;
        if (
          !parent?.isProgram() &&
          !parent?.isExportNamedDeclaration() &&
          !parent?.isExportDefaultDeclaration() &&
          !parent?.isImportDeclaration()
        )
          return;
        const node = bindingPath.node as t.Node;
        if (node.start == null || node.end == null || visited.has(node.start)) return;
        if (node.end - node.start > 10_000 || declarations.size >= 30) return;

        let code: string | null = null;
        if (
          bindingPath.isImportSpecifier() ||
          bindingPath.isImportDefaultSpecifier() ||
          bindingPath.isImportNamespaceSpecifier()
        ) {
          const importDeclaration = bindingPath.parentPath.node;
          if (
            t.isImportDeclaration(importDeclaration) &&
            ['react', 'react-dom'].includes(importDeclaration.source.value)
          ) {
            const specifier = node as
              | t.ImportSpecifier
              | t.ImportDefaultSpecifier
              | t.ImportNamespaceSpecifier;
            const runtime = importDeclaration.source.value === 'react' ? 'React' : 'ReactDOM';
            const imported = t.isImportSpecifier(specifier)
              ? t.isIdentifier(specifier.imported)
                ? specifier.imported.name
                : specifier.imported.value
              : null;
            if (specifier.local.name !== (imported ?? runtime))
              code = `const ${specifier.local.name} = ${runtime}${imported ? `.${imported}` : ''};`;
          }
        }

        if (bindingPath.isFunctionDeclaration() && t.isFunctionDeclaration(node) && node.id) {
          code = source.slice(node.start, node.end);
        } else if (bindingPath.isVariableDeclarator()) {
          const declarator = node as t.VariableDeclarator;
          if (
            t.isIdentifier(declarator.id) &&
            (isStaticPreviewValue(declarator.init) ||
              t.isArrowFunctionExpression(declarator.init) ||
              t.isFunctionExpression(declarator.init))
          ) {
            code = `const ${source.slice(node.start, node.end)};`;
          }
        }
        if (!code) return;
        visited.add(node.start);
        declarations.set(node.start, code);
        collect(bindingPath);
      },
    });
  };
  collect(path);

  return [...declarations.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, declaration]) => declaration)
    .join('\n');
}

function unwrapPreviewFunction(
  node: t.Node | null | undefined
): t.ArrowFunctionExpression | t.FunctionExpression | null {
  if (t.isArrowFunctionExpression(node) || t.isFunctionExpression(node)) return node;
  if (t.isTSAsExpression(node) || t.isTSSatisfiesExpression(node))
    return unwrapPreviewFunction(node.expression);
  if (t.isCallExpression(node)) {
    const callee = node.callee;
    const wrapper = t.isIdentifier(callee)
      ? callee.name
      : t.isMemberExpression(callee) && t.isIdentifier(callee.property)
        ? callee.property.name
        : '';
    if (['memo', 'forwardRef'].includes(wrapper)) return unwrapPreviewFunction(node.arguments[0]);
  }
  return null;
}

function hasRenderReturn(node: t.Node): boolean {
  let found = false;
  const visit = (current: t.Node) => {
    if (current !== node && t.isFunction(current)) return;
    const value = t.isReturnStatement(current)
      ? current.argument
      : current === node &&
          t.isArrowFunctionExpression(current) &&
          !t.isBlockStatement(current.body)
        ? current.body
        : null;
    if (
      t.isNullLiteral(value) ||
      t.isBooleanLiteral(value) ||
      t.isStringLiteral(value) ||
      t.isNumericLiteral(value)
    )
      found = true;
    if (
      t.isCallExpression(value) &&
      ((t.isIdentifier(value.callee) &&
        ['createElement', 'cloneElement', 'createPortal'].includes(value.callee.name)) ||
        (t.isMemberExpression(value.callee) &&
          t.isIdentifier(value.callee.property) &&
          ['createElement', 'cloneElement', 'createPortal'].includes(value.callee.property.name)))
    )
      found = true;
    for (const key of t.VISITOR_KEYS[current.type] ?? []) {
      const child = (current as unknown as Record<string, t.Node | t.Node[] | undefined>)[key];
      if (Array.isArray(child))
        child.forEach((n) => {
          if (n?.type) visit(n);
        });
      else if (child?.type) visit(child);
    }
  };
  visit(node);
  return found;
}

// ──────────────────────────────────────────
// Main parse function
// ──────────────────────────────────────────
export function parseFile(
  filePath: string,
  source: string
): { components: ReactComponent[]; errors: ParseError[] } {
  const components: ReactComponent[] = [];
  const errors: ParseError[] = [];

  let ast: t.File;
  try {
    ast = parser.parse(source, {
      sourceType: 'module',
      plugins: [
        'jsx',
        'typescript',
        'classProperties',
        'classStaticBlock',
        'decorators-legacy',
        'exportDefaultFrom',
        'dynamicImport',
        'optionalChaining',
        'nullishCoalescingOperator',
      ],
    });
  } catch (e) {
    errors.push({ file: filePath, message: String(e) });
    return { components, errors };
  }

  const anonymousDefault = ast.program.body.find(
    (statement) =>
      t.isExportDefaultDeclaration(statement) &&
      (t.isFunctionDeclaration(statement.declaration) || t.isClassDeclaration(statement.declaration)
        ? !statement.declaration.id
        : !t.isIdentifier(statement.declaration))
  );
  if (
    anonymousDefault &&
    t.isExportDefaultDeclaration(anonymousDefault) &&
    !/(^|\/)use[-A-Z]/.test(filePath) &&
    (/\.[jt]sx$/.test(filePath) ||
      ast.program.body.some(
        (statement) => t.isImportDeclaration(statement) && statement.source.value === 'react'
      ) ||
      extractFeaturesFromNode(anonymousDefault.declaration).hasJsx)
  ) {
    const declaration = anonymousDefault.declaration;
    if (
      t.isFunctionDeclaration(declaration) ||
      t.isClassDeclaration(declaration) ||
      unwrapPreviewFunction(declaration)
    ) {
      let name = 'DefaultComponent';
      while (new RegExp(`\\b${name}\\b`).test(source)) name += '_';
      const expression = source.slice(declaration.start ?? 0, declaration.end ?? 0);
      const rewritten =
        source.slice(0, anonymousDefault.start ?? 0) +
        `const ${name} = ${expression}; export default ${name};` +
        source.slice(anonymousDefault.end ?? source.length);
      return parseFile(filePath, rewritten);
    }
  }

  let defaultExportName: string | null = null;

  traverse(ast, {
    ExportDefaultDeclaration(path) {
      const decl = path.node.declaration;
      if (t.isIdentifier(decl)) defaultExportName = decl.name;
      else if (t.isCallExpression(decl)) {
        let inner: t.Node | undefined = decl;
        while (t.isCallExpression(inner)) inner = inner.arguments[0];
        if (t.isIdentifier(inner)) defaultExportName = inner.name;
      } else if (t.isFunctionDeclaration(decl) && decl.id) defaultExportName = decl.id.name;
      else if (t.isClassDeclaration(decl) && decl.id) defaultExportName = decl.id.name;
    },
  });

  traverse(ast, {
    // Named function declarations: function Button() { return <...> }
    FunctionDeclaration(path) {
      const node = path.node;
      if (!node.id || !isComponentName(node.id.name)) return;
      const features = extractFeaturesFromNode(node);
      if (!features.hasJsx && !hasRenderReturn(node)) return;

      const { propNames, propTypes } = extractProps(node.params, ast);

      const exportType =
        node.id.name === defaultExportName
          ? 'default'
          : path.parent.type === 'ExportNamedDeclaration' ||
              path.parent.type === 'ExportDefaultDeclaration'
            ? 'named'
            : 'none';

      components.push({
        id: componentId(filePath, node.id.name, node.loc?.start.line ?? 0),
        name: node.id.name,
        file: filePath,
        line: node.loc?.start.line ?? 0,
        kind: 'function',
        exportType: exportType as ReactComponent['exportType'],
        jsxTags: features.jsxTags,
        propNames,
        propTypes,
        eventHandlers: features.eventHandlers,
        classNames: features.classNames,
        rootTag: features.rootTag,
        ariaRoles: features.ariaRoles,
        jsxDepth: features.jsxDepth,
        jsxNodeCount: features.jsxNodeCount,
        source: source.slice(node.start ?? 0, node.end ?? 0),
        previewDependencies: extractPreviewDependencies(path, source),
        previewPropValues: inferPreviewProps(ast, node.id.name, node),
      });
    },

    // Arrow/function expressions assigned to variable
    VariableDeclaration(path) {
      const node = path.node;
      for (const declarator of node.declarations) {
        if (!t.isIdentifier(declarator.id)) continue;
        const name = declarator.id.name;
        if (!isComponentName(name)) continue;

        const fn = t.isClassExpression(declarator.init)
          ? declarator.init
          : unwrapPreviewFunction(declarator.init);
        const fnNode = fn;
        let fallbackTypeName: string | undefined;
        let wrapped = declarator.init;
        while (t.isCallExpression(wrapped)) {
          const callee = wrapped.callee;
          const wrapper = t.isIdentifier(callee)
            ? callee.name
            : t.isMemberExpression(callee) && t.isIdentifier(callee.property)
              ? callee.property.name
              : '';
          const propType = wrapped.typeParameters?.params[wrapper === 'forwardRef' ? 1 : 0];
          if (propType && t.isTSTypeReference(propType) && t.isIdentifier(propType.typeName))
            fallbackTypeName = propType.typeName.name;
          const inner = wrapped.arguments[0];
          wrapped = t.isExpression(inner) ? inner : null;
        }
        if (!fn || !fnNode) continue;

        const features = extractFeaturesFromNode(fnNode);
        if (!features.hasJsx && !hasRenderReturn(fn)) continue;

        const { propNames, propTypes } = extractProps(
          t.isClassExpression(fn) ? [] : fn.params,
          ast,
          fallbackTypeName
        );
        const exportType =
          name === defaultExportName
            ? 'default'
            : path.parent.type === 'ExportNamedDeclaration'
              ? 'named'
              : 'none';

        components.push({
          id: componentId(filePath, name, node.loc?.start.line ?? 0),
          name,
          file: filePath,
          line: node.loc?.start.line ?? 0,
          kind: t.isClassExpression(fn) ? 'class' : 'arrow',
          exportType: exportType as ReactComponent['exportType'],
          jsxTags: features.jsxTags,
          propNames,
          propTypes,
          eventHandlers: features.eventHandlers,
          classNames: features.classNames,
          rootTag: features.rootTag,
          ariaRoles: features.ariaRoles,
          jsxDepth: features.jsxDepth,
          jsxNodeCount: features.jsxNodeCount,
          source: `${node.kind} ${source.slice(declarator.start ?? 0, declarator.end ?? 0)};`,
          previewDependencies: extractPreviewDependencies(path, source),
          previewPropValues: inferPreviewProps(ast, name, fn),
        });
      }
    },

    // Class components
    ClassDeclaration(path) {
      const node = path.node;
      if (!node.id || !isComponentName(node.id.name)) return;
      const features = extractFeaturesFromNode(node);
      if (
        !features.hasJsx &&
        !node.body.body.some(
          (member) =>
            t.isClassMethod(member) &&
            t.isIdentifier(member.key, { name: 'render' }) &&
            hasRenderReturn(member)
        )
      )
        return;

      const exportType =
        node.id.name === defaultExportName
          ? 'default'
          : path.parent.type === 'ExportNamedDeclaration'
            ? 'named'
            : 'none';

      components.push({
        id: componentId(filePath, node.id.name, node.loc?.start.line ?? 0),
        name: node.id.name,
        file: filePath,
        line: node.loc?.start.line ?? 0,
        kind: 'class',
        exportType: exportType as ReactComponent['exportType'],
        jsxTags: features.jsxTags,
        propNames: [],
        propTypes: {},
        eventHandlers: features.eventHandlers,
        classNames: features.classNames,
        rootTag: features.rootTag,
        ariaRoles: features.ariaRoles,
        jsxDepth: features.jsxDepth,
        jsxNodeCount: features.jsxNodeCount,
        source: source.slice(node.start ?? 0, node.end ?? 0),
        previewDependencies: extractPreviewDependencies(path, source),
        previewPropValues: inferPreviewProps(ast, node.id.name, node),
      });
    },
  });

  return { components, errors };
}
