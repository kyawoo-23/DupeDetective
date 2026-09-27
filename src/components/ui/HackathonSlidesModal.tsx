import { useEffect, useId, useRef, useState } from 'react';
import { IconButton } from './Button';
import { footerHelpTrigger, helpLinkTrigger } from './shared';

const SLIDES_URL = '/hackathon-slides.html';
const SLIDES_PDF_URL = '/dupe-detective-hackathon.pdf';

type HackathonSlidesModalProps = {
  variant?: 'inline' | 'footer' | 'header';
  triggerClassName?: string;
};

function PresentationIcon({
  className = 'size-4 shrink-0 text-primary-700',
}: {
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      focusable="false"
    >
      <path d="M2 3h20" />
      <path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3" />
      <path d="m7 21 5-5 5 5" />
    </svg>
  );
}

const headerNavTrigger =
  'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500';

export function HackathonSlidesModal({
  variant = 'inline',
  triggerClassName,
}: HackathonSlidesModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [open, setOpen] = useState(false);

  const triggerClass =
    triggerClassName ??
    (variant === 'footer'
      ? footerHelpTrigger
      : variant === 'header'
        ? headerNavTrigger
        : helpLinkTrigger);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    const body = document.body;
    const html = document.documentElement;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyPosition = body.style.position;
    const prevBodyTop = body.style.top;
    const prevBodyWidth = body.style.width;
    const scrollbarGap = window.innerWidth - html.clientWidth;

    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    if (scrollbarGap > 0) {
      body.style.paddingRight = `${scrollbarGap}px`;
    }

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.position = prevBodyPosition;
      body.style.top = prevBodyTop;
      body.style.width = prevBodyWidth;
      body.style.paddingRight = '';
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  const close = () => setOpen(false);

  const triggerLabel =
    variant === 'footer' ? (
      <>
        <PresentationIcon />
        <span className="min-w-0 flex-1">Hackathon presentation</span>
      </>
    ) : variant === 'header' ? (
      <>
        <PresentationIcon className="size-4 shrink-0" />
        <span>Presentation</span>
      </>
    ) : (
      'View hackathon presentation'
    );

  return (
    <>
      <button type="button" className={triggerClass} onClick={() => setOpen(true)}>
        {triggerLabel}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="fixed inset-0 m-0 flex h-dvh max-h-dvh w-full max-w-none overflow-hidden border-0 bg-[#d7e1e6] p-0 shadow-none backdrop:bg-transparent [&:not([open])]:hidden"
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
      >
        <div className="relative flex h-full min-h-0 w-full flex-col">
          <div className="absolute right-3 top-3 z-10 flex items-center gap-2 sm:right-4 sm:top-4">
            <span id={titleId} className="sr-only">
              DupeDetective hackathon presentation
            </span>
            <a
              href={SLIDES_PDF_URL}
              download
              className="inline-flex min-h-11 items-center rounded-md bg-white/90 px-3 text-sm font-medium text-slate-700 shadow-md backdrop-blur-sm hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              Download PDF
            </a>
            <IconButton
              aria-label="Close presentation"
              className="bg-white/90 shadow-md backdrop-blur-sm hover:bg-white"
              onClick={close}
            >
              ×
            </IconButton>
          </div>
          {open ? (
            <iframe
              src={SLIDES_URL}
              title="DupeDetective hackathon presentation"
              className="h-full w-full min-h-0 flex-1 border-0"
            />
          ) : null}
        </div>
      </dialog>
    </>
  );
}
