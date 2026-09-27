// Scan input page: GitHub URL or ZIP upload

import { Link } from 'react-router-dom';
import { HackathonDemoVideo } from '../components/scan/HackathonDemoVideo';
import { PreviousScans } from '../components/scan/PreviousScans';
import { ProductValueSection } from '../components/scan/ProductValueSection';
import { ScanForm } from '../components/scan/ScanForm';
import { WorkflowSteps } from '../components/scan/WorkflowSteps';
import { DetectiveIcon } from '../components/ui';
import { HackathonSlidesModal } from '../components/ui/HackathonSlidesModal';

export function ScanInputPage() {
  return (
    <div className="dd-site-background min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Link
            to="/"
            aria-label="DupeDetective home"
            className="flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <DetectiveIcon />
            <span className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              DupeDetective
            </span>
          </Link>
          <span className="text-sm text-slate-400 ml-1">/ New scan</span>
          <div className="ml-auto">
            <HackathonSlidesModal variant="header" />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 pt-8 pb-16 sm:px-6 sm:pt-12 sm:pb-20 lg:pt-16">
        <div className="flex flex-col items-center gap-12 lg:gap-16">
          <section className="w-full max-w-3xl min-w-0 pb-6 sm:pb-10" aria-label="Start a scan">
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                Start a scan
              </h1>
              <span className="text-xs text-slate-500">Choose a source</span>
            </div>

            <ScanForm />
            <PreviousScans />
          </section>

          <WorkflowSteps />

          <ProductValueSection />

          <HackathonDemoVideo />
        </div>
      </main>
    </div>
  );
}
