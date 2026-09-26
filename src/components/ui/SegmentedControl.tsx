import type React from 'react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { btnFocus } from './shared';

export interface SegmentedControlProps<T extends string> {
  options: { value: T; label: React.ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  /** Sliding pill behind the active segment (default on). */
  animateIndicator?: boolean;
  className?: string;
}

function useSegmentIndicator<T extends string>(
  enabled: boolean,
  value: T,
  fieldsetRef: React.RefObject<HTMLFieldSetElement | null>,
  buttonRefs: React.MutableRefObject<Map<T, HTMLButtonElement>>
) {
  const [indicator, setIndicator] = useState<{ width: number; x: number } | null>(null);

  const syncIndicator = useCallback(() => {
    const fieldset = fieldsetRef.current;
    const button = buttonRefs.current.get(value);
    if (!enabled || !fieldset || !button) {
      setIndicator(null);
      return;
    }
    const fieldRect = fieldset.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    setIndicator({
      width: buttonRect.width,
      x: buttonRect.left - fieldRect.left,
    });
  }, [enabled, value, fieldsetRef, buttonRefs]);

  useLayoutEffect(() => {
    syncIndicator();
  }, [syncIndicator]);

  useLayoutEffect(() => {
    if (!enabled) return;
    const fieldset = fieldsetRef.current;
    if (!fieldset) return;
    const observer = new ResizeObserver(() => syncIndicator());
    observer.observe(fieldset);
    return () => observer.disconnect();
  }, [enabled, syncIndicator, fieldsetRef]);

  return indicator;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  fullWidth = false,
  animateIndicator = true,
  className = '',
}: SegmentedControlProps<T>) {
  const fieldsetRef = useRef<HTMLFieldSetElement>(null);
  const buttonRefs = useRef(new Map<T, HTMLButtonElement>());
  const indicator = useSegmentIndicator(animateIndicator, value, fieldsetRef, buttonRefs);

  const segmentSize =
    size === 'sm' ? 'px-3 py-1.5 text-xs rounded-md' : 'py-2 px-4 rounded-md text-sm';
  return (
    <fieldset
      ref={fieldsetRef}
      className={`relative flex max-w-full gap-1 overflow-x-auto bg-slate-100 p-1 rounded-lg border-0 m-0 min-w-0 ${fullWidth ? 'w-full' : 'w-fit'} ${className}`}
    >
      {animateIndicator && indicator && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-1 left-0 z-0 rounded-md bg-white shadow-sm transition-[transform,width] duration-200 ease-out motion-reduce:transition-none"
          style={{
            width: indicator.width,
            transform: `translateX(${indicator.x}px)`,
          }}
        />
      )}
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            ref={(node) => {
              if (node) buttonRefs.current.set(opt.value, node);
              else buttonRefs.current.delete(opt.value);
            }}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`relative z-10 inline-flex items-center justify-center whitespace-nowrap font-medium ${
              animateIndicator ? '' : 'transition-colors'
            } ${btnFocus} ${segmentSize} ${fullWidth ? 'min-w-0 flex-1' : 'shrink-0'} ${
              active
                ? `text-slate-900 ${animateIndicator ? '' : 'bg-white shadow-sm'}`
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </fieldset>
  );
}
