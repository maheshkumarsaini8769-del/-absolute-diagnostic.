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
        {/* ═══ HERO ═══ */}
        <section className="relative overflow-hidden">
          {/* Full Laboratory Background Image */}
          <div className="absolute inset-0 z-0">
            <img 
              src="/images/hero/hero-diagnostic-lab.jpg" 
              alt="Diagnostic Laboratory" 
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
              <span className="text-white">Packages</span>
            </nav>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
              Health <span className="gradient-text">Packages</span>
            </h1>
            <p className="text-slate-300 max-w-2xl text-lg leading-relaxed">
              Comprehensive health checkup packages designed to give you a complete picture of your health at affordable prices.
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
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
