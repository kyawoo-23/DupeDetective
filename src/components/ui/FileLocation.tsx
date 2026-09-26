import { Tooltip } from './Overlays';

interface FileLocationProps {
  file: string;
  line?: number;
  /** Single-line ellipsis; full path stays in the tooltip. */
  truncate?: boolean;
  className?: string;
}

export function FileLocation({ file, line, truncate = false, className = '' }: FileLocationProps) {
  const location = line != null ? `${file}:${line}` : file;
  const wrap = truncate ? 'inline-block max-w-full truncate' : 'break-all';
  return (
    <Tooltip content={location}>
      <code
        className={`rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700 ${wrap} ${className}`}
      >
        {location}
      </code>
    </Tooltip>
  );
}
