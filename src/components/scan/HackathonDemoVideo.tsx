const HACKATHON_DEMO_VIDEO_URL = '/dupe-detective-hackathon.mp4';

export function HackathonDemoVideo() {
  return (
    <section
      className="w-full max-w-5xl border-t border-slate-200 pt-8 lg:pt-12"
      aria-labelledby="hackathon-demo-heading"
    >
      <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">
        IBM Bob 2.0 Hackathon
      </p>
      <h2
        id="hackathon-demo-heading"
        className="mx-auto max-w-4xl text-center text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl"
      >
        Demo walkthrough
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-center text-base leading-7 text-slate-600">
        Watch how DupeDetective scans a project, surfaces similar components, and supports merge
        decisions in the review workspace.
      </p>
      <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-slate-950 shadow-sm">
        {/* biome-ignore lint/a11y/useMediaCaption: optional hackathon demo clip; no caption track */}
        <video
          className="aspect-video w-full"
          controls
          playsInline
          preload="metadata"
          src={HACKATHON_DEMO_VIDEO_URL}
          aria-label="Demo walkthrough of DupeDetective"
        >
          Your browser does not support embedded video.
        </video>
      </div>
    </section>
  );
}
