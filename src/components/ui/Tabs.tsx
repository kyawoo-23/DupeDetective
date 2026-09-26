import { btnFocus } from './shared';

interface TabsProps {
  tabs: { id: string; label: string; mobileLabel?: string; count?: number }[];
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
          className={`min-w-0 flex-1 whitespace-nowrap px-1.5 py-3 text-xs font-medium border-b-2 transition-colors sm:flex-none sm:px-4 sm:text-sm ${btnFocus} ${
            active === tab.id
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span className="sm:hidden">{tab.mobileLabel ?? tab.label}</span>
          <span className="hidden sm:inline">{tab.label}</span>
          {tab.count != null && (
            <span
              className={`ml-1 hidden rounded-full px-1.5 py-0.5 text-xs sm:inline ${
                active === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
