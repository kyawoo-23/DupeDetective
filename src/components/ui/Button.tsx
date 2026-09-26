import type React from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { btnFocus, btnMotion } from './shared';

// ──────────────────────────────────────────
// Button
// ──────────────────────────────────────────
type BtnVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'success'
  | 'successSoft'
  | 'amberSoft'
  | 'link'
  | 'linkMuted';
type BtnSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
  loading?: boolean;
}

const variantCls: Record<BtnVariant, string> = {
  primary: `bg-primary-600 text-white shadow-sm shadow-primary-600/25 hover:bg-primary-700 hover:shadow-md disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:hover:bg-slate-200 disabled:shadow-none ${btnMotion}`,
  secondary: `bg-white text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 hover:shadow disabled:opacity-50 disabled:shadow-none ${btnMotion}`,
  ghost: `text-slate-600 hover:bg-slate-100 disabled:opacity-40 ${btnMotion}`,
  danger: `bg-red-600 text-white shadow-sm shadow-red-600/20 hover:bg-red-700 hover:shadow-md disabled:bg-red-300 disabled:shadow-none ${btnMotion}`,
  success: `bg-emerald-600 text-white shadow-sm shadow-emerald-600/25 hover:bg-emerald-700 hover:shadow-md disabled:bg-emerald-300 disabled:shadow-none ${btnMotion}`,
  successSoft: `bg-emerald-50 text-emerald-800 border border-emerald-200/90 shadow-sm shadow-emerald-900/5 hover:bg-emerald-100/90 hover:border-emerald-300 hover:shadow disabled:opacity-50 disabled:shadow-none ${btnMotion}`,
  amberSoft: `bg-amber-50 text-amber-900 border border-amber-200/90 shadow-sm shadow-amber-900/5 hover:bg-amber-100/90 hover:border-amber-300 hover:shadow disabled:opacity-50 disabled:shadow-none ${btnMotion}`,
  link: `text-primary-700 hover:text-primary-900 underline-offset-2 hover:underline disabled:opacity-40 ${btnMotion}`,
  linkMuted: `text-slate-500 hover:text-slate-700 underline-offset-2 hover:underline disabled:opacity-40 ${btnMotion}`,
};
const sizeCls: Record<BtnSize, string> = {
  sm: 'min-h-11 px-3 py-2 text-sm rounded-md sm:min-h-0 sm:py-1.5 sm:text-xs',
  md: 'min-h-11 px-4 py-2 text-sm rounded-md',
  lg: 'min-h-12 px-5 py-2.5 text-base rounded-md',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  className = '',
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const isLink = variant === 'link' || variant === 'linkMuted';
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 font-medium ${btnFocus} ${variantCls[variant]} ${
        isLink ? 'text-sm px-0 py-0 min-h-0 rounded-sm' : sizeCls[size]
      } ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          focusable="false"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      )}
      {children}
    </button>
  );
}

interface LinkButtonProps extends LinkProps {
  variant?: BtnVariant;
  size?: BtnSize;
}

export function LinkButton({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}: LinkButtonProps) {
  const isLink = variant === 'link' || variant === 'linkMuted';
  return (
    <Link
      className={`inline-flex items-center justify-center gap-2 font-medium ${btnFocus} ${variantCls[variant]} ${
        isLink ? 'text-sm px-0 py-0 min-h-0 rounded-sm' : sizeCls[size]
      } ${className}`}
      {...rest}
    >
      {children}
    </Link>
  );
}

// ──────────────────────────────────────────
// IconButton
// ──────────────────────────────────────────
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual size of the hit target */
  size?: 'sm' | 'md';
}

export function IconButton({ size = 'md', className = '', children, ...rest }: IconButtonProps) {
  const sizeClass =
    size === 'sm'
      ? 'min-h-11 min-w-11 p-1 text-base sm:min-h-0 sm:min-w-0'
      : 'min-h-11 min-w-11 p-1.5 text-lg leading-none';
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 ${btnFocus} ${btnMotion} ${sizeClass} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

// ──────────────────────────────────────────
// RowButton
// ──────────────────────────────────────────
type RowButtonVariant = 'card' | 'subtle';

interface RowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: RowButtonVariant;
}

const rowButtonCls: Record<RowButtonVariant, string> = {
  card: 'bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm hover:border-primary-400 hover:bg-slate-50/80',
  subtle:
    'flex items-center gap-3 bg-slate-50 hover:bg-primary-50 border border-slate-200 hover:border-primary-300 rounded-lg px-3 py-2',
};

export function RowButton({ variant = 'card', className = '', children, ...rest }: RowButtonProps) {
  return (
    <button
      type="button"
      className={`w-full min-h-11 text-left transition-colors ${btnFocus} ${rowButtonCls[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
