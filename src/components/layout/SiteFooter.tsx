import { DetectiveIcon } from '../ui/DetectiveIcon';
import { HackathonSlidesModal } from '../ui/HackathonSlidesModal';
import { LabelGuide } from '../ui/LabelGuide';
import { SimilarityHelp } from '../ui/SimilarityHelp';
import { footerHelpTrigger } from '../ui/shared';

const REPO_URL = 'https://github.com/kyawoo-23/DupeDetective';
const REPO_SLUG = 'kyawoo-23/DupeDetective';

export function SiteFooter() {
  return (
    <footer className="relative bg-[#eef2f8]">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex items-center gap-3">
          <DetectiveIcon size={42} />
          <div className="min-w-0">
            <p className="text-base font-semibold tracking-tight text-slate-950">DupeDetective</p>
            <p className="flex items-center gap-2 text-sm text-slate-600">
              <img
                src="/ibm-bob-hackathon.png"
                alt=""
                width={1024}
                height={535}
                className="h-5 w-auto max-w-[7.5rem] shrink-0 object-contain object-left"
              />
              IBM Bob 2.0 Hackathon
            </p>
          </div>
        </div>

        <p className="max-w-prose text-sm leading-relaxed text-slate-600">
          Scan React projects for overlapping components, review AST evidence and previews, and
          record merge decisions without sending your code to a model.
        </p>

        <nav aria-label="Guides and source" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <SimilarityHelp variant="footer" />
          <LabelGuide variant="footer" />
          <HackathonSlidesModal variant="footer" />
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={footerHelpTrigger}
          >
            <GitHubIcon />
            <span className="min-w-0 flex-1 truncate font-mono text-[13px] font-normal">
              {REPO_SLUG}
            </span>
          </a>
        </nav>

        <p className="pt-2 text-xs leading-relaxed text-slate-500">
          Scans and decisions stay in this browser. ZIP uploads and GitHub archives are fetched and
          parsed read-only.
        </p>
      </div>
    </footer>
  );
}

function GitHubIcon() {
  return (
    <svg
      className="size-4 shrink-0 text-primary-700"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
      focusable="false"
    >
      <path
        fillRule="evenodd"
        d="M10 1.5a8.5 8.5 0 0 0-2.69 16.57c.42.08.58-.18.58-.41v-1.44c-2.36.51-2.86-1.14-2.86-1.14-.38-.98-.94-1.24-.94-1.24-.77-.53.06-.52.06-.52.85.06 1.3.87 1.3.87.76 1.3 1.99.92 2.48.7.08-.55.3-.92.54-1.13-1.88-.21-3.86-.94-3.86-4.2 0-.93.33-1.69.87-2.28-.09-.21-.38-1.08.08-2.25 0 0 .71-.23 2.33.87a8.1 8.1 0 0 1 4.24 0c1.62-1.1 2.33-.87 2.33-.87.46 1.17.17 2.04.08 2.25.54.59.87 1.35.87 2.28 0 3.27-1.99 3.98-3.88 4.19.31.26.58.78.58 1.57v2.33c0 .23.15.5.59.41A8.5 8.5 0 0 0 10 1.5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
