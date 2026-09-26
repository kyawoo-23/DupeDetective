// Components tab — searchable list of all scanned components

import { useState } from 'react';
import type { Scan } from '../../types';
import { Badge, Card, ComponentTag, Empty, FileLocation, Input } from '../ui';

export function ComponentsTab({ scan }: { scan: Scan }) {
  const [search, setSearch] = useState('');
  const filtered = scan.components.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.file.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="min-w-0">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full max-w-md">
          <Input
            label="Search components"
            type="search"
            placeholder="Name or file path"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <p className="text-sm text-slate-500" role="status">
          {filtered.length} of {scan.components.length} components
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((c) => (
          <Card key={c.id} className="min-w-0 p-4">
            <div className="flex min-w-0 flex-wrap items-center gap-2 mb-1">
              <ComponentTag
                name={c.name}
                className="min-w-0 break-all font-medium text-sm text-slate-900"
              />
              <Badge color="slate">{c.kind}</Badge>
              {c.exportType !== 'none' && <Badge color="blue">{c.exportType}</Badge>}
            </div>
            <p className="mb-2">
              <FileLocation file={c.file} line={c.line} />
            </p>
            <div className="flex flex-wrap gap-1">
              {c.propNames.slice(0, 5).map((p) => (
                <span key={p} className="bg-slate-100 text-slate-600 text-xs rounded px-1.5 py-0.5">
                  {p}
                </span>
              ))}
              {c.propNames.length > 5 && (
                <span className="text-xs text-slate-400">+{c.propNames.length - 5}</span>
              )}
            </div>
            {c.propNames.length === 0 && (
              <span className="text-xs text-slate-400">No props detected</span>
            )}
          </Card>
        ))}
      </div>
      {filtered.length === 0 && (
        <Empty title="No components match" description="Try a different search term." />
      )}
    </div>
  );
}
