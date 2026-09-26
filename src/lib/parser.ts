// Deterministic React component analyzer using Babel AST
// No AI — fixed rules and weights only.
// Note: Babel's NodePath generics are complex; we use type assertions where needed.

/* eslint-disable @typescript-eslint/no-explicit-any */

import * as parser from '@babel/parser';
import traverseModule from '@babel/traverse';
import * as t from '@babel/types';
import type { ParseError, ReactComponent } from '../types';

const traverse =
  typeof traverseModule === 'function'
    ? traverseModule
    : (traverseModule as unknown as { default: typeof traverseModule }).default;

let componentIdCounter = 0;
function makeComponentId() {
  return `comp_${++componentIdCounter}_${Math.random().toString(36).slice(2, 6)}`;
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
    const alias = ast.program.body.find((statement) =>
      t.isTSTypeAliasDeclaration(statement) && statement.id.name === typeName
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
  jsxDepth: number;
  jsxNodeCount: number;
  hasJsx: boolean;
}

function extractFeaturesFromNode(node: t.Node): ComponentFeatures {
  const jsxTags: string[] = [];
  const eventHandlers: string[] = [];
  const classNames: string[] = [];
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
        if (t.isJSXIdentifier(name)) {
          jsxTags.push(name.name);
        } else if (t.isJSXMemberExpression(name)) {
          const parts: string[] = [];
          let cur: t.JSXMemberExpression | t.JSXIdentifier = name;
          while (t.isJSXMemberExpression(cur)) {
            parts.unshift(cur.property.name);
            cur = cur.object;
          }
          if (t.isJSXIdentifier(cur)) parts.unshift(cur.name);
          jsxTags.push(parts.join('.'));
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
            if (t.isStringLiteral(val)) {
              classNames.push(...val.value.split(/\s+/).filter(Boolean));
            } else if (t.isJSXExpressionContainer(val) && t.isStringLiteral(val.expression)) {
              classNames.push(...val.expression.value.split(/\s+/).filter(Boolean));
            }
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
    jsxDepth,
    jsxNodeCount,
    hasJsx: foundJsx,
  };
}

function extractProps(params: t.Function['params'], ast: t.File, fallbackTypeName?: string): {
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
    const typeName = annotation && t.isTSTypeReference(annotation) && t.isIdentifier(annotation.typeName)
      ? annotation.typeName.name : fallbackTypeName;
    if (typeName) {
      const declaration = ast.program.body.find((statement) =>
        (t.isTSInterfaceDeclaration(statement) || t.isTSTypeAliasDeclaration(statement)) &&
        statement.id.name === typeName
      );
      if (declaration && t.isTSInterfaceDeclaration(declaration)) members = declaration.body.body;
      if (declaration && t.isTSTypeAliasDeclaration(declaration) && t.isTSTypeLiteral(declaration.typeAnnotation)) {
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
  const collect = (current: any) => {
    current.traverse({
      ReferencedIdentifier(reference: any) {
        const binding = reference.scope.getBinding(reference.node.name);
        if (!binding) return;
        const bindingPath = binding.path;
        const declaration = bindingPath.isVariableDeclarator() ? bindingPath.parentPath : bindingPath;
        const parent = declaration?.parentPath;
        if (!parent?.isProgram() && !parent?.isExportNamedDeclaration() && !parent?.isExportDefaultDeclaration()) return;
        const node = bindingPath.node as t.Node;
        if (node.start == null || node.end == null || visited.has(node.start)) return;
        if (node.end - node.start > 10_000 || declarations.size >= 30) return;

        let code: string | null = null;
        if (bindingPath.isFunctionDeclaration() && t.isFunctionDeclaration(node) && node.id) {
          code = source.slice(node.start, node.end);
        } else if (bindingPath.isVariableDeclarator()) {
          const declarator = node as t.VariableDeclarator;
          if (t.isIdentifier(declarator.id) &&
              (isStaticPreviewValue(declarator.init) || t.isArrowFunctionExpression(declarator.init) || t.isFunctionExpression(declarator.init))) {
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

  let defaultExportName: string | null = null;

  traverse(ast, {
    ExportDefaultDeclaration(path) {
      const decl = path.node.declaration;
      if (t.isIdentifier(decl)) defaultExportName = decl.name;
      else if (t.isFunctionDeclaration(decl) && decl.id) defaultExportName = decl.id.name;
      else if (t.isClassDeclaration(decl) && decl.id) defaultExportName = decl.id.name;
    },
  });

  traverse(ast, {
    // Named function declarations: function Button() { return <...> }
    FunctionDeclaration(path) {
      const node = path.node;
      if (!node.id || !isComponentName(node.id.name)) return;
      const features = extractFeaturesFromNode(node);
      if (!features.hasJsx) return;

      const { propNames, propTypes } = extractProps(node.params, ast);

      const exportType =
        node.id.name === defaultExportName
          ? 'default'
          : path.parent.type === 'ExportNamedDeclaration' ||
              path.parent.type === 'ExportDefaultDeclaration'
            ? 'named'
            : 'none';

      components.push({
        id: makeComponentId(),
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
        jsxDepth: features.jsxDepth,
        jsxNodeCount: features.jsxNodeCount,
        source: source.slice(node.start ?? 0, node.end ?? 0),
        previewDependencies: extractPreviewDependencies(path, source),
      });
    },

    // Arrow/function expressions assigned to variable
    VariableDeclaration(path) {
      const node = path.node;
      for (const declarator of node.declarations) {
        if (!t.isIdentifier(declarator.id)) continue;
        const name = declarator.id.name;
        if (!isComponentName(name)) continue;

        let fn: t.ArrowFunctionExpression | t.FunctionExpression | null = null;
        let fnNode: t.Node | null = null;
        let fallbackTypeName: string | undefined;
        if (t.isArrowFunctionExpression(declarator.init)) {
          fn = declarator.init;
          fnNode = fn;
        } else if (t.isFunctionExpression(declarator.init)) {
          fn = declarator.init;
          fnNode = fn;
        } else if (t.isCallExpression(declarator.init)) {
          const callee = declarator.init.callee;
          const wrapper = t.isIdentifier(callee) ? callee.name
            : t.isMemberExpression(callee) && t.isIdentifier(callee.object) && callee.object.name === 'React' && t.isIdentifier(callee.property)
              ? callee.property.name : '';
          const inner = declarator.init.arguments[0];
          if (['forwardRef', 'memo'].includes(wrapper) &&
              (t.isArrowFunctionExpression(inner) || t.isFunctionExpression(inner))) {
            fn = inner;
            fnNode = inner;
            const propType = declarator.init.typeParameters?.params[wrapper === 'forwardRef' ? 1 : 0];
            if (propType && t.isTSTypeReference(propType) && t.isIdentifier(propType.typeName)) {
              fallbackTypeName = propType.typeName.name;
            }
          }
        }
        if (!fn || !fnNode) continue;

        const features = extractFeaturesFromNode(fnNode);
        if (!features.hasJsx) continue;

        const { propNames, propTypes } = extractProps(fn.params, ast, fallbackTypeName);
        const exportType =
          name === defaultExportName
            ? 'default'
            : path.parent.type === 'ExportNamedDeclaration'
              ? 'named'
              : 'none';

        components.push({
          id: makeComponentId(),
          name,
          file: filePath,
          line: node.loc?.start.line ?? 0,
          kind: 'arrow',
          exportType: exportType as ReactComponent['exportType'],
          jsxTags: features.jsxTags,
          propNames,
          propTypes,
          eventHandlers: features.eventHandlers,
          classNames: features.classNames,
          jsxDepth: features.jsxDepth,
          jsxNodeCount: features.jsxNodeCount,
          source: `${node.kind} ${source.slice(declarator.start ?? 0, declarator.end ?? 0)};`,
          previewDependencies: extractPreviewDependencies(path, source),
        });
      }
    },

    // Class components
    ClassDeclaration(path) {
      const node = path.node;
      if (!node.id || !isComponentName(node.id.name)) return;
      const features = extractFeaturesFromNode(node);
      if (!features.hasJsx) return;

      const exportType =
        node.id.name === defaultExportName
          ? 'default'
          : path.parent.type === 'ExportNamedDeclaration'
            ? 'named'
            : 'none';

      components.push({
        id: makeComponentId(),
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
        jsxDepth: features.jsxDepth,
        jsxNodeCount: features.jsxNodeCount,
        source: source.slice(node.start ?? 0, node.end ?? 0),
        previewDependencies: extractPreviewDependencies(path, source),
      });
    },
  });

  return { components, errors };
}
