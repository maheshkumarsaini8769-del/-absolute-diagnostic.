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
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0A1628 0%, #0d2818 40%, #0A1628 100%)' }} />
          <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--teal)] rounded-full blur-[200px] opacity-10" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[var(--blue)] rounded-full blur-[180px] opacity-8" />
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(52,211,153,0.04) 1px, transparent 0)', backgroundSize: '32px 32px' }} />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
            <nav className="text-sm text-[var(--gray-500)] mb-6" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-[var(--teal)] transition-colors">Home</Link>
              <span className="mx-2 text-[var(--gray-600)]">/</span>
              <span className="text-white">Packages</span>
            </nav>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
              Health <span className="gradient-text">Packages</span>
            </h1>
            <p className="text-[var(--gray-400)] max-w-2xl text-lg leading-relaxed">
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
