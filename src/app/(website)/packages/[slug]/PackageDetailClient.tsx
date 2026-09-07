'use client';

import Link from 'next/link';

interface Test {
  id: string;
  name: string;
  slug: string;
  price: number;
  category?: { name: string };
}

interface PackageTest {
  id: string;
  test: Test;
}

interface Package {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  mrp?: number;
  discount?: number;
  reportTime?: string;
  preparationInstructions?: string;
  homeCollection: boolean;
  isFeatured: boolean;
  packageTests?: PackageTest[];
}

export default function PackageDetailClient({ pkg }: { pkg: Package }) {
  return (
    <>
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0A1628 0%, #0d2818 40%, #0A1628 100%)' }}>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <nav className="flex items-center gap-2 text-sm text-white/50 mb-8">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            <Link href="/packages" className="hover:text-white transition-colors">Packages</Link>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            <span className="text-white/80">{pkg.name}</span>
          </nav>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
            {pkg.name}
          </h1>
          {pkg.description && <p className="text-white/60 text-lg max-w-xl">{pkg.description}</p>}
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 reveal">
              <h2 className="text-2xl font-bold text-[var(--navy)] mb-6" style={{ fontFamily: 'var(--font-jakarta)' }}>
                Tests Included ({pkg.packageTests?.length || 0})
              </h2>
              <div className="space-y-3">
                {(pkg.packageTests || []).map((pt) => (
                  <div key={pt.id} className="flex items-center justify-between p-4 rounded-xl bg-[var(--gray-50)] border border-[var(--gray-100)] hover:border-[var(--blue)]/20 hover:shadow-md transition-all duration-300">
                    <div>
                      <p className="font-semibold text-[var(--navy)] text-sm">{pt.test.name}</p>
                      {pt.test.category && <p className="text-xs text-[var(--gray-500)] mt-0.5">{pt.test.category.name}</p>}
                    </div>
                    <span className="text-sm font-bold text-[var(--blue)]">₹{pt.test.price}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="reveal-right">
              <div className="surface-elevated rounded-2xl p-6 sticky top-24">
                <div className="text-center mb-6">
                  <p className="text-3xl font-bold text-[var(--navy)]" style={{ fontFamily: 'var(--font-jakarta)' }}>₹{pkg.price}</p>
                  {pkg.mrp && pkg.mrp > pkg.price && (
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <span className="text-sm text-[var(--gray-400)] line-through">₹{pkg.mrp}</span>
                      <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        {Math.round(((pkg.mrp - pkg.price) / pkg.mrp) * 100)}% OFF
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 mb-6 text-sm">
                  {pkg.reportTime && (
                    <div className="flex justify-between">
                      <span className="text-[var(--gray-500)]">Report Time</span>
                      <span className="font-medium text-[var(--navy)]">{pkg.reportTime}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[var(--gray-500)]">Tests Included</span>
                    <span className="font-medium text-[var(--navy)]">{pkg.packageTests?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--gray-500)]">Home Collection</span>
                    <span className="font-medium text-[var(--navy)]">{pkg.homeCollection ? 'Available' : 'Not Available'}</span>
                  </div>
                </div>

                <Link
                  href={`/booking?package=${pkg.slug}`}
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-gradient-to-r from-[var(--blue)] to-[var(--blue-light)] text-white font-bold text-sm hover:shadow-xl hover:shadow-[var(--blue)]/25 transition-all duration-300 hover:-translate-y-0.5"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  Book This Package
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
