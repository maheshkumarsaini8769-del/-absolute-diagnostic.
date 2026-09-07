'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useCallback, useTransition } from 'react';

export default function TestsClientFilter({ category }: { category: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('search') || '');
  const [isPending, startTransition] = useTransition();

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (value) params.set('search', value);
      startTransition(() => {
        router.push(`/tests?${params.toString()}`, { scroll: false });
      });
    },
    [category, router]
  );

  return (
    <div className="relative max-w-md">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>
      <input
        type="text"
        placeholder="Search tests by name..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[var(--gray-200)] bg-white text-[var(--navy)] text-sm font-medium placeholder:text-[var(--gray-400)] focus:outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/10 transition-all duration-300"
      />
      {isPending && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-[var(--blue)]/30 border-t-[var(--blue)] rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
