import Link from 'next/link';
import QuickActions from '@/components/QuickActions';
import TestSearch from '@/components/TestSearch';
import HomepageFAQs from '@/components/HomepageFAQs';
import HomepageAnimations from '@/components/HomepageAnimations';
import AnimatedCounter from '@/components/AnimatedCounter';
import TiltCard from '@/components/TiltCard';
import ReviewsSection from '@/components/ReviewsSection';
import SymptomCheckerWidget from '@/components/SymptomCheckerWidget';

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
      {/* ═══ HERO SECTION (Matches Reference Design) ═══ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f8fafc] via-[#f0fdfa]/40 to-white pt-4 pb-12 sm:pt-8 sm:pb-16 lg:py-16">
        {/* Soft background ambient glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-teal-100/40 via-sky-100/30 to-transparent rounded-full blur-3xl opacity-70 -translate-y-1/3" />
          <div className="absolute bottom-0 left-10 w-[450px] h-[450px] bg-gradient-to-tr from-emerald-50/50 to-transparent rounded-full blur-2xl opacity-60 translate-y-1/3" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
            
            {/* ── LEFT COLUMN: Eyebrow, Heading, Subtext, Action Buttons, Trust Badges ── */}
            <div className="order-2 lg:order-1 lg:col-span-7 max-w-2xl">
              
              {/* Eyebrow: ACCURATE TESTS | TRUSTED CARE */}
              <div className="inline-flex items-center gap-2 mb-3.5 sm:mb-4">
                <span className="text-[11px] sm:text-[12px] font-extrabold tracking-[0.18em] uppercase text-slate-500">
                  ACCURATE TESTS
                </span>
                <span className="text-slate-300 font-bold">|</span>
                <span className="text-[11px] sm:text-[12px] font-extrabold tracking-[0.18em] uppercase text-teal-600">
                  TRUSTED CARE
                </span>
              </div>

              {/* Main Headline: Better Testing / Brighter / Tomorrows */}
              <h1 className="text-4xl sm:text-5xl lg:text-[62px] font-black tracking-tight text-[#0f172a] leading-[1.08] mb-4 sm:mb-5" style={{ fontFamily: 'var(--font-jakarta)' }}>
                <span className="block text-[#0f172a]">Better Testing</span>
                <span className="block bg-gradient-to-r from-[#0d9488] via-[#059669] to-[#0284c7] bg-clip-text text-transparent">
                  Brighter
                </span>
                <span className="block text-[#0f172a]">Tomorrows</span>
              </h1>

              {/* Supporting Subtitle */}
              <p className="text-slate-600 text-[14.5px] sm:text-base lg:text-[17px] leading-relaxed mb-6 sm:mb-8 max-w-xl font-normal">
                Book lab tests online, get home sample collection, and access reports anytime — quick, safe and reliable.
              </p>

              {/* Action Buttons: Book a Test, Upload Photo, Home Collection, View Packages */}
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5 mb-8 sm:mb-10">
                <Link
                  href="/booking"
                  className="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-[#0d9488] hover:bg-[#0b7d73] text-white text-sm sm:text-[15px] font-bold shadow-md shadow-teal-700/20 hover:shadow-lg hover:shadow-teal-700/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  <span>Book a Test</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>

                <Link
                  href="/upload-prescription"
                  className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-full bg-teal-50 hover:bg-teal-100 text-[#0d9488] text-sm sm:text-[15px] font-bold border border-teal-200/80 shadow-xs hover:border-teal-300 transition-all duration-200"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <span>Upload Photo</span>
                </Link>
                
                <Link
                  href="/home-collection"
                  className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-full bg-white hover:bg-slate-50 text-[#0f172a] text-sm sm:text-[15px] font-semibold border border-slate-200 shadow-xs hover:border-slate-300 transition-all duration-200"
                >
                  <span>🏡 Home Collection</span>
                </Link>
              </div>

              {/* 3 Horizontal Trust Indicators (Matches Reference Badges) */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-2">
                {/* Badge 1: NABL Accredited */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-white/80 backdrop-blur-xs border border-slate-100 shadow-2xs">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0d9488] shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="6" />
                      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                    </svg>
                  </div>
                  <div className="leading-tight">
                    <p className="text-[11px] sm:text-xs font-bold text-slate-800">NABL</p>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">Accredited Lab</p>
                  </div>
                </div>

                {/* Badge 2: Free Home Collection */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-white/80 backdrop-blur-xs border border-slate-100 shadow-2xs">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0d9488] shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </div>
                  <div className="leading-tight">
                    <p className="text-[11px] sm:text-xs font-bold text-slate-800">Free Home</p>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">Collection</p>
                  </div>
                </div>

                {/* Badge 3: Reports in 24-48 hrs */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-white/80 backdrop-blur-xs border border-slate-100 shadow-2xs">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0d9488] shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div className="leading-tight">
                    <p className="text-[11px] sm:text-xs font-bold text-slate-800">Reports in</p>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">24–48 hrs</p>
                  </div>
                </div>
              </div>

              {/* Mobile Full Test Search Bar (Matches Mobile Reference Preview) */}
              <div className="lg:hidden mt-7">
                <form
                  action="/tests"
                  method="GET"
                  className="relative flex items-center bg-white rounded-full border border-slate-200/90 shadow-sm p-1.5 pl-4 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/10 transition-all"
                >
                  <svg className="w-4 h-4 text-slate-400 shrink-0 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    name="q"
                    placeholder="Search for tests, packages..."
                    className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none font-medium"
                  />
                  <button
                    type="submit"
                    className="w-9 h-9 rounded-full bg-[#0d9488] hover:bg-[#0b7d73] text-white flex items-center justify-center shrink-0 transition-colors shadow-2xs"
                    aria-label="Search"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                </form>
              </div>

            </div>

            {/* ── RIGHT COLUMN: 3D Microscope + Floating Glass Cards ── */}
            <div className="order-1 lg:order-2 lg:col-span-5 relative flex justify-center items-center mb-2 lg:mb-0">
              <div className="relative w-full max-w-[420px] lg:max-w-[480px]">
                
                {/* Soft backdrop glow behind microscope */}
                <div className="absolute inset-0 bg-gradient-to-tr from-teal-200/30 via-sky-100/40 to-transparent rounded-3xl blur-2xl -z-10" />

                {/* 3D Microscope Visual Container */}
                <div className="relative rounded-3xl overflow-hidden shadow-xl shadow-teal-950/5 border border-white/80 bg-gradient-to-b from-slate-50/50 to-white p-2 sm:p-3 group">
                  <img
                    src="/images/hero/hero-microscope.webp"
                    alt="Precision laboratory microscope with specimen test tubes"
                    className="w-full h-auto object-cover rounded-2xl group-hover:scale-[1.01] transition-transform duration-500 ease-out"
                    loading="eager"
                  />
                  
                  {/* Subtle clean gradient edge blending */}
                  <div className="absolute inset-0 bg-gradient-to-t from-white/10 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Floating Glassmorphism Cards: Trusted Results / Advanced Technology / Patient First */}
                <div className="absolute -left-3 sm:-left-6 top-8 sm:top-12 z-20 space-y-2.5">
                  
                  {/* Glass Card 1: Trusted Results */}
                  <div className="flex items-center gap-2.5 px-3 sm:px-3.5 py-2 rounded-xl bg-white/90 backdrop-blur-md border border-white/80 shadow-md shadow-slate-900/5 animate-float">
                    <div className="w-6 h-6 rounded-lg bg-teal-50 flex items-center justify-center text-[#0d9488]">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <polyline points="9 12 11 14 15 10" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[11px] sm:text-xs font-bold text-slate-800 leading-none">Trusted Results</p>
                      <p className="text-[9px] text-slate-400 font-medium leading-none mt-0.5">100% Verified</p>
                    </div>
                  </div>

                  {/* Glass Card 2: Advanced Technology */}
                  <div className="flex items-center gap-2.5 px-3 sm:px-3.5 py-2 rounded-xl bg-white/90 backdrop-blur-md border border-white/80 shadow-md shadow-slate-900/5 animate-float" style={{ animationDelay: '1.5s' }}>
                    <div className="w-6 h-6 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[11px] sm:text-xs font-bold text-slate-800 leading-none">Advanced Tech</p>
                      <p className="text-[9px] text-slate-400 font-medium leading-none mt-0.5">Robotic Analyzers</p>
                    </div>
                  </div>

                  {/* Glass Card 3: Patient First */}
                  <div className="flex items-center gap-2.5 px-3 sm:px-3.5 py-2 rounded-xl bg-white/90 backdrop-blur-md border border-white/80 shadow-md shadow-slate-900/5 animate-float" style={{ animationDelay: '3s' }}>
                    <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[11px] sm:text-xs font-bold text-slate-800 leading-none">Patient First</p>
                      <p className="text-[9px] text-slate-400 font-medium leading-none mt-0.5">Compassionate Care</p>
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

      {/* ═══ INTERACTIVE SYMPTOM-TO-TEST CHECKER ═══ */}
      <SymptomCheckerWidget />

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
