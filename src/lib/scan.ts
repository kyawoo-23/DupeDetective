// Main scan orchestration

import * as babelParser from '@babel/parser';
import { makeScanId } from '../store';
import type { ParseError, ReactComponent, Scan } from '../types';
import { extractZip, fetchGitHubArchive, parseGitHubUrl } from './fs';
import { parseFile } from './parser';
import { buildCandidateGroups } from './scorer';

type SourceFile = { path: string; content: string };

// Bundle only referenced components from relative source imports. This keeps
// previews independent of repository package scripts and external modules.
export function attachLocalPreviewImports(components: ReactComponent[], files: SourceFile[]) {
  const byFile = new Map<string, ReactComponent[]>();
  for (const component of components) {
    const group = byFile.get(component.file) ?? [];
    group.push(component);
    byFile.set(component.file, group);
  }
  const imports = new Map<string, Map<string, { file: string; exported: string }>>();
  const originalDependencies = new Map(
    components.map((component) => [component.id, component.previewDependencies])
  );
  const paths = new Set(files.map((file) => file.path));
  for (const file of files) {
    const entries = new Map<string, { file: string; exported: string }>();
    try {
      const ast = babelParser.parse(file.content, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
      });
      for (const statement of ast.program.body) {
        if (statement.type !== 'ImportDeclaration' || !statement.source.value.startsWith('.'))
          continue;
        const parts = [...file.path.split('/').slice(0, -1), ...statement.source.value.split('/')];
        const resolved: string[] = [];
        for (const part of parts) {
          if (part === '..') resolved.pop();
          else if (part && part !== '.') resolved.push(part);
        }
        const base = resolved.join('/');
        const target = [
          base,
          `${base}.tsx`,
          `${base}.jsx`,
          `${base}.ts`,
          `${base}.js`,
          `${base}/index.tsx`,
          `${base}/index.jsx`,
        ].find((candidate) => paths.has(candidate));
        if (!target) continue;
        for (const specifier of statement.specifiers) {
          if (specifier.type === 'ImportDefaultSpecifier')
            entries.set(specifier.local.name, { file: target, exported: 'default' });
          if (specifier.type === 'ImportSpecifier' && specifier.imported.type === 'Identifier') {
            entries.set(specifier.local.name, { file: target, exported: specifier.imported.name });
          }
        }
      }
    } catch {
      /* parser diagnostics are already recorded by parseFile */
    }
    imports.set(file.path, entries);
  }

  for (const component of components) {
    const snippets: string[] = [];
    const seen = new Set([`${component.file}:${component.name}`]);
    let bytes = 0;
    const collect = (current: ReactComponent, depth: number) => {
      if (depth > 4 || snippets.length >= 20) return;
      for (const tag of current.jsxTags) {
        const localName = tag.split('.')[0];
        const imported = imports.get(current.file)?.get(localName);
        if (!imported) continue;
        const target = (byFile.get(imported.file) ?? []).find((candidate) =>
          imported.exported === 'default'
            ? candidate.exportType === 'default'
            : candidate.name === imported.exported && candidate.exportType === 'named'
        );
        if (!target) continue;
        const key = `${target.file}:${target.name}`;
        if (seen.has(key)) continue;
        const snippet = [
          originalDependencies.get(target.id),
          target.source,
          localName === target.name ? '' : `const ${localName} = ${target.name};`,
        ]
          .filter(Boolean)
          .join('\n');
        if (bytes + snippet.length > 100_000) continue;
        seen.add(key);
        collect(target, depth + 1);
        snippets.push(snippet);
        bytes += snippet.length;
      }
    };
    collect(component, 0);
    if (snippets.length)
      component.previewDependencies = [...snippets, originalDependencies.get(component.id)]
        .filter(Boolean)
        .join('\n');
  }
}

export async function runZipScan(file: File, onProgress?: (msg: string) => void): Promise<Scan> {
  onProgress?.('Extracting ZIP archive…');
  const { files, errors, contentHash } = await extractZip(file);

  onProgress?.(`Parsing ${files.length} source files…`);
  const components = [];
  const parseErrors: ParseError[] = [...errors];

  for (const f of files) {
    const result = parseFile(f.path, f.content);
    components.push(...result.components);
    parseErrors.push(...result.errors);
  }

  attachLocalPreviewImports(components, files);

  onProgress?.(`Found ${components.length} components. Building candidate groups…`);
  const groups = buildCandidateGroups(components);

  return {
    id: makeScanId(),
    source: { kind: 'zip', filename: file.name, contentHash },
    status: 'ready',
    createdAt: new Date().toISOString(),
    components,
    groups,
    parseErrors,
    groupDecisions: [],
    analysisVersion: 2,
  };
}

export async function runGitHubScan(
  url: string,
  branch?: string,
  onProgress?: (msg: string) => void
): Promise<Scan> {
  const ref = parseGitHubUrl(url);
  if (!ref) throw new Error('Invalid GitHub URL');

  const resolvedBranch = branch || ref.branch || 'HEAD';
  onProgress?.(`Fetching ${ref.owner}/${ref.repo} @ ${resolvedBranch}…`);

  const { files, errors, commitSha } = await fetchGitHubArchive(
    ref.owner,
    ref.repo,
    resolvedBranch
  );

  onProgress?.(`Parsing ${files.length} source files…`);
  const components = [];
  const parseErrors: ParseError[] = [...errors];

  for (const f of files) {
    const result = parseFile(f.path, f.content);
    components.push(...result.components);
    parseErrors.push(...result.errors);
  }

  attachLocalPreviewImports(components, files);

  onProgress?.(`Found ${components.length} components. Building candidate groups…`);
  const groups = buildCandidateGroups(components);

  return {
    id: makeScanId(),
    source: { kind: 'github', url, branch: resolvedBranch, commitSha },
    status: 'ready',
    createdAt: new Date().toISOString(),
    components,
    groups,
    parseErrors,
    groupDecisions: [],
    analysisVersion: 2,
  };
}
