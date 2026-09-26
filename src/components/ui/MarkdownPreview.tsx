import { marked } from 'marked';

const markdownClassName = [
  'text-sm leading-relaxed text-slate-700',
  '[&_h1]:mt-0 [&_h1]:mb-4 [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:text-slate-900',
  '[&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-slate-900 [&_h2:first-child]:mt-0',
  '[&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-slate-800',
  '[&_p]:my-2',
  '[&_hr]:my-5 [&_hr]:border-slate-200',
  '[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5',
  '[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5',
  '[&_li]:my-0.5',
  '[&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_code]:text-slate-800',
  '[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-slate-50 [&_pre]:p-3',
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0',
  '[&_strong]:font-semibold [&_strong]:text-slate-900',
].join(' ');

interface MarkdownPreviewProps {
  source: string;
  className?: string;
}

export function MarkdownPreview({ source, className = '' }: MarkdownPreviewProps) {
  const html = marked.parse(source, { async: false, gfm: true });

  return (
    <div
      className={`${markdownClassName} ${className}`}
      // Generated locally from scan decisions; not user-authored HTML.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
