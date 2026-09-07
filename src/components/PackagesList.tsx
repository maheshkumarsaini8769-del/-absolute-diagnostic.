'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import TiltCard from './TiltCard';

interface PackageTest {
  test: { name: string };
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
  homeCollection: boolean;
  isFeatured: boolean;
  packageTests?: PackageTest[];
}

export default function PackagesList() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/packages')
      .then(r => r.json())
      .then(data => { setPackages(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl bg-white border border-[var(--gray-100)] p-6 animate-pulse">
                <div className="h-2 bg-[var(--gray-100)] rounded-full mb-6" />
                <div className="h-5 bg-[var(--gray-100)] rounded w-3/4 mb-3" />
                <div className="h-4 bg-[var(--gray-100)] rounded w-full mb-2" />
                <div className="h-4 bg-[var(--gray-100)] rounded w-2/3 mb-6" />
                <div className="h-10 bg-[var(--gray-100)] rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (packages.length === 0) {
    return (
      <section className="py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20 reveal">
            <div className="w-20 h-20 rounded-2xl bg-[var(--gray-50)] flex items-center justify-center mx-auto mb-6">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--gray-300)" strokeWidth="1.5" strokeLinecap="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
            </div>
            <p className="text-[var(--gray-600)] font-semibold text-lg mb-1">No packages available</p>
            <p className="text-[var(--gray-400)] text-sm">Check back later or browse our individual tests.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger reveal">
          {packages.map((pkg) => {
            const testCount = pkg.packageTests?.length || 0;
            return (
              <div key={pkg.id} id={pkg.slug} className="flex">
                <TiltCard className="w-full">
                  <div className="surface-elevated rounded-2xl overflow-hidden group flex flex-col h-full">
                    {/* Gradient top border */}
                    <div className="h-2 bg-gradient-to-r from-[var(--blue)] to-[var(--teal)] animate-gradient" />
                    {pkg.isFeatured && (
                      <div className="bg-gradient-to-r from-[var(--blue)]/10 to-[var(--teal)]/10 px-5 py-2 border-b border-[var(--gray-100)]">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--blue)]">Featured Package</span>
                      </div>
                    )}
                    <div className="p-6 flex flex-col flex-grow">
                      <h2 className="text-lg font-bold text-[var(--navy)] mb-2 group-hover:text-[var(--blue)] transition-colors" style={{ fontFamily: 'var(--font-jakarta)' }}>
                        {pkg.name}
                      </h2>
                      {pkg.description && (
                        <p className="text-sm text-[var(--gray-500)] mb-4 line-clamp-2 leading-relaxed">{pkg.description}</p>
                      )}

                      {/* Test count */}
                      <div className="flex items-center gap-2 mb-5">
                        <div className="w-7 h-7 rounded-lg bg-[var(--blue)]/10 flex items-center justify-center shrink-0">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                        <span className="text-sm font-semibold text-[var(--blue)]">{testCount} tests included</span>
                      </div>

                      {/* Info items */}
                      <div className="space-y-2 mb-5">
                        {pkg.reportTime && (
                          <div className="flex items-center gap-2 text-sm text-[var(--gray-600)]">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2" strokeLinecap="round">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            Report: {pkg.reportTime}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-[var(--gray-600)]">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2" strokeLinecap="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                          </svg>
                          Home Collection: {pkg.homeCollection ? 'Available' : 'Not'}
                        </div>
                      </div>

                      {/* Included tests */}
                      {pkg.packageTests && pkg.packageTests.length > 0 && (
                        <div className="mb-6">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gray-500)] mb-2">Included Tests</p>
                          <div className="flex flex-wrap gap-1.5">
                            {pkg.packageTests.slice(0, 6).map((pt, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 rounded-lg bg-[var(--gray-50)] text-[var(--gray-600)] text-[11px] font-medium border border-[var(--gray-100)]"
                              >
                                {pt.test.name}
                              </span>
                            ))}
                            {pkg.packageTests.length > 6 && (
                              <span className="px-2.5 py-1 rounded-lg bg-[var(--blue)]/5 text-[var(--blue)] text-[11px] font-semibold">
                                +{pkg.packageTests.length - 6} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Price & CTA */}
                      <div className="mt-auto pt-5 border-t border-[var(--gray-100)]">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <span className="font-bold text-[var(--navy)] text-2xl" style={{ fontFamily: 'var(--font-jakarta)' }}>₹{pkg.price}</span>
                            {pkg.mrp && pkg.mrp > pkg.price && (
                              <span className="text-sm text-[var(--gray-400)] line-through ml-2">₹{pkg.mrp}</span>
                            )}
                          </div>
                          {pkg.discount && pkg.discount > 0 && (
                            <span className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 text-xs font-bold border border-purple-100">
                              Save {pkg.discount}%
                            </span>
                          )}
                        </div>
                        <Link
                          href={`/booking?package=${pkg.slug}`}
                          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-[var(--blue)] to-[var(--blue-light)] text-white font-bold text-sm hover:shadow-xl hover:shadow-[var(--blue)]/25 transition-all duration-300 hover:-translate-y-0.5"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          Book Package
                        </Link>
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
