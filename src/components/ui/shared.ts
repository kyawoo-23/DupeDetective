// Internal shared constants — not re-exported from the barrel

export const btnFocus =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2';

export const btnMotion =
  'transition-all duration-150 motion-safe:active:scale-[0.98] disabled:motion-safe:active:scale-100';

export type BadgeColor = 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'slate' | 'teal';

export const helpLinkTrigger =
  'min-h-11 rounded-md text-sm font-medium text-primary-700 underline underline-offset-2 hover:text-primary-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 sm:min-h-0';

/** Quiet card-style trigger for the site footer */
export const footerHelpTrigger =
  'flex h-11 w-full items-center gap-2.5 rounded-lg border border-slate-200/90 bg-white px-3 text-left text-sm font-medium text-slate-800 shadow-sm shadow-slate-900/[0.04] hover:border-primary-300 hover:bg-primary-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500';
