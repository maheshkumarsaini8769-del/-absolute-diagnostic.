import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import HomepageAnimations from '@/components/HomepageAnimations';

async function getService(slug: string) {
  return prisma.service.findFirst({
    where: { slug, isActive: true },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) return { title: 'Service Not Found' };
  return {
    title: service.title,
    description: service.description || `${service.title} at Absolute Diagnostic`,
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = await getService(slug);

  if (!service) notFound();

  return (
    <HomepageAnimations>
      <div className="pb-20 md:pb-0">
        {/* ═══ DARK HERO ═══ */}
        <section className="relative overflow-hidden gradient-hero">
          <div className="absolute inset-0">
            <div className="absolute top-10 left-1/4 w-64 h-64 bg-[var(--blue)] rounded-full blur-[160px] opacity-15" />
            <div className="absolute bottom-10 right-1/4 w-48 h-48 bg-[var(--teal)] rounded-full blur-[140px] opacity-10" />
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
            <nav className="text-sm text-[var(--gray-400)] mb-6" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-[var(--teal)] transition-colors">Home</Link>
              <span className="mx-2">/</span>
              <Link href="/services" className="hover:text-[var(--teal)] transition-colors">Services</Link>
              <span className="mx-2">/</span>
              <span className="text-white">{service.title}</span>
            </nav>
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4"
              style={{ fontFamily: 'var(--font-jakarta)' }}
            >
              {service.title}
            </h1>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
        </section>

        {/* ═══ CONTENT ═══ */}
        <section className="py-20 lg:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Main Content */}
              <div className="lg:col-span-2 reveal-left">
                {service.description && (
                  <div className="prose prose-lg max-w-none">
                    <div className="text-[var(--gray-600)] leading-relaxed whitespace-pre-line text-base lg:text-lg">
                      {service.description}
                    </div>
                  </div>
                )}

                {!service.description && (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--blue)]/10 flex items-center justify-center mx-auto mb-4">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                    </div>
                    <p className="text-[var(--gray-500)]">Details for this service are coming soon.</p>
                  </div>
                )}
              </div>

              {/* Info Sidebar */}
              <div className="reveal-right">
                <div className="surface-elevated rounded-2xl p-7 sticky top-24">
                  <h3
                    className="text-lg font-bold text-[var(--navy)] mb-5"
                    style={{ fontFamily: 'var(--font-jakarta)' }}
                  >
                    Quick Info
                  </h3>
                  <div className="space-y-4 mb-6">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[var(--blue)]/8 flex items-center justify-center shrink-0 mt-0.5">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--navy)]">NABL Accredited</p>
                        <p className="text-xs text-[var(--gray-500)]">Quality assured diagnostics</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[var(--teal)]/8 flex items-center justify-center shrink-0 mt-0.5">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--navy)]">Timely Results</p>
                        <p className="text-xs text-[var(--gray-500)]">Fast and accurate reporting</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/8 flex items-center justify-center shrink-0 mt-0.5">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                          <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--navy)]">Home Collection</p>
                        <p className="text-xs text-[var(--gray-500)]">Sample collection at your doorstep</p>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-[var(--gray-100)] my-6" />

                  <h4
                    className="text-sm font-bold text-[var(--navy)] mb-4"
                    style={{ fontFamily: 'var(--font-jakarta)' }}
                  >
                    Ready to Get Started?
                  </h4>
                  <p className="text-sm text-[var(--gray-500)] mb-5">
                    Book your test or contact us for more information about this service.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      href="/booking"
                      className="btn-primary text-center text-sm"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        Book Test
                      </span>
                    </Link>
                    <Link
                      href="/contact"
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-[var(--gray-200)] text-sm font-medium text-[var(--navy)] hover:border-[var(--blue)] hover:text-[var(--blue)] transition-colors"
                    >
                      Contact Us
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </HomepageAnimations>
  );
}
