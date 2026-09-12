import Link from 'next/link';
import type { Metadata } from 'next';
import HomepageAnimations from '@/components/HomepageAnimations';
import PackagesList from '@/components/PackagesList';
import PackageSavingsCalculator from '@/components/PackageSavingsCalculator';

export const metadata: Metadata = {
  title: 'Health Packages',
  description: 'Comprehensive health checkup packages at affordable prices. Complete blood tests, wellness packages, and specialized health screenings.',
};

export const dynamic = 'force-dynamic';

export default async function PackagesPage() {
  return (
    <HomepageAnimations>
      <div className="pb-20 md:pb-0">
        {/* ═══ HERO WITH HEALTH PACKAGES LAB IMAGE ═══ */}
        <section className="relative overflow-hidden bg-[#0A1628]">
          <div className="absolute inset-0 z-0 pointer-events-none">
            <img 
              src="/images/hero/hero-diagnostic-lab.jpg" 
              alt="Laboratory Equipment" 
              className="w-full h-full object-cover object-center opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A1628] via-[#0A1628]/90 to-[#0A1628]/75" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628] via-transparent to-[#0A1628]/80" />
          </div>

          <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--teal)] rounded-full blur-[200px] opacity-15 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[var(--blue)] rounded-full blur-[180px] opacity-15 pointer-events-none" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
            <nav className="text-sm text-slate-400 mb-6 flex items-center gap-2" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-teal-400 transition-colors">Home</Link>
              <span className="text-slate-600">/</span>
              <span className="text-white font-medium">Packages</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold uppercase tracking-wider mb-4">
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                  PREVENTIVE WELLNESS & FULL BODY CHECKUPS
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 tracking-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>
                  Health <span className="bg-gradient-to-r from-teal-400 via-emerald-300 to-sky-400 bg-clip-text text-transparent">Packages</span>
                </h1>
                
                <p className="text-slate-300 max-w-2xl text-base sm:text-lg leading-relaxed mb-6 font-normal">
                  Comprehensive health checkup packages designed to give you a complete picture of your health with huge savings and free home collection.
                </p>

                <div className="flex flex-wrap gap-2.5 sm:gap-3 mb-8">
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-slate-200 backdrop-blur-md">
                    <span className="text-teal-400">💰</span> Save Up To 60% On MRP
                  </div>
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-slate-200 backdrop-blur-md">
                    <span className="text-teal-400">🏡</span> Free Home Sample Pickup
                  </div>
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-slate-200 backdrop-blur-md">
                    <span className="text-teal-400">⚡</span> Same-Day Digital Reports
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href="/home-collection"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-bold shadow-lg shadow-teal-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>Book Home Collection</span>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                  </Link>

                  <Link
                    href="/booking"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold border border-white/20 transition-all backdrop-blur-sm"
                  >
                    <span>Instant Booking</span>
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-5 relative mt-4 lg:mt-0">
                <div className="relative mx-auto max-w-md lg:max-w-none">
                  <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-teal-500/30 to-sky-500/30 blur-xl opacity-60" />
                  
                  <div className="relative rounded-3xl overflow-hidden border border-white/20 shadow-2xl shadow-slate-950/80 bg-slate-900 group">
                    <img
                      src="/images/test-tube-analysis.jpg"
                      alt="Health Checkup Laboratory Testing"
                      className="w-full h-[260px] sm:h-[300px] object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent pointer-events-none" />

                    <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/85 backdrop-blur-md border border-white/20 text-white text-xs font-semibold shadow-lg">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>Certified Pathologists</span>
                    </div>

                    <div className="absolute bottom-3.5 left-3.5 right-3.5 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span className="text-teal-300 font-extrabold">✓</span> 100% Quality Assured
                      </p>
                      <p className="text-[11px] text-slate-300 mt-0.5 font-normal">
                        NABL accredited clinical protocols with doctor consultation
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
        </section>

        {/* ═══ PACKAGES GRID (client component with fetch) ═══ */}
        <PackagesList />

        {/* ═══ BILL & SAVINGS OPTIMIZER ═══ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
          <PackageSavingsCalculator />
        </section>
      </div>
    </HomepageAnimations>
  );
}
