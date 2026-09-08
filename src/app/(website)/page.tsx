import Link from 'next/link';
import QuickActions from '@/components/QuickActions';
import TestSearch from '@/components/TestSearch';
import HomepageFAQs from '@/components/HomepageFAQs';
import HomepageAnimations from '@/components/HomepageAnimations';
import AnimatedCounter from '@/components/AnimatedCounter';
import TiltCard from '@/components/TiltCard';
import ReviewsSection from '@/components/ReviewsSection';

import { getHomepageData } from '@/lib/homepage';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const data = await getHomepageData();
  const featuredTests = (data?.featuredTests || []).slice(0, 4);
  const allPackages = data?.allPackages || [];
  const services = data?.services || [];
  const testimonials = data?.testimonials || [];
  const content = data?.content || {};
  const settings = data?.settings || {};
  const branches = data?.branches || [];

  const featuredPackages = allPackages.filter((p: any) => p.isFeatured).slice(0, 4);
  const nightEnabled = settings.night_service_enabled !== 'false';

  return (
    <HomepageAnimations>
      {/* ═══ HERO ═══ */}
      <section className="relative min-h-[88vh] flex items-center overflow-hidden" style={{ background: 'linear-gradient(135deg, #071224 0%, #0c1c38 45%, #071224 100%)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-10 w-96 h-96 bg-[var(--blue)] rounded-full blur-[180px] opacity-20 animate-morph" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-[var(--teal)] rounded-full blur-[180px] opacity-15 animate-morph" style={{ animationDelay: '4s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-sky-600 rounded-full blur-[320px] opacity-10" />
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(14,165,233,0.08) 1px, transparent 0)', backgroundSize: '36px 36px' }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 lg:py-20 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7 max-w-2xl order-2 lg:order-1">
              {nightEnabled && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-400/30 mb-6 shadow-2xs">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-semibold text-sky-200 tracking-wide">24x7 Emergency & Night Sample Collection</span>
                </div>
              )}

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.12] mb-5" style={{ fontFamily: 'var(--font-jakarta)' }}>
                {content.hero_heading ? (
                  <span>{content.hero_heading}</span>
                ) : (
                  <>
                    <span className="block">Precision Clinical Diagnostics,</span>
                    <span className="gradient-text block">Trusted Healthcare</span>
                  </>
                )}
              </h1>

              <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-8 max-w-xl">
                {content.hero_description || 'NABL accredited diagnostic laboratory offering automated pathology, molecular testing, and doorstep certified sample collection with fast digital reports.'}
              </p>

              <div className="flex flex-col sm:flex-row gap-3.5 sm:gap-4">
                <Link href="/booking" className="btn-glow text-center sm:text-left flex items-center justify-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>Book a Test Now</span>
                </Link>
                <Link href="/booking?collection=home_collection" className="btn-outline text-center sm:text-left flex items-center justify-center gap-2">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  <span>Home Sample Pickup</span>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-6 sm:gap-8 mt-8 pt-6 border-t border-white/10">
                <div className="flex items-center gap-2 text-slate-300 text-xs sm:text-sm font-medium">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                  <span>NABL Accredited</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300 text-xs sm:text-sm font-medium">
                  <div className="w-5 h-5 rounded-full bg-sky-500/20 flex items-center justify-center shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                  <span>Same Day Reports</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300 text-xs sm:text-sm font-medium">
                  <div className="w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2DD4BF" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                  <span>Doorstep Collection</span>
                </div>
              </div>
            </div>

            {/* Hero Visual Card */}
            <div className="lg:col-span-5 flex justify-center items-center order-1 lg:order-2 my-2 lg:my-0">
              <div className="relative w-full max-w-[440px] sm:max-w-[480px]">
                {/* Decorative Glowing Rings */}
                <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-sky-500/20 via-teal-500/10 to-transparent blur-xl pointer-events-none" />

                {/* Main Visual Frame */}
                <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-white/15 bg-slate-900 shadow-2xl shadow-sky-950/60 aspect-[4/3] group">
                  <img
                    src="/images/hero/hero-diagnostic-lab.jpg"
                    alt="High-precision diagnostic laboratory automated analyzer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#071224]/90 via-[#071224]/25 to-transparent pointer-events-none" />
                  
                  <div className="absolute bottom-4 left-4 right-4 sm:bottom-5 sm:left-5 sm:right-5 z-10">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <p className="text-white text-xs sm:text-sm font-bold tracking-wide">Automated Diagnostic Analyzer</p>
                    </div>
                    <p className="text-slate-300 text-[11px] sm:text-xs">Advanced robotic pipetting & digital optical microscopy</p>
                  </div>
                </div>

                {/* Floating Top Trust Badge */}
                <div className="absolute -top-3 -right-2 sm:-top-4 sm:-right-4 px-3.5 py-2 rounded-xl bg-white/95 backdrop-blur-md border border-slate-100 shadow-xl shadow-slate-950/20 animate-float">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-800 tracking-wide uppercase leading-tight">NABL Accredited</p>
                      <p className="text-[9px] text-slate-500 font-medium leading-none mt-0.5">ISO 15189 Certified</p>
                    </div>
                  </div>
                </div>

                {/* Floating Bottom Report Badge */}
                <div className="absolute -bottom-3 -left-2 sm:-bottom-4 sm:-left-4 px-3.5 py-2.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-100 shadow-xl shadow-slate-950/20 animate-float" style={{ animationDelay: '2.5s' }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--blue)] to-[var(--teal)] flex items-center justify-center text-white shrink-0 shadow-sm">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-slate-900 text-xs font-bold leading-tight">Digital Reports</p>
                      <p className="text-emerald-600 text-[10px] font-semibold leading-none mt-0.5">Within 6-24 Hours</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <QuickActions />

      {/* ═══ SERVICES ═══ */}
      <section className="py-12 lg:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 lg:mb-10 reveal">
            <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-[var(--blue)] mb-2">Our Services</span>
            <h2 className="text-xl sm:text-3xl lg:text-5xl font-bold text-[var(--navy)]" style={{ fontFamily: 'var(--font-jakarta)' }}>
              {content.services_heading || 'Comprehensive Diagnostic Services'}
            </h2>
            <p className="text-[var(--gray-500)] mt-2 max-w-2xl mx-auto text-base sm:text-lg">
              {content.services_description || 'Advanced laboratory services with accurate results and quick turnaround time'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {services.slice(0, 6).map((service: any) => (
              <Link key={service.id} href={`/services/${service.slug || service.id}`} className="group reveal">
                <TiltCard className="h-full">
                  <div className="relative p-7 sm:p-8 rounded-3xl bg-gradient-to-br from-[var(--gray-50)] to-white border border-[var(--gray-100)] hover:border-[var(--blue)]/20 hover:shadow-2xl hover:shadow-[var(--blue)]/5 transition-all duration-500 h-full">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[var(--blue)] to-[var(--blue-light)] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-[var(--navy)] mb-2 group-hover:text-[var(--blue)] transition-colors">{service.name}</h3>
                    <p className="text-[var(--gray-500)] text-sm leading-relaxed">{service.description || 'Professional diagnostic service with accurate results'}</p>
                    <div className="mt-5 flex items-center text-[var(--blue)] text-sm font-semibold">
                      Learn More
                      <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                    </div>
                  </div>
                </TiltCard>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <TestSearch />

      {/* ═══ FEATURED TESTS (Top 4 Popular) ═══ */}
      {featuredTests.length > 0 && (
        <section className="py-10 lg:py-14 bg-gradient-to-b from-[var(--gray-50)] to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-6 sm:mb-8">
              <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-[var(--blue)] mb-2">Featured Tests</span>
              <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold text-[var(--navy)]" style={{ fontFamily: 'var(--font-jakarta)' }}>
                {content.tests_heading || 'Popular Diagnostic Tests'}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {featuredTests.map((test: any) => (
                <Link key={test.id} href={`/tests/${test.slug || test.id}`} className="group">
                  <TiltCard className="h-full">
                    <div className="relative p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-sky-300 hover:shadow-lg transition-all duration-300 h-full flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between mb-3 gap-2">
                          <span className="text-[11px] font-bold text-[var(--blue)] bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-100">{test.category?.name || 'Test'}</span>
                          {test.price && <span className="text-base sm:text-lg font-bold text-[var(--navy)] shrink-0">₹{test.price}</span>}
                        </div>
                        <h3 className="font-bold text-[var(--navy)] text-sm sm:text-base mb-1.5 group-hover:text-[var(--blue)] transition-colors line-clamp-1">{test.name}</h3>
                        <p className="text-[var(--gray-500)] text-xs line-clamp-2 leading-relaxed">{test.description || 'Verified NABL diagnostic test'}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[var(--blue)] text-xs font-semibold">
                        <span>Book / View Details</span>
                        <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                      </div>
                    </div>
                  </TiltCard>
                </Link>
              ))}
            </div>

            <div className="mt-7 text-center">
              <Link
                href="/tests"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:border-[var(--blue)]/40 hover:bg-sky-50 text-slate-700 hover:text-[var(--blue)] font-semibold text-xs sm:text-sm transition-all shadow-2xs"
              >
                <span>Explore All 500+ Diagnostic Tests</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══ FEATURED PACKAGES ═══ */}
      {featuredPackages.length > 0 && (
        <section className="py-12 lg:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 lg:mb-10 reveal">
              <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-[var(--blue)] mb-2">Health Packages</span>
              <h2 className="text-xl sm:text-3xl lg:text-5xl font-bold text-[var(--navy)]" style={{ fontFamily: 'var(--font-jakarta)' }}>
                {content.packages_heading || 'Complete Health Checkup Packages'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredPackages.map((pkg: any) => (
                <Link key={pkg.id} href={`/packages/${pkg.slug || pkg.id}`} className="group reveal">
                  <TiltCard>
                    <div className="relative p-6 rounded-2xl bg-gradient-to-br from-white to-[var(--gray-50)] border border-[var(--gray-100)] hover:border-[var(--blue)]/20 hover:shadow-xl transition-all duration-500 h-full">
                      <div className="w-full h-1 bg-gradient-to-r from-[var(--blue)] to-[var(--teal)] rounded-full mb-4 animate-gradient" />
                      <h3 className="font-bold text-[var(--navy)] mb-2 group-hover:text-[var(--blue)] transition-colors">{pkg.name}</h3>
                      {pkg.price && <p className="text-2xl font-bold text-[var(--blue)] mb-3">₹{pkg.price}</p>}
                      {pkg.description && <p className="text-[var(--gray-500)] text-sm line-clamp-2">{pkg.description}</p>}
                      <div className="mt-4 flex items-center text-[var(--blue)] text-xs font-semibold">
                        View Package
                        <svg className="ml-1 w-3 h-3 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                      </div>
                    </div>
                  </TiltCard>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ BRANCHES ═══ */}
      {branches.length > 0 && (
        <section className="py-12 lg:py-16 bg-gradient-to-b from-white to-[var(--gray-50)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 lg:mb-10 reveal">
              <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-[var(--blue)] mb-2">Our Locations</span>
              <h2 className="text-xl sm:text-3xl lg:text-5xl font-bold text-[var(--navy)]" style={{ fontFamily: 'var(--font-jakarta)' }}>
                {content.branches_heading || 'Visit Our Lab'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {branches.slice(0, 3).map((branch: any) => (
                <TiltCard key={branch.id} className="reveal">
                  <div className="p-7 sm:p-8 rounded-3xl bg-white border border-[var(--gray-100)] hover:shadow-xl transition-all duration-500">
                    <h3 className="text-lg sm:text-xl font-bold text-[var(--navy)] mb-2">{branch.name}</h3>
                    {branch.address && <p className="text-[var(--gray-500)] text-sm mb-4">{branch.address}</p>}
                    {branch.phone && (
                      <div className="flex items-center gap-2 text-[var(--blue)] text-sm font-medium">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                        {branch.phone}
                      </div>
                    )}
                  </div>
                </TiltCard>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ PATIENT REVIEWS ═══ */}
      <ReviewsSection
        initialTestimonials={testimonials}
        heading={content.testimonials_heading}
      />

      <HomepageFAQs initialFaqs={data?.faqs || []} />

      {/* ═══ ABOUT ═══ */}
      <section className="py-10 lg:py-14 bg-gradient-to-b from-white to-[var(--gray-50)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
            <div className="reveal-left">
              <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-[var(--blue)] mb-2">About Us</span>
              <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold text-[var(--navy)] mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
                {content.about_heading || 'Precision Diagnostics, Trusted Care'}
              </h2>
              <p className="text-[var(--gray-600)] leading-relaxed mb-6 text-base sm:text-lg">
                {content.about_description || 'We are a NABL accredited diagnostic laboratory committed to providing accurate, timely, and affordable diagnostic services. Our state-of-the-art equipment and experienced team ensure the highest quality results.'}
              </p>
              <Link href="/about" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-[var(--blue)] to-[var(--blue-light)] text-white font-bold hover:shadow-xl hover:shadow-[var(--blue-glow)] transition-all duration-300 hover:-translate-y-0.5 text-sm sm:text-base">
                Learn More About Us
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
              </Link>
            </div>
            <div className="reveal-right">
              <div className="relative rounded-3xl overflow-hidden animate-glow-pulse shadow-xl">
                <img src="/images/scientist-microscope.jpg" alt="Laboratory" className="w-full h-[280px] sm:h-[360px] object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--navy)]/60 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ STATS (with Counter Animation) ═══ */}
      <section className="py-10 lg:py-12 animate-gradient" style={{ background: 'linear-gradient(135deg, #0284C7, #0369A1, #0D9488, #0284C7)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[
              { label: 'Tests Available', value: 500, suffix: '+' },
              { label: 'Happy Patients', value: 50000, suffix: '+' },
              { label: 'Years Experience', value: 10, suffix: '+' },
              { label: 'Home Collections', value: 10000, suffix: '+' },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-6 sm:p-7 rounded-2xl bg-white/90 backdrop-blur border border-white/20 hover:shadow-xl transition-all duration-500 group reveal">
                <p className="text-2xl sm:text-4xl font-bold gradient-text mb-1.5" style={{ fontFamily: 'var(--font-jakarta)' }}>
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-xs sm:text-sm text-[var(--gray-500)] font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-12 lg:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold text-[var(--navy)] mb-3 reveal" style={{ fontFamily: 'var(--font-jakarta)' }}>
            Ready to Book Your Test?
          </h2>
          <p className="text-[var(--gray-500)] mb-8 text-base sm:text-lg max-w-2xl mx-auto reveal">
            Book your diagnostic test online and get accurate results with quick turnaround time
          </p>
          <div className="flex flex-col sm:flex-row gap-3.5 sm:gap-4 justify-center reveal">
            <Link href="/booking" className="btn-glow animate-glow-pulse">
              <span className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                Book Test Now
              </span>
            </Link>
            <Link href="/tests" className="btn-outline">
              Browse All Tests
            </Link>
          </div>
        </div>
      </section>
    </HomepageAnimations>
  );
}
