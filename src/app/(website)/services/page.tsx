import Link from 'next/link';
import type { Metadata } from 'next';
import HomepageAnimations from '@/components/HomepageAnimations';
import ServicesList from './ServicesList';

export const metadata: Metadata = {
  title: 'Services',
  description: 'Comprehensive diagnostic services including blood tests, imaging, home sample collection, and more.',
};

export const dynamic = 'force-dynamic';

export default async function ServicesPage() {
  return (
    <HomepageAnimations>
      <div className="pb-20 md:pb-0">
        {/* ═══ DARK HERO ═══ */}
        <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0A1628 0%, #0d2818 40%, #0A1628 100%)' }}>
          <div className="absolute inset-0">
            <div className="absolute top-10 left-1/4 w-64 h-64 bg-[var(--blue)] rounded-full blur-[160px] opacity-15" />
            <div className="absolute bottom-10 right-1/4 w-48 h-48 bg-[var(--teal)] rounded-full blur-[140px] opacity-10" />
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
            <nav className="text-sm text-[var(--gray-400)] mb-6" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-[var(--teal)] transition-colors">Home</Link>
              <span className="mx-2">/</span>
              <span className="text-white">Services</span>
            </nav>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
              Our <span className="gradient-text">Services</span>
            </h1>
            <p className="text-[var(--gray-400)] mt-2 max-w-2xl text-lg">
              Comprehensive diagnostic solutions powered by advanced technology and expert professionals.
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
        </section>

        {/* ═══ SERVICES GRID ═══ */}
        <ServicesList />
      </div>
    </HomepageAnimations>
  );
}
