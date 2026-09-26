// Empty state and CopyButton
import React from 'react';
import { Button } from './Button';

interface EmptyProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  className?: string;
}

export function Empty({ icon, title, description, className = '' }: EmptyProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 gap-3 text-center ${className}`}
    >
      {icon && <div className="text-slate-300 mb-1">{icon}</div>}
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {description && <p className="text-xs text-slate-400 max-w-xs">{description}</p>}
    </div>
  );
}

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = React.useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <Button variant="secondary" size="sm" onClick={copy}>
      {copied ? '✓ Copied' : label}
    </Button>
  );
}
