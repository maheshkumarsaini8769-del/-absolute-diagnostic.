'use client';

import Link from 'next/link';
import TiltCard from '@/components/TiltCard';

interface TestData {
  id: string;
  name: string;
  slug: string;
  category?: { name: string; slug: string };
  shortDescription?: string;
  description?: string;
  price: number;
  mrp?: number;
  discount?: number;
  reportTime?: string;
  preparationInstructions?: string;
  fastingRequired: boolean;
  homeCollection: boolean;
  nightAvailable: boolean;
  nightSurcharge?: number;
}

interface RelatedTest {
  id: string;
  name: string;
  slug: string;
  price: number;
  reportTime?: string;
}

export default function TestDetailClient({ test, relatedTests }: { test: TestData; relatedTests: RelatedTest[] }) {
  return (
    <div className="pb-20 md:pb-0">
      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0A1628 0%, #0d2818 40%, #0A1628 100%)' }} />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--blue)] rounded-full blur-[200px] opacity-10" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[var(--teal)] rounded-full blur-[180px] opacity-8" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(52,211,153,0.04) 1px, transparent 0)', backgroundSize: '32px 32px' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <nav className="text-sm text-[var(--gray-500)] mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[var(--teal)] transition-colors">Home</Link>
            <span className="mx-2 text-[var(--gray-600)]">/</span>
            <Link href="/tests" className="hover:text-[var(--teal)] transition-colors">Tests</Link>
            <span className="mx-2 text-[var(--gray-600)]">/</span>
            <span className="text-white">{test.name}</span>
          </nav>
          <div className="flex items-center gap-3 mb-4">
            {test.category && (
              <span className="px-3 py-1.5 rounded-lg bg-[var(--blue)]/15 text-[var(--blue-light)] text-xs font-bold uppercase tracking-wider border border-[var(--blue)]/20">
                {test.category.name}
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
            {test.name}
          </h1>
          {test.shortDescription && (
            <p className="text-[var(--gray-400)] max-w-2xl text-lg leading-relaxed">
              {test.shortDescription}
            </p>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ═══ CONTENT ═══ */}
      <section className="py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Info Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 stagger reveal">
                <div className="p-5 rounded-xl bg-[var(--gray-50)] border border-[var(--gray-100)] text-center group hover:border-[var(--blue)]/20 hover:shadow-lg transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl bg-[var(--blue)]/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-[var(--blue)]/20 transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--gray-500)] mb-1">Report Time</p>
                  <p className="text-sm font-bold text-[var(--navy)]">{test.reportTime || 'Lab schedule'}</p>
                </div>
                <div className="p-5 rounded-xl bg-[var(--gray-50)] border border-[var(--gray-100)] text-center group hover:border-[var(--teal)]/20 hover:shadow-lg transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl bg-[var(--teal)]/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-[var(--teal)]/20 transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--gray-500)] mb-1">Home Collection</p>
                  <p className="text-sm font-bold text-[var(--navy)]">{test.homeCollection ? 'Available' : 'No'}</p>
                </div>
                {test.fastingRequired ? (
                  <div className="p-5 rounded-xl bg-amber-50 border border-amber-200 text-center group hover:shadow-lg transition-all duration-300">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mx-auto mb-3 group-hover:bg-amber-200 transition-colors">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 mb-1">Fasting</p>
                    <p className="text-sm font-bold text-amber-700">Required</p>
                  </div>
                ) : (
                  <div className="p-5 rounded-xl bg-[var(--gray-50)] border border-[var(--gray-100)] text-center group hover:border-[var(--blue)]/20 hover:shadow-lg transition-all duration-300">
                    <div className="w-10 h-10 rounded-xl bg-[var(--blue)]/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-[var(--blue)]/20 transition-colors">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--gray-500)] mb-1">Fasting</p>
                    <p className="text-sm font-bold text-[var(--navy)]">Not Required</p>
                  </div>
                )}
                {test.nightAvailable && (
                  <div className="p-5 rounded-xl bg-purple-50 border border-purple-200 text-center group hover:shadow-lg transition-all duration-300">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-200 transition-colors">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600 mb-1">Night</p>
                    <p className="text-sm font-bold text-purple-700">Available</p>
                  </div>
                )}
              </div>

              {/* Description */}
              {test.description && (
                <div className="surface-elevated rounded-2xl p-7 reveal">
                  <h2 className="text-xl font-bold text-[var(--navy)] mb-4 flex items-center gap-3" style={{ fontFamily: 'var(--font-jakarta)' }}>
                    <div className="w-8 h-8 rounded-lg bg-[var(--blue)]/10 flex items-center justify-center shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round"><line x1="17" y1="10" x2="3" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="17" y1="18" x2="3" y2="18" /></svg>
                    </div>
                    About this Test
                  </h2>
                  <p className="text-[var(--gray-600)] leading-relaxed whitespace-pre-line">{test.description}</p>
                </div>
              )}

              {/* Preparation Instructions */}
              {test.preparationInstructions && (
                <div className="surface-elevated rounded-2xl p-7 reveal">
                  <h3 className="text-lg font-bold text-[var(--navy)] mb-4 flex items-center gap-3" style={{ fontFamily: 'var(--font-jakarta)' }}>
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                    </div>
                    Preparation Instructions
                  </h3>
                  <p className="text-sm text-[var(--gray-600)] leading-relaxed whitespace-pre-line">{test.preparationInstructions}</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-5">
                {/* Price Card */}
                <div className="surface-elevated rounded-2xl p-7 text-center reveal">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--gray-500)] mb-3">Test Price</p>
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <span className="text-4xl font-bold text-[var(--navy)]" style={{ fontFamily: 'var(--font-jakarta)' }}>₹{test.price}</span>
                    {test.mrp && test.mrp > test.price && (
                      <span className="text-lg text-[var(--gray-400)] line-through">₹{test.mrp}</span>
                    )}
                  </div>
                  {test.mrp && test.mrp > test.price && (
                    <p className="text-sm text-emerald-600 font-semibold mb-5">
                      You save ₹{Math.round(test.mrp - test.price)}
                    </p>
                  )}
                  <Link
                    href={`/booking?test=${test.slug}`}
                    className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-gradient-to-r from-[var(--blue)] to-[var(--blue-light)] text-white font-bold hover:shadow-xl hover:shadow-[var(--blue)]/25 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    Book This Test
                  </Link>
                </div>

                {/* Quick Info */}
                <div className="surface-elevated rounded-2xl p-6 reveal">
                  <h3 className="font-bold text-[var(--navy)] text-sm mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>Quick Information</h3>
                  <div className="space-y-3">
                    {test.category && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[var(--gray-500)]">Category</span>
                        <span className="text-sm font-semibold text-[var(--navy)]">{test.category.name}</span>
                      </div>
                    )}
                    <div className="h-px bg-[var(--gray-100)]" />
                    {test.reportTime && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[var(--gray-500)]">Report Time</span>
                        <span className="text-sm font-semibold text-[var(--navy)]">{test.reportTime}</span>
                      </div>
                    )}
                    <div className="h-px bg-[var(--gray-100)]" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[var(--gray-500)]">Home Collection</span>
                      <span className="text-sm font-semibold text-[var(--navy)]">{test.homeCollection ? 'Yes' : 'No'}</span>
                    </div>
                    {test.fastingRequired && (
                      <>
                        <div className="h-px bg-[var(--gray-100)]" />
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-[var(--gray-500)]">Fasting</span>
                          <span className="text-sm font-semibold text-amber-600">Required</span>
                        </div>
                      </>
                    )}
                    {test.nightAvailable && (
                      <>
                        <div className="h-px bg-[var(--gray-100)]" />
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-[var(--gray-500)]">Night Service</span>
                          <span className="text-sm font-semibold text-purple-600">
                            Available{test.nightSurcharge ? ` (+₹${test.nightSurcharge})` : ''}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ RELATED TESTS ═══ */}
      {relatedTests.length > 0 && (
        <section className="py-14 bg-[var(--gray-50)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 reveal">
              <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-[var(--blue)] mb-3">Related Tests</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--navy)]" style={{ fontFamily: 'var(--font-jakarta)' }}>
                You May Also Need
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 stagger reveal">
              {relatedTests.map((rt) => (
                <Link key={rt.id} href={`/tests/${rt.slug}`} className="surface-elevated rounded-2xl p-5 group">
                  <h3 className="font-semibold text-[var(--navy)] text-sm mb-3 group-hover:text-[var(--blue)] transition-colors leading-snug">{rt.name}</h3>
                  <div className="flex items-center justify-between pt-3 border-t border-[var(--gray-100)]">
                    <span className="font-bold text-[var(--navy)]">₹{rt.price}</span>
                    {rt.reportTime && <span className="text-[11px] text-[var(--gray-500)] bg-[var(--gray-50)] px-2 py-1 rounded-md">{rt.reportTime}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
