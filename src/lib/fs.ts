// File system helpers: ZIP extraction and GitHub archive fetching

import JSZip from 'jszip';
import type { ParseError } from '../types';

const REACT_EXTENSIONS = new Set(['.jsx', '.tsx', '.js', '.ts']);
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  'out',
  '.cache',
  'coverage',
  '__pycache__',
  '.venv',
  'vendor',
  '.turbo',
  '.svelte-kit',
]);
const MAX_FILE_SIZE = 500 * 1024; // 500 KB per file
const MAX_FILES = 5000;
const MAX_EXPANDED = 100 * 1024 * 1024; // 100 MB

/** Same-origin proxies in Vite dev/preview (see vite.config.ts). */
const GITHUB_API = '/__github_api';
const GITHUB_CODELoad = '/__github_codeload';

const githubHeaders = { Accept: 'application/vnd.github.v3+json' };

export interface SourceFile {
  path: string;
  content: string;
}

// ──────────────────────────────────────────
// ZIP extraction
// ──────────────────────────────────────────
export async function extractZip(
  file: File
): Promise<{ files: SourceFile[]; errors: ParseError[]; contentHash: string }> {
  const errors: ParseError[] = [];
  const files: SourceFile[] = [];

  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);

  // Content hash (simple: file size + name)
  const contentHash = await hashBuffer(buffer);

  let expandedSize = 0;
  let fileCount = 0;

  for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir) continue;

    // Path traversal guard
    const normalized = relativePath.replace(/\\/g, '/');
    if (normalized.includes('../') || normalized.startsWith('/')) {
      errors.push({
        file: relativePath,
        message: 'Path traversal attempt rejected',
      });
      continue;
    }

    // Skip directories
    const parts = normalized.split('/');
    if (parts.some((p) => SKIP_DIRS.has(p))) continue;

    // Extension filter
    const ext = `.${normalized.split('.').pop() ?? ''}`;
    if (!REACT_EXTENSIONS.has(ext)) continue;

    if (++fileCount > MAX_FILES) {
      errors.push({
        file: 'archive',
        message: `File count limit (${MAX_FILES}) exceeded`,
      });
      break;
    }

    let content: string;
    try {
      const rawContent = await zipEntry.async('arraybuffer');
      expandedSize += rawContent.byteLength;
      if (expandedSize > MAX_EXPANDED) {
        errors.push({
          file: 'archive',
          message: `Expanded size limit exceeded`,
        });
        break;
      }
      if (rawContent.byteLength > MAX_FILE_SIZE) continue;
      content = new TextDecoder('utf-8', { fatal: false }).decode(rawContent);
    } catch {
      errors.push({ file: relativePath, message: 'Failed to read file' });
      continue;
    }

    files.push({ path: normalized, content });
  }

  return { files, errors, contentHash };
}

async function hashBuffer(buffer: ArrayBuffer): Promise<string> {
  try {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 16);
  } catch {
    return `hash_${Date.now()}`;
  }
}

// ──────────────────────────────────────────
// GitHub URL parsing
// ──────────────────────────────────────────
export interface GitHubRef {
  owner: string;
  repo: string;
  branch?: string;
}

export function parseGitHubUrl(url: string): GitHubRef | null {
  try {
    const u = new URL(url.trim());
    if (u.hostname !== 'github.com') return null;
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    const [owner, repo, , branch] = parts;
    return { owner, repo: repo.replace(/\.git$/, ''), branch };
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────
// GitHub archive fetch
// ──────────────────────────────────────────
export async function fetchGitHubArchive(
  owner: string,
  repo: string,
  ref: string
): Promise<{ files: SourceFile[]; errors: ParseError[]; commitSha: string }> {
  const errors: ParseError[] = [];

  // Resolve commit SHA first via refs API
  let commitSha = ref;
  try {
    const refRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/commits/${ref}`, {
      headers: githubHeaders,
    });
    if (refRes.ok) {
      const data = await refRes.json();
      commitSha = data.sha ?? ref;
    }
  } catch {
    // non-fatal, use ref as-is
  }

  // Download zip archive
  const archiveUrl = `${GITHUB_CODELoad}/${owner}/${repo}/legacy.zip/${encodeURIComponent(ref)}`;
  let archiveRes: Response;
  try {
    archiveRes = await fetch(archiveUrl);
  } catch (e) {
    throw new Error(`Network error fetching repository: ${String(e)}`);
  }

  if (archiveRes.status === 404) throw new Error('Repository not found or is private.');
  if (archiveRes.status === 403 || archiveRes.status === 429) {
    const resetHeader = archiveRes.headers.get('X-RateLimit-Reset');
    const resetTime = resetHeader
      ? new Date(parseInt(resetHeader, 10) * 1000).toLocaleTimeString()
      : 'soon';
    throw new Error(
      `GitHub rate limit reached. Resets at ${resetTime}. Try uploading a ZIP instead.`
    );
  }
  if (!archiveRes.ok)
    throw new Error(`GitHub returned ${archiveRes.status}: ${archiveRes.statusText}`);

  const buffer = await archiveRes.arrayBuffer();
  const { files, errors: zipErrors } = await extractZipBuffer(buffer);
  errors.push(...zipErrors);

  return { files, errors, commitSha };
}

async function extractZipBuffer(
  buffer: ArrayBuffer
): Promise<{ files: SourceFile[]; errors: ParseError[] }> {
  const errors: ParseError[] = [];
  const files: SourceFile[] = [];

  const zip = await JSZip.loadAsync(buffer);
  let expandedSize = 0;
  let fileCount = 0;

  for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir) continue;

    const normalized = relativePath.replace(/\\/g, '/');
    // GitHub archives have a top-level dir like owner-repo-sha/; strip it
    const pathWithoutRoot = normalized.split('/').slice(1).join('/');
    if (!pathWithoutRoot) continue;

    const parts = pathWithoutRoot.split('/');
    if (parts.some((p) => SKIP_DIRS.has(p))) continue;

    const ext = `.${pathWithoutRoot.split('.').pop() ?? ''}`;
    if (!REACT_EXTENSIONS.has(ext)) continue;

    if (++fileCount > MAX_FILES) break;

    try {
      const raw = await zipEntry.async('arraybuffer');
      expandedSize += raw.byteLength;
      if (expandedSize > MAX_EXPANDED) break;
      if (raw.byteLength > MAX_FILE_SIZE) continue;
      const content = new TextDecoder('utf-8', { fatal: false }).decode(raw);
      files.push({ path: pathWithoutRoot, content });
    } catch {
      errors.push({ file: pathWithoutRoot, message: 'Failed to read file' });
    }
  }

  return { files, errors };
}

// ──────────────────────────────────────────
// Detect source roots (packages / apps)
// ──────────────────────────────────────────
export function detectSourceRoots(files: SourceFile[]): string[] {
  const roots = new Set<string>();
  for (const f of files) {
    const parts = f.path.split('/');
    // Heuristic: if a directory contains a package.json or src/ subdir, it's a root
    if (parts.length >= 2) {
      const dir = parts[0];
      if (['src', 'packages', 'apps', 'components', 'lib'].includes(dir)) {
        roots.add(dir);
      }
    }
  }
  return roots.size > 1 ? [...roots] : [];
}

export function filterFilesByRoot(files: SourceFile[], root: string): SourceFile[] {
  return files.filter((f) => f.path.startsWith(`${root}/`));
}
