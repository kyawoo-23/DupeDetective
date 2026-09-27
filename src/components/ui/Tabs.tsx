import type { ReactNode } from 'react';
import { Badge } from './Badge';
import { btnFocus } from './shared';

interface TabsProps {
  tabs: { id: string; label: string; mobileLabel?: string; count?: number; icon?: ReactNode }[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, active, onChange, className = '' }: TabsProps) {
  return (
    <div className={`flex w-full min-w-0 gap-0 border-b border-slate-200 ${className}`}>
      {tabs.map((tab) => (
        <button
          type="button"
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap px-1.5 py-3 text-xs font-medium border-b-2 transition-colors sm:flex-none sm:px-4 sm:text-sm ${btnFocus} ${
            active === tab.id
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          {tab.icon}
          <span className="sm:hidden">{tab.mobileLabel ?? tab.label}</span>
          <span className="hidden sm:inline">{tab.label}</span>
          {tab.count != null && (
            <Badge color={active === tab.id ? 'blue' : 'slate'} className="hidden sm:inline-flex">
              {tab.count}
            </Badge>
          )}
        </button>
      ))}
    </div>
  );
}
