'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import HomepageAnimations from '@/components/HomepageAnimations';

interface TestItem {
  id: string;
  name: string;
  slug: string;
  category?: { name: string; slug: string };
  price: number;
  mrp?: number;
  discount?: number;
  reportTime?: string;
  sampleType?: string;
  fastingRequired?: boolean;
  homeCollection?: boolean;
  nightAvailable?: boolean;
  preparationInstructions?: string;
  shortDescription?: string;
}

function CompareContent() {
  const searchParams = useSearchParams();
  const [allTests, setAllTests] = useState<TestItem[]>([]);
  const [selectedTests, setSelectedTests] = useState<(TestItem | null)[]>([null, null, null]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tests')
      .then((res) => res.json())
      .then((data) => {
        const tests: TestItem[] = data.tests || [];
        setAllTests(tests);

        // Pre-select from query params or first 2 tests
        const slug1 = searchParams.get('test1');
        const slug2 = searchParams.get('test2');
        const t1 = tests.find((t) => t.slug === slug1 || t.id === slug1) || tests[0] || null;
        const t2 = tests.find((t) => t.slug === slug2 || t.id === slug2) || tests[1] || null;

        setSelectedTests([t1, t2, null]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [searchParams]);

  const handleSelect = (index: number, testId: string) => {
    const found = allTests.find((t) => t.id === testId) || null;
    setSelectedTests((prev) => {
      const next = [...prev];
      next[index] = found;
      return next;
    });
  };

  const handleRemove = (index: number) => {
    setSelectedTests((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="w-12 h-12 border-4 border-[var(--teal)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[var(--gray-500)] text-sm">Loading test comparison matrix...</p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0A1628 0%, #0d2818 40%, #0A1628 100%)' }} />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--blue)] rounded-full blur-[200px] opacity-10" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[var(--teal)] rounded-full blur-[180px] opacity-10" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <nav className="text-sm text-[var(--gray-500)] mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[var(--teal)] transition-colors">Home</Link>
            <span className="mx-2 text-[var(--gray-600)]">/</span>
            <Link href="/tests" className="hover:text-[var(--teal)] transition-colors">Tests</Link>
            <span className="mx-2 text-[var(--gray-600)]">/</span>
            <span className="text-white">Compare</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
            Compare Diagnostic <span className="gradient-text">Tests</span>
          </h1>
          <p className="text-[var(--gray-400)] max-w-2xl text-base sm:text-lg leading-relaxed">
            Side-by-side comparison of test requirements, pricing, turnaround times, and preparation guidelines to help you choose the right investigation.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ═══ COMPARISON TABLE ═══ */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl border border-[var(--gray-200)] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-[var(--gray-200)] bg-[var(--gray-50)]">
                    <th className="p-4 sm:p-6 w-1/4 min-w-[200px] text-xs font-bold uppercase tracking-wider text-[var(--navy)]">
                      Attribute / Parameter
                    </th>
                    {[0, 1, 2].map((idx) => {
                      const test = selectedTests[idx];
                      return (
                        <th key={idx} className="p-4 sm:p-6 w-1/4 min-w-[240px] align-top">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--gray-400)]">
                                Test #{idx + 1}
                              </span>
                              {test && (
                                <button
                                  onClick={() => handleRemove(idx)}
                                  className="text-xs text-rose-500 hover:text-rose-700 font-medium"
                                  title="Remove from comparison"
                                >
                                  ✕ Remove
                                </button>
                              )}
                            </div>

                            <select
                              value={test?.id || ''}
                              onChange={(e) => handleSelect(idx, e.target.value)}
                              className="w-full text-xs sm:text-sm font-medium border border-[var(--gray-300)] rounded-xl px-3 py-2 bg-white text-[var(--navy)] focus:outline-none focus:border-[var(--teal)]"
                            >
                              <option value="">-- Choose a test --</option>
                              {allTests.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name}
                                </option>
                              ))}
                            </select>

                            {test && (
                              <div className="mt-2">
                                <h4 className="font-bold text-sm text-[var(--navy)] leading-tight">{test.name}</h4>
                                <div className="mt-1 flex items-baseline gap-2">
                                  <span className="text-xl font-bold text-[var(--navy)]">₹{test.price}</span>
                                  {test.mrp && test.mrp > test.price && (
                                    <span className="text-xs text-[var(--gray-400)] line-through">₹{test.mrp}</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--gray-100)] text-xs sm:text-sm">
                  {/* Category */}
                  <tr>
                    <td className="p-4 sm:p-6 font-semibold text-[var(--navy)] bg-[var(--gray-50)]/50">
                      Category
                    </td>
                    {[0, 1, 2].map((idx) => (
                      <td key={idx} className="p-4 sm:p-6 text-[var(--gray-700)]">
                        {selectedTests[idx]?.category?.name || (selectedTests[idx] ? 'General Pathology' : '—')}
                      </td>
                    ))}
                  </tr>

                  {/* Sample Type */}
                  <tr>
                    <td className="p-4 sm:p-6 font-semibold text-[var(--navy)] bg-[var(--gray-50)]/50">
                      Sample Type
                    </td>
                    {[0, 1, 2].map((idx) => {
                      const test = selectedTests[idx];
                      return (
                        <td key={idx} className="p-4 sm:p-6 text-[var(--gray-700)]">
                          {test ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-medium text-xs">
                              🩸 {test.sampleType || 'Whole Blood / Serum'}
                            </span>
                          ) : '—'}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Turnaround Time */}
                  <tr>
                    <td className="p-4 sm:p-6 font-semibold text-[var(--navy)] bg-[var(--gray-50)]/50">
                      Report Turnaround Time
                    </td>
                    {[0, 1, 2].map((idx) => {
                      const test = selectedTests[idx];
                      return (
                        <td key={idx} className="p-4 sm:p-6 text-[var(--gray-700)]">
                          {test?.reportTime ? (
                            <span className="font-semibold text-emerald-700">⏱ {test.reportTime}</span>
                          ) : (test ? 'Within 24 Hours' : '—')}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Fasting Required */}
                  <tr>
                    <td className="p-4 sm:p-6 font-semibold text-[var(--navy)] bg-[var(--gray-50)]/50">
                      Fasting Required
                    </td>
                    {[0, 1, 2].map((idx) => {
                      const test = selectedTests[idx];
                      if (!test) return <td key={idx} className="p-4 sm:p-6 text-[var(--gray-400)]">—</td>;
                      return (
                        <td key={idx} className="p-4 sm:p-6">
                          {test.fastingRequired ? (
                            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              ⚠️ Yes (8-12 hrs fasting)
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              ✓ No Fasting Required
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Home Sample Collection */}
                  <tr>
                    <td className="p-4 sm:p-6 font-semibold text-[var(--navy)] bg-[var(--gray-50)]/50">
                      Home Sample Collection
                    </td>
                    {[0, 1, 2].map((idx) => {
                      const test = selectedTests[idx];
                      if (!test) return <td key={idx} className="p-4 sm:p-6 text-[var(--gray-400)]">—</td>;
                      return (
                        <td key={idx} className="p-4 sm:p-6">
                          {test.homeCollection !== false ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                              ✓ Doorstep Collection Available
                            </span>
                          ) : (
                            <span className="text-[var(--gray-500)]">Lab Visit Only</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Night Service */}
                  <tr>
                    <td className="p-4 sm:p-6 font-semibold text-[var(--navy)] bg-[var(--gray-50)]/50">
                      Night Emergency Collection
                    </td>
                    {[0, 1, 2].map((idx) => {
                      const test = selectedTests[idx];
                      if (!test) return <td key={idx} className="p-4 sm:p-6 text-[var(--gray-400)]">—</td>;
                      return (
                        <td key={idx} className="p-4 sm:p-6 text-[var(--gray-700)]">
                          {test.nightAvailable ? (
                            <span className="text-purple-700 font-semibold">🌙 Available 24/7</span>
                          ) : (
                            <span className="text-[var(--gray-500)]">Daytime Hours</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Preparation Instructions */}
                  <tr>
                    <td className="p-4 sm:p-6 font-semibold text-[var(--navy)] bg-[var(--gray-50)]/50">
                      Preparation Instructions
                    </td>
                    {[0, 1, 2].map((idx) => {
                      const test = selectedTests[idx];
                      return (
                        <td key={idx} className="p-4 sm:p-6 text-[var(--gray-600)] text-xs leading-relaxed">
                          {test?.preparationInstructions || (test ? 'Standard hydration recommended. Avoid vigorous physical exercise 2 hours prior.' : '—')}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Booking CTA */}
                  <tr className="bg-[var(--gray-50)]">
                    <td className="p-4 sm:p-6 font-bold text-[var(--navy)]">
                      Action
                    </td>
                    {[0, 1, 2].map((idx) => {
                      const test = selectedTests[idx];
                      if (!test) return <td key={idx} className="p-4 sm:p-6" />;
                      return (
                        <td key={idx} className="p-4 sm:p-6">
                          <Link
                            href={`/booking?testId=${test.id}`}
                            className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-xl bg-[var(--teal)] hover:bg-[var(--teal-dark)] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-[var(--teal)]/20"
                          >
                            Book For ₹{test.price}
                          </Link>
                          <Link
                            href={`/tests/${test.slug}`}
                            className="block text-center text-xs text-[var(--blue)] hover:underline mt-2"
                          >
                            View Full Details →
                          </Link>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function ComparePage() {
  return (
    <HomepageAnimations>
      <Suspense fallback={<div className="p-12 text-center">Loading comparison...</div>}>
        <CompareContent />
      </Suspense>
    </HomepageAnimations>
  );
}
