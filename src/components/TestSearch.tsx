'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

interface Test {
  id: string;
  name: string;
  slug: string;
  price: number;
  category?: { name: string; slug: string };
}

export default function TestSearch() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tests').then(r => r.json()).then(d => { setTests(d.tests || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const map = new Map<string, { name: string; slug: string; count: number }>();
    tests.forEach(t => {
      if (t.category) {
        const existing = map.get(t.category.slug);
        if (existing) existing.count++;
        else map.set(t.category.slug, { ...t.category, count: 1 });
      }
    });
    return Array.from(map.values());
  }, [tests]);

  const results = useMemo(() => {
    return tests.filter(t => {
      const matchQuery = !query || t.name.toLowerCase().includes(query.toLowerCase()) || t.slug.includes(query.toLowerCase());
      const matchCategory = !category || t.category?.slug === category;
      return matchQuery && matchCategory;
    }).slice(0, 12);
  }, [tests, query, category]);

  return (
    <section className="py-16 lg:py-20 bg-gradient-to-b from-white to-[var(--gray-50)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 reveal">
          <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-[var(--blue)] mb-3">Search</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--navy)]" style={{ fontFamily: 'var(--font-jakarta)' }}>
            Find Your Test
          </h2>
          <p className="text-[var(--gray-500)] mt-2">Search from our complete range of diagnostic tests</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-[var(--gray-200)]/50 p-5 sm:p-6 border border-[var(--gray-100)] reveal">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--gray-400)]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tests (e.g., CBC, Thyroid, Diabetes)"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[var(--gray-200)] focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/10 outline-none transition-all text-sm bg-[var(--gray-50)]" />
            </div>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-3.5 rounded-xl border border-[var(--gray-200)] focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/10 outline-none transition-all text-sm bg-[var(--gray-500)] w-full sm:w-auto sm:min-w-[180px]">
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.slug} value={cat.slug}>{cat.name} ({cat.count})</option>
              ))}
            </select>
          </div>

          {results.length > 0 && (
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {results.map((test) => (
                <Link key={test.id} href={`/tests/${test.slug}`}
                  className="flex items-center justify-between p-4 rounded-xl border border-[var(--gray-100)] hover:border-[var(--blue)]/20 hover:shadow-md transition-all duration-300 group">
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--navy)] text-sm group-hover:text-[var(--blue)] transition-colors truncate">{test.name}</p>
                    {test.category && <p className="text-[11px] text-[var(--gray-500)] mt-0.5">{test.category.name}</p>}
                  </div>
                  <span className="font-bold text-[var(--navy)] text-sm ml-3 shrink-0">₹{test.price}</span>
                </Link>
              ))}
            </div>
          )}

          {query && results.length === 0 && !loading && (
            <div className="mt-8 text-center py-8">
              <p className="text-[var(--gray-500)] text-sm">No tests found matching your search.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
