'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  url: string;
  icon?: string;
  price?: number;
  badge?: string;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

export default function GlobalSearchModal({ isOpen, onClose, isAdmin = false }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Global keydown: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const q = query.trim().toLowerCase();

        if (isAdmin) {
          // Admin search API
          const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`);
          if (res.ok) {
            const data = await res.json();
            const items: SearchResultItem[] = [];

            if (Array.isArray(data.bookings)) {
              data.bookings.forEach((b: any) => {
                items.push({
                  id: b.id,
                  title: `Booking: ${b.bookingId} (${b.patientName})`,
                  subtitle: `Status: ${b.status}`,
                  category: 'Bookings',
                  url: `/admin/bookings`,
                  badge: b.status,
                });
              });
            }

            if (Array.isArray(data.patients)) {
              data.patients.forEach((p: any) => {
                items.push({
                  id: p.id,
                  title: p.name,
                  subtitle: `Phone: ${p.phone}`,
                  category: 'Patients',
                  url: `/admin/patients`,
                });
              });
            }

            if (Array.isArray(data.samples)) {
              data.samples.forEach((s: any) => {
                items.push({
                  id: s.id,
                  title: `Sample: ${s.sampleId} - ${s.patientName}`,
                  subtitle: `Status: ${s.status}`,
                  category: 'Samples',
                  url: `/admin/samples`,
                  badge: s.status,
                });
              });
            }

            if (Array.isArray(data.reports)) {
              data.reports.forEach((r: any) => {
                items.push({
                  id: r.id,
                  title: `Report: ${r.testName || r.fileName}`,
                  subtitle: `Status: ${r.status}`,
                  category: 'Reports',
                  url: `/admin/reports`,
                });
              });
            }

            setResults(items);
          }
        } else {
          // Public website search: tests, packages, services
          const [testsRes, pkgRes] = await Promise.all([
            fetch(`/api/tests?search=${encodeURIComponent(q)}`),
            fetch(`/api/packages`)
          ]);

          const items: SearchResultItem[] = [];

          if (testsRes.ok) {
            const testsData = await testsRes.json();
            (testsData.tests || []).slice(0, 8).forEach((t: any) => {
              items.push({
                id: t.id,
                title: t.name,
                subtitle: t.shortDescription || (t.category ? t.category.name : 'Diagnostic Test'),
                category: 'Diagnostic Tests',
                url: `/tests/${t.slug}`,
                price: t.price,
                badge: t.reportTime || '24h',
              });
            });
          }

          if (pkgRes.ok) {
            const pkgData = await pkgRes.json();
            (pkgData.packages || [])
              .filter((p: any) => p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)))
              .slice(0, 4)
              .forEach((p: any) => {
                items.push({
                  id: p.id,
                  title: p.name,
                  subtitle: `${p.testCount || 5}+ Parameters Included`,
                  category: 'Health Packages',
                  url: `/packages/${p.slug}`,
                  price: p.price,
                  badge: 'Full Body',
                });
              });
          }

          setResults(items);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, isAdmin]);

  if (!isOpen) return null;

  // Quick Action Shortcuts ("jis me sb add kr ske")
  const quickActions = isAdmin ? [
    { label: '+ Accession Sample', url: '/admin/samples', category: 'LIMS' },
    { label: '+ Enter Technician Results', url: '/admin/lab-worklist', category: 'Worklist' },
    { label: '+ Pathologist Verification', url: '/admin/pathologist', category: 'Review' },
    { label: '+ New Billing Invoice', url: '/admin/billing', category: 'Finance' },
    { label: '+ Record QC Run', url: '/admin/qc', category: 'Quality' },
    { label: '+ Add New Test', url: '/admin/tests', category: 'Catalog' },
    { label: '+ Add Health Package', url: '/admin/packages', category: 'Catalog' },
  ] : [
    { label: '⚡ Book Any Diagnostic Test', url: '/booking', category: 'Booking' },
    { label: '⚡ Book Full Body Checkup', url: '/packages', category: 'Packages' },
    { label: '🏠 Request Home Sample Collection', url: '/home-collection', category: 'Doorstep' },
    { label: '🌙 24x7 Night Emergency Request', url: '/night-request', category: 'Urgent' },
    { label: '⚖️ Side-by-Side Test Comparison', url: '/tests/compare', category: 'Compare' },
    { label: '💼 Apply for Career Openings', url: '/careers', category: 'Jobs' },
    { label: '📑 Download Test Reports', url: '/reports', category: 'Reports' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Backdrop click */}
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[var(--gray-200)] overflow-hidden flex flex-col max-h-[80vh] z-10">
        {/* Search Bar Header */}
        <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-[var(--gray-200)] bg-[var(--gray-50)]">
          <svg className="w-5 h-5 text-[var(--gray-400)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isAdmin ? 'Search bookings, patients, samples, reports...' : 'Search 500+ diagnostic tests, packages, departments...'}
            className="w-full bg-transparent text-sm sm:text-base font-medium text-[var(--navy)] placeholder:text-[var(--gray-400)] focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs text-[var(--gray-400)] hover:text-[var(--gray-600)] px-2 py-1 rounded-md"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs font-semibold px-2 py-1 rounded-lg bg-[var(--gray-200)] text-[var(--gray-600)] hover:bg-[var(--gray-300)] shrink-0"
          >
            ESC
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Quick Actions / Add items */}
          {!query && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--gray-400)] block mb-3">
                {isAdmin ? 'Quick Operations & Actions' : 'Quick Actions & Booking Shortcuts'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickActions.map((action, idx) => (
                  <Link
                    key={idx}
                    href={action.url}
                    onClick={onClose}
                    className="flex items-center justify-between p-3 rounded-xl border border-[var(--gray-100)] bg-[var(--gray-50)]/60 hover:bg-white hover:border-[var(--teal)] hover:shadow-sm transition-all group"
                  >
                    <span className="text-xs font-semibold text-[var(--navy)] group-hover:text-[var(--teal)] transition-colors">
                      {action.label}
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[var(--gray-200)]/60 text-[var(--gray-600)]">
                      {action.category}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Results List */}
          {loading ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-3 border-[var(--teal)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-[var(--gray-400)]">Searching diagnostic records...</p>
            </div>
          ) : query && results.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--gray-100)] flex items-center justify-center mx-auto mb-3 text-[var(--gray-400)]">
                🔍
              </div>
              <p className="text-sm font-semibold text-[var(--navy)]">No matching results found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-[var(--gray-400)] mt-1">Try another keyword like &ldquo;blood&rdquo;, &ldquo;sugar&rdquo;, or check quick actions.</p>
            </div>
          ) : results.length > 0 ? (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--gray-400)] block mb-3">
                Found {results.length} Result{results.length > 1 ? 's' : ''}
              </span>
              <div className="space-y-2">
                {results.map((item) => (
                  <Link
                    key={item.id}
                    href={item.url}
                    onClick={onClose}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--gray-100)] hover:border-[var(--blue)] hover:bg-[var(--blue)]/5 transition-all group"
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--blue)]/10 text-[var(--blue)]">
                          {item.category}
                        </span>
                        {item.badge && (
                          <span className="text-[9px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-[var(--navy)] group-hover:text-[var(--blue)] transition-colors truncate">
                        {item.title}
                      </h4>
                      {item.subtitle && (
                        <p className="text-xs text-[var(--gray-500)] truncate mt-0.5">{item.subtitle}</p>
                      )}
                    </div>
                    {item.price !== undefined && (
                      <div className="text-right shrink-0">
                        <span className="text-sm font-bold text-[var(--navy)]">₹{item.price}</span>
                        <span className="block text-[10px] text-[var(--teal)] font-semibold">Book Now →</span>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-[var(--gray-100)] bg-[var(--gray-50)] text-[11px] text-[var(--gray-400)] flex items-center justify-between">
          <span>Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-white border border-[var(--gray-300)] font-mono text-[10px] text-[var(--gray-700)]">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-white border border-[var(--gray-300)] font-mono text-[10px] text-[var(--gray-700)]">K</kbd> to open anytime</span>
          <span>Absolute Diagnostic Platform</span>
        </div>
      </div>
    </div>
  );
}
