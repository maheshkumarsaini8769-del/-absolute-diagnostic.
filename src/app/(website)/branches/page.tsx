import { prisma } from '@/lib/prisma';
import HomepageAnimations from '@/components/HomepageAnimations';
import Link from 'next/link';

export const metadata = {
  title: 'Our Branches',
  description: 'Find Absolute Diagnostic Centre branches near you. Visit our conveniently located labs for diagnostic tests and health checkups.',
};

export const dynamic = 'force-dynamic';

export default async function BranchesPage() {
  let branches: any[] = [];
  try {
    branches = await prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  } catch (err) {
    console.warn('Could not fetch branches at render time:', err);
  }

  return (
    <HomepageAnimations>
      <section className="relative bg-gradient-to-br from-[var(--navy)] via-[var(--navy-light)] to-[var(--navy)] overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[var(--blue)] rounded-full blur-[160px] opacity-15 animate-morph" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-[var(--teal)] rounded-full blur-[180px] opacity-10 animate-morph" style={{ animationDelay: '4s' }} />
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <nav className="flex items-center gap-2 text-sm text-white/50 mb-8">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
            <span className="text-white/80">Branches</span>
          </nav>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
            Our <span className="gradient-text">Branches</span>
          </h1>
          <p className="text-white/60 text-lg max-w-xl">
            Visit us at any of our conveniently located diagnostic centres across the city.
          </p>
        </div>
      </section>

      <section className="pb-20 md:pb-0 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {branches.length === 0 ? (
            <div className="text-center py-20 reveal">
              <div className="w-20 h-20 rounded-full bg-[var(--blue)]/10 flex items-center justify-center mx-auto mb-6">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="1.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
              </div>
              <h3 className="text-xl font-bold text-[var(--navy)] mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>No Branches Available</h3>
              <p className="text-[var(--gray-500)]">We are expanding. Check back soon for new locations.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger reveal">
              {branches.map((branch) => (
                <div key={branch.id} id={branch.slug} className="surface-elevated rounded-2xl p-6 group">
                  <div className="w-12 h-12 rounded-xl bg-[var(--blue)]/10 flex items-center justify-center mb-5 group-hover:bg-[var(--blue)]/20 transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-[var(--navy)] text-lg mb-2 group-hover:text-[var(--blue)] transition-colors" style={{ fontFamily: 'var(--font-jakarta)' }}>
                    {branch.name}
                  </h3>
                  {branch.address && (
                    <p className="text-sm text-[var(--gray-500)] mb-1 leading-relaxed">{branch.address}</p>
                  )}
                  {branch.city && (
                    <p className="text-sm text-[var(--gray-500)] mb-3">{branch.city}</p>
                  )}
                  {branch.openingHours && (
                    <div className="flex items-center gap-2 mb-5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span className="text-xs text-[var(--gray-400)]">{branch.openingHours}</span>
                    </div>
                  )}
                  {branch.nightAvailable && (
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse-soft" />
                      <span className="text-[11px] font-medium text-purple-500">Night Service Available</span>
                    </div>
                  )}
                  <div className="flex gap-2 pt-4 border-t border-[var(--gray-100)]">
                    {branch.phone && (
                      <a
                        href={`tel:${branch.phone}`}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--blue)]/8 text-[var(--blue)] text-xs font-semibold hover:bg-[var(--blue)]/15 transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        Call
                      </a>
                    )}
                    {branch.whatsapp && (
                      <a
                        href={`https://wa.me/${branch.whatsapp.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--teal)]/8 text-[var(--teal)] text-xs font-semibold hover:bg-[var(--teal)]/15 transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 gradient-section-dark" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[var(--blue)] rounded-full blur-[300px] opacity-10" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center reveal">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6" style={{ fontFamily: 'var(--font-jakarta)' }}>
            Can&apos;t Find a Branch Nearby?
          </h2>
          <p className="text-[var(--gray-400)] mb-10 max-w-2xl mx-auto text-lg">
            We offer home sample collection across all service areas. A trained phlebotomist will visit your doorstep.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/booking?collection=home_collection" className="btn-glow">
              <span className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                Book Home Collection
              </span>
            </Link>
            <Link href="/contact" className="btn-outline">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </HomepageAnimations>
  );
}
