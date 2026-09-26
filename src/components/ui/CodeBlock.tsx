import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const codeBtnFocus =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#282c34]';

const codeBtnBase =
  'rounded-md border border-slate-600/80 bg-slate-800/95 px-3 py-1 text-xs font-medium text-slate-200 shadow-sm hover:border-slate-500 hover:bg-slate-700/95 transition-colors';

const blockTheme: typeof oneDark = {
  ...oneDark,
  'pre[class*="language-"]': {
    ...oneDark['pre[class*="language-"]'],
    margin: 0,
    padding: '1rem',
    background: 'transparent',
    overflow: 'visible',
  },
  'code[class*="language-"]': {
    ...oneDark['code[class*="language-"]'],
    background: 'transparent',
    fontSize: '0.75rem',
    lineHeight: '1.35',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
};

interface CodeBlockProps {
  code: string;
  maxLines?: number;
  language?: string;
  showLineNumbers?: boolean;
}

export function CodeBlock({
  code,
  maxLines,
  language = 'tsx',
  showLineNumbers = false,
}: CodeBlockProps) {
  const [expanded, setExpanded] = React.useState(false);
  const lines = code.split('\n');
  const canTruncate = Boolean(maxLines && lines.length > maxLines);
  const truncated = canTruncate && !expanded;
  const displayCode = truncated ? lines.slice(0, maxLines).join('\n') : code;
  const hiddenCount = canTruncate && maxLines != null ? lines.length - maxLines : 0;

  React.useEffect(() => {
    setExpanded(false);
  }, []);

  return (
    <div className="rounded-lg overflow-hidden border border-slate-700/60 bg-[#282c34] shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-slate-700/80 bg-slate-800/90 px-3 py-1.5">
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
          {language}
        </span>
        <div className="flex items-center gap-3">
          {truncated && (
            <span className="text-[10px] text-slate-500">
              {maxLines} of {lines.length} lines
            </span>
          )}
          {canTruncate && expanded && (
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className={`text-[10px] font-medium text-blue-400 hover:text-blue-300 transition-colors rounded-sm ${codeBtnFocus}`}
            >
              Show less
            </button>
          )}
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <SyntaxHighlighter
          language={language}
          style={blockTheme}
          showLineNumbers={showLineNumbers}
          wrapLongLines
          lineNumberStyle={{
            minWidth: '2.25em',
            paddingRight: '1em',
            color: '#5c6370',
            userSelect: 'none',
          }}
        >
          {displayCode}
        </SyntaxHighlighter>

        {truncated && (
          <>
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#282c34] via-[#282c34]/90 to-transparent"
              aria-hidden
            />
            <div className="absolute inset-x-0 bottom-0 flex justify-center pb-2 pt-6">
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className={`${codeBtnBase} ${codeBtnFocus}`}
              >
                Show {hiddenCount} more lines
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
