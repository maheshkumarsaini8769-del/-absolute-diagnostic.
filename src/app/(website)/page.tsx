import Link from 'next/link';
import QuickActions from '@/components/QuickActions';
import TestSearch from '@/components/TestSearch';
import HomepageFAQs from '@/components/HomepageFAQs';
import HomepageAnimations from '@/components/HomepageAnimations';
import TypewriterText from '@/components/TypewriterText';
import AnimatedCounter from '@/components/AnimatedCounter';
import TiltCard from '@/components/TiltCard';

export const dynamic = 'force-dynamic';

async function getHomepageData() {
  try {
    const res = await fetch('/api/homepage-data', { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const data = await getHomepageData();
  const featuredTests = data?.featuredTests || [];
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
      <section className="relative min-h-[92vh] flex items-center overflow-hidden" style={{ background: 'linear-gradient(135deg, #0F0A1A 0%, #1a0a2e 40%, #0F0A1A 100%)' }}>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[var(--blue)] rounded-full blur-[160px] opacity-20 animate-morph" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-[var(--teal)] rounded-full blur-[180px] opacity-15 animate-morph" style={{ animationDelay: '4s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--blue)] rounded-full blur-[300px] opacity-8" />
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(52,211,153,0.05) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-0 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="max-w-3xl">
              {nightEnabled && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/15 border border-purple-400/20 mb-8 animate-fade-in">
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse-soft" />
                  <span className="text-xs font-medium text-purple-300 tracking-wide">Night Collection Available</span>
                </div>
              )}

              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-[1.08] mb-6" style={{ fontFamily: 'var(--font-jakarta)' }}>
                {content.hero_heading ? (
                  <span className="animate-fade-in">{content.hero_heading}</span>
                ) : (
                  <>
                    <span className="block animate-fade-in">Accurate</span>
                    <span className="block animate-fade-in" style={{ animationDelay: '0.15s' }}> Diagnostics,</span>
                    <span className="gradient-text block animate-fade-in" style={{ animationDelay: '0.3s' }}>
                      <TypewriterText text="Trusted Care" delay={1200} />
                    </span>
                  </>
                )}
              </h1>

              <p className="text-[var(--gray-400)] text-base sm:text-lg lg:text-xl leading-relaxed mb-10 max-w-xl animate-fade-in" style={{ animationDelay: '0.4s' }}>
                {content.hero_description || 'NABL accredited diagnostic laboratory providing accurate and timely test results with advanced technology and expert professionals.'}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                <Link href="/booking" className="btn-glow text-center sm:text-left animate-glow-pulse">
                  <span className="flex items-center justify-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    Book Test Now
                  </span>
                </Link>
                <Link href="/booking?collection=home_collection" className="btn-outline text-center sm:text-left">
                  Home Sample Collection
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-6 mt-10 animate-fade-in" style={{ animationDelay: '0.65s' }}>
                <div className="flex items-center gap-2 text-[var(--gray-500)] text-sm">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                  NABL Accredited
                </div>
                <div className="flex items-center gap-2 text-[var(--gray-500)] text-sm">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                  Same Day Results
                </div>
                <div className="flex items-center gap-2 text-[var(--gray-500)] text-sm">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                  Home Collection
                </div>
              </div>
            </div>

            <div className="flex justify-center items-center animate-fade-in order-first lg:order-last" style={{ animationDelay: '0.4s' }}>
              <div className="relative w-[280px] h-[280px] sm:w-[360px] sm:h-[360px] lg:w-[480px] lg:h-[480px]">
                <div className="absolute inset-0 rounded-full border border-[var(--blue)]/10 animate-glow-pulse hidden sm:block" style={{ animation: 'rotateGlow 20s linear infinite' }} />
                <div className="absolute inset-4 rounded-full border border-[var(--teal)]/15 hidden sm:block" style={{ animation: 'rotateGlow 15s linear infinite reverse' }} />
                <div className="absolute inset-4 sm:inset-12 rounded-2xl sm:rounded-3xl glass-dark overflow-hidden">
                  <div className="absolute inset-0">
                    <img src="/images/hero-microscope.jpg" alt="Medical Laboratory Microscope" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--navy)]/90 via-[var(--navy)]/40 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 z-10">
                    <p className="text-white text-sm font-bold mb-1">Precision Diagnostics</p>
                    <p className="text-white/60 text-xs">Advanced laboratory technology</p>
                  </div>
                </div>
                <div className="absolute top-4 right-4 sm:top-6 sm:right-6 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl glass-dark border border-[var(--blue)]/20 animate-float hidden sm:block" style={{ animationDelay: '1s' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[var(--blue)] animate-pulse-soft" />
                    <span className="text-[10px] font-bold text-white/80 tracking-wider">NABL CERTIFIED</span>
                  </div>
                </div>
                <div className="absolute bottom-16 sm:bottom-10 left-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl glass-dark border border-[var(--teal)]/20 animate-float hidden sm:block" style={{ animationDelay: '2s' }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--blue)] to-[var(--teal)] flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                    </div>
                    <div>
                      <p className="text-white text-xs font-bold">Digital Reports</p>
                      <p className="text-white/50 text-[10px]">Available Online</p>
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
      <section className="py-20 lg:py-28 bg-white parallax-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 reveal">
            <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-[var(--blue)] mb-3">Our Services</span>
            <h2 className="text-xl sm:text-3xl lg:text-5xl font-bold text-[var(--navy)]" style={{ fontFamily: 'var(--font-jakarta)' }}>
              {content.services_heading || 'Comprehensive Diagnostic Services'}
            </h2>
            <p className="text-[var(--gray-500)] mt-3 max-w-2xl mx-auto text-lg">
              {content.services_description || 'Advanced laboratory services with accurate results and quick turnaround time'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.slice(0, 6).map((service: any) => (
              <Link key={service.id} href={`/services/${service.slug || service.id}`} className="group reveal">
                <TiltCard className="h-full">
                  <div className="relative p-8 rounded-3xl bg-gradient-to-br from-[var(--gray-50)] to-white border border-[var(--gray-100)] hover:border-[var(--blue)]/20 hover:shadow-2xl hover:shadow-[var(--blue)]/5 transition-all duration-500 h-full">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--blue)] to-[var(--blue-light)] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                    </div>
                    <h3 className="text-xl font-bold text-[var(--navy)] mb-3 group-hover:text-[var(--blue)] transition-colors">{service.name}</h3>
                    <p className="text-[var(--gray-500)] text-sm leading-relaxed">{service.description || 'Professional diagnostic service with accurate results'}</p>
                    <div className="mt-6 flex items-center text-[var(--blue)] text-sm font-semibold">
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

      {/* ═══ FEATURED TESTS ═══ */}
      {featuredTests.length > 0 && (
        <section className="py-20 lg:py-28 bg-gradient-to-b from-[var(--gray-50)] to-white parallax-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 reveal">
              <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-[var(--blue)] mb-3">Featured Tests</span>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-[var(--navy)]" style={{ fontFamily: 'var(--font-jakarta)' }}>
                {content.tests_heading || 'Popular Diagnostic Tests'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featuredTests.map((test: any) => (
                <Link key={test.id} href={`/tests/${test.slug || test.id}`} className="group reveal">
                  <TiltCard>
                    <div className="relative p-6 rounded-2xl bg-white border border-[var(--gray-100)] hover:border-[var(--blue)]/20 hover:shadow-xl transition-all duration-500 h-full">
                      <div className="flex items-start justify-between mb-4">
                        <span className="text-xs font-bold text-[var(--blue)] bg-[var(--blue)]/10 px-3 py-1 rounded-full">{test.category?.name || 'Test'}</span>
                        {test.price && <span className="text-lg font-bold text-[var(--navy)]">₹{test.price}</span>}
                      </div>
                      <h3 className="font-bold text-[var(--navy)] mb-2 group-hover:text-[var(--blue)] transition-colors">{test.name}</h3>
                      <p className="text-[var(--gray-500)] text-sm line-clamp-2">{test.description || ''}</p>
                      <div className="mt-4 flex items-center text-[var(--blue)] text-xs font-semibold">
                        View Details
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

      {/* ═══ FEATURED PACKAGES ═══ */}
      {featuredPackages.length > 0 && (
        <section className="py-20 lg:py-28 bg-white parallax-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 reveal">
              <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-[var(--blue)] mb-3">Health Packages</span>
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
        <section className="py-20 lg:py-28 bg-gradient-to-b from-white to-[var(--gray-50)] parallax-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 reveal">
              <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-[var(--blue)] mb-3">Our Locations</span>
              <h2 className="text-xl sm:text-3xl lg:text-5xl font-bold text-[var(--navy)]" style={{ fontFamily: 'var(--font-jakarta)' }}>
                {content.branches_heading || 'Visit Our Lab'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {branches.slice(0, 3).map((branch: any) => (
                <TiltCard key={branch.id} className="reveal">
                  <div className="p-8 rounded-3xl bg-white border border-[var(--gray-100)] hover:shadow-xl transition-all duration-500">
                    <h3 className="text-xl font-bold text-[var(--navy)] mb-2">{branch.name}</h3>
                    {branch.address && <p className="text-[var(--gray-500)] text-sm mb-4">{branch.address}</p>}
                    {branch.phone && (
                      <div className="flex items-center gap-2 text-[var(--blue)] text-sm">
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

      {/* ═══ TESTIMONIALS ═══ */}
      {testimonials.length > 0 && (
        <section className="py-20 lg:py-28 bg-white parallax-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 reveal">
              <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-[var(--blue)] mb-3">Testimonials</span>
              <h2 className="text-xl sm:text-3xl lg:text-5xl font-bold text-[var(--navy)]" style={{ fontFamily: 'var(--font-jakarta)' }}>
                {content.testimonials_heading || 'What Our Patients Say'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.slice(0, 6).map((t: any) => (
                <TiltCard key={t.id} className="reveal">
                  <div className="p-8 rounded-3xl bg-gradient-to-br from-[var(--gray-50)] to-white border border-[var(--gray-100)]">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={i < (t.rating || 5) ? 'var(--blue)' : 'none'} stroke="var(--blue)" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                      ))}
                    </div>
                    <p className="text-[var(--gray-600)] text-sm leading-relaxed mb-6">{t.content || t.text || ''}</p>
                    <div>
                      <p className="font-bold text-[var(--navy)] text-sm">{t.patientName || t.name || 'Patient'}</p>
                    </div>
                  </div>
                </TiltCard>
              ))}
            </div>
          </div>
        </section>
      )}

      <HomepageFAQs />

      {/* ═══ ABOUT ═══ */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-white to-[var(--gray-50)] parallax-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="reveal-left">
              <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-[var(--blue)] mb-3">About Us</span>
              <h2 className="text-xl sm:text-3xl lg:text-5xl font-bold text-[var(--navy)] mb-6" style={{ fontFamily: 'var(--font-jakarta)' }}>
                {content.about_heading || 'Precision Diagnostics, Trusted Care'}
              </h2>
              <p className="text-[var(--gray-600)] leading-relaxed mb-8 text-lg">
                {content.about_description || 'We are a NABL accredited diagnostic laboratory committed to providing accurate, timely, and affordable diagnostic services. Our state-of-the-art equipment and experienced team ensure the highest quality results.'}
              </p>
              <Link href="/about" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-[var(--blue)] to-[var(--blue-light)] text-white font-bold hover:shadow-xl hover:shadow-[var(--blue-glow)] transition-all duration-300 hover:-translate-y-1">
                Learn More About Us
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
              </Link>
            </div>
            <div className="reveal-right">
              <div className="relative rounded-3xl overflow-hidden animate-glow-pulse">
                <img src="/images/scientist-microscope.jpg" alt="Laboratory" className="w-full h-[400px] object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--navy)]/60 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ STATS (with Counter Animation) ═══ */}
      <section className="py-16 animate-gradient" style={{ background: 'linear-gradient(135deg, #7C3AED, #8B5CF6, #A78BFA, #8B5CF6)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Tests Available', value: 500, suffix: '+' },
              { label: 'Happy Patients', value: 50000, suffix: '+' },
              { label: 'Years Experience', value: 10, suffix: '+' },
              { label: 'Home Collections', value: 10000, suffix: '+' },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-8 rounded-2xl bg-white/90 backdrop-blur border border-white/20 hover:shadow-xl transition-all duration-500 group reveal">
                <p className="text-3xl sm:text-4xl font-bold gradient-text mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-sm text-[var(--gray-500)] font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl sm:text-3xl lg:text-5xl font-bold text-[var(--navy)] mb-6 reveal" style={{ fontFamily: 'var(--font-jakarta)' }}>
            Ready to Book Your Test?
          </h2>
          <p className="text-[var(--gray-500)] mb-10 text-lg max-w-2xl mx-auto reveal">
            Book your diagnostic test online and get accurate results with quick turnaround time
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center reveal">
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
