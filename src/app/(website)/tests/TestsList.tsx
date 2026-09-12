'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import TiltCard from '@/components/TiltCard';
import TestsClientFilter from './TestsClientFilter';

interface TestItem {
  id: string;
  name: string;
  slug: string;
  category?: { name: string; slug: string };
  shortDescription?: string;
  price: number;
  mrp?: number;
  reportTime?: string;
  homeCollection: boolean;
  isFeatured: boolean;
}

interface Category {
  slug: string;
  name: string;
}

export default function TestsList({ initialCategory, initialSearch }: { initialCategory: string; initialSearch: string }) {
  const [tests, setTests] = useState<TestItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (initialCategory) params.set('category', initialCategory);
    if (initialSearch) params.set('search', initialSearch);
    fetch(`/api/tests?${params.toString()}`)
      .then(r => r.json())
      .then(data => { setTests(data.tests || []); setCategories(data.categories || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [initialCategory, initialSearch]);



  return (
    <section className="py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search */}
        <div className="mb-6 reveal">
          <TestsClientFilter category={initialCategory} />
        </div>

        {/* Category Pills */}
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide reveal" style={{ scrollbarWidth: 'none' }}>
            <Link
              href="/tests"
              className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                !initialCategory
                  ? 'bg-gradient-to-r from-[var(--blue)] to-[var(--blue-light)] text-white shadow-lg shadow-[var(--blue)]/20'
                  : 'bg-[var(--gray-100)] text-[var(--gray-600)] hover:bg-[var(--gray-200)] hover:text-[var(--navy)]'
              }`}
            >
              All Tests
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/tests?category=${cat.slug}${initialSearch ? `&search=${initialSearch}` : ''}`}
                className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                  initialCategory === cat.slug
                    ? 'bg-gradient-to-r from-[var(--blue)] to-[var(--blue-light)] text-white shadow-lg shadow-[var(--blue)]/20'
                    : 'bg-[var(--gray-100)] text-[var(--gray-600)] hover:bg-[var(--gray-200)] hover:text-[var(--navy)]'
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between mb-6 reveal">
          <p className="text-sm text-[var(--gray-500)]">
            <span className="font-semibold text-[var(--navy)]">{tests.length}</span> test{tests.length !== 1 ? 's' : ''} found
          </p>
          {initialCategory && (
            <Link href="/tests" className="text-sm text-[var(--blue)] hover:text-[var(--blue-light)] font-medium transition-colors">
              Clear filter
            </Link>
          )}
        </div>

        {/* Tests Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-2xl bg-white border border-[var(--gray-100)] p-6 animate-pulse">
                <div className="h-5 bg-[var(--gray-100)] rounded w-20 mb-4" />
                <div className="h-4 bg-[var(--gray-100)] rounded w-3/4 mb-2" />
                <div className="h-3 bg-[var(--gray-100)] rounded w-full mb-4" />
                <div className="h-8 bg-[var(--gray-100)] rounded w-24" />
              </div>
            ))}
          </div>
        ) : tests.length === 0 ? (
          <div className="text-center py-20 reveal">
            <div className="w-20 h-20 rounded-2xl bg-[var(--gray-50)] flex items-center justify-center mx-auto mb-6">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--gray-300)" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <p className="text-[var(--gray-600)] font-semibold text-lg mb-1">No tests found</p>
            <p className="text-[var(--gray-400)] text-sm">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger reveal">
            {tests.map((test) => (
              <Link
                key={test.id}
                href={`/tests/${test.slug}`}
                className="flex"
              >
                <TiltCard className="w-full">
                  <div className="surface-elevated rounded-2xl p-6 group flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      {test.category && (
                        <span className="px-2.5 py-1 rounded-lg bg-[var(--blue)]/8 text-[var(--blue)] text-[10px] font-bold uppercase tracking-wider">
                          {test.category.name}
                        </span>
                      )}
                      {test.homeCollection && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--teal)]/8 text-[var(--teal)] text-[10px] font-bold">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                          </svg>
                          Home
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-[var(--navy)] text-sm mb-3 group-hover:text-[var(--blue)] transition-colors leading-snug flex-grow">
                      {test.name}
                    </h3>
                    {test.shortDescription && (
                      <p className="text-xs text-[var(--gray-500)] mb-4 line-clamp-2 leading-relaxed">{test.shortDescription}</p>
                    )}
                    <div className="flex items-center justify-between pt-4 border-t border-[var(--gray-100)] mt-auto">
                      <div>
                        <span className="font-bold text-[var(--navy)] text-lg">₹{test.price}</span>
                        {test.mrp && test.mrp > test.price && (
                          <span className="text-xs text-[var(--gray-400)] line-through ml-1.5">₹{test.mrp}</span>
                        )}
                      </div>
                      {test.reportTime && (
                        <span className="text-[11px] text-[var(--gray-500)] bg-[var(--gray-50)] px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          {test.reportTime}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-[var(--gray-100)]/60 flex items-center justify-between text-xs font-semibold">
                      <span className="text-[var(--gray-500)] group-hover:text-[var(--blue)] transition-colors">Details &amp; Prep →</span>
                      <span className="px-3 py-1 rounded-lg bg-[var(--blue)]/10 text-[var(--blue)] group-hover:bg-[var(--blue)] group-hover:text-white transition-all font-bold">
                        Book Test +
                      </span>
                    </div>
                  </div>
                </TiltCard>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
