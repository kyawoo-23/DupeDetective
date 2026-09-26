// Errors tab — parse errors from the scan

import type { Scan } from '../../types';

export function ErrorsTab({ scan }: { scan: Scan }) {
  return (
    <div className="flex flex-col gap-2">
      {scan.parseErrors.map((e) => (
        <div
          key={`${e.file}:${e.message}`}
          className="min-w-0 bg-amber-50 border border-amber-200 rounded-lg p-3"
        >
          <p className="break-all text-xs font-mono font-medium text-amber-800">{e.file}</p>
          <p className="break-words text-xs text-amber-700 mt-0.5">{e.message}</p>
        </div>
      ))}
    </div>
  );
}
