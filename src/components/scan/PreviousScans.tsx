// List of previous scans on the landing page

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store';
import type { Scan } from '../../types';
import { Button, Modal } from '../ui';

function scanName(scan: Scan): string {
  return scan.source.kind === 'github' ? scan.source.url : scan.source.filename;
}

export function PreviousScans() {
  const scans = useAppStore((s) => s.scans);
  const setActiveScan = useAppStore((s) => s.setActiveScan);
  const deleteScan = useAppStore((s) => s.deleteScan);
  const [deleteTarget, setDeleteTarget] = useState<Scan | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const navigate = useNavigate();

  const closeDelete = () => {
    if (deleting) return;
    setDeleteTarget(null);
    setDeleteError('');
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteScan(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      setDeleteError('Could not delete this scan. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  if (scans.length === 0) return null;
  return (
    <div className="mt-6">
      <h2 className="mb-2 text-sm font-semibold text-slate-700">Recent scans</h2>
      <div className="h-56 space-y-2 overflow-y-auto overscroll-contain pr-0.5">
        {scans
          .slice()
          .reverse()
          .map((scan) => (
            <div
              key={scan.id}
              className="flex min-w-0 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white transition-colors hover:border-slate-300"
            >
              <button
                type="button"
                className="min-h-11 min-w-0 flex-1 px-4 py-3 text-left hover:bg-slate-50 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500"
                onClick={() => {
                  setActiveScan(scan.id);
                  navigate(`/scan/${scan.id}`);
                }}
              >
                <span className="block break-all font-medium text-slate-800">{scanName(scan)}</span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  {scan.groups.length} groups · {scan.components.length} components ·{' '}
                  {new Date(scan.createdAt).toLocaleString()}
                </span>
              </button>
              <button
                type="button"
                className="flex w-12 shrink-0 items-center justify-center border-l border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-700 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-500"
                aria-label={`Delete scan ${scanName(scan)} from ${new Date(scan.createdAt).toLocaleString()}`}
                title="Delete scan"
                onClick={() => setDeleteTarget(scan)}
              >
                <svg
                  className="size-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" />
                </svg>
              </button>
            </div>
          ))}
      </div>
      <Modal open={!!deleteTarget} onClose={closeDelete} title="Delete scan?">
        {deleteTarget && (
          <div className="flex flex-col gap-4">
            <p className="break-words text-sm text-slate-700">
              Delete <strong>{scanName(deleteTarget)}</strong> from{' '}
              {new Date(deleteTarget.createdAt).toLocaleString()}? Its review decisions and backlog
              will be removed from this browser.
            </p>
            {deleteError && (
              <p role="alert" className="text-sm text-red-700">
                {deleteError}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={closeDelete} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="danger" onClick={confirmDelete} loading={deleting}>
                Delete scan
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
