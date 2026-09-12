import Link from 'next/link';
import type { Metadata } from 'next';
import HomepageAnimations from '@/components/HomepageAnimations';
import ServicesList from './ServicesList';

export const metadata: Metadata = {
  title: 'Services',
  description: 'Comprehensive diagnostic services including blood tests, imaging, home sample collection, and more.',
};

export const revalidate = 60;

export default async function ServicesPage() {
  return (
    <HomepageAnimations>
      <div className="pb-20 md:pb-0">
        {/* ═══ DARK HERO WITH BACKGROUND IMAGE ═══ */}
        <section className="relative overflow-hidden">
          {/* Full Laboratory Background Image */}
          <div className="absolute inset-0 z-0">
            <img 
              src="/images/hero/hero-services.webp" 
              alt="Diagnostic Medical Services" 
              fetchPriority="high"
              decoding="async"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A1628]/95 via-[#0d2818]/85 to-[#0A1628]/75" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628]/95 via-transparent to-[#0A1628]/60" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
            <nav className="text-sm text-slate-400 mb-6" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-teal-400 transition-colors">Home</Link>
              <span className="mx-2 text-slate-600">/</span>
              <span className="text-white">Services</span>
            </nav>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
              Our <span className="gradient-text">Services</span>
            </h1>
            <p className="text-slate-300 mt-2 max-w-2xl text-lg leading-relaxed">
              Comprehensive diagnostic solutions powered by advanced automated technology and expert medical professionals.
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
