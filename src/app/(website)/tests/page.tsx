import Link from 'next/link';
import type { Metadata } from 'next';
import HomepageAnimations from '@/components/HomepageAnimations';
import TestsList from './TestsList';

export const metadata: Metadata = {
  title: 'Diagnostic Tests',
  description: 'Browse our complete range of diagnostic tests. Blood tests, urine tests, imaging, and more. Accurate results with quick turnaround time.',
};

export const dynamic = 'force-dynamic';

export default async function TestsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const category = typeof params.category === 'string' ? params.category : '';
  const search = typeof params.search === 'string' ? params.search : '';

  return (
    <HomepageAnimations>
      <div className="pb-20 md:pb-0">
        {/* ═══ HERO WITH LABORATORY IMAGE ═══ */}
        <section className="relative overflow-hidden bg-[#0A1628]">
          {/* Subtle laboratory background image blend */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <img 
              src="/images/hero/hero-diagnostic-lab.jpg" 
              alt="Laboratory Equipment" 
              className="w-full h-full object-cover object-center opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A1628] via-[#0A1628]/90 to-[#0A1628]/75" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628] via-transparent to-[#0A1628]/80" />
          </div>

          <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--blue)] rounded-full blur-[200px] opacity-15 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[var(--teal)] rounded-full blur-[180px] opacity-15 pointer-events-none" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
            <nav className="text-sm text-slate-400 mb-6 flex items-center gap-2" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-teal-400 transition-colors">Home</Link>
              <span className="text-slate-600">/</span>
              <span className="text-white font-medium">Tests</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Column: Heading, Subtitle, Badges & Action Buttons */}
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold uppercase tracking-wider mb-4">
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                  NABL ACCREDITED DIAGNOSTIC CARE
                </div>
                
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 tracking-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>
                  Diagnostic <span className="bg-gradient-to-r from-teal-400 via-emerald-300 to-sky-400 bg-clip-text text-transparent">Tests</span>
                </h1>
                
                <p className="text-slate-300 max-w-2xl text-base sm:text-lg leading-relaxed mb-6 font-normal">
                  Browse our complete catalog of certified blood tests and diagnostic profiles. Enjoy home sample collection and 100% verified clinical reports.
                </p>

                {/* Trust Badges */}
                <div className="flex flex-wrap gap-2.5 sm:gap-3 mb-8">
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-slate-200 backdrop-blur-md">
                    <span className="text-teal-400">⚡</span> Fast 24-48 Hr Reports
                  </div>
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-slate-200 backdrop-blur-md">
                    <span className="text-teal-400">🏡</span> Home Collection Available
                  </div>
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-slate-200 backdrop-blur-md">
                    <span className="text-teal-400">🔬</span> 500+ Verified Tests
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href="/home-collection"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-bold shadow-lg shadow-teal-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>Book Home Collection</span>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                  </Link>

                  <Link
                    href="/tests/compare"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold border border-white/20 transition-all backdrop-blur-sm"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" /></svg>
                    <span>Compare Tests</span>
                  </Link>
                </div>
              </div>

              {/* Right Column: Diagnostic Laboratory Image Card */}
              <div className="lg:col-span-5 relative mt-4 lg:mt-0">
                <div className="relative mx-auto max-w-md lg:max-w-none">
                  {/* Glowing ambient background */}
                  <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-teal-500/30 to-sky-500/30 blur-xl opacity-60" />
                  
                  {/* Modern Framed Lab Image Container */}
                  <div className="relative rounded-3xl overflow-hidden border border-white/20 shadow-2xl shadow-slate-950/80 bg-slate-900 group">
                    <img
                      src="/images/hero/hero-diagnostic-lab.jpg"
                      alt="State of the Art Diagnostic Laboratory"
                      className="w-full h-[260px] sm:h-[300px] object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent pointer-events-none" />

                    {/* Floating badge on top right */}
                    <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/85 backdrop-blur-md border border-white/20 text-white text-xs font-semibold shadow-lg">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>Robotic Analyzers</span>
                    </div>

                    {/* Bottom Caption Overlay */}
                    <div className="absolute bottom-3.5 left-3.5 right-3.5 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span className="text-teal-300 font-extrabold">✓</span> Automated Pathology Testing
                      </p>
                      <p className="text-[11px] text-slate-300 mt-0.5 font-normal">
                        NABL calibrated analyzers ensuring 99.9% clinical accuracy
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-50 to-transparent" />
        </section>

        {/* ═══ TESTS (client component with fetch) ═══ */}
        <TestsList initialCategory={category} initialSearch={search} />
      </div>
    </HomepageAnimations>
  );
}
