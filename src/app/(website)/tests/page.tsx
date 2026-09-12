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
        {/* ═══ HERO ═══ */}
        <section className="relative overflow-hidden">
          {/* Full Laboratory Background Image */}
          <div className="absolute inset-0 z-0">
            <img 
              src="/images/hero/hero-diagnostic-lab.webp" 
              alt="Diagnostic Laboratory" 
              fetchPriority="high"
              decoding="async"
              className="w-full h-full object-cover object-center"
            />
            {/* Dark green / navy overlay preserving the green-black vibe while showing the lab clearly */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A1628]/90 via-[#0d2818]/80 to-[#0A1628]/70" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628]/95 via-transparent to-[#0A1628]/60" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
            <nav className="text-sm text-slate-400 mb-6" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-teal-400 transition-colors">Home</Link>
              <span className="mx-2 text-slate-600">/</span>
              <span className="text-white">Tests</span>
            </nav>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
                  Diagnostic <span className="gradient-text">Tests</span>
                </h1>
                <p className="text-slate-300 max-w-2xl text-lg leading-relaxed">
                  Browse our complete range of diagnostic tests. Find the test you need and book online with accurate, timely results.
                </p>
              </div>
              <Link
                href="/tests/compare"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold border border-white/20 transition-all shrink-0 backdrop-blur-sm self-start sm:self-auto"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" /></svg>
                Compare Tests
              </Link>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
        </section>

        {/* ═══ TESTS (client component with fetch) ═══ */}
        <TestsList initialCategory={category} initialSearch={search} />
      </div>
    </HomepageAnimations>
  );
}
