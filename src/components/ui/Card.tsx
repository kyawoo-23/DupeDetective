import type React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  const interactive = onClick != null;
  return (
    <div
      {...(interactive
        ? {
            onClick,
            onKeyDown: (e: React.KeyboardEvent) =>
              (e.key === 'Enter' || e.key === ' ') && onClick(),
            role: 'button' as const,
            tabIndex: 0,
          }
        : {})}
      className={`bg-white border border-slate-200 rounded-xl ${interactive ? 'cursor-pointer hover:border-primary-400 hover:shadow-sm transition-all' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
