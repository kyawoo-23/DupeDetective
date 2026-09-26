// List of previous scans on the landing page

import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store';
import { RowButton } from '../ui';

export function PreviousScans() {
  const scans = useAppStore((s) => s.scans);
  const setActiveScan = useAppStore((s) => s.setActiveScan);
  const navigate = useNavigate();
  if (scans.length === 0) return null;
  return (
    <div className="mt-6">
      <h2 className="mb-2 text-sm font-semibold text-slate-700">Recent scans</h2>
      <div className="flex flex-col gap-2">
        {scans
          .slice()
          .reverse()
          .map((scan) => (
            <RowButton
              key={scan.id}
              onClick={() => {
                setActiveScan(scan.id);
                navigate(`/scan/${scan.id}`);
              }}
            >
              <div className="font-medium text-slate-800 break-all">
                {scan.source.kind === 'github' ? scan.source.url : scan.source.filename}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {scan.groups.length} groups · {scan.components.length} components ·{' '}
                {new Date(scan.createdAt).toLocaleString()}
              </div>
            </RowButton>
          ))}
      </div>
    </div>
  );
}
