// GitHub and ZIP scan forms with drag-and-drop support

import { parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';
import type React from 'react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import demoZipUrl from '../../../demo-project.zip?url';
import { parseGitHubUrl } from '../../lib/fs';
import { runGitHubScan, runZipScan } from '../../lib/scan';
import { useAppStore } from '../../store';
import { Button, Card, Input, SegmentedControl } from '../ui';

const scanInputParsers = {
  tab: parseAsStringLiteral(['github', 'zip'] as const).withDefault('github'),
  url: parseAsString.withDefault(''),
  ref: parseAsString.withDefault(''),
};

export function ScanForm() {
  const navigate = useNavigate();
  const { addScan, setActiveScan } = useAppStore();
  const [query, setQuery] = useQueryStates(scanInputParsers, { history: 'replace' });
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [pending, setPending] = useState<'github' | 'zip' | 'demo' | null>(null);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<{ source: 'github' | 'zip'; message: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [isDragOver, setIsDragOver] = useState(false);

  const selectTab = (tab: 'github' | 'zip') => {
    setError(null);
    if (tab === 'zip') {
      setQuery({ tab, url: null, ref: null });
    } else {
      setQuery({ tab });
    }
  };

  const handleGitHub = async () => {
    setError(null);
    if (!parseGitHubUrl(query.url)) {
      setError({
        source: 'github',
        message: 'Enter a valid public GitHub URL, e.g. https://github.com/owner/repo',
      });
      return;
    }
    setPending('github');
    try {
      const scan = await runGitHubScan(query.url, query.ref || undefined, setProgress);
      await addScan(scan);
      setActiveScan(scan.id);
      navigate(`/scan/${scan.id}`);
    } catch (e) {
      setError({ source: 'github', message: String(e) });
    } finally {
      setPending(null);
      setProgress('');
    }
  };

  const handleZip = async () => {
    setError(null);
    if (!zipFile) {
      setError({ source: 'zip', message: 'Select a ZIP file first.' });
      return;
    }
    setPending('zip');
    try {
      const scan = await runZipScan(zipFile, setProgress);
      await addScan(scan);
      setActiveScan(scan.id);
      navigate(`/scan/${scan.id}`);
    } catch (e) {
      setError({ source: 'zip', message: String(e) });
    } finally {
      setPending(null);
      setProgress('');
    }
  };

  const loadDemo = async () => {
    setError(null);
    setPending('demo');
    setProgress('Loading demo project…');
    setQuery({ tab: 'zip', url: null, ref: null });
    try {
      const response = await fetch(demoZipUrl);
      if (!response.ok) {
        throw new Error('Could not load the demo project.');
      }
      const file = new File([await response.blob()], 'demo-project.zip', {
        type: 'application/zip',
      });
      setZipFile(file);
      const scan = await runZipScan(file, setProgress);
      await addScan(scan);
      setActiveScan(scan.id);
      navigate(`/scan/${scan.id}`);
    } catch (e) {
      setError({ source: 'zip', message: String(e) });
    } finally {
      setPending(null);
      setProgress('');
    }
  };

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current += 1;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true);
    }
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setIsDragOver(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current = 0;
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith('.zip')) {
      setZipFile(file);
      selectTab('zip');
    }
  };

  return (
    <>
      <SegmentedControl
        className="mb-4"
        fullWidth
        value={query.tab}
        onChange={selectTab}
        options={[
          {
            value: 'github',
            label: (
              <span className="inline-flex items-center justify-center gap-2">
                <SourceIcon kind="github" />
                GitHub URL
              </span>
            ),
          },
          {
            value: 'zip',
            label: (
              <span className="inline-flex items-center justify-center gap-2">
                <SourceIcon kind="zip" />
                Upload ZIP
              </span>
            ),
          },
        ]}
      />

      <Card className="p-5 shadow-sm shadow-slate-900/5 sm:p-8">
        {query.tab === 'github' ? (
          <form
            className="flex flex-col gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              handleGitHub();
            }}
          >
            <Input
              label="Repository URL"
              placeholder="https://github.com/owner/repo"
              type="url"
              inputMode="url"
              value={query.url}
              onChange={(e) => setQuery({ url: e.target.value })}
            />
            <Input
              label="Branch or commit (optional)"
              placeholder="main, feature/my-branch, or a commit SHA"
              value={query.ref}
              onChange={(e) => setQuery({ ref: e.target.value })}
            />
            <p className="text-xs text-slate-400">
              Only public repositories. Leave branch empty to use the default branch.
            </p>
            {error?.source === 'github' && <ErrorBox message={error.message} />}
            {progress && <ProgressMsg message={progress} />}
            <Button
              type="submit"
              size="lg"
              loading={pending === 'github'}
              disabled={pending !== null && pending !== 'github'}
              className="w-full"
            >
              Start scan
            </Button>
          </form>
        ) : (
          <form
            className="flex flex-col gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              handleZip();
            }}
          >
            {/* biome-ignore lint/a11y/useSemanticElements: drop zone must be a div to contain the hidden <input type="file"> — a <button> cannot nest interactive elements */}
            <div
              onDrop={onDrop}
              onDragEnter={onDragEnter}
              onDragLeave={onDragLeave}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileRef.current?.click();
                }
              }}
              role="button"
              tabIndex={0}
              className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                isDragOver
                  ? 'border-primary-500 bg-primary-50 shadow-md ring-2 ring-primary-200/80 scale-[1.01]'
                  : 'border-slate-200 hover:border-primary-400 hover:bg-primary-50/30'
              }`}
            >
              {zipFile ? (
                <div>
                  <p className="text-sm font-medium text-slate-800">📦 {zipFile.name}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {(zipFile.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-slate-500">Drop a ZIP archive here</p>
                  <p className="text-xs text-slate-400 mt-1">or click to browse</p>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".zip"
                className="hidden"
                aria-label="Choose a ZIP archive"
                onChange={(e) => setZipFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <p className="text-xs text-slate-400">
              ZIP of your project source. Limit: 100 MB. Skips node_modules automatically.
            </p>
            {error?.source === 'zip' && <ErrorBox message={error.message} />}
            {progress && <ProgressMsg message={progress} />}
            <Button
              type="submit"
              size="lg"
              loading={pending === 'zip'}
              className="w-full"
              disabled={!zipFile || (pending !== null && pending !== 'zip')}
            >
              Start scan
            </Button>
          </form>
        )}
      </Card>

      <div className="mt-4 flex flex-col items-center gap-2">
        <Button
          variant="secondary"
          loading={pending === 'demo'}
          disabled={pending !== null && pending !== 'demo'}
          onClick={loadDemo}
        >
          Load demo project
        </Button>
        <p className="text-center text-xs text-slate-400">
          Bundled sample with known duplicate components.
        </p>
      </div>
    </>
  );
}

function SourceIcon({ kind }: { kind: 'github' | 'zip' }) {
  return (
    <svg
      className="size-5 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {kind === 'github' ? (
        <>
          <circle cx="6" cy="5" r="2" />
          <circle cx="18" cy="6" r="2" />
          <circle cx="18" cy="19" r="2" />
          <path d="M6 7v9a3 3 0 0 0 3 3h7M8 10h7a3 3 0 0 0 3-3" />
        </>
      ) : (
        <>
          <path d="M5 3h9l5 5v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
          <path d="M14 3v5h5M11 4v2M11 8v2M11 12v2" />
          <rect x="9" y="15" width="4" height="3" rx="1" />
        </>
      )}
    </svg>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700"
    >
      {message.includes('rate limit') || message.includes('throttled') ? (
        <>
          {message} <br />
          <span className="font-medium">Tip: Upload a ZIP instead.</span>
        </>
      ) : (
        message
      )}
    </div>
  );
}

function ProgressMsg({ message }: { message: string }) {
  return (
    <div role="status" className="flex items-center gap-2 text-sm text-primary-700">
      <svg
        className="animate-spin h-4 w-4"
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
      {message}
    </div>
  );
}
