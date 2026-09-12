'use client';

import { useState } from 'react';
import Link from 'next/link';

interface SelectableTest {
  id: string;
  name: string;
  price: number;
}

const COMMON_TESTS: SelectableTest[] = [
  { id: 'cbc', name: 'Complete Blood Count (CBC)', price: 299 },
  { id: 'lipid', name: 'Lipid Profile (Cholesterol)', price: 450 },
  { id: 'lft', name: 'Liver Function Test (LFT)', price: 550 },
  { id: 'kft', name: 'Kidney Function Test (KFT)', price: 550 },
  { id: 'thyroid', name: 'Thyroid Profile (T3, T4, TSH)', price: 399 },
  { id: 'hba1c', name: 'HbA1c (Blood Sugar Average)', price: 450 },
  { id: 'vitamins', name: 'Vitamin D & Vitamin B12', price: 999 },
  { id: 'urine', name: 'Urinalysis (Routine & Micro)', price: 180 },
];

export default function PackageSavingsCalculator() {
  const [selectedIds, setSelectedIds] = useState<string[]>(['cbc', 'lipid', 'lft', 'thyroid']);

  const toggleTest = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const individualTotal = selectedIds.reduce((sum, id) => {
    const found = COMMON_TESTS.find((t) => t.id === id);
    return sum + (found ? found.price : 0);
  }, 0);

  const packagePrice = 999;
  const packageTestsCount = 85;
  const savings = Math.max(0, individualTotal - packagePrice);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-teal-500/30 shadow-xl relative overflow-hidden">
      <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-teal-500 rounded-full blur-[120px] opacity-15" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <span className="inline-block text-[11px] font-bold text-teal-300 bg-teal-500/20 px-3 py-1 rounded-full uppercase tracking-wider mb-2">
            🧮 Smart Bill & Savings Optimizer
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-white">
            Individual Tests vs Full Health Package
          </h3>
          <p className="text-xs sm:text-sm text-teal-100/70 mt-1">
            Select the tests you are planning to take to see how much you save with our package.
          </p>
        </div>

        <div className="text-left sm:text-right bg-white/5 p-3 sm:p-4 rounded-2xl border border-white/10 shrink-0">
          <span className="text-xs text-slate-300">Your Calculated Savings</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">
            {savings > 0 ? `₹${savings} OFF` : 'Best Value'}
          </div>
        </div>
      </div>

      {/* Test Checkboxes */}
      <div className="py-6">
        <label className="block text-xs font-bold text-teal-300 uppercase tracking-wider mb-3">
          Select Tests You Need:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {COMMON_TESTS.map((test) => {
            const isChecked = selectedIds.includes(test.id);
            return (
              <button
                key={test.id}
                type="button"
                onClick={() => toggleTest(test.id)}
                className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isChecked
                    ? 'bg-teal-600/30 border-teal-400 text-white shadow-xs'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${isChecked ? 'bg-teal-400 text-slate-950' : 'border border-slate-500'}`}>
                    {isChecked ? '✓' : ''}
                  </span>
                  <span className="text-xs font-semibold truncate">{test.name}</span>
                </div>
                <span className="text-xs font-bold text-teal-300 shrink-0">₹{test.price}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparison Bottom Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10 items-center">
        {/* Left: Individual Total */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Individual Tests Total ({selectedIds.length} tests)</span>
            <p className="text-xl font-bold text-slate-300 line-through">₹{individualTotal}</p>
          </div>
          <span className="text-xs text-rose-400 font-semibold bg-rose-500/10 px-2.5 py-1 rounded-lg">
            Higher Cost
          </span>
        </div>

        {/* Right: Package Deal */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-500/30 to-emerald-500/30 border border-emerald-400/40 flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-300 font-bold">Absolute Full Body Checkup ({packageTestsCount}+ Tests)</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">₹{packagePrice}</span>
              <span className="text-xs text-emerald-300 font-semibold">Free Home Sample Included</span>
            </div>
          </div>
          <Link
            href="/packages"
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs transition-all shadow-md shrink-0"
          >
            Upgrade & Book @ ₹{packagePrice} →
          </Link>
        </div>
      </div>
    </div>
  );
}
